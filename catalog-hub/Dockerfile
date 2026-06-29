FROM node:22-alpine

WORKDIR /app

# wget for container healthcheck; vips for sharp (swatch color sampling)
RUN apk add --no-cache wget vips-dev

COPY package.json ./
RUN npm install --omit=dev

COPY server.js ./
COPY lib ./lib
COPY viewer ./viewer
COPY data ./data

ENV NODE_ENV=production
ENV PORT=10000
ENV HOST=0.0.0.0

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:10000/api/health || exit 1

CMD ["node", "server.js"]
