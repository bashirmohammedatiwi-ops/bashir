FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ vips-dev
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache vips wget tar
ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev --legacy-peer-deps || npm install --omit=dev --legacy-peer-deps
RUN npm install tsx --no-save
RUN npx prisma generate

COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/docker-entrypoint.sh"]
