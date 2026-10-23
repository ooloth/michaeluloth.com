import { z } from 'zod'

const pushoverEnvSchema = z.object({
  PUSHOVER_API_TOKEN: z.string().min(1, 'PUSHOVER_API_TOKEN is required'),
  PUSHOVER_USER_KEY: z.string().min(1, 'PUSHOVER_USER_KEY is required'),
})

export const pushoverEnv = pushoverEnvSchema.parse(process.env)
