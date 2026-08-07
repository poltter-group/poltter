import { AgentV2 } from "@poltter-ai/core/agent"
import { AISDK } from "@poltter-ai/core/aisdk"
import { Catalog } from "@poltter-ai/core/catalog"
import { CommandV2 } from "@poltter-ai/core/command"
import { Credential } from "@poltter-ai/core/credential"
import { AppNodeBuilder } from "@poltter-ai/core/effect/app-node-builder"
import { LayerNodePlatform } from "@poltter-ai/core/effect/app-node-platform"
import { LayerNode } from "@poltter-ai/core/effect/layer-node"
import { EventV2 } from "@poltter-ai/core/event"
import { FileSystem } from "@poltter-ai/core/filesystem"
import { FSUtil } from "@poltter-ai/core/fs-util"
import { Integration } from "@poltter-ai/core/integration"
import { Location } from "@poltter-ai/core/location"
import { Npm } from "@poltter-ai/core/npm"
import { PluginV2 } from "@poltter-ai/core/plugin"
import { Reference } from "@poltter-ai/core/reference"
import { SkillV2 } from "@poltter-ai/core/skill"
import { Effect, Layer } from "effect"
import { tempLocationLayer } from "../fixture/location"

const npmLayer = Layer.succeed(
  Npm.Service,
  Npm.Service.of({
    add: () => Effect.succeed({ directory: "", entrypoint: undefined }),
    install: () => Effect.void,
    which: () => Effect.succeed(undefined),
  }),
)

export const PluginTestLayer = AppNodeBuilder.build(
  LayerNode.group([
    FileSystem.node,
    FSUtil.node,
    Location.node,
    Npm.node,
    Credential.node,
    EventV2.node,
    LayerNodePlatform.httpClient,
    PluginV2.node,
    AgentV2.node,
    AISDK.node,
    Catalog.node,
    CommandV2.node,
    Integration.node,
    Reference.node,
    SkillV2.node,
  ]),
  [
    [Location.node, tempLocationLayer],
    [Npm.node, npmLayer],
  ],
)
