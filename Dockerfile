FROM node:20.19.5-alpine3.22 AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20.19.5-alpine3.22 AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
ARG DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ARG AUTH_SECRET=build-only-value-that-is-never-used-at-runtime-000000
ARG AUTH_URL=http://127.0.0.1:3000
ENV DATABASE_URL=$DATABASE_URL AUTH_SECRET=$AUTH_SECRET AUTH_URL=$AUTH_URL
RUN npx prisma generate && npm run build

FROM node:20.19.5-alpine3.22 AS runtime
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser
COPY --from=builder --chown=appuser:nodejs /app/.next/standalone ./
COPY --from=builder --chown=appuser:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=appuser:nodejs /app/scripts ./scripts
USER appuser
EXPOSE 3000
CMD ["node", "scripts/container-start.mjs"]
