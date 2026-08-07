interface ImportMetaEnv {
  readonly POLTTER_CHANNEL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "virtual:poltter-server" {
  export namespace Server {
    export const listen: typeof import("../../../poltter/dist/types/src/node").Server.listen
    export type Listener = import("../../../poltter/dist/types/src/node").Server.Listener
  }
  export namespace Config {
    export const get: typeof import("../../../poltter/dist/types/src/node").Config.get
    export type Info = import("../../../poltter/dist/types/src/node").Config.Info
  }
  export const bootstrap: typeof import("../../../poltter/dist/types/src/node").bootstrap
}
