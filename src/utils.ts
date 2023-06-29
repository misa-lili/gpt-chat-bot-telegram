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
  const readableStream = new Readable()
  readableStream.push(buffer)
  readableStream.push(null)

  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []
    const passThrough = new stream.PassThrough()

    ffmpeg()
      .input(readableStream)
      .output(passThrough)
      .size("512x512")
      .videoCodec("libvpx-vp9")
      .outputFormat("webm")
      .noAudio()
      .addOptions("-pix_fmt yuva420p")
      .on("end", function () {
        resolve(Buffer.concat(chunks))
      })
      .on("error", reject)
      .run()

    passThrough.on("data", (chunk) => chunks.push(chunk))
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
    throw new Error("no sticker set found.")
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
    throw new Error("no sticker set found.")
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
  console.log(filename)
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
  if (response.ok === false) throw new Error("ok false")
  const data = await response.json()
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
    console.log(data)
    throw new Error(data.description)
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
  if (response.ok === false) {
    console.error(response.statusText)
    throw new Error("ok false")
  }
  const data = await response.json()
  return data.result
}

export async function sendMessage({
  chat_id,
  text,
}: {
  chat_id: number | string
  text: string
}): Promise<any /* Message */> {
  const response = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage?chat_id=${chat_id}&text=${text}`,
    { method: "POST" }
  )
  if (response.ok === false) console.error("ok false")
  const data = await response.json()

  /**
   *
   */
  const res2 = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage?chat_id=${chat_id}&text=${text}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chat_id, text }),
    }
  )

  /**
   *
   */
  const form = new FormData()
  form.append("chat_id", chat_id)
  form.append("text", text)

  const resp3 = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`,
    { method: "POST", body: form, headers: form.getHeaders() }
  )

  console.log(response.ok, res2.ok, resp3.ok)

  return data
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
