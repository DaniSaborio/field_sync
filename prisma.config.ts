import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

// Cargar .env.local explícitamente
config({ path: '.env.local' })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    path: 'prisma/migrations',
  },
})
