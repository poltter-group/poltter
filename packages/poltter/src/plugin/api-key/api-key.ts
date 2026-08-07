import { z } from "zod"
import { tool } from "@poltter-ai/plugin"
import type { AuthHook, Hooks, PluginInput } from "@poltter-ai/plugin"
import { Effect } from "effect"

// This plugin provides an API key authentication method for Poltter itself.
export async function APIKeyPlugin(_input: PluginInput): Promise<Hooks> {
  const API_KEY_METHOD_LABEL = "Poltter API Key"

  const poltterApiKeyAuth: AuthHook["methods"][number] = {
    type: "api", // Using "api" type as it's an API key that needs to be provided
    label: API_KEY_METHOD_LABEL,
    prompts: [
      {
        type: "text",
        key: "apiKey",
        message: "Enter your Poltter API key",
        placeholder: "sk-........................................",
      },
    ],
    authorize: async (inputs) => {
      const apiKey = inputs?.apiKey
      if (!apiKey) {
        return { type: "failed" }
      }
      // In a real scenario, you might want to validate the API key against an endpoint.
      // For now, we just store it in the environment.
      process.env.POLTTER_API_KEY = apiKey
      return {
        type: "success",
        key: apiKey,
        provider: "poltter", // Indicate it's for Poltter itself
      }
    },
  }

  return {
    auth: {
      provider: "poltter", // This auth is for Poltter's own services
      methods: [poltterApiKeyAuth],
    },
  }
}
