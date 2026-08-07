import { expect, test } from "bun:test"
import {
  clearWslDistroState,
  requireWslIpcString,
  requireWslIpcStrings,
  wslServerIdToRestart,
  wslTerminalArgs,
} from "./policy"
import {
  expectPoltterVersion,
  pendingRestartAfterWslInstall,
  pollWslHealth,
  wslServerIdsToStartOnInitialize,
} from "./startup"
import { createWslServersController, type WslServerConfig } from "./servers"

let persistedServers: WslServerConfig[] = []
let releasePoltterResolve: (() => void) | undefined

test("starts every configured WSL server on initialization", () => {
  expect(
    wslServerIdsToStartOnInitialize([
      { id: "wsl:Debian", distro: "Debian" },
      { id: "wsl:Ubuntu-24.04", distro: "Ubuntu-24.04" },
    ]),
  ).toEqual(["wsl:Debian", "wsl:Ubuntu-24.04"])
})

test("rejects an update that did not install the desktop version", () => {
  expect(() => expectPoltterVersion("1.16.2", "1.16.2")).not.toThrow()
  expect(() => expectPoltterVersion("1.14.35", "1.16.2")).toThrow(
    "Poltter update finished but Debian still reports 1.14.35; expected 1.16.2",
  )
})

test("restarts an existing distro server after updating Poltter", () => {
  expect(
    wslServerIdToRestart(
      [
        {
          config: { id: "wsl:Debian", distro: "Debian" },
          runtime: { kind: "ready", url: "", username: null, password: null },
        },
      ],
      "Debian",
    ),
  ).toBe("wsl:Debian")
  expect(wslServerIdToRestart([], "Debian")).toBeUndefined()
})

test("clears cached distro probes when removing a WSL server", () => {
  expect(
    clearWslDistroState(
      { Debian: { name: "Debian", canExecute: true, hasBash: true, hasCurl: true, error: null } },
      {
        Debian: {
          distro: "Debian",
          resolvedPath: "/home/luke/.poltter/bin/poltter",
          version: "1.16.2",
          expectedVersion: "1.16.2",
          matchesDesktop: true,
          error: null,
        },
      },
      "Debian",
    ),
  ).toEqual({ distroProbes: {}, poltterChecks: {} })
})

test("opens terminals for distro names containing spaces", () => {
  expect(wslTerminalArgs("Ubuntu Preview")).toEqual(["/c", "start", "", "wsl", "-d", "Ubuntu Preview"])
})

test("stops health polling when sidecar startup settles", async () => {
  const abort = new AbortController()
  let checks = 0
  const polling = pollWslHealth(
    async () => {
      checks++
      return false
    },
    abort.signal,
    1,
  )

  await new Promise((resolve) => setTimeout(resolve, 5))
  abort.abort()
  await polling
  const settled = checks
  await new Promise((resolve) => setTimeout(resolve, 5))
  expect(checks).toBe(settled)
})

test("validates WSL IPC identifiers at the module boundary", () => {
  expect(requireWslIpcString("distro", "Debian")).toBe("Debian")
  expect(requireWslIpcStrings("distro", ["Debian", "Ubuntu"])).toEqual(["Debian", "Ubuntu"])
  expect(() => requireWslIpcString("distro", "")).toThrow("Invalid distro")
  expect(() => requireWslIpcString("server id", undefined)).toThrow("Invalid server id")
  expect(() => requireWslIpcStrings("distro", [])).toThrow("Invalid distro")
})

test("derives a required Windows restart from the post-install runtime probe", () => {
  expect(pendingRestartAfterWslInstall({ available: false, version: null, error: "WSL unavailable" })).toBe(true)
  expect(pendingRestartAfterWslInstall({ available: true, version: "WSL version: 2.6.1", error: null })).toBe(false)
})

test("ignores stale background Poltter checks after removing a WSL server", async () => {
  persistedServers = []
  releasePoltterResolve = undefined
  const controller = createWslServersController(
    "1.16.2",
    async () => ({
      listener: {
        stop: () => undefined,
        onExit: () => undefined,
      },
      url: "http://127.0.0.1:4096",
      username: "poltter",
      password: "secret",
    }),
    testControllerOptions(),
  )

  await controller.addServer("Debian")
  await waitFor(() => !!releasePoltterResolve)
  await controller.removeServer("wsl:Debian")
  releasePoltterResolve?.()
  await new Promise((resolve) => setTimeout(resolve, 0))

  expect(controller.getState().servers).toEqual([])
  expect(controller.getState().poltterChecks).toEqual({})
})

test("ignores stale startup Poltter checks after removing a WSL server", async () => {
  persistedServers = [{ id: "wsl:Debian", distro: "Debian" }]
  releasePoltterResolve = undefined
  const controller = createWslServersController(
    "1.16.2",
    async () => new Promise<never>(() => undefined),
    testControllerOptions(),
  )

  await controller.initialize()
  await waitFor(() => !!releasePoltterResolve)
  await controller.removeServer("wsl:Debian")
  releasePoltterResolve?.()
  await new Promise((resolve) => setTimeout(resolve, 0))

  expect(controller.getState().servers).toEqual([])
  expect(controller.getState().poltterChecks).toEqual({})
})

test("probes addable distros in parallel before checking Poltter", async () => {
  persistedServers = []
  const started: string[] = []
  const release = new Map<string, () => void>()
  const poltter: string[] = []
  const controller = createWslServersController("1.16.2", async () => new Promise<never>(() => undefined), {
    ...testControllerOptions(),
    probeDistro: async (distro) => {
      started.push(distro)
      await new Promise<void>((resolve) => release.set(distro, resolve))
      return { name: distro, canExecute: true, hasBash: true, hasCurl: true, error: null }
    },
    resolvePoltter: async (distro) => {
      poltter.push(distro)
      return "/home/me/.poltter/bin/poltter"
    },
  })

  const task = controller.probeAddable(["Debian", "Ubuntu"])
  await waitFor(() => started.length === 2)
  expect(started).toEqual(["Debian", "Ubuntu"])
  expect(poltter).toEqual([])
  release.get("Debian")?.()
  release.get("Ubuntu")?.()
  await task

  expect(Object.keys(controller.getState().distroProbes)).toEqual(["Debian", "Ubuntu"])
  expect(poltter).toEqual(["Debian", "Ubuntu"])
  expect(Object.keys(controller.getState().poltterChecks)).toEqual(["Debian", "Ubuntu"])
})

test("does not check Poltter in addable distros that cannot execute commands", async () => {
  persistedServers = []
  const poltter: string[] = []
  const controller = createWslServersController("1.16.2", async () => new Promise<never>(() => undefined), {
    ...testControllerOptions(),
    probeDistro: async (distro) => ({
      name: distro,
      canExecute: distro === "Debian",
      hasBash: distro === "Debian",
      hasCurl: distro === "Debian",
      error: distro === "Debian" ? null : "Open Ubuntu once to finish setup",
    }),
    resolvePoltter: async (distro) => {
      poltter.push(distro)
      return "/home/me/.poltter/bin/poltter"
    },
  })

  await controller.probeAddable(["Debian", "Ubuntu"])

  expect(Object.keys(controller.getState().distroProbes)).toEqual(["Debian", "Ubuntu"])
  expect(poltter).toEqual(["Debian"])
  expect(Object.keys(controller.getState().poltterChecks)).toEqual(["Debian"])
})

async function waitFor(check: () => boolean) {
  for (let attempt = 0; attempt < 20; attempt++) {
    if (check()) return
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
  throw new Error("Timed out waiting for condition")
}

function testControllerOptions() {
  return {
    readServers: () => persistedServers,
    writeServers: (servers: WslServerConfig[]) => {
      persistedServers = servers
    },
    readCommandVersion: async () => "1.16.2",
    resolvePoltter: async () => {
      await new Promise<void>((resolve) => {
        releasePoltterResolve = resolve
      })
      return "/home/me/.poltter/bin/poltter"
    },
  }
}
