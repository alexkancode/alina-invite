FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY migrations ./migrations
COPY scripts ./scripts
EXPOSE 4321
ENV HOST=0.0.0.0
ENV PORT=4321
CMD ["sh", "-c", "npx tsx scripts/migrate.ts && node ./dist/server/entry.mjs"]
