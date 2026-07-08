FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY server.js ./
COPY lib ./lib
ENV NODE_ENV=production
ENV PORT=10000
ENV HOST=0.0.0.0
EXPOSE 10000
CMD ["node", "server.js"]
