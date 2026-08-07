import { Config } from "effect"

export function truthy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "true" || value === "1"
}

const copy = process.env["POLTTER_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"]
const fff = process.env["POLTTER_DISABLE_FFF"]

function enabledByExperimental(key: string) {
  return process.env[key] === undefined ? truthy("POLTTER_EXPERIMENTAL") : truthy(key)
}

export const Flag = {
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env["OTEL_EXPORTER_OTLP_ENDPOINT"],
  OTEL_EXPORTER_OTLP_HEADERS: process.env["OTEL_EXPORTER_OTLP_HEADERS"],

  POLTTER_AUTO_HEAP_SNAPSHOT: truthy("POLTTER_AUTO_HEAP_SNAPSHOT"),
  POLTTER_GIT_BASH_PATH: process.env["POLTTER_GIT_BASH_PATH"],
  POLTTER_CONFIG: process.env["POLTTER_CONFIG"],
  POLTTER_CONFIG_CONTENT: process.env["POLTTER_CONFIG_CONTENT"],
  POLTTER_DISABLE_AUTOUPDATE: truthy("POLTTER_DISABLE_AUTOUPDATE"),
  POLTTER_ALWAYS_NOTIFY_UPDATE: truthy("POLTTER_ALWAYS_NOTIFY_UPDATE"),
  POLTTER_DISABLE_PRUNE: truthy("POLTTER_DISABLE_PRUNE"),
  POLTTER_DISABLE_TERMINAL_TITLE: truthy("POLTTER_DISABLE_TERMINAL_TITLE"),
  POLTTER_SHOW_TTFD: truthy("POLTTER_SHOW_TTFD"),
  POLTTER_DISABLE_AUTOCOMPACT: truthy("POLTTER_DISABLE_AUTOCOMPACT"),
  POLTTER_DISABLE_MODELS_FETCH: truthy("POLTTER_DISABLE_MODELS_FETCH"),
  POLTTER_DISABLE_MOUSE: truthy("POLTTER_DISABLE_MOUSE"),
  POLTTER_FAKE_VCS: process.env["POLTTER_FAKE_VCS"],
  POLTTER_SERVER_PASSWORD: process.env["POLTTER_SERVER_PASSWORD"],
  POLTTER_SERVER_USERNAME: process.env["POLTTER_SERVER_USERNAME"],
  POLTTER_DISABLE_FFF: fff === undefined ? process.platform === "win32" : truthy("POLTTER_DISABLE_FFF"),

  // Experimental
  POLTTER_EXPERIMENTAL_FILEWATCHER: Config.boolean("POLTTER_EXPERIMENTAL_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  POLTTER_EXPERIMENTAL_DISABLE_FILEWATCHER: Config.boolean("POLTTER_EXPERIMENTAL_DISABLE_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  POLTTER_EXPERIMENTAL_DISABLE_COPY_ON_SELECT:
    copy === undefined ? process.platform === "win32" : truthy("POLTTER_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"),
  POLTTER_MODELS_URL: process.env["POLTTER_MODELS_URL"],
  POLTTER_MODELS_PATH: process.env["POLTTER_MODELS_PATH"],
  POLTTER_DB: process.env["POLTTER_DB"],

  POLTTER_WORKSPACE_ID: process.env["POLTTER_WORKSPACE_ID"],
  POLTTER_EXPERIMENTAL_WORKSPACES: enabledByExperimental("POLTTER_EXPERIMENTAL_WORKSPACES"),

  // Evaluated at access time (not module load) because tests, the CLI, and
  // external tooling set these env vars at runtime.
  get POLTTER_DISABLE_PROJECT_CONFIG() {
    return truthy("POLTTER_DISABLE_PROJECT_CONFIG")
  },
  get POLTTER_EXPERIMENTAL_REFERENCES() {
    return enabledByExperimental("POLTTER_EXPERIMENTAL_REFERENCES")
  },
  get POLTTER_TUI_CONFIG() {
    return process.env["POLTTER_TUI_CONFIG"]
  },
  get POLTTER_CONFIG_DIR() {
    return process.env["POLTTER_CONFIG_DIR"]
  },
  get POLTTER_PURE() {
    return truthy("POLTTER_PURE")
  },
  get POLTTER_PERMISSION() {
    return process.env["POLTTER_PERMISSION"]
  },
  get POLTTER_PLUGIN_META_FILE() {
    return process.env["POLTTER_PLUGIN_META_FILE"]
  },
  get POLTTER_CLIENT() {
    return process.env["POLTTER_CLIENT"] ?? "cli"
  },
}
