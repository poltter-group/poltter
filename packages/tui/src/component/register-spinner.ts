import { getComponentCatalogue } from "@opentui/solid/components"
import { registerSpinner } from "opentui-spinner/solid"

export function registerPoltterSpinner() {
  if (!getComponentCatalogue().spinner) registerSpinner()
}
