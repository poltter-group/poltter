// @ts-nocheck

import { Poltter } from "@poltter-ai/core"
import { ReadTool } from "@poltter-ai/core/tools"

const poltter = Poltter.make({})

poltter.tool.add(ReadTool)

poltter.tool.add({
  name: "bash",
  schema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The command to run.",
      },
    },
    required: ["command"],
  },
  execute(input, ctx) {},
})

poltter.auth.add({
  provider: "openai",
  type: "api",
  value: process.env.OPENAI_API_KEY,
})

poltter.agent.add({
  name: "build",
  permissions: [],
  model: {
    id: "gpt-5-5",
    provider: "openai",
    variant: "xhigh",
  },
})

const sessionID = await poltter.session.create({
  agent: "build",
})

poltter.subscribe((event) => {
  console.log(event)
})

await poltter.session.prompt({
  sessionID,
  text: "hey what is up",
})

await poltter.session.prompt({
  sessionID,
  text: "what is up with this",
  files: [
    {
      mime: "image/png",
      uri: "data:image/png;base64,xxxx",
    },
  ],
})

await poltter.session.wait()

console.log(await poltter.session.messages(sessionID))
