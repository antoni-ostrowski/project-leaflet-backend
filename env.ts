import { createEnv } from "@t3-oss/env-core"
import { Schema } from "effect"

export const env = createEnv({
  clientPrefix: "",
  client: {},
  server: {
    DATABASE_URI: Schema.toStandardSchemaV1(Schema.String)
  },
  runtimeEnv: {
    ...process.env,
    ...import.meta.env
  },

  emptyStringAsUndefined: true
})
