import fetch from "node-fetch"
import ffmpeg from "fluent-ffmpeg"
import stream from "stream"
import { Stream } from "stream"

// Convert Buffer to Readable Stream
const bufferToStream = (buffer: Buffer): stream.Readable => {
  const readableStream = new stream.Readable()
  readableStream.push(buffer)
  readableStream.push(null)
  return readableStream
}

export const fetchAndConvert = async (url: string): Promise<Stream> => {
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  const readable = bufferToStream(Buffer.from(buffer))

  let outputStream = new stream.PassThrough()

  return new Promise((resolve, reject) => {
    ffmpeg(readable)
      .inputFormat("mp4")
      .outputFormat("webm")
      .on("error", (error) => {
        console.error("", error)
        reject(error)
      })
      .on("end", () => {
        console.log("SUCCESS")
        outputStream.end()
        resolve(outputStream)
      })
      .pipe(outputStream)
  })
}
