import { Context } from "effect"
import type { InstanceContext } from "@/project/instance-context"
import type { WorkspaceV2 } from "@poltter-ai/core/workspace"

export const InstanceRef = Context.Reference<InstanceContext | undefined>("~poltter/InstanceRef", {
  defaultValue: () => undefined,
})

export const WorkspaceRef = Context.Reference<WorkspaceV2.ID | undefined>("~poltter/WorkspaceRef", {
  defaultValue: () => undefined,
})
