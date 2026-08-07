import { initI18n, t } from "./i18n"

export async function installCli(): Promise<void> {
  await initI18n()
  window.alert(t("desktop.cli.notAvailable.message"))
}
