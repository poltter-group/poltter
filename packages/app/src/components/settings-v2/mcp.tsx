import { Component, For, Show, createMemo, createResource, createSignal } from "solid-js"
import { useLanguage } from "@/context/language"
import { useServerSDK } from "@/context/server-sdk"
import { SettingsListV2 } from "./parts/list"
import { Switch } from "@poltter-ai/ui/switch"
import { Icon } from "@poltter-ai/ui/icon"
import { ButtonV2 } from "@poltter-ai/ui/v2/button-v2"
import { useDialog } from "@poltter-ai/ui/context/dialog"
import { DialogMcpServerAdd, DialogMcpServerEdit } from "./mcp-dialog"
import { toggleMcp } from "@/context/global-sync/mcp"
import "./settings-v2.css"

const statusColor: Record<string, string> = {
  connected: "bg-v2-color-green-500",
  failed: "bg-v2-color-red-500",
  needs_auth: "bg-v2-color-yellow-500",
  needs_client_registration: "bg-v2-color-yellow-500",
  disabled: "bg-v2-text-text-muted",
  pending: "bg-v2-text-text-muted",
}

export const SettingsMcpV2: Component = () => {
  const language = useLanguage()
  const serverSDK = useServerSDK()
  const dialog = useDialog()

  const [tick, setTick] = createSignal(0)

  const [servers] = createResource(
    () => tick(),
    async () => {
      const sdk = serverSDK()
      const result = await sdk.client.mcp.status({})
      if (!result.data) return []
      return Object.entries(result.data)
        .map(([name, status]) => ({ name, status: status.status }))
        .sort((a, b) => a.name.localeCompare(b.name))
    },
  )

  const enabledCount = createMemo(() => servers()?.filter((s) => s.status === "connected").length ?? 0)
  const totalCount = createMemo(() => servers()?.length ?? 0)

  const openAdd = () => {
    dialog.push(() => <DialogMcpServerAdd />)
  }

  const openEdit = (name: string) => {
    const config = { type: "remote", enabled: false }
    dialog.push(() => <DialogMcpServerEdit name={name} config={config} />)
  }

  const handleToggle = async (name: string, status: string) => {
    const sdk = serverSDK()
    await toggleMcp({
      status: status as Parameters<typeof toggleMcp>[0]["status"],
      connect: async () => {
        await sdk.client.mcp.connect({ name })
      },
      disconnect: async () => {
        await sdk.client.mcp.disconnect({ name })
      },
      authenticate: async () => {
        await sdk.client.mcp.auth.authenticate({ name })
      },
      refresh: async () => {
        setTick((t) => t + 1)
      },
    })
  }

  return (
    <>
      <div class="settings-v2-tab-header">
        <div class="flex items-center justify-between w-full">
          <div>
            <h2 class="settings-v2-tab-title">{language.t("settings.mcp.title")}</h2>
            <p class="settings-v2-tab-description">
              {language.t("dialog.mcp.description", { enabled: enabledCount(), total: totalCount() })}
            </p>
          </div>
          <ButtonV2 variant="neutral" class="h-8 px-3 shrink-0" onClick={openAdd}>
            <Icon name="plus" size="small" />
            {language.t("common.add")}
          </ButtonV2>
        </div>
      </div>

      <div class="settings-v2-tab-body">
        <Show
          when={!servers.loading && servers()}
          fallback={<div class="settings-v2-servers-status">{servers.loading ? "Loading..." : language.t("dialog.mcp.empty")}</div>}
        >
          <SettingsListV2>
            <For each={servers()!}>
              {(item) => {
                const enabled = () => item.status === "connected"
                return (
                  <div class="settings-v2-servers-row">
                    <div class="settings-v2-servers-lead">
                      <div class={`w-2 h-2 rounded-full ${statusColor[item.status] ?? statusColor.disabled}`} />
                      <div class="settings-v2-servers-copy">
                        <span class="settings-v2-servers-name">{item.name}</span>
                        <Show when={item.status !== "connected" && item.status !== "disabled"}>
                          <span class="settings-v2-servers-meta">
                            {language.t(`mcp.status.${item.status}`)}
                          </span>
                        </Show>
                      </div>
                    </div>
                    <div class="settings-v2-servers-actions gap-1">
                      <button
                        type="button"
                        class="p-1 rounded hover:bg-surface-raised-base-hover transition-colors"
                        title={language.t("common.edit")}
                        onClick={() => openEdit(item.name)}
                      >
                        <Icon name="edit" size="small" class="text-icon-weak" />
                      </button>
                      <Switch
                        checked={enabled()}
                        onChange={() => handleToggle(item.name, item.status)}
                      />
                    </div>
                  </div>
                )
              }}
            </For>
          </SettingsListV2>
        </Show>
      </div>
    </>
  )
}
