import { $ } from "bun"
import { downloadCliToResources } from "./utils"

await $`bun run install-electron`

await $`bun ./scripts/copy-icons.ts ${process.env.POLTTER_CHANNEL ?? "dev"}`

await $`cd ../poltter && bun script/build-node.ts`
await downloadCliToResources()
