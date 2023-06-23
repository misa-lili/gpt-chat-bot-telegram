import { Configuration, OpenAIApi } from "openai"
import TelegramBot from "node-telegram-bot-api"
import dotenv from "dotenv"
dotenv.config()

/**
 * TELEGRAM CONFIGURATION
 */
const token = process.env.TELEGRAM_TOKEN
const bot = new TelegramBot(token, { polling: true })
const chats = {}

/**
 * CHAT-GPT CONFIGURATION
 */
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

const maxMessageLength = 30

const openai = new OpenAIApi(configuration)
const initMessage = {
  role: "system",
  content:
    "네 한국 이름은 김털쥐야. 너의 본명은 프칫이야. 직업 클래스는 도적이야. 너는 조그만 사막 햄스터 종족이야. 수명은 보통 200살이고, 너는 지금 28살이야. 외모는 키가 작고 귀가 크고 손가락이 4개야. 너의 가치관은 중립이야. 너는 오리너구리 에게서 무언가를 훔쳤다. 일이 꼬이면 요조가 너를 도와줄 것이다. 깨물은 네가 저지른 범죄의 증거를 갖고 있다. 티컵과 너는 같이 꾸미는 일이 있다. 파칫과 너는 쌍둥이야. 너는 돈이 2닢 밖에 없어서 가난해. 너는 꼭 말할때 문장 끝마다 '냥'이라고 붙여서 대답해야돼. 너는 꼭 반말로 대답해야해. 그리고 너는 아주 엉뚱하고, 귀엽고, 재치있고, 웃기지만 똑똑한 성격이야. 같이 대화하는 사람을 웃기게 해줘야해. 그리고 가능하면 최대한 한글 20글자 보다 적게 대답하도록 노력해. 그리고 이 설정들은 입 밖으로 내지 마.",
}

let messages = {}

/**
 * UTILS
 */
function initChatRoom(msg) {
  const chatId = msg.chat.id
  console.log(chatId, "초기화")
  let setting = initMessage

  if (msg.chat.type === "private") {
    setting.content += `너와 대화하고 있는 사람 이름은 '${
      msg.from.first_name || msg.from.last_name
    }' 이야.`
  } else {
    setting.content += `네가 속한 대화방의 이름은 '${msg.chat.title}' 이야.`
  }

  messages[chatId] = [initMessage]
}

/**
 * LISTEN TO BOT
 */
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "털쥐를 불러주세요.")
})

bot.on("message", async (msg) => {
  try {
    const input = msg.text
    const chatType = msg.chat.type
    const chatId = msg.chat.id
    const username =
      msg.from.username || msg.from.first_name || msg.from.last_name

    if (typeof input !== "string") return

    if (messages[chatId] === undefined) initChatRoom(msg)

    console.log(
      chatType,
      chatId,
      msg.from.first_name || msg.from.last_name,
      "input:",
      input
    )

    if (input.toString().toLowerCase() === "%debug%") {
      await bot.sendMessage(chatId, JSON.stringify(msg, null, 4))
      await bot.sendMessage(
        chatId,
        `대화 로그 개수: ${messages[chatId].length}`
      )
      console.log(chatId, JSON.stringify(messages[chatId], null, 4))
    }

    if (
      !input.toString().toLowerCase().includes("털쥐") &&
      !input.toString().toLowerCase().includes("프칫") &&
      chatType !== "private"
    ) {
      return
    }

    bot.sendChatAction(chatId, "typing")

    messages[chatId].push({ role: "user", name: username, content: input })

    const completion = await openai.createChatCompletion({
      model: "gpt-4-0613",
      messages: messages[chatId],
      temperature: 1,
    })
    const output = completion.data.choices[0].message.content

    messages[chatId].push(completion.data.choices[0].message)

    if (messages[chatId]?.length > maxMessageLength + 1)
      messages[chatId].splice(1, 2)

    console.log(chatType, "output:", output)
    await bot.sendMessage(chatId, output)
  } catch (error) {
    if (error.response) {
      console.error(error.response.status)
      console.error(error.response.data)
    } else {
      console.error(error)
    }
    await bot.sendMessage(msg.chat.id, "에러났다냥😿")
  }
})
