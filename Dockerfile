# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ---- 1. Instalar dependencias ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- 2. Generar cliente de Prisma y compilar la app ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY .env.local .env.local
RUN npx prisma generate
RUN npm run build

# ---- 3. Imagen final, liviana, solo con lo necesario para producción ----
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
