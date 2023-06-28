import fetch from "node-fetch"
import ffmpeg from "fluent-ffmpeg"
import stream from "stream"
import { pipeline } from "stream/promises"
import { Readable } from "stream"
import { PassThrough } from "stream"

// Convert Buffer to Readable Stream
// const bufferToStream = (buffer: Buffer): stream.Readable => {
//   const readableStream = new stream.Readable()
//   readableStream.push(buffer)
//   readableStream.push(null)
//   return readableStream
// }

// export const convertToWebmStream = async (
//   url: string
// ): Promise<stream.Stream> => {
//   return new Promise(async (resolve, reject) => {
//     const response = await fetch(url)
//     const buffer = await response.arrayBuffer()
//     const readable = bufferToStream(Buffer.from(buffer))

//     const outputStream = new stream.PassThrough()

//     ffmpeg(readable)
//       .inputFormat("mp4")
//       .outputFormat("webm")
//       .videoCodec("libvpx-vp9")
//       .noAudio()
//       .size("512x512")
//       .on("progress", (progress) => {
//         console.log("Processing: " + progress.percent + "% done")
//       })
//       .on("error", (error) => {
//         console.error("Error occurred during conversion:", error)
//         reject(error)
//       })
//       .on("end", () => {
//         console.log("Conversion completed successfully.")
//         outputStream.end()
//         resolve(outputStream.read())
//       })
//       .pipe(outputStream, { end: false })
//   })
// }

// export const convertToWebmBuffer = (url: string): Promise<Buffer> => {
//   return new Promise(async (resolve, reject) => {
//     const response = await fetch(url)
//     const buffer = await response.arrayBuffer()
//     const readable = bufferToStream(Buffer.from(buffer))

//     const outputStream = new stream.PassThrough()
//     const chunks: Buffer[] = []

//     ffmpeg(readable)
//       .inputFormat("mp4")
//       .outputFormat("webm")
//       .videoCodec("libvpx-vp9")
//       .noAudio()
//       .size("512x512")
//       .on("progress", (progress) => {
//         console.log(JSON.stringify(progress))
//       })
//       .on("error", (error) => {
//         console.error("Error occurred during conversion:", error)
//         reject(error)
//       })
//       .on("data", (chunk: Buffer) => {
//         chunks.push(chunk)
//       })
//       .on("end", (err, stdout, stderr) => {
//         console.log({ stdout, stderr })
//         console.log("Conversion completed successfully.")
//         const result = Buffer.concat(chunks)
//         console.log(result.byteLength)
//         resolve(result)
//       })
//       .run()
//   })
// }

export const bufferToStream = (buffer: Buffer): Readable => {
  const tmp = new Readable()
  tmp.push(buffer)
  tmp.push(null)
  return tmp
}

export const convertToWebmBuffer = (url: string): Promise<Buffer> => {
  return new Promise(async (resolve, reject) => {
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()
    const readable = bufferToStream(Buffer.from(buffer))

    let outputBuffer: Buffer = Buffer.alloc(0)

    const stream = new PassThrough()

    stream.on("data", (chunk) => {
      outputBuffer = Buffer.concat([outputBuffer, chunk])
    })

    stream.on("end", () => {
      resolve(outputBuffer)
    })

    ffmpeg()
      .input(readable)
      .output(stream)
      .outputFormat("webm")
      .videoCodec("libvpx-vp9")
      .noAudio()
      .size("512x486")
      .autopad()
      .on("progress", (progress) => {
        console.log(JSON.stringify(progress))
      })
      .on("error", (error) => {
        console.error("Error occurred during conversion:", error)
        reject(error)
      })
      .on("end", (_, stdout) => {
        console.log(stdout)
      })
      .run()
  })
}
