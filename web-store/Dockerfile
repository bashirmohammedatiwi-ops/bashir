# متجر الويب — Next.js (standalone): صفحات تُرسم على السيرفر وتتحدث مع الـ API داخل شبكة Docker.
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps && npm cache clean --force

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SITE_URL=https://deemaalhayat.com
ARG NEXT_PUBLIC_APP_STORE_URL=
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_APP_STORE_URL=$NEXT_PUBLIC_APP_STORE_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3001 HOSTNAME=0.0.0.0
RUN apt-get update && apt-get install -y --no-install-recommends wget && rm -rf /var/lib/apt/lists/* \
    && groupadd -r store && useradd -r -g store store
COPY --from=builder --chown=store:store /app/.next/standalone ./
COPY --from=builder --chown=store:store /app/.next/static ./.next/static
COPY --from=builder --chown=store:store /app/public ./public
USER store
EXPOSE 3001
CMD ["node", "server.js"]
