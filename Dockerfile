FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=deps /app/node_modules ./node_modules
COPY server.js Saarthi.js ./
COPY public ./public
EXPOSE 3000
USER node
CMD ["node", "server.js"]