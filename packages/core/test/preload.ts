import path from "path"

process.env.POLTTER_DB = ":memory:"
process.env.POLTTER_MODELS_PATH = path.join(import.meta.dir, "plugin", "fixtures", "models-dev.json")
process.env.POLTTER_DISABLE_MODELS_FETCH = "true"
