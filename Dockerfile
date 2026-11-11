# syntax=docker/dockerfile:1
# Trang chủ + trang quản trị chạy bằng một tiến trình Node (Astro, adapter node). Caddy đứng trước, xem docker-compose.yml.

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Thiếu biến này là build báo lỗi (xem CLAUDE.md). Truyền bằng --build-arg hoặc `build.args` trong compose.
ARG PUBLIC_GOOGLE_SHEETS_ENDPOINT
ENV PUBLIC_GOOGLE_SHEETS_ENDPOINT=$PUBLIC_GOOGLE_SHEETS_ENDPOINT
RUN npm run build

FROM node:22-bookworm-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321 DATA_DIR=/data TRUST_PROXY=1
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# Cần để chạy `npm run admin:create` trong container: Node chạy thẳng các file .ts này.
COPY package.json ./
COPY scripts ./scripts
COPY src/server ./src/server
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 4321
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4321/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "--disable-warning=ExperimentalWarning", "dist/server/entry.mjs"]
