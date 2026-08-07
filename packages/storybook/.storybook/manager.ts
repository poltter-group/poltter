import { addons, types } from "storybook/manager-api"
import { ThemeTool } from "./theme-tool"

addons.register("poltter/theme-toggle", () => {
  addons.add("poltter/theme-toggle/tool", {
    type: types.TOOL,
    title: "Theme",
    match: ({ viewMode }) => viewMode === "story" || viewMode === "docs",
    render: ThemeTool,
  })
})
