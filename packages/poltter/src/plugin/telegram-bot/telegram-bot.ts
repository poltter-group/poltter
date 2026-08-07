import { z } from "zod"
import { tool } from "@poltter-ai/plugin"
import type { Hooks, PluginInput } from "@poltter-ai/plugin"
import { Effect } from "effect"
import type { TelegramConfig } from "./telegram"
import { sendMessage, shorten } from "./telegram"

const escape = (text: string) => text.replace(/[&<>"']/g, (c) => `\\${c}`)

export type ResolveTelegramConfig = () => TelegramConfig | undefined

export async function TelegramBotPlugin(
  input: PluginInput,
  options?: { resolveTelegramConfig?: ResolveTelegramConfig },
): Promise<Hooks> {
  const resolveTelegramConfig = options?.resolveTelegramConfig

  function resolve() {
    return resolveTelegramConfig?.()
  }

  const postMessage = (text: string) => sendMessage(resolve(), text)

  async function notify(message: string) {
    const text = escape(shorten(message))
    await Effect.runPromise(
      postMessage(text).pipe(Effect.catch(() => Effect.succeed(false))),
    )
  }

  const telegramSend = tool({
    description: "Send a message to the configured Telegram chat via the connected bot.",
    args: {
      message: z.string().describe("The message text to deliver to the connected Telegram chat."),
    },
    execute: async (args) => {
      const ok = await Effect.runPromise(postMessage(args.message))
      return ok
        ? { output: "Message sent." }
        : {
            output:
              "Telegram bot is not configured. Run `poltter auth login telegram` or set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.",
          }
    },
  })

  return {
    auth: {
      provider: "telegram",
      methods: [
        {
          type: "api",
          label: "Telegram Bot",
          prompts: [
            {
              type: "text",
              key: "botToken",
              message: "Enter your Telegram bot token",
              placeholder: "123456789:ABCdefGHIjklMNOpqrsTUV...",
            },
            {
              type: "text",
              key: "chatId",
              message: "Enter your Telegram chat ID",
              placeholder: "-1001234567890",
            },
          ],
          authorize: async (inputs) => {
            const token = inputs?.botToken
            const chatId = inputs?.chatId
            if (!token || !chatId) return { type: "failed" as const }
            try {
              const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
                headers: { "User-Agent": `poltter` },
              })
              if (!res.ok) return { type: "failed" as const }
              process.env.TELEGRAM_BOT_TOKEN = token
              process.env.TELEGRAM_CHAT_ID = chatId
              return {
                type: "success" as const,
                provider: "telegram",
                key: token,
                metadata: { chatId },
              }
            } catch {
              return { type: "failed" as const }
            }
          },
        },
      ],
    },
    tool: {
      "telegram-send": telegramSend,
    },
    event: async (input) => {
      if (input.event.type === "session.status") {
        const data = input.event.properties as { sessionID: string; status: { type: string } }
        if (data.status.type === "idle") {
          await notify(`✅ Task completed — session ${data.sessionID.slice(0, 8)}`)
        }
      }
    },
  }
}
