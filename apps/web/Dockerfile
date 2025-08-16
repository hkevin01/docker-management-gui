# syntax=docker/dockerfile:1.7

# ---- build stage ----
FROM node:20-alpine AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/shared-types/package.json packages/shared-types/
# install deps
RUN pnpm install --frozen-lockfile

# build shared types
COPY packages/shared-types ./packages/shared-types
RUN pnpm --filter @docker-gui/shared-types build

# build web
COPY apps/web/tsconfig*.json apps/web/
COPY apps/web/vite.config.ts apps/web/
COPY apps/web/index.html apps/web/
COPY apps/web/src apps/web/src
RUN pnpm --filter @docker-gui/web build

# ---- nginx runtime ----
FROM nginx:1.27-alpine AS runtime
WORKDIR /usr/share/nginx/html
COPY --from=build /app/apps/web/dist .
# nginx config to proxy /api to server
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ >/dev/null || exit 1
