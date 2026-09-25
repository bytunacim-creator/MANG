# syntax=docker/dockerfile:1

# ---------- Bagimliliklar ----------
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Derleme ----------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SUPPORT_WHATSAPP=""
ENV NEXT_PUBLIC_SUPPORT_WHATSAPP=$NEXT_PUBLIC_SUPPORT_WHATSAPP
# Push aboneligi tarayicida bu acik anahtarla kurulur. NEXT_PUBLIC_* derleme
# aninda pakete gomuldugu icin calisma ortaminda vermek ise yaramaz.
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_TELEMETRY_DISABLED=1
# AUTH_SECRET derleme sirasinda kullanilmaz; calisma aninda ortamdan gelir
RUN npm run build

# ---------- Calistirma ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN apk add --no-cache libc6-compat \
 && addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Next.js standalone cikti: yalnizca gereken node_modules dahildir
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Migration icin: SQL dosyalari + saf Node calistirici.
# Bagimliliklar (pg, drizzle-orm/node-postgres) standalone ciktisinda gelir;
# bkz. next.config.ts > outputFileTracingIncludes
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrate-prod.mjs ./scripts/migrate-prod.mjs

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
