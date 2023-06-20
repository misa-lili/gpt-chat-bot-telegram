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

const openai = new OpenAIApi(configuration)

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
    console.log(chatType, "input:", input)

    if (typeof input !== "string") return

    if (input.toString().toLowerCase().includes("%debug%")) {
      bot.sendMessage(chatId, JSON.stringify(msg, null, 4))
    }

    if (
      !input.toString().toLowerCase().includes("털쥐") &&
      chatType !== "private"
    ) {
      return
    }

    bot.sendChatAction(chatId, "typing")

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "네 이름은 김털쥐야." },
        {
          role: "system",
          content:
            "너는 말할때 문장 끝마다 '냥'이라고 붙여서 대답해야돼. 그리고 너는 아주 엉뚱하고, 웃기게 대답해야해. 그리고 가급적이면 한 문장으로 대답해.",
        },
        { role: "user", content: input },
      ],
    })
    const output = completion.data.choices[0].message.content
    console.log(chatType, "output:", output)
    bot.sendMessage(chatId, output)
  } catch (error) {
    if (error.response) {
      console.error(error.response.status)
      console.error(error.response.data)
    } else {
      console.error(error)
    }
    bot.sendMessage(chatId, "에러났다냥😿")
  }
})
