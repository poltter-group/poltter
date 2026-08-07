import { ButtonV2 } from "@poltter-ai/ui/v2/button-v2"
import { Dialog, DialogBody, DialogFooter, DialogHeader, DialogTitleGroup } from "@poltter-ai/ui/v2/dialog-v2"
import { DividerV2 } from "@poltter-ai/ui/v2/divider-v2"
import { Field } from "@poltter-ai/ui/v2/field-v2"
import { TextInputV2 } from "@poltter-ai/ui/v2/text-input-v2"
import { showToast } from "@/utils/toast"
import { type Accessor, type Component, createMemo, createResource, createSignal, Show } from "solid-js"
import { useLanguage } from "@/context/language"
import { useServerSDK } from "@/context/server-sdk"
import { useDialog } from "@poltter-ai/ui/context/dialog"

export const DialogIntegrationApiKey: Component<{ directory?: Accessor<string | undefined> }> = (props) => {
  const language = useLanguage()
  const serverSDK = useServerSDK()
  const dialog = useDialog()
  const [apiKey, setApiKey] = createSignal("")
  const [revealApiKey, setRevealApiKey] = createSignal(false)
  const [tick, setTick] = createSignal(0)
  const [optimisticConnected, setOptimisticConnected] = createSignal(false)

  const location = () => {
    const directory = props.directory?.()
    return directory === undefined ? undefined : { directory }
  }

  const [integration] = createResource(
    () => tick(),
    () =>
      serverSDK()
        .api.integration.get({ integrationID: "poltter", location: location() })
        .then((result) => result.data),
  )
  const connected = createMemo(() => optimisticConnected() || (integration.latest?.connections.length ?? 0) > 0)

  const refresh = () => setTick((value) => value + 1)

  const save = async () => {
    const key = apiKey()
    if (!key) return
    try {
      await serverSDK().api.integration.connect.key({
        integrationID: "poltter",
        key,
        location: location(),
      })
      setOptimisticConnected(true)
      showToast({
        variant: "success",
        title: language.t("settings.integrations.apiKey.toast.connected"),
      })
      refresh()
      dialog.close()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      showToast({ title: language.t("common.requestFailed"), description: message })
    }
  }

  const disconnect = async () => {
    const connection = integration.latest?.connections[0]
    if (!connection || connection.type !== "credential") return
    try {
      await serverSDK().api.credential.remove({
        credentialID: connection.id,
        location: location(),
      })
      setOptimisticConnected(false)
      showToast({
        variant: "success",
        title: language.t("settings.integrations.apiKey.toast.disconnected"),
      })
      refresh()
      dialog.close()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      showToast({ title: language.t("common.requestFailed"), description: message })
    }
  }

  return (
    <Dialog fit>
      <DialogHeader>
        <DialogTitleGroup
          title={language.t("settings.integrations.apiKey.title")}
          description={language.t("settings.integrations.apiKey.description")}
        />
      </DialogHeader>
      <DividerV2 />
      <DialogBody class="flex w-full flex-col gap-6 overflow-y-auto px-4 pt-4 pb-1">
        <Show when={connected()}>
          <span class="flex w-fit items-center gap-1.5 rounded-full bg-[var(--v2-state-bg-success)] px-2 py-1 text-[11px] font-[500] leading-none text-[var(--v2-state-fg-success)]">
            {language.t("settings.integrations.apiKey.connected")}
          </span>
        </Show>
        <Field>
          <Field.Label>{language.t("settings.integrations.apiKey.apiKey.label")}</Field.Label>
          <Field.Prefix>{language.t("settings.integrations.apiKey.apiKey.description")}</Field.Prefix>
          <TextInputV2
            autofocus
            type={revealApiKey() ? "text" : "password"}
            appearance="base"
            value={apiKey()}
            onInput={(event) => setApiKey(event.currentTarget.value)}
            placeholder={language.t("settings.integrations.apiKey.apiKey.placeholder")}
            showRevealButton
            revealed={revealApiKey()}
            revealLabel={language.t(revealApiKey() ? "settings.integrations.reveal.hide" : "settings.integrations.reveal.show")}
            onRevealClick={() => setRevealApiKey((value) => !value)}
            spellcheck={false}
            autocorrect="off"
            autocomplete="off"
            autocapitalize="off"
          />
        </Field>
      </DialogBody>
      <DialogFooter>
        <Show
          when={connected()}
          fallback={
            <ButtonV2
              type="button"
              variant="contrast"
              disabled={!apiKey()}
              onClick={() => void save()}
            >
              {language.t("settings.integrations.apiKey.connect")}
            </ButtonV2>
          }
        >
          <ButtonV2 type="button" variant="danger" onClick={() => void disconnect()}>
            {language.t("settings.integrations.apiKey.disconnect")}
          </ButtonV2>
        </Show>
      </DialogFooter>
    </Dialog>
  )
}

export const DialogIntegrationTelegram: Component<{ directory?: Accessor<string | undefined> }> = (props) => {
  const language = useLanguage()
  const serverSDK = useServerSDK()
  const dialog = useDialog()
  const [botToken, setBotToken] = createSignal("")
  const [chatId, setChatId] = createSignal("")
  const [revealToken, setRevealToken] = createSignal(false)
  const [tick, setTick] = createSignal(0)
  const [optimisticConnected, setOptimisticConnected] = createSignal(false)

  const location = () => {
    const directory = props.directory?.()
    return directory === undefined ? undefined : { directory }
  }

  const [integration] = createResource(
    () => tick(),
    () =>
      serverSDK()
        .api.integration.get({ integrationID: "telegram", location: location() })
        .then((result) => result.data),
  )
  const connected = createMemo(() => optimisticConnected() || (integration.latest?.connections.length ?? 0) > 0)

  const refresh = () => setTick((value) => value + 1)

  const save = async () => {
    const token = botToken()
    const id = chatId()
    if (!token || !id) return
    try {
      await serverSDK().api.integration.connect.key({
        integrationID: "telegram",
        key: `${token}:${id}`,
        location: location(),
      })
      setOptimisticConnected(true)
      showToast({
        variant: "success",
        title: language.t("settings.integrations.telegram.toast.connected"),
      })
      refresh()
      dialog.close()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      showToast({ title: language.t("common.requestFailed"), description: message })
    }
  }

  const disconnect = async () => {
    const connection = integration.latest?.connections[0]
    if (!connection || connection.type !== "credential") return
    try {
      await serverSDK().api.credential.remove({
        credentialID: connection.id,
        location: location(),
      })
      setOptimisticConnected(false)
      showToast({
        variant: "success",
        title: language.t("settings.integrations.telegram.toast.disconnected"),
      })
      refresh()
      dialog.close()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      showToast({ title: language.t("common.requestFailed"), description: message })
    }
  }

  return (
    <Dialog fit>
      <DialogHeader>
        <DialogTitleGroup
          title={language.t("settings.integrations.telegram.title")}
          description={language.t("settings.integrations.telegram.description")}
        />
      </DialogHeader>
      <DividerV2 />
      <DialogBody class="flex w-full flex-col gap-6 overflow-y-auto px-4 pt-4 pb-1">
        <Show when={connected()}>
          <span class="flex w-fit items-center gap-1.5 rounded-full bg-[var(--v2-state-bg-success)] px-2 py-1 text-[11px] font-[500] leading-none text-[var(--v2-state-fg-success)]">
            {language.t("settings.integrations.telegram.connected")}
          </span>
        </Show>
        <Field>
          <Field.Label>{language.t("settings.integrations.telegram.botToken.label")}</Field.Label>
          <Field.Prefix>{language.t("settings.integrations.telegram.botToken.description")}</Field.Prefix>
          <TextInputV2
            autofocus
            type={revealToken() ? "text" : "password"}
            appearance="base"
            value={botToken()}
            onInput={(event) => setBotToken(event.currentTarget.value)}
            placeholder={language.t("settings.integrations.telegram.botToken.placeholder")}
            showRevealButton
            revealed={revealToken()}
            revealLabel={language.t(revealToken() ? "settings.integrations.reveal.hide" : "settings.integrations.reveal.show")}
            onRevealClick={() => setRevealToken((value) => !value)}
            spellcheck={false}
            autocorrect="off"
            autocomplete="off"
            autocapitalize="off"
          />
        </Field>
        <Field>
          <Field.Label>{language.t("settings.integrations.telegram.chatId.label")}</Field.Label>
          <Field.Prefix>{language.t("settings.integrations.telegram.chatId.description")}</Field.Prefix>
          <TextInputV2
            type="text"
            appearance="base"
            value={chatId()}
            onInput={(event) => setChatId(event.currentTarget.value)}
            placeholder={language.t("settings.integrations.telegram.chatId.placeholder")}
            spellcheck={false}
            autocorrect="off"
            autocomplete="off"
            autocapitalize="off"
          />
        </Field>
      </DialogBody>
      <DialogFooter>
        <Show
          when={connected()}
          fallback={
            <ButtonV2
              type="button"
              variant="contrast"
              disabled={!botToken() || !chatId()}
              onClick={() => void save()}
            >
              {language.t("settings.integrations.telegram.connect")}
            </ButtonV2>
          }
        >
          <ButtonV2 type="button" variant="danger" onClick={() => void disconnect()}>
            {language.t("settings.integrations.telegram.disconnect")}
          </ButtonV2>
        </Show>
      </DialogFooter>
    </Dialog>
  )
}
