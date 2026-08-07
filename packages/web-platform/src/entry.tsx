// @refresh reload

import * as Sentry from "@sentry/solid"
import { render } from "solid-js/web"
import {
  AppBaseProviders,
  AppInterface,
  loadLocaleDict,
  normalizeLocale,
  type Locale,
  PlatformProvider,
  ServerConnection,
} from "@poltter-ai/app"
import { createResource } from "solid-js"
import pkg from "../package.json"
import { createWebPlatform } from "./platform"
import "./index.css"

const DEFAULT_SERVER_URL_KEY = "poltter.settings.dat:defaultServerUrl"

const getStorage = (key: string) => {
  if (typeof localStorage === "undefined") return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const readDefaultServerUrl = () => getStorage(DEFAULT_SERVER_URL_KEY)

const getCurrentUrl = () => {
  if (location.hostname.includes("opencode.ai")) return "http://localhost:4096"
  if (import.meta.env.DEV)
    return `http://${import.meta.env.VITE_POLTTER_SERVER_HOST ?? "localhost"}:${import.meta.env.VITE_POLTTER_SERVER_PORT ?? "4096"}`
  return location.origin
}

const getDefaultUrl = () => {
  const lsDefault = readDefaultServerUrl()
  if (lsDefault) return lsDefault
  return getCurrentUrl()
}

const clearAuthToken = () => {
  const params = new URLSearchParams(location.search)
  if (!params.has("auth_token")) return
  params.delete("auth_token")
  history.replaceState(null, "", location.pathname + (params.size ? `?${params}` : "") + location.hash)
}

const decode64 = (str: string | undefined): string | undefined => {
  if (!str) return undefined
  try {
    return atob(str)
  } catch {
    return undefined
  }
}

const authFromToken = (token: string | null) => {
  const decoded = decode64(token ?? undefined)
  if (!decoded) return
  const separator = decoded.indexOf(":")
  if (separator === -1) return
  return {
    username: decoded.slice(0, separator) || "poltter",
    password: decoded.slice(separator + 1),
  }
}

const root = document.getElementById("root")
if (!(root instanceof HTMLElement) && import.meta.env.DEV) {
  throw new Error("Root element not found")
}

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE ?? `web-platform@${pkg.version}`,
    initialScope: {
      tags: {
        platform: "web-platform",
      },
    },
    integrations: (integrations) => {
      return integrations.filter(
        (i) =>
          i.name !== "Breadcrumbs" && !(import.meta.env.POLTTER_CHANNEL === "prod" && i.name === "GlobalHandlers"),
      )
    },
  })
}

if (root instanceof HTMLElement) {
  const platform = createWebPlatform()

  const loadLocale = async (): Promise<Locale | undefined> => {
    const storage = platform.storage?.("poltter.global.dat")
    const current = await storage?.getItem("language")
    if (!current) return
    const locale = current.match(/"locale"\s*:\s*"([^"]+)"/)?.[1]
    if (!locale) return
    const next = normalizeLocale(locale)
    if (next !== "en") await loadLocaleDict(next)
    return next satisfies Locale
  }

  const auth = authFromToken(new URLSearchParams(location.search).get("auth_token"))
  clearAuthToken()

  const server: ServerConnection.Http = {
    type: "http",
    authToken: !!auth,
    http: {
      url: getCurrentUrl(),
      ...auth,
    },
  }

  render(
    () => (
      <PlatformProvider value={platform}>
        <AppBaseProviders>
          <AppInterface
            defaultServer={ServerConnection.Key.make(getDefaultUrl())}
            canonicalLocalServer={ServerConnection.key(server)}
            servers={[server]}
            disableHealthCheck
          />
        </AppBaseProviders>
      </PlatformProvider>
    ),
    root,
  )
}
