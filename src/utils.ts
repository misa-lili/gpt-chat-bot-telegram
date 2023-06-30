import { StickerSet } from "node-telegram-bot-api"
import FormData from "form-data"
import fetch from "node-fetch"
import stream from "stream"
import ffmpeg from "fluent-ffmpeg"
import { Readable } from "stream"

export const convertToWebm = async (url: string): Promise<Buffer> => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Unexpected response ${response.statusText}`)
  }

  const buffer = await response.buffer()
  const readableStream = Readable.from(buffer)
  const readableStream2 = Readable.from(buffer)

  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []
    const passThrough = new stream.PassThrough()

    /**
     * For stickers, one side must be exactly 512 pixels in size – the other side can be 512 pixels or less.
      For emoji, the video must be exactly 100x100 pixels in size
      Video duration must not exceed 3 seconds.
      Frame rate can be up to 30 FPS.
      Video should be looped for optimal user experience.
      Video size should not exceed 256 KB.
      Video must be in .WEBM format encoded with the VP9 codec.
      Video must have no audio stream.
    */
    // TODO: loop and speed and duration
    // TODO: .videoFilters('setpts=PTS/2') <- arca 의 max 시간 확인해서 적용

    ffmpeg(readableStream).ffprobe(0, (_, data) => {
      // console.log(data)
      const duration: number = data.format.duration ?? 0
      const pts = duration > 3 ? duration / 3 : 1
      ffmpeg()
        .input(readableStream2)
        .output(passThrough)
        .videoFilters(`setpts=PTS/${pts}`)
        .fps(24)
        .videoBitrate("384k", true)
        .duration(3)
        .size("512x512")
        .videoCodec("libvpx-vp9")
        .outputFormat("webm")
        .noAudio()
        .addOptions("-pix_fmt yuva420p")
        .on("end", function (_, stdout) {
          const lastFrame = stdout
            .split("\n")
            .filter((line: string) => line.includes("frame"))
            .at(-1)
            .trim()
          const fileSize = stdout.split("\n").at(-2).split(" ").at(0)
          console.info({ duration, pts, lastFrame, fileSize })
          resolve(Buffer.concat(chunks))
        })
        .on("error", reject)
        .run()

      passThrough.on("data", (chunk) => chunks.push(chunk))
    })
  })
}

/**
 * https://core.telegram.org/bots/api#getstickerset
 */
export async function getStickerSet({
  name,
}: {
  name: string
}): Promise<StickerSet> {
  const form = new FormData()
  form.append("name", name)
  const response = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/getStickerSet`,
    { method: "POST", body: form, headers: form.getHeaders() }
  )
  const data = await response.json()
  if (data.ok === false) {
    // console.error("getStickerSet")
    // console.error(data)
    throw new Error("getStickerSet" + data.description)
  }
  return data.result
}

/**
 * https://core.telegram.org/bots/api#deleteStickerSet
 */
export async function deleteStickerSet({
  name,
}: {
  name: string
}): Promise<boolean> {
  const form = new FormData()
  form.append("name", name)
  const response = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/deleteStickerSet`,
    { method: "POST", body: form, headers: form.getHeaders() }
  )
  const data = await response.json()
  if (data.ok === false) {
    console.error("deleteStickerSet")
    console.error(data)
    throw new Error("deleteStickerSet" + data.description)
  }
  return data.result
}

/**
 * https://core.telegram.org/bots/api#uploadstickerfile
 */
export async function uploadStickerFile({
  user_id,
  sticker,
  sticker_format,
  url,
}: {
  user_id: number
  sticker: BotAPI.InputFile
  sticker_format: "static" | "animated" | "video"
  url: string
}): Promise<BotAPI.File> {
  const form = new FormData()
  const filename = simpleHash(url) + ".webm"
  form.append("user_id", user_id)
  form.append("sticker", sticker, {
    filename,
    contentType: "video/webm",
  })
  form.append("sticker_format", sticker_format)

  const response = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/uploadStickerFile`,
    { method: "POST", body: form, headers: form.getHeaders() }
  )
  const data = await response.json()
  if (response.ok === false) {
    console.error("uploadStickerFile")
    console.error(data)
    throw new Error("uploadStickerFile" + data.description)
  }
  return data.result
}

/**
 * https://core.telegram.org/bots/api#createnewstickerset
 */
export async function createNewStickerSet({
  user_id,
  name,
  title,
  stickers,
  sticker_format,
  sticker_type,
  needs_repainting,
}: {
  user_id: number
  name: string
  title: string
  stickers: BotAPI.InputSticker[]
  sticker_format: "static" | "animated" | "video"
  sticker_type?: string
  needs_repainting?: boolean
}): Promise<boolean> {
  const form = new FormData()
  form.append("user_id", user_id)
  form.append("name", name)
  form.append("title", title)
  form.append("stickers", JSON.stringify(stickers))
  form.append("sticker_format", sticker_format)

  form.append("sticker_type", sticker_type ?? "regular")
  // form.append("needs_repainting", needs_repainting ?? false)

  const response = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/createNewStickerSet`,
    { method: "POST", body: form, headers: form.getHeaders() }
  )
  const data = await response.json()
  if (data.ok === false) {
    console.error("createNewStickerSet")
    console.error(data)
    throw new Error("createNewStickerSet" + data.description)
  }
  return data
}

/**
 * https://core.telegram.org/bots/api#addstickertoset
 */
export async function addStickerToSet({
  user_id,
  name,
  sticker,
}: {
  user_id: number
  name: string
  sticker: BotAPI.InputSticker
}): Promise<boolean> {
  const form = new FormData()
  form.append("user_id", user_id)
  form.append("name", name)
  form.append("sticker", JSON.stringify(sticker))

  const response = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/addStickerToSet`,
    { method: "POST", body: form, headers: form.getHeaders() }
  )
  const data = await response.json()
  if (response.ok === false) {
    console.error("addStickerToSet")
    console.error(data)
    throw new Error("addStickerToSet" + data.description)
  }
  return data.result
}

export function simpleHash(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    let char = input.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString()
}
