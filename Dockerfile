FROM node:20-bookworm-slim

WORKDIR /app

# Prisma's native query/schema engines require OpenSSL at build and runtime.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY client/package.json client/package-lock.json ./client/
RUN npm ci --prefix client

COPY server/package.json server/package-lock.json ./server/
RUN npm ci --prefix server

COPY client ./client
COPY server ./server

ENV DATABASE_URL=file:./data/shatranj.db
RUN npm run build --prefix client && npm run build --prefix server

ENV NODE_ENV=production
ENV PORT=3000
ENV SAVES_DIR=/app/server/prisma/data/saves

EXPOSE 3000
VOLUME ["/app/server/prisma/data"]

WORKDIR /app/server
CMD ["sh", "-c", "mkdir -p prisma/data && touch prisma/data/shatranj.db && npx prisma db push && npx prisma db seed && node dist/index.js"]
