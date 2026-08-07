import { ButtonV2 } from "@poltter-ai/ui/v2/button-v2"
import { useDialog } from "@poltter-ai/ui/context/dialog"
import { Icon } from "@poltter-ai/ui/icon"
import { type Accessor, type Component, createMemo, createResource, createSignal, Show } from "solid-js"
import { useLanguage } from "@/context/language"
import { useServerSDK } from "@/context/server-sdk"
import { DialogIntegrationApiKey, DialogIntegrationTelegram } from "./integration-dialog"
import { SettingsListV2 } from "./parts/list"
import "./settings-v2.css"

export const SettingsIntegrations: Component<{ directory?: Accessor<string | undefined> }> = (props) => {
  const language = useLanguage()
  const serverSDK = useServerSDK()
  const dialog = useDialog()
  const directory = props.directory ?? (() => undefined)

  const location = () => {
    const dir = directory()
    return dir === undefined ? undefined : { directory: dir }
  }

  const [tick, setTick] = createSignal(0)
  const [telegram] = createResource(
    () => tick(),
    () =>
      serverSDK()
        .api.integration.get({ integrationID: "telegram", location: location() })
        .then((result) => result.data),
  )
  const telegramConnected = createMemo(() => (telegram.latest?.connections.length ?? 0) > 0)
  const [apiKey] = createResource(
    () => tick(),
    () =>
      serverSDK()
        .api.integration.get({ integrationID: "poltter", location: location() })
        .then((result) => result.data),
  )
  const apiKeyConnected = createMemo(() => (apiKey.latest?.connections.length ?? 0) > 0)

  const openTelegram = () => {
    dialog.push(() => <DialogIntegrationTelegram directory={directory} />, () => setTick((value) => value + 1))
  }
  const openApiKey = () => {
    dialog.push(() => <DialogIntegrationApiKey directory={directory} />, () => setTick((value) => value + 1))
  }

  const disconnectTelegram = async () => {
    const connection = telegram.latest?.connections[0]
    if (!connection || connection.type !== "credential") return
    try {
      await serverSDK().api.credential.remove({
        credentialID: connection.id,
        location: location(),
      })
      setTick((value) => value + 1)
    } catch {
      // silently ignore
    }
  }

  const disconnectApiKey = async () => {
    const connection = apiKey.latest?.connections[0]
    if (!connection || connection.type !== "credential") return
    try {
      await serverSDK().api.credential.remove({
        credentialID: connection.id,
        location: location(),
      })
      setTick((value) => value + 1)
    } catch {
      // silently ignore
    }
  }

  const [telegramHover, setTelegramHover] = createSignal(false)
  const [apiKeyHover, setApiKeyHover] = createSignal(false)

  return (
    <>
      <div class="settings-v2-tab-header">
        <h2 class="settings-v2-tab-title">{language.t("settings.integrations.title")}</h2>
      </div>

      <div class="settings-v2-tab-body">
        <SettingsListV2>
          <div class="settings-v2-integration-row">
            <Icon name="telegram" class="settings-v2-integration-row-icon" />
            <span class="settings-v2-integration-row-copy">
              <span class="settings-v2-integration-row-title">
                {language.t("settings.integrations.telegram.title")}
              </span>
              <span class="settings-v2-integration-row-desc">
                {language.t("settings.integrations.telegram.description")}
              </span>
            </span>
            <ButtonV2
              size="small"
              variant={telegramConnected() ? "danger" : "outline"}
              class="settings-v2-integration-row-action"
              onClick={() => (telegramConnected() ? void disconnectTelegram() : openTelegram())}
              onMouseEnter={() => setTelegramHover(true)}
              onMouseLeave={() => setTelegramHover(false)}
            >
              {telegramConnected()
                ? telegramHover()
                  ? language.t("settings.integrations.telegram.connect")
                  : language.t("settings.integrations.telegram.disconnect")
                : language.t("settings.integrations.telegram.connect")}
            </ButtonV2>
          </div>
          <div class="settings-v2-integration-row">
            <Icon name="shield" class="settings-v2-integration-row-icon" />
            <span class="settings-v2-integration-row-copy">
              <span class="settings-v2-integration-row-title">
                {language.t("settings.integrations.apiKey.title")}
              </span>
              <span class="settings-v2-integration-row-desc">
                {language.t("settings.integrations.apiKey.description")}
              </span>
            </span>
            <ButtonV2
              size="small"
              variant={apiKeyConnected() ? "danger" : "outline"}
              class="settings-v2-integration-row-action"
              onClick={() => (apiKeyConnected() ? void disconnectApiKey() : openApiKey())}
              onMouseEnter={() => setApiKeyHover(true)}
              onMouseLeave={() => setApiKeyHover(false)}
            >
              {apiKeyConnected()
                ? apiKeyHover()
                  ? language.t("settings.integrations.apiKey.connect")
                  : language.t("settings.integrations.apiKey.disconnect")
                : language.t("settings.integrations.apiKey.connect")}
            </ButtonV2>
          </div>
        </SettingsListV2>
      </div>
    </>
  )
}
