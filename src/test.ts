import { config } from "dotenv"
import { convertToWebmBuffer } from "./utils"

config()

export async function test() {
  // const user_id = (873486701).toString()
  // const name = crypto.randomUUID().toString()
  // const bufferData = await convertToWebmBuffer(
  //   "https://ac-p1.namu.la/20220301sac/f88b17c9b16a93747652706d110b74cb9a967a96fad889cf925c609c88205dec.mp4?expires=1688173200&key=dirMH7OLDLpA48H4xXtIRA"
  // )
  // const blob = new Blob([bufferData], { type: "application/octet-stream" })
  // const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/addStickerToSet`
  // const formData = new FormData()
  // formData.append("user_id", user_id)
  // formData.append("name", name)
  // formData.append("sticker", blob, "myFile.webm")
  // // https://core.telegram.org/bots/api#addstickertoset
  // fetch(url, {
  //   method: "POST",
  //   body: formData,
  // })
  //   .then((response) => {
  //     if (!response.ok) {
  //       throw new Error("Network response was not ok")
  //     }
  //     return response.json()
  //   })
  //   .then((data) => {
  //     console.log(data)
  //   })
  //   .catch((error) => {
  //     console.error("Error:", error)
  //   })
}
