/// <reference path="../markdown.d.ts" />

export * as SkillPlugin from "./skill"

import { define } from "./internal"
import { Effect } from "effect"
import { AbsolutePath } from "../schema"
import { SkillV2 } from "../skill"
import customizePoltterContent from "./skill/customize-poltter.md" with { type: "text" }

export const CustomizePoltterContent = customizePoltterContent

export const Plugin = define({
  id: "skill",
  effect: Effect.fn(function* (ctx) {
    yield* ctx.skill.transform((draft) => {
      draft.source(
        SkillV2.EmbeddedSource.make({
          type: "embedded",
          skill: SkillV2.Info.make({
            name: "customize-poltter",
            description:
              "Use ONLY when the user is editing or creating poltter's own configuration: poltter.json, poltter.jsonc, files under .poltter/, or files under ~/.config/poltter/. Also use when creating or fixing poltter agents, subagents, commands, skills, plugins, MCP servers, or permission rules. Do not use for the user's own application code, or for any project that is not configuring poltter itself.",
            location: AbsolutePath.make("/builtin/customize-poltter.md"),
            content: CustomizePoltterContent,
          }),
        }),
      )
    })
  }),
})
