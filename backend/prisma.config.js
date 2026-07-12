import { defineConfig } from 'prisma/config'
import { config } from 'dotenv'
import path from 'path'

// Load .env from the backend root regardless of which directory the CLI is run from
config({ path: path.resolve(import.meta.dirname, '.env') })

export default defineConfig({
  schema: path.resolve(import.meta.dirname, 'prisma/schema.prisma'),
  datasource: {
    url: process.env.DIRECT_URL,
  },
})
