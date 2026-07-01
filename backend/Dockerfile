FROM node:20-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ libvips-dev \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npx prisma generate
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y libvips42 libglib2.0-0 wget ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev --legacy-peer-deps || npm install --omit=dev --legacy-peer-deps
RUN npx prisma generate

COPY --from=builder /app/dist ./dist
COPY prisma/scripts ./prisma/scripts
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/docker-entrypoint.sh"]
