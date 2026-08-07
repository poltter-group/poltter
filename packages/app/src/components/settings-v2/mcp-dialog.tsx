import { ButtonV2 } from "@poltter-ai/ui/v2/button-v2"
import { Dialog, DialogBody, DialogFooter, DialogHeader, DialogTitleGroup } from "@poltter-ai/ui/v2/dialog-v2"
import { Field } from "@poltter-ai/ui/v2/field-v2"
import { TextInputV2 } from "@poltter-ai/ui/v2/text-input-v2"
import { showToast } from "@/utils/toast"
import { type Component, createSignal, Show } from "solid-js"
import { useLanguage } from "@/context/language"
import { useServerSDK } from "@/context/server-sdk"
import { useDialog } from "@poltter-ai/ui/context/dialog"

type McpServerType = "local" | "remote"

export const DialogMcpServerAdd: Component = () => {
  const language = useLanguage()
  const serverSDK = useServerSDK()
  const dialog = useDialog()

  const [name, setName] = createSignal("")
  const [serverType, setServerType] = createSignal<McpServerType>("remote")
  const [url, setUrl] = createSignal("")
  const [command, setCommand] = createSignal("")
  const [envKey, setEnvKey] = createSignal("")
  const [envValue, setEnvValue] = createSignal("")
  const [saving, setSaving] = createSignal(false)

  const save = async () => {
    const n = name().trim()
    if (!n) return
    setSaving(true)
    try {
      const config =
        serverType() === "remote"
          ? { type: "remote" as const, url: url(), enabled: true }
          : {
              type: "local" as const,
              command: command().split(/\s+/).filter(Boolean),
              enabled: true,
              ...(envKey()
                ? { environment: { [envKey()]: envValue() } }
                : {}),
            }
      await serverSDK().client.mcp.add({ name: n, config })
      showToast({ variant: "success", title: language.t("settings.mcp.toast.added") })
      dialog.close()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      showToast({ title: language.t("common.requestFailed"), description: message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog fit>
      <DialogHeader>
        <DialogTitleGroup title={language.t("settings.mcp.dialog.addTitle")} description={""} />
      </DialogHeader>
      <DialogBody class="flex flex-col gap-4">
        <Field>
          <Field.Label>{language.t("settings.mcp.dialog.name")}</Field.Label>
          <TextInputV2 value={name()} onInput={(e) => setName(e.currentTarget.value)} placeholder="my-server" />
        </Field>
        <Field>
          <Field.Label>{language.t("settings.mcp.dialog.type")}</Field.Label>
          <div class="flex gap-2">
            <ButtonV2
              variant={serverType() === "remote" ? "neutral" : "outline"}
              onClick={() => setServerType("remote")}
            >
              Remote
            </ButtonV2>
            <ButtonV2
              variant={serverType() === "local" ? "neutral" : "outline"}
              onClick={() => setServerType("local")}
            >
              Local
            </ButtonV2>
          </div>
        </Field>
        <Show when={serverType() === "remote"}>
          <Field>
            <Field.Label>{language.t("settings.mcp.dialog.url")}</Field.Label>
            <TextInputV2 value={url()} onInput={(e) => setUrl(e.currentTarget.value)} placeholder="https://example.com/mcp" />
          </Field>
        </Show>
        <Show when={serverType() === "local"}>
          <Field>
            <Field.Label>{language.t("settings.mcp.dialog.command")}</Field.Label>
            <TextInputV2 value={command()} onInput={(e) => setCommand(e.currentTarget.value)} placeholder="npx -y @example/mcp-server" />
          </Field>
          <Field>
            <Field.Label>{language.t("settings.mcp.dialog.env")}</Field.Label>
            <div class="flex gap-2">
              <TextInputV2 value={envKey()} onInput={(e) => setEnvKey(e.currentTarget.value)} placeholder="KEY" class="flex-1" />
              <TextInputV2 value={envValue()} onInput={(e) => setEnvValue(e.currentTarget.value)} placeholder="value" class="flex-1" />
            </div>
          </Field>
        </Show>
      </DialogBody>
      <DialogFooter>
        <ButtonV2 variant="outline" onClick={() => dialog.close()}>
          {language.t("common.cancel")}
        </ButtonV2>
        <ButtonV2 variant="neutral" onClick={save} disabled={saving() || !name().trim()}>
          {language.t("common.save")}
        </ButtonV2>
      </DialogFooter>
    </Dialog>
  )
}

export const DialogMcpServerEdit: Component<{
  name: string
  config: { type: string; url?: string; command?: string[]; environment?: Record<string, string>; enabled?: boolean }
}> = (props) => {
  const language = useLanguage()
  const serverSDK = useServerSDK()
  const dialog = useDialog()

  const [serverType, setServerType] = createSignal<McpServerType>(props.config.type as McpServerType)
  const [url, setUrl] = createSignal(props.config.url ?? "")
  const [command, setCommand] = createSignal((props.config.command ?? []).join(" "))
  const [envKey, setEnvKey] = createSignal(Object.keys(props.config.environment ?? {})[0] ?? "")
  const [envValue, setEnvValue] = createSignal(Object.values(props.config.environment ?? {})[0] ?? "")
  const [saving, setSaving] = createSignal(false)

  const save = async () => {
    setSaving(true)
    try {
      const config =
        serverType() === "remote"
          ? { type: "remote" as const, url: url(), enabled: props.config.enabled ?? true }
          : {
              type: "local" as const,
              command: command().split(/\s+/).filter(Boolean),
              enabled: props.config.enabled ?? true,
              ...(envKey()
                ? { environment: { [envKey()]: envValue() } }
                : {}),
            }
      await serverSDK().client.mcp.add({ name: props.name, config })
      showToast({ variant: "success", title: language.t("settings.mcp.toast.updated") })
      dialog.close()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      showToast({ title: language.t("common.requestFailed"), description: message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog fit>
      <DialogHeader>
        <DialogTitleGroup title={language.t("settings.mcp.dialog.editTitle", { name: props.name })} description={""} />
      </DialogHeader>
      <DialogBody class="flex flex-col gap-4">
        <Field>
          <Field.Label>{language.t("settings.mcp.dialog.type")}</Field.Label>
          <div class="flex gap-2">
            <ButtonV2
              variant={serverType() === "remote" ? "neutral" : "outline"}
              onClick={() => setServerType("remote")}
            >
              Remote
            </ButtonV2>
            <ButtonV2
              variant={serverType() === "local" ? "neutral" : "outline"}
              onClick={() => setServerType("local")}
            >
              Local
            </ButtonV2>
          </div>
        </Field>
        <Show when={serverType() === "remote"}>
          <Field>
            <Field.Label>{language.t("settings.mcp.dialog.url")}</Field.Label>
            <TextInputV2 value={url()} onInput={(e) => setUrl(e.currentTarget.value)} placeholder="https://example.com/mcp" />
          </Field>
        </Show>
        <Show when={serverType() === "local"}>
          <Field>
            <Field.Label>{language.t("settings.mcp.dialog.command")}</Field.Label>
            <TextInputV2 value={command()} onInput={(e) => setCommand(e.currentTarget.value)} placeholder="npx -y @example/mcp-server" />
          </Field>
          <Field>
            <Field.Label>{language.t("settings.mcp.dialog.env")}</Field.Label>
            <div class="flex gap-2">
              <TextInputV2 value={envKey()} onInput={(e) => setEnvKey(e.currentTarget.value)} placeholder="KEY" class="flex-1" />
              <TextInputV2 value={envValue()} onInput={(e) => setEnvValue(e.currentTarget.value)} placeholder="value" class="flex-1" />
            </div>
          </Field>
        </Show>
      </DialogBody>
      <DialogFooter>
        <ButtonV2 variant="outline" onClick={() => dialog.close()}>
          {language.t("common.cancel")}
        </ButtonV2>
        <ButtonV2 variant="neutral" onClick={save} disabled={saving()}>
          {language.t("common.save")}
        </ButtonV2>
      </DialogFooter>
    </Dialog>
  )
}
