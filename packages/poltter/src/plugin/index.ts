import { LayerNode } from "@poltter-ai/core/effect/layer-node"
import type {
  Hooks,
  PluginInput,
  Plugin as PluginInstance,
  PluginModule,
  WorkspaceAdapter as PluginWorkspaceAdapter,
} from "@poltter-ai/plugin"
import { Config } from "@/config/config"
import { createPoltterClient } from "@poltter-ai/sdk"
import { ServerAuth } from "@/server/auth"
import { CodexAuthPlugin } from "./openai/codex"
import { Session } from "@/session/session"
import { NamedError } from "@poltter-ai/core/util/error"
import { CopilotAuthPlugin } from "./github-copilot/copilot"
import { TelegramBotPlugin } from "./telegram-bot/telegram-bot"
import { APIKeyPlugin } from "./api-key/api-key"
import { ModalPlugin } from "./modal/modal"
import { gitlabAuthPlugin } from "opencode-gitlab-auth"
import { PoeAuthPlugin } from "opencode-poe-auth"
import { CloudflareAIGatewayAuthPlugin, CloudflareWorkersAuthPlugin } from "./cloudflare"
import { AzureAuthPlugin } from "./azure"
import { DigitalOceanAuthPlugin } from "./digitalocean"
import { XaiAuthPlugin } from "./xai"
import { SnowflakeCortexAuthPlugin } from "./snowflake-cortex"
import { Effect, Layer, Context } from "effect"
import { EffectBridge } from "@/effect/bridge"
import { InstanceState } from "@/effect/instance-state"
import { errorMessage } from "@/util/error"
import { PluginLoader } from "./loader"
import { parsePluginSpecifier, readPluginId, readV1Plugin, resolvePluginId } from "./shared"
import { registerAdapter } from "@/control-plane/adapters"
import type { WorkspaceAdapter } from "@/control-plane/types"
import { RuntimeFlags } from "@/effect/runtime-flags"
import { EventV2Bridge } from "@/event-v2-bridge"
import { InstallationChannel } from "@poltter-ai/core/installation/version"
import { Credential } from "@poltter-ai/core/credential"
import { Integration } from "@poltter-ai/core/integration"
import { existsSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"

type State = {
  hooks: Hooks[]
}

// Hook names that follow the (input, output) => Promise<void> trigger pattern
type TriggerName = {
  [K in keyof Hooks]-?: NonNullable<Hooks[K]> extends (input: any, output: any) => Promise<void> ? K : never
}[keyof Hooks]

export interface Interface {
  readonly trigger: <
    Name extends TriggerName,
    Input = Parameters<Required<Hooks>[Name]>[0],
    Output = Parameters<Required<Hooks>[Name]>[1],
  >(
    name: Name,
    input: Input,
    output: Output,
  ) => Effect.Effect<Output>
  readonly list: () => Effect.Effect<Hooks[]>
  readonly init: () => Effect.Effect<void>
}

export class Service extends Context.Service<Service, Interface>()("@poltter/Plugin") {}

export function experimentalWebSocketsEnabled(input: { enabled: boolean; channel?: string }) {
  return input.enabled || ["local", "dev", "beta"].includes(input.channel ?? InstallationChannel)
}

// Built-in plugins that are directly imported (not installed from npm)
function internalPlugins(
  flags: RuntimeFlags.Info,
  credentialStore?: Credential.Interface,
): PluginInstance[] {
  const resolveTelegramConfig = credentialStore
    ? () => {
        const stored = Effect.runSync(
          credentialStore.all().pipe(Effect.catch(() => Effect.succeed([])))
        )
        const cred = stored.find((item) => item.integrationID === "telegram" && item.value.type === "key")
        if (!cred || cred.value.type !== "key") return undefined
        const telegram = parseTelegramCredential(cred.value)
        if (!telegram?.token || !telegram?.chatId) return undefined
        return { botToken: telegram.token, chatId: telegram.chatId }
      }
    : undefined
  return [
    // Temporary rollout: pre-release builds use WebSockets by default; releases require explicit opt-in.
    (input) =>
      CodexAuthPlugin(input, {
        experimentalWebSockets: experimentalWebSocketsEnabled({ enabled: flags.experimentalWebSockets }),
      }),
    CopilotAuthPlugin,
    ModalPlugin,
    gitlabAuthPlugin as unknown as PluginInstance,
    PoeAuthPlugin as unknown as PluginInstance,
    CloudflareWorkersAuthPlugin,
    CloudflareAIGatewayAuthPlugin,
    AzureAuthPlugin,
    DigitalOceanAuthPlugin,
    XaiAuthPlugin,
    (input, options) => TelegramBotPlugin(input, { ...options, resolveTelegramConfig }),
    APIKeyPlugin,
  ]
}

function isServerPlugin(value: unknown): value is PluginInstance {
  return typeof value === "function"
}

function getServerPlugin(value: unknown) {
  if (isServerPlugin(value)) return value
  if (!value || typeof value !== "object" || !("server" in value)) return
  if (!isServerPlugin(value.server)) return
  return value.server
}

function getLegacyPlugins(mod: Record<string, unknown>) {
  const seen = new Set<unknown>()
  const result: PluginInstance[] = []

  for (const entry of Object.values(mod)) {
    if (seen.has(entry)) continue
    seen.add(entry)
    const plugin = getServerPlugin(entry)
    if (!plugin) throw new TypeError("Plugin export is not a function")
    result.push(plugin)
  }

  return result
}

async function applyPlugin(load: PluginLoader.Loaded, input: PluginInput, hooks: Hooks[]) {
  const plugin = readV1Plugin(load.mod, load.spec, "server", "detect")
  if (plugin) {
    await resolvePluginId(load.source, load.spec, load.target, readPluginId(plugin.id, load.spec), load.pkg)
    hooks.push(await (plugin as PluginModule).server(input, load.options))
    return
  }

  for (const server of getLegacyPlugins(load.mod)) {
    hooks.push(await server(input, load.options))
  }
}

// Parse a stored Telegram credential into { token, chatId }. Supports both
// formats: token + metadata.chatId (from `poltter auth login telegram`) and the
// composite "token:chatId" (from the Integrations panel). The bot token itself
// contains a colon (digits:secret), so composite keys split on the SECOND colon.
function parseTelegramCredential(value: Credential.Key): { token: string; chatId?: string } | undefined {
  const chatIdFromMeta = value.metadata?.chatId
  if (typeof chatIdFromMeta === "string") return { token: value.key, chatId: chatIdFromMeta }
  const firstColon = value.key.indexOf(":")
  const secondColon = value.key.indexOf(":", firstColon + 1)
  if (secondColon === -1) return { token: value.key }
  return { token: value.key.slice(0, secondColon), chatId: value.key.slice(secondColon + 1) }
}

const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const events = yield* EventV2Bridge.Service
    const config = yield* Config.Service
    const flags = yield* RuntimeFlags.Service
    const credentials = yield* Credential.Service
    const integration = yield* Integration.Service

    const state = yield* InstanceState.make<State>(
      Effect.fn("Plugin.state")(function* (ctx) {
        const hooks: Hooks[] = []
        const bridge = yield* EffectBridge.make()

        function publishPluginError(message: string) {
          bridge.fork(events.publish(Session.Event.Error, { error: new NamedError.Unknown({ message }).toObject() }))
        }

        const { Server } = yield* Effect.promise(() => import("../server/server"))

        const serverUrl = Server.url
        const client = createPoltterClient({
          baseUrl: serverUrl?.toString() ?? "http://localhost:4096",
          directory: ctx.directory,
          headers: ServerAuth.headers(),
          ...(serverUrl ? {} : { fetch: async (...args) => Server.Default().app.fetch(...args) }),
        })
        const cfg = yield* config.get()
        const input: PluginInput = {
          client,
          project: ctx.project,
          worktree: ctx.worktree,
          directory: ctx.directory,
          experimental_workspace: {
            register(type: string, adapter: PluginWorkspaceAdapter) {
              registerAdapter(ctx.project.id, type, adapter as WorkspaceAdapter)
            },
          },
          get serverUrl(): URL {
            return Server.url ?? new URL("http://localhost:4096")
          },
          // @ts-expect-error
          $: typeof Bun === "undefined" ? undefined : Bun.$,
        }

        for (const plugin of flags.disableDefaultPlugins ? [] : internalPlugins(flags, credentials)) {
          const init = yield* Effect.tryPromise({
            try: () => plugin(input),
            catch: errorMessage,
          }).pipe(
            Effect.tapError((error) => Effect.logError("failed to load internal plugin", { name: plugin.name, error })),
            Effect.option,
          )
          if (init._tag === "Some") hooks.push(init.value)
        }

        const plugins = flags.pure ? [] : (cfg.plugin_origins ?? [])
        if (flags.pure && cfg.plugin_origins?.length) {
        }
        if (plugins.length) yield* config.waitForDependencies()

        const loaded = yield* Effect.promise(() =>
          PluginLoader.loadExternal({
            items: plugins,
            kind: "server",
            report: {
              start(candidate) {},
              missing(candidate, _retry, message) {},
              error(candidate, _retry, stage, error, resolved) {
                const spec = candidate.plan.spec
                const cause = error instanceof Error ? (error.cause ?? error) : error
                const message = stage === "load" ? errorMessage(error) : errorMessage(cause)

                if (stage === "install") {
                  const parsed = parsePluginSpecifier(spec)
                  publishPluginError(`Failed to install plugin ${parsed.pkg}@${parsed.version}: ${message}`)
                  return
                }

                if (stage === "compatibility") {
                  publishPluginError(`Plugin ${spec} skipped: ${message}`)
                  return
                }

                if (stage === "entry") {
                  publishPluginError(`Failed to load plugin ${spec}: ${message}`)
                  return
                }

                publishPluginError(`Failed to load plugin ${spec}: ${message}`)
              },
            },
          }),
        )
        for (const load of loaded) {
          if (!load) continue

          // Keep plugin execution sequential so hook registration and execution
          // order remains deterministic across plugin runs.
          yield* Effect.tryPromise({
            try: () => applyPlugin(load, input, hooks),
            catch: (err) => {
              const message = errorMessage(err)
              return message
            },
          }).pipe(
            Effect.tapError((error) => Effect.logError("failed to load plugin", { path: load.spec, error })),
            Effect.catch(() => {
              // TODO: make proper events for this
              // events.publish(Session.Event.Error, {
              //   error: new NamedError.Unknown({
              //     message: `Failed to load plugin ${load.spec}: ${message}`,
              //   }).toObject(),
              // })
              return Effect.void
            }),
          )
        }

        // Notify plugins of current config
        for (const hook of hooks) {
          yield* Effect.tryPromise({
            try: () => Promise.resolve((hook as any).config?.(cfg)),
            catch: errorMessage,
          }).pipe(
            Effect.tapError((error) => Effect.logError("plugin config hook failed", { error })),
            Effect.ignore,
          )
        }

        // Sync stored integration credentials into process.env so plugins
        // that read process.env (e.g. Telegram) keep working across restarts
        // and react immediately to connect/disconnect events. `clear` mirrors an
        // explicit disconnect (credential removed); startup keeps any env vars
        // that were set by the shell instead of erasing them.
        const syncTelegramEnv = Effect.fn("Plugin.syncTelegramEnv")(function* (clear: boolean) {
          const stored = yield* credentials.all().pipe(Effect.catch(() => Effect.succeed([])))
          const cred = stored.find((item) => item.integrationID === "telegram" && item.value.type === "key")
          let token: string | undefined
          let chatId: string | undefined
          if (cred?.value.type === "key") {
            const telegram = parseTelegramCredential(cred.value)
            token = telegram?.token
            chatId = telegram?.chatId
            if (token) process.env.TELEGRAM_BOT_TOKEN = token
            if (chatId) process.env.TELEGRAM_CHAT_ID = chatId
          } else if (clear) {
            delete process.env.TELEGRAM_BOT_TOKEN
            delete process.env.TELEGRAM_CHAT_ID
          }
          try {
            const envPath = join(ctx.directory, ".env")
            let env: Record<string, string> = {}
            if (existsSync(envPath)) {
              for (const line of readFileSync(envPath, "utf-8").split("\n")) {
                const trimmed = line.trim()
                if (!trimmed || trimmed.startsWith("#")) continue
                const eq = trimmed.indexOf("=")
                if (eq === -1) continue
                env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "")
              }
            }
            if (token && chatId) {
              env.TELEGRAM_BOT_TOKEN = token
              env.TELEGRAM_CHAT_ID = chatId
            } else {
              delete env.TELEGRAM_BOT_TOKEN
              delete env.TELEGRAM_CHAT_ID
            }
            writeFileSync(envPath, Object.entries(env).map(([k, v]) => `${k}=${v}`).join("\n") + "\n", "utf-8")
          } catch {}
        })
        yield* syncTelegramEnv(false)

        // Expose legacy plugin credentials through the v2 Integration registry so
        // the Integrations panel can connect/disconnect Telegram via the standard
        // key-method flow (stored in the Credential store, mirrored to process.env).
        yield* integration.transform((draft) => {
          draft.method.update({
            integrationID: Integration.ID.make("telegram"),
            method: { type: "key", label: "Telegram Bot" },
          })
        })

        const unsubscribe = yield* events.listen((event) => {
          // Integration connection events may not carry a matching location, so
          // sync them before the per-directory guard below.
          const data = event.data as { integrationID?: string } | undefined
          if (event.type === "integration.connection.updated" && data?.integrationID === "telegram") {
            return syncTelegramEnv(true)
          }
          if (event.location?.directory !== ctx.directory) return Effect.void
          return Effect.sync(() => {
            for (const hook of hooks) {
              void hook["event"]?.({ event: { id: event.id, type: event.type, properties: event.data } as any })
            }
          })
        })
        yield* Effect.addFinalizer(() => unsubscribe)

        yield* Effect.addFinalizer(() =>
          Effect.forEach(
            hooks,
            (hook) =>
              Effect.tryPromise({
                try: () => Promise.resolve(hook.dispose?.()),
                catch: errorMessage,
              }).pipe(
                Effect.tapError((error) => Effect.logError("plugin dispose hook failed", { error })),
                Effect.ignore,
              ),
            { discard: true },
          ),
        )

        return { hooks }
      }),
    )

    const trigger = Effect.fn("Plugin.trigger")(function* <
      Name extends TriggerName,
      Input = Parameters<Required<Hooks>[Name]>[0],
      Output = Parameters<Required<Hooks>[Name]>[1],
    >(name: Name, input: Input, output: Output) {
      if (!name) return output
      const s = yield* InstanceState.get(state)
      for (const hook of s.hooks) {
        const fn = hook[name] as any
        if (!fn) continue
        yield* Effect.promise(async () => fn(input, output))
      }
      return output
    })

    const list = Effect.fn("Plugin.list")(function* () {
      const s = yield* InstanceState.get(state)
      return s.hooks
    })

    const init = Effect.fn("Plugin.init")(function* () {
      yield* InstanceState.get(state)
    })

    return Service.of({ trigger, list, init })
  }),
)

export const node = LayerNode.make({
  service: Service,
  layer: layer,
  deps: [EventV2Bridge.node, Config.node, RuntimeFlags.node, Credential.node, Integration.node],
})

export * as Plugin from "."
