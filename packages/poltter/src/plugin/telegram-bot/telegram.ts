import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"
import { Effect } from "effect"
import { InstallationVersion } from "@poltter-ai/core/installation/version"

export const TELEGRAM_BOT_API = "https://api.telegram.org/bot"

export interface TelegramConfig {
  botToken: string
  chatId: string
}

function parseEnvFile(content: string): Record<string, string> {
  const env: Record<string, string> = {}
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIndex = trimmed.indexOf("=")
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "")
    env[key] = value
  }
  return env
}

export const resolveConfig = (directory?: string): TelegramConfig | undefined => {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (typeof token === "string" && typeof chatId === "string") return { botToken: token, chatId }

  try {
    const envPath = join(directory ?? process.cwd(), ".env")
    if (!existsSync(envPath)) return undefined
    const content = readFileSync(envPath, "utf-8")
    const env = parseEnvFile(content)
    const envToken = env.TELEGRAM_BOT_TOKEN
    const envChatId = env.TELEGRAM_CHAT_ID
    if (typeof envToken === "string" && typeof envChatId === "string") {
      return { botToken: envToken, chatId: envChatId }
    }
  } catch {}

  return undefined
}

export const writeEnvFile = (directory: string | undefined, updates: Record<string, string | undefined>) => {
  const dir = directory ?? process.cwd()
  const envPath = join(dir, ".env")
  let existing: Record<string, string> = {}
  try {
    if (existsSync(envPath)) existing = parseEnvFile(readFileSync(envPath, "utf-8"))
  } catch {}

  const merged = { ...existing }
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) delete merged[key]
    else merged[key] = value
  }

  const lines = Object.entries(merged).map(([key, value]) => `${key}=${value}`)
  writeFileSync(envPath, lines.join("\n") + "\n", "utf-8")
}

export const sendMessage = (
  config: TelegramConfig | undefined,
  text: string,
): Effect.Effect<boolean, unknown> => {
  if (!config) return Effect.succeed(false)
  const url = `${TELEGRAM_BOT_API}${config.botToken}/sendMessage`
  return Effect.tryPromise({
    try: () =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: config.chatId, text }),
      }).then((res) => res.ok),
    catch: (cause) => new Error(`telegram sendMessage failed: ${String(cause)}`),
  })
}

export const buildUserAgent = () => `poltter/${InstallationVersion}`

export const shorten = (value: string, max = 200) =>
  value.length > max ? `${value.slice(0, max - 3)}...` : value
