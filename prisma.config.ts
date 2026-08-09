import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

// Cargar .env.local explícitamente
// quiet: true evita que dotenv imprima sus "tips" promocionales en cada carga
config({ path: '.env.local', quiet: true })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'node --import tsx prisma/seed.ts',
  },
})
