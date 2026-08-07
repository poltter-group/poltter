export * from "./client.js"
export * from "./server.js"

import { createPoltterClient } from "./client.js"
import { createPoltterServer } from "./server.js"
import type { ServerOptions } from "./server.js"

export async function createPoltter(options?: ServerOptions) {
  const server = await createPoltterServer({
    ...options,
  })

  const client = createPoltterClient({
    baseUrl: server.url,
  })

  return {
    client,
    server,
  }
}
