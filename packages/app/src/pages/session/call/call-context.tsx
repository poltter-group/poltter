import { createSimpleContext } from "@poltter-ai/ui/context"
import { type Accessor, type ParentProps } from "solid-js"
import { createCall, type CallController } from "./use-call"

export const { use: useCall, provider: CallProvider } = createSimpleContext({
  name: "Call",
  init: (props: { sessionID: Accessor<string | undefined> }) => createCall({ sessionID: props.sessionID }),
})
