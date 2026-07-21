FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js ./
COPY lib ./lib
COPY data ./data-seed
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
ENV NODE_ENV=production
ENV PORT=10000
ENV HOST=0.0.0.0
EXPOSE 10000
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]
