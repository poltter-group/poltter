import { Config, ConfigProvider, Context, Effect, Layer, Option } from "effect"
import { ConfigService } from "@/effect/config-service"

const bool = (name: string) => Config.boolean(name).pipe(Config.withDefault(false))
const positiveInteger = (name: string) =>
  Config.number(name).pipe(
    Config.map((value) => (Number.isInteger(value) && value > 0 ? value : undefined)),
    Config.orElse(() => Config.succeed(undefined)),
  )
const experimental = bool("POLTTER_EXPERIMENTAL")
const enabledByExperimental = (name: string) =>
  Config.all({ experimental, enabled: Config.boolean(name).pipe(Config.option) }).pipe(
    Config.map((flags) => Option.getOrElse(flags.enabled, () => flags.experimental)),
  )

export class Service extends ConfigService.Service<Service>()("@poltter/RuntimeFlags", {
  autoShare: bool("POLTTER_AUTO_SHARE"),
  pure: bool("POLTTER_PURE"),
  disableDefaultPlugins: bool("POLTTER_DISABLE_DEFAULT_PLUGINS"),
  disableEmbeddedWebUi: bool("POLTTER_DISABLE_EMBEDDED_WEB_UI"),
  disableExternalSkills: bool("POLTTER_DISABLE_EXTERNAL_SKILLS"),
  disableLspDownload: bool("POLTTER_DISABLE_LSP_DOWNLOAD"),
  disableClaudeCodePrompt: Config.all({
    broad: bool("POLTTER_DISABLE_CLAUDE_CODE"),
    direct: bool("POLTTER_DISABLE_CLAUDE_CODE_PROMPT"),
  }).pipe(Config.map((flags) => flags.broad || flags.direct)),
  disableClaudeCodeSkills: Config.all({
    broad: bool("POLTTER_DISABLE_CLAUDE_CODE"),
    direct: bool("POLTTER_DISABLE_CLAUDE_CODE_SKILLS"),
  }).pipe(Config.map((flags) => flags.broad || flags.direct)),
  enableExa: Config.all({
    experimental,
    enabled: bool("POLTTER_ENABLE_EXA"),
    legacy: bool("POLTTER_EXPERIMENTAL_EXA"),
  }).pipe(Config.map((flags) => flags.experimental || flags.enabled || flags.legacy)),
  enableParallel: Config.all({
    enabled: bool("POLTTER_ENABLE_PARALLEL"),
    legacy: bool("POLTTER_EXPERIMENTAL_PARALLEL"),
  }).pipe(Config.map((flags) => flags.enabled || flags.legacy)),
  enableExperimentalModels: bool("POLTTER_ENABLE_EXPERIMENTAL_MODELS"),
  enableQuestionTool: bool("POLTTER_ENABLE_QUESTION_TOOL"),
  experimentalReferences: enabledByExperimental("POLTTER_EXPERIMENTAL_REFERENCES"),
  experimentalBackgroundSubagents: enabledByExperimental("POLTTER_EXPERIMENTAL_BACKGROUND_SUBAGENTS"),
  experimentalLspTy: bool("POLTTER_EXPERIMENTAL_LSP_TY"),
  experimentalLspTool: enabledByExperimental("POLTTER_EXPERIMENTAL_LSP_TOOL"),
  experimentalOxfmt: enabledByExperimental("POLTTER_EXPERIMENTAL_OXFMT"),
  experimentalPlanMode: enabledByExperimental("POLTTER_EXPERIMENTAL_PLAN_MODE"),
  experimentalCodeMode: enabledByExperimental("POLTTER_EXPERIMENTAL_CODE_MODE"),
  experimentalEventSystem: enabledByExperimental("POLTTER_EXPERIMENTAL_EVENT_SYSTEM"),
  experimentalWorkspaces: enabledByExperimental("POLTTER_EXPERIMENTAL_WORKSPACES"),
  experimentalIconDiscovery: enabledByExperimental("POLTTER_EXPERIMENTAL_ICON_DISCOVERY"),
  outputTokenMax: positiveInteger("POLTTER_EXPERIMENTAL_OUTPUT_TOKEN_MAX"),
  bashDefaultTimeoutMs: positiveInteger("POLTTER_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS"),
  experimentalNativeLlm: bool("POLTTER_EXPERIMENTAL_NATIVE_LLM"),
  experimentalWebSockets: bool("POLTTER_EXPERIMENTAL_WEBSOCKETS"),
  client: Config.string("POLTTER_CLIENT").pipe(Config.withDefault("cli")),
}) {}

export type Info = Context.Service.Shape<typeof Service>

const emptyConfigLayer = Service.layer.pipe(
  Layer.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({}))),
  Layer.orDie,
)

export const layer = (overrides: Partial<Info> = {}) =>
  Layer.effect(
    Service,
    Effect.gen(function* () {
      const flags = yield* Service
      return Service.of({ ...flags, ...overrides })
    }),
  ).pipe(Layer.provide(emptyConfigLayer))

export const node = LayerNode.make({ service: Service, layer: Service.layer.pipe(Layer.orDie), deps: [] })

export * as RuntimeFlags from "./runtime-flags"
import { LayerNode } from "@poltter-ai/core/effect/layer-node"
