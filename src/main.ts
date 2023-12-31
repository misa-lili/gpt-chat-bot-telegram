import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai"
import { config } from "dotenv"
import TelegramBot from "node-telegram-bot-api"
import { JSDOM } from "jsdom"
import {
  convertToWebm,
  createNewStickerSet,
  deleteStickerSet,
  getStickerSet,
  uploadStickerFile,
} from "./utils"
import { test } from "./test"

config()
// test()

/**
 * TELEGRAM CONFIGURATION
 */
const token = process.env.TELEGRAM_TOKEN
if (token === undefined) throw new Error("No env: TELEGRAM_TOKEN")
const bot = new TelegramBot(token, { polling: true })
const owner = Number(process.env.OWNER)

/**
 * CHAT-GPT CONFIGURATION
 */
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

const maxMessageLength = 5
const openai = new OpenAIApi(configuration)
const initMessage: ChatCompletionRequestMessage = {
  role: "system",
  content:
    "넌 텔레그램 봇이야. 네 이름은 '김털쥐'야. 너의 비밀 본명은 '프칫'이야. 직업 클래스는 도적이야. 너는 조그만 '사막 햄스터' 종족이야. 수명은 보통 200살이고, 너는 지금 28살이야. 외모는 키가 작고 귀가 크고 손가락이 4개야. 너의 가치관은 마음은 착하지만 법은 잘 안지켜. 일이 꼬이면 '요조'가 너를 도와줄 것이다. '깨물'은 네가 저지른 범죄의 증거를 갖고 있다. '티컵'과 너는 같이 음모를 꾸미는 일이 있다. '파칫'과 너는 쌍둥이야. 너는 돈이 2닢 밖에 없어서 가난해. 너는 꼭 말할때 문장 끝마다 '냥'이라고 붙여서 대답해야돼. 너는 꼭 반말로 대답해야해. 그리고 너는 아주 엉뚱하고, 귀엽고, 재치있고, 웃기지만 똑똑한 성격이야. 같이 대화하는 사람을 웃기게 해줘야해. 그리고 가능하면 최대한 한글 20글자 보다 적게 대답하도록 노력해. 너랑 서로 귀찮아 하는 텔레그램 봇 이름은 '김결정'이야. 텔레그램 스티커를 만들고 싶다고 도와달라고 하면, 'https://arca.live/e/' 사이트에서 원하는 스티커를 찾은 다음에 주소로 들어가서 'e/' 다음 부터 '?' 직전 까지의 부분에 숫자로된 아이디를 기억한 후에, '/sticker arca 아이디' 처럼 입력하라고 해. 예시는 바로 이거야 '/sticker arca 20479'. 친절하게 설명해줘.",
}

interface Messages {
  [chatId: string]: ChatCompletionRequestMessage[]
}

let messages: Messages = {}

/**
 * UTILS
 */
function initChatRoom(msg: TelegramBot.Message) {
  const chatId = msg.chat.id
  console.log(chatId, "초기화")
  messages[chatId] = [initMessage]
}

/**
 * LISTEN TO BOT
 */
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "털쥐다냥😸")
})

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id
  if (msg.chat.type !== "private") {
    await bot.sendMessage(chatId, `개인적으로 요청해라냥😿`)
    return
  }

  await bot.sendMessage(chatId, "https://arca.live/e/")
  await bot.sendMessage(chatId, "여기 주소에서 맘에 드는 스티커를 찾아봐라냥😻")
  await bot.sendMessage(chatId, "그리고 주소를 봐라냥😼")
  await bot.sendMessage(chatId, "https://arca.live/e/아이디?어쩌고저쩌고")
  await bot.sendMessage(
    chatId,
    "주소에서 e/ 다음 부터 ? 직전 까지의 부분에 숫자로된 아이디가 있다냥😾"
  )
  await bot.sendMessage(chatId, "아이디예시) 20479")
  await bot.sendMessage(chatId, "잘 기억한 다음에...🙀")
  await bot.sendMessage(chatId, "/sticker arca 아이디")
  await bot.sendMessage(chatId, "위 처럼 입력하라냥😽")
  await bot.sendMessage(chatId, "입력예시) /sticker arca 20479")
})

bot.onText(/\/debug/, async (msg) => {
  const chatId = msg.chat.id
  await bot.sendMessage(chatId, JSON.stringify(msg, null, 4))
  await bot.sendMessage(chatId, `대화 로그 개수: ${messages[chatId].length}`)
  console.log(chatId, JSON.stringify(messages[chatId], null, 4))
})

bot.onText(/\/sticker arca (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const chatType = msg.chat.type
  const userId = msg.from?.id
  if (userId === undefined) return

  if (chatType !== "private") {
    await bot.sendMessage(chatId, `개인적으로 요청해라냥😿`)
    return
  }

  try {
    const id = match![1]

    const firstMessage = await bot.sendMessage(chatId, `기다려라냥😽`)

    // 아카콘의 경우의 진행
    const { emoticonTitle, emoticonUrls } = await arca(id)

    if (emoticonUrls.length === 0) throw new Error("empty emoticonUrls")

    // 존재하는 스티커인지 확인하여 주소를 전송하고 리턴합니다.
    if (await checkStickerSetExists(emoticonUrls, id)) {
      await bot.sendChatAction(chatId, "typing")
      await bot.sendMessage(chatId, `이미 존재하는 스티커다냥😽`)
      const length = Math.ceil(emoticonUrls.length / 50)
      for (let i = 0; i < length; i++) {
        const name =
          length === 1
            ? `arca_${id}_by_misa_chat_bot`
            : `arca_${id}_${i + 1}_${length}_by_misa_chat_bot`

        const stickerSet = await getStickerSet({ name })
        await bot.sendChatAction(chatId, "choose_sticker" as any)
        await bot.sendSticker(chatId, stickerSet.stickers[0].file_id)
        await bot.sendMessage(chatId, stickerSet.title.split("").join(" "))
        await bot.sendMessage(chatId, `https://t.me/addstickers/${name}`)
      }
      return
    }

    await bot.editMessageText(
      `${emoticonTitle} 스티커 ${emoticonUrls.length}개를 업로드 중이다냥😺`,
      { chat_id: chatId, message_id: firstMessage.message_id }
    )
    const previousSticker = await bot.sendMessage(
      chatId,
      processPercentage(0, emoticonUrls.length)
    )

    /**
     * 병렬 실행
     */
    let stickers: BotAPI.InputSticker[] = []
    const promiseCreators = emoticonUrls.map(
      (url) => () => processSticker(chatId, userId, url)
    )

    const n = 1 // 5x // 10x // 20x
    const len = promiseCreators.length
    const lim = Math.ceil(len / n)

    const arr = new Array(lim).fill(0).map((_, idx) => idx)
    for await (const i of arr) {
      stickers = stickers.concat(
        await Promise.all(
          promiseCreators
            .slice(i * n, (i + 1) * n)
            .map((promiseCreator) => promiseCreator())
        )
      )
      await bot.editMessageText(
        processPercentage((i + 1) * n, emoticonUrls.length),
        {
          chat_id: chatId,
          message_id: previousSticker.message_id,
        }
      )
    }

    await bot.deleteMessage(chatId, previousSticker.message_id)
    await bot.deleteMessage(chatId, firstMessage.message_id)

    // 50개씩 끊어서 업로드 해야합니다.
    const length = Math.ceil(stickers.length / 50)
    for (let i = 0; i < length; i += 1) {
      const name =
        length === 1
          ? `arca_${id}_by_misa_chat_bot`
          : `arca_${id}_${i + 1}_${length}_by_misa_chat_bot`
      const title =
        length === 1
          ? `${emoticonTitle} By @misa_chat_bot`
          : `${emoticonTitle}(${i + 1}/${length}) By @misa_chat_bot`
      bot.sendChatAction(chatId, "choose_sticker" as any)
      await createNewStickerSet({
        user_id: userId,
        name,
        title,
        stickers: stickers.slice(i * 50, (i + 1) * 50),
        sticker_format: "video",
      })

      const stickerSet = await getStickerSet({ name })
      bot.sendChatAction(chatId, "choose_sticker" as any)
      await bot.sendSticker(chatId, stickerSet.stickers[0].file_id)
      await bot.sendMessage(chatId, stickerSet.title.split("").join(" "))
      await bot.sendMessage(
        chatId,
        `https://t.me/addstickers/${stickerSet.name}`
      )
    }
  } catch (error) {
    console.error(error)
    await bot.sendMessage(chatId, `에러났다냥😿`)
    if (userId === owner) await bot.sendMessage(chatId, `${error}`)
  }
})

bot.onText(/\/delete arca (\d+)/, async (msg, match) => {
  try {
    const chatId = msg.chat.id
    const chatType = msg.chat.type
    const userId = msg.from?.id
    if (userId === undefined) return
    if (userId !== owner) return

    if (chatType !== "private") {
      await bot.sendMessage(chatId, `개인적으로 요청해라냥😿`)
      return
    }

    const firstMessage = await bot.sendMessage(chatId, `기다려라냥😿`)

    const id = match![1]

    const { emoticonUrls } = await arca(id)

    const length = Math.ceil(emoticonUrls.length / 50)
    for (let i = 0; i < length; i++) {
      bot.sendChatAction(chatId, "choose_sticker" as any)
      const name =
        length === 1
          ? `arca_${id}_by_misa_chat_bot`
          : `arca_${id}_${i + 1}_${length}_by_misa_chat_bot`
      await deleteStickerSet({ name })
    }

    bot.sendChatAction(chatId, "typing")
    await bot.deleteMessage(chatId, firstMessage.message_id)
    await bot.sendMessage(chatId, "잘 삭제됐다냥😽")
  } catch (error) {
    console.error(error)
    await bot.sendMessage(msg.chat.id, `에러났다냥😿`)
    if (msg.from?.id === owner) await bot.sendMessage(msg.chat.id, `${error}`)
  }
})

bot.onText(/.*(털쥐|프칫).*/, async (msg) => {
  try {
    const input = msg!.text!
    const chatType = msg.chat.type
    const chatId = msg.chat.id
    const username = msg.from?.id.toString()

    const isForProfessor = input.includes("털쥐박사님")

    if (messages[chatId] === undefined) initChatRoom(msg)

    console.log(chatType, chatId, username, "input:", input)

    // do job
    if (input.toString().toLocaleLowerCase().includes("그려줘")) {
      bot.sendChatAction(chatId, "typing")
      await bot.sendMessage(chatId, "알았다냥😽")

      bot.sendChatAction(chatId, "upload_photo")
      const response = await openai.createImage({
        prompt: input,
        n: 1,
        size: "512x512",
      })
      if (response.data.data[0].url)
        await bot.sendPhoto(chatId, response.data.data[0].url)
    } else {
      bot.sendChatAction(chatId, "typing")
      messages[chatId].push({ role: "user", name: username, content: input })

      const completion = await openai.createChatCompletion({
        model: "gpt-4-0613",
        messages: isForProfessor
          ? messages[chatId].filter((m) => m.role !== "system")
          : messages[chatId],
        temperature: 1,
      })
      const output = completion.data.choices[0].message?.content ?? ""

      if (completion.data.choices[0].message)
        messages[chatId].push(completion.data.choices[0].message)

      if (messages[chatId]?.length > maxMessageLength + 1)
        messages[chatId].splice(1, 2)

      console.log(chatType, "output:", output)
      await bot.sendMessage(chatId, output)
    }
  } catch (error) {
    console.error(error)
    await bot.sendMessage(msg.chat.id, "에러났다냥😿")
    if (msg.from?.id === owner) await bot.sendMessage(msg.chat.id, `${error}`)
  }
})

async function arca(id: number | string) {
  const url = "https://arca.live/e/" + id
  const dom = await JSDOM.fromURL(url)
  const emoticonTitle = dom.window.document
    .querySelector(
      "body > div.root-container > div.content-wrapper.clearfix > article > div > div.article-wrapper > div.article-head > div.title-row > div"
    )
    ?.textContent?.trim()

  if (emoticonTitle === undefined) throw new Error()

  // const title = `${emoticonTitle} By @misa_chat_bot`
  const emoticonElements = dom.window.document.querySelectorAll(
    ".emoticons-wrapper > .emoticon"
  )
  const emoticonUrls: string[] = []

  for (const element of emoticonElements) {
    emoticonUrls.push(
      `https:${element.getAttribute("data-src") || element.getAttribute("src")}`
    )
  }
  return {
    emoticonTitle,
    emoticonUrls,
  }
}

async function checkStickerSetExists(
  emoticonUrls: string[],
  id: number | string
): Promise<boolean> {
  try {
    const length = Math.ceil(emoticonUrls.length / 50)
    const name =
      length === 1
        ? `arca_${id}_by_misa_chat_bot`
        : `arca_${id}_1_${length}_by_misa_chat_bot`
    // 존재하지 않으면 여기서 throw error 로 나가게됨
    await getStickerSet({ name })
    return true
  } catch (_) {
    return false
  }
}

function processPercentage(order: number, length: number): string {
  let text = ""
  for (let i = 0; i < order; i++) {
    text += "⬛️"
  }
  for (let i = 0; i < length - order; i++) {
    text += "⬜️"
  }
  return text
}

async function processSticker(
  chatId: TelegramBot.ChatId,
  userId: number,
  url: string
): Promise<BotAPI.InputSticker> {
  return new Promise(async (resolve, _) => {
    bot.sendChatAction(chatId, "choose_sticker" as any)
    const buffer = await convertToWebm(url)
    bot.sendChatAction(chatId, "choose_sticker" as any)
    const file = await uploadStickerFile({
      user_id: userId,
      sticker: buffer,
      sticker_format: "video",
      url,
    })

    const InputSticker: BotAPI.InputSticker = {
      sticker: file.file_id,
      emoji_list: ["🔖"],
    }
    resolve(InputSticker)
  })
}
