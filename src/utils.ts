import ffmpeg from "fluent-ffmpeg"
import stream from "stream"
import axios from "axios"

export const bufferToStream = (buffer: Buffer): stream.Readable => {
  const tmp = new stream.Readable()
  tmp.push(buffer)
  tmp.push(null)
  return tmp
}

export const convertMp4ToWebm = async (url: string): Promise<Buffer> => {
  const response = await axios.get(url, { responseType: "stream" })

  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []
    const passThrough = new stream.PassThrough()

    ffmpeg()
      .input(response.data)
      .noAudio()
      .videoCodec("libvpx-vp9")
      .size("512x512")
      .outputFormat("webm")
      .output(passThrough)
      .on("error", reject)
      .on("end", (_, stdout) => {
        console.info(stdout)
        resolve(Buffer.concat(chunks))
      })
      .run()

    passThrough.on("data", (chunk) => chunks.push(chunk))
  })
}

export const convertPngToWebm = async (url: string): Promise<Buffer> => {
  const response = await axios.get(url, { responseType: "stream" })

  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []
    const passThrough = new stream.PassThrough()

    ffmpeg()
      .input(response.data)
      .output(passThrough)
      .size("512x512")
      .videoCodec("libvpx-vp9")
      .outputFormat("webm")
      .noAudio()
      .addOptions("-pix_fmt yuva420p")
      .on("end", (_, stdout) => {
        console.info(stdout)
        resolve(Buffer.concat(chunks))
      })
      .on("error", reject)
      .run()

    passThrough.on("data", (chunk) => chunks.push(chunk))
  })
}
