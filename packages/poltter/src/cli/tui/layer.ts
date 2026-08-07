import { run as runTui, type TuiInput } from "@poltter-ai/tui"
import { Global } from "@poltter-ai/core/global"
import { AppNodeBuilder } from "@poltter-ai/core/effect/app-node-builder"
import { Effect } from "effect"

export function run(input: TuiInput) {
  return runTui(input).pipe(Effect.provide(AppNodeBuilder.build(Global.node)))
}
