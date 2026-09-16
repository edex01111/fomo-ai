FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json .env.example ./
COPY src ./src
COPY tests ./tests
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY src/database/migrations ./dist/database/migrations
EXPOSE 3000
CMD ["node", "dist/index.js"]
