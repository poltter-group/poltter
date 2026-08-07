declare global {
  const POLTTER_VERSION: string
  const POLTTER_CHANNEL: string
}

export const InstallationVersion = typeof POLTTER_VERSION === "string" ? POLTTER_VERSION : "local"
export const InstallationChannel = typeof POLTTER_CHANNEL === "string" ? POLTTER_CHANNEL : "local"
export const InstallationLocal = InstallationChannel === "local"
