FROM node:22-slim AS base
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Prisma 7 resolve DATABASE_URL ao carregar prisma.config.ts no `generate`
# (não conecta no build; a URL real vem do Compose em runtime)
ARG DATABASE_URL=postgresql://portal:portal@localhost:5432/portal?schema=public
ENV DATABASE_URL=$DATABASE_URL

FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

FROM base AS runtime
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
RUN npx prisma generate
EXPOSE 3333
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/database/seed.js && node dist/server.js"]
