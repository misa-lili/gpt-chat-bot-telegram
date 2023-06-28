import fetch from "node-fetch"
import ffmpeg from "fluent-ffmpeg"
import stream from "stream"
import { pipeline } from "stream/promises"

// Convert Buffer to Readable Stream
const bufferToStream = (buffer: Buffer): stream.Readable => {
  const readableStream = new stream.Readable()
  readableStream.push(buffer)
  readableStream.push(null)
  return readableStream
}

export const convertToWebmStream = async (
  url: string
): Promise<stream.Stream> => {
  return new Promise(async (resolve, reject) => {
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()
    const readable = bufferToStream(Buffer.from(buffer))

    const outputStream = new stream.PassThrough()

    ffmpeg(readable)
      .inputFormat("mp4")
      .outputFormat("webm")
      .videoCodec("libvpx-vp9")
      .noAudio()
      .size("512x512")
      .on("progress", (progress) => {
        console.log("Processing: " + progress.percent + "% done")
      })
      .on("error", (error) => {
        console.error("Error occurred during conversion:", error)
        reject(error)
      })
      .on("end", () => {
        console.log("Conversion completed successfully.")
        outputStream.end()
        resolve(outputStream.read())
      })
      .pipe(outputStream, { end: false })
  })
}

export const convertToWebmBuffer = (url: string): Promise<Buffer> => {
  return new Promise(async (resolve, reject) => {
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()
    const readable = bufferToStream(Buffer.from(buffer))

    const outputStream = new stream.PassThrough()
    const chunks: Buffer[] = []

    const ffmpegStream = ffmpeg(readable)
      .inputFormat("mp4")
      .outputFormat("webm")
      .videoCodec("libvpx-vp9")
      .noAudio()
      .size("512x512")
      .on("progress", (progress) => {
        console.log("Processing: " + progress.percent + "% done")
      })
      .on("error", (error) => {
        console.error("Error occurred during conversion:", error)
        reject(error)
      })
      .on("data", (chunk: Buffer) => {
        chunks.push(chunk)
      })
      .on("end", () => {
        console.log("Conversion completed successfully.")
        resolve(Buffer.concat(chunks))
      })
      .pipe(outputStream, { end: false })

    await pipeline(readable, ffmpegStream, outputStream)
  })
}
