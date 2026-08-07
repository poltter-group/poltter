import type { Platform, ServerConnection } from "@poltter-ai/app"
import type { AsyncStorage } from "@solid-primitives/storage"
import pkg from "../package.json"

const DEFAULT_SERVER_URL_KEY = "poltter.settings.dat:defaultServerUrl"

const getStorageItem = (key: string): string | null => {
  if (typeof localStorage === "undefined") return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const setStorageItem = (key: string, value: string | null) => {
  if (typeof localStorage === "undefined") return
  try {
    if (value !== null) {
      localStorage.setItem(key, value)
      return
    }
    localStorage.removeItem(key)
  } catch {
    return
  }
}

const readDefaultServerUrl = () => getStorageItem(DEFAULT_SERVER_URL_KEY)
const writeDefaultServerUrl = (url: string | null) => setStorageItem(DEFAULT_SERVER_URL_KEY, url)

const notify: Platform["notify"] = async (title, description, onClick) => {
  if (!("Notification" in window)) return

  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission().catch(() => "denied")
      : Notification.permission

  if (permission !== "granted") return

  const inView = document.visibilityState === "visible" && document.hasFocus()
  if (inView) return

  const notification = new Notification(title, {
    body: description ?? "",
    icon: "https://opencode.ai/favicon-96x96-v3.png",
  })

  notification.onclick = () => {
    window.focus()
    onClick?.()
    notification.close()
  }
}

const openExternal: Platform["openExternal"] = (value) => {
  if (!URL.canParse(value)) return
  const url = new URL(value)
  if (url.protocol !== "http:" && url.protocol !== "https:" && url.protocol !== "mailto:") return
  window.open(url.href, "_blank", "noopener,noreferrer")
}

const restart: Platform["restart"] = async () => {
  window.location.reload()
}

function createLocalStorage(name = "default.dat"): AsyncStorage {
  const prefix = `poltter.${name}:`
  return {
    getItem: async (key: string) => getStorageItem(`${prefix}${key}`),
    setItem: async (key: string, value: string) => setStorageItem(`${prefix}${key}`, value),
    removeItem: async (key: string) => setStorageItem(`${prefix}${key}`, null),
    clear: async () => {
      if (typeof localStorage === "undefined") return
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k?.startsWith(prefix)) keys.push(k)
      }
      keys.forEach((k) => localStorage.removeItem(k))
    },
    key: async (index: number) => {
      if (typeof localStorage === "undefined") return null
      let count = 0
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k?.startsWith(prefix)) {
          if (count === index) return k.slice(prefix.length)
          count++
        }
      }
      return null
    },
    getLength: async () => {
      if (typeof localStorage === "undefined") return 0
      let count = 0
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k?.startsWith(prefix)) count++
      }
      return count
    },
    get length() {
      return 0
    },
  }
}

let zoomLevel = 1

const webviewZoom: Platform["webviewZoom"] = () => zoomLevel

const setZoomLevel = (level: number) => {
  zoomLevel = Math.min(Math.max(level, 0.25), 5)
  document.documentElement.style.zoom = String(zoomLevel)
}

const zoomIn = () => setZoomLevel(zoomLevel + 0.1)
const zoomOut = () => setZoomLevel(zoomLevel - 0.1)
const resetZoom = () => setZoomLevel(1)

const isFullscreen = () => !!document.fullscreenElement

const windowFullscreen: Platform["windowFullscreen"] = isFullscreen

const toggleFullscreen = async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen()
  } else {
    await document.documentElement.requestFullscreen()
  }
}

const openDirectoryPickerDialog: Platform extends { platform: "desktop" } ? NonNullable<Platform["openDirectoryPickerDialog"]> : never = async (opts) => {
  if ("showDirectoryPicker" in window) {
    try {
      const dirHandle = await (window as any).showDirectoryPicker({ mode: "readwrite" })
      return dirHandle.name
    } catch {
      return null
    }
  }

  return new Promise((resolve) => {
    const input = document.createElement("input")
    input.type = "file"
    input.webkitdirectory = true
    input.multiple = opts?.multiple ?? false
    input.addEventListener("change", () => {
      const files = input.files
      if (!files || files.length === 0) {
        resolve(null)
        return
      }
      const firstFile = files[0]
      const relativePath = firstFile.webkitRelativePath
      const dirName = relativePath ? relativePath.split("/")[0] : firstFile.name
      resolve(opts?.multiple ? [dirName] : dirName)
    })
    input.addEventListener("cancel", () => resolve(null))
    input.click()
  })
}

const openAttachmentPickerDialog: Platform["openAttachmentPickerDialog"] = async (opts, onFile) => {
  return new Promise<void>((resolve) => {
    const input = document.createElement("input")
    input.type = "file"
    input.multiple = opts?.multiple ?? false
    if (opts?.accept) {
      input.accept = opts.accept.join(",")
    }
    input.addEventListener("change", async () => {
      const files = input.files
      if (!files) {
        resolve()
        return
      }
      for (const file of files) {
        await onFile(file)
      }
      resolve()
    })
    input.addEventListener("cancel", () => resolve())
    input.click()
  })
}

const saveFilePickerDialog: Platform["saveFilePickerDialog"] = async (opts) => {
  if ("showSaveFilePicker" in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: opts?.defaultPath,
      })
      return handle.name
    } catch {
      return null
    }
  }

  const name = prompt("Enter file name:", opts?.defaultPath ?? "download")
  return name
}

const readClipboardImage: Platform["readClipboardImage"] = async () => {
  if (!navigator.clipboard?.read) return null
  try {
    const clipboardItems = await navigator.clipboard.read()
    for (const item of clipboardItems) {
      for (const type of item.types) {
        if (type === "image/png" || type.startsWith("image/")) {
          const blob = await item.getType(type)
          const ext = type.split("/")[1] ?? "png"
          return new File([blob], `clipboard-image-${Date.now()}.${ext}`, { type })
        }
      }
    }
    return null
  } catch {
    return null
  }
}

const getPathForFile: Platform["getPathForFile"] = (file) => {
  return (file as any).webkitRelativePath ?? file.name
}

const openPath: Platform["openPath"] = async () => {}
const revealPath: Platform["revealPath"] = async () => false
const openLocalFile: Platform["openLocalFile"] = () => {}

const runDesktopMenuAction: Platform["runDesktopMenuAction"] = async (action) => {
  switch (action) {
    case "view.resetZoom":
      resetZoom()
      break
    case "view.zoomIn":
      zoomIn()
      break
    case "view.zoomOut":
      zoomOut()
      break
    case "view.toggleFullscreen":
      await toggleFullscreen()
      break
  }
}

const exportDebugLogs: Platform["exportDebugLogs"] = async () => {
  return "Debug logs not available in web platform"
}

const checkAppExists: Platform["checkAppExists"] = async () => false
const setForceFocus: Platform["setForceFocus"] = async () => {}
const recordFatalRendererError: Platform["recordFatalRendererError"] = async () => {}

const os = (() => {
  const ua = navigator.userAgent
  if (ua.includes("Mac")) return "macos" as const
  if (ua.includes("Windows")) return "windows" as const
  if (ua.includes("Linux")) return "linux" as const
  return undefined
})()

export function createWebPlatform(): Platform {
  return {
    platform: "web",
    os,
    version: pkg.version,
    openExternal,
    openLocalFile,
    openPath,
    revealPath,
    restart,
    notify,
    openDirectoryPickerDialog,
    openAttachmentPickerDialog,
    getPathForFile,
    saveFilePickerDialog,
    storage: createLocalStorage,
    updater: {
      state: () => ({ status: "disabled" as const }),
      check: async () => ({ status: "disabled" as const }),
      install: async () => {},
    },
    exportDebugLogs,
    setForceFocus,
    recordFatalRendererError,
    webviewZoom,
    windowFullscreen,
    runDesktopMenuAction,
    checkAppExists,
    readClipboardImage,
    getDefaultServer: async () => {
      const stored = readDefaultServerUrl()
      return stored ? ServerConnection.Key.make(stored) : null
    },
    setDefaultServer: writeDefaultServerUrl,
    getDisplayBackend: () => null,
    setDisplayBackend: async () => {},
    getPinchZoomEnabled: () => false,
    setPinchZoomEnabled: async () => {},
  }
}
