# syntax=docker/dockerfile:1.7

# ---- base deps layer ----
FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

# Copy only root files needed for installs
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./

# Copy workspace package.jsons for filtering installs
COPY apps/server/package.json apps/server/
COPY packages/shared-types/package.json packages/shared-types/

# Install workspace deps (hoistless install is fine since we'll deploy)
RUN pnpm install --frozen-lockfile

# ---- build shared types ----
FROM base AS build-types
# Ensure tsconfig.base.json is available for shared-types build
COPY tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
RUN pnpm --filter @docker-gui/shared-types build

# ---- build server ----
FROM base AS build-server
# bring compiled shared-types from previous stage
COPY --from=build-types /app/packages/shared-types/dist packages/shared-types/dist
COPY apps/server/tsconfig.json apps/server/
COPY apps/server/src apps/server/src
RUN pnpm --filter @docker-gui/server build

# ---- deploy pruned server ----
FROM base AS pruned
# Bring compiled dist from build-server so deploy includes it
COPY --from=build-server /app/apps/server/dist apps/server/dist
# Use pnpm deploy (legacy mode for broader compatibility) to create a self-contained package dir
RUN pnpm --filter @docker-gui/server --prod deploy server-deploy

# ---- runtime image ----
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
# Copy deployed package
COPY --from=pruned /app/server-deploy .
# Expose API port
EXPOSE 3001
# The server expects Docker socket mounted at /var/run/docker.sock (bind via compose)
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3001/api/health || exit 1
CMD ["node", "dist/index.js"]
