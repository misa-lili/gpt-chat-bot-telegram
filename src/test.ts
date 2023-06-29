import { config } from "dotenv"
import {
  convertToWebm,
  createNewStickerSet,
  sendMessage,
  uploadStickerFile,
} from "./utils"
import fs from "fs"

config()

// 이 함수는 버퍼를 로컬 파일로 작성합니다.
function writeBufferToFile(buffer: Buffer, filePath: string) {
  fs.writeFile(filePath, buffer, (err) => {
    if (err) {
      console.error("An error occurred:", err)
    } else {
      console.log("File saved successfully")
    }
  })
}

export async function test() {
  const url =
    "https://ac-p1.namu.la/20220301sac/f88b17c9b16a93747652706d110b74cb9a967a96fad889cf925c609c88205dec.mp4?expires=1688173200&key=dirMH7OLDLpA48H4xXtIRA"

  const imgUrl =
    "https://ac-p1.namu.la/20220301sac2/f91607db61846e072da4a6738ba257d11b05607aec8ac4c4497a5e81ab0d5a8f.png?expires=1688173200&key=KjxmnqnNsLcqld3JwYhCFg"

  const stickerSetUrl = "https://t.me/addstickers/arca_20479_by_misa_chat_bot"

  const stickerName = "arca_20479_by_misa_chat_bot"
  const user_id = 873486701

  // convertToWebm(url)

  const buffer = await convertToWebm(imgUrl)

  const file = await uploadStickerFile({
    user_id,
    sticker: buffer,
    sticker_format: "video",
  })

  const InputSticker: BotAPI.InputSticker = {
    sticker: file.file_id,
    emoji_list: ["🔖"],
  }

  let isSuccess = await createNewStickerSet({
    user_id,
    name: stickerName,
    title: "By @misa_chat_bot",
    stickers: [InputSticker],
    sticker_format: "video",
  })

  if (isSuccess) console.log(stickerSetUrl)
  else console.error(isSuccess)
}
