#!/usr/bin/env bash
set -euo pipefail

# docker-management-gui runner
# - Builds and starts the compose stack (server + web)
# - Waits for API health
# - Opens the web UI in the default browser

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

command_exists() { command -v "$1" >/dev/null 2>&1; }

info()  { printf "\033[1;34m[INFO]\033[0m  %s\n" "$*"; }
succ()  { printf "\033[1;32m[OK]\033[0m    %s\n" "$*"; }
warn()  { printf "\033[1;33m[WARN]\033[0m  %s\n" "$*"; }
error() { printf "\033[1;31m[ERROR]\033[0m %s\n" "$*"; }

API_URL="http://localhost:3001/api/health"
WEB_URL="http://localhost:8086"

# 1) Basic checks
if ! command_exists docker; then
  error "Docker is not installed or not in PATH. Install Docker and retry."
  exit 1
fi

# Check Docker daemon
if ! docker info >/dev/null 2>&1; then
  warn "Docker daemon not reachable. Attempting to start (systemd)..."
  if command_exists systemctl; then
    sudo systemctl start docker || true
  fi
  sleep 2
  if ! docker info >/dev/null 2>&1; then
    error "Docker daemon is not running. Please start Docker and re-run."
    exit 1
  fi
fi

# Check docker compose v2
if ! docker compose version >/dev/null 2>&1; then
  error "Docker Compose v2 plugin not found. Update Docker Desktop/Engine or install compose plugin."
  exit 1
fi

# 2) Seed .env from example if missing
if [[ ! -f .env && -f .env.example ]]; then
  info "Creating .env from .env.example"
  cp .env.example .env
fi

# 3) Build & start
info "Building images..."
docker compose build

info "Starting containers..."
docker compose up -d

# 4) Wait for API health
info "Waiting for API health at ${API_URL}"
ATTEMPTS=60
SLEEP=1
for ((i=1; i<=ATTEMPTS; i++)); do
  if curl -fsS "$API_URL" >/dev/null 2>&1; then
    succ "API is healthy."
    break
  fi
  sleep "$SLEEP"
  if [[ $i -eq $ATTEMPTS ]]; then
    warn "API did not become healthy within $((ATTEMPTS*SLEEP))s. Continuing anyway."
  fi
done

# 5) Open the web UI
info "Opening Web UI at ${WEB_URL}"
if command_exists xdg-open; then
  xdg-open "$WEB_URL" >/dev/null 2>&1 || true
elif command_exists sensible-browser; then
  sensible-browser "$WEB_URL" >/dev/null 2>&1 || true
else
  warn "Could not auto-open a browser. Please navigate to ${WEB_URL} manually."
fi

succ "Stack is up. Use 'docker compose ps' to see status, 'docker compose logs -f' to tail logs, and 'docker compose down' to stop."
