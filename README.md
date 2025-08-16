# Docker Management GUI

A modern, desktop-friendly GUI for Docker management on Ubuntu with rich features for managing containers, images, volumes, and networks.

## Features

- **Dashboard**: Overview of system resources, containers, images, volumes, and networks
- **Container Management**: Start, stop, restart, remove containers, view logs, exec into containers
- **Image Management**: List, pull, build, remove, and tag images
- **Volume Management**: Create, inspect, and remove volumes
- **Network Management**: Create, inspect, connect/disconnect containers
- **System Operations**: Prune unused resources, view system information
- **Real-time Updates**: Live event streaming and container stats
- **User-friendly Interface**: Material-UI design with confirmations for destructive actions

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Material-UI
- **Backend**: Fastify + TypeScript + Dockerode
- **State Management**: TanStack Query (React Query)
- **Desktop**: Optional Tauri packaging
- **Development**: pnpm workspaces, ESLint, Prettier

## Prerequisites

- Node.js 18+ and pnpm
- Docker Engine running
- User must be in `docker` group or have appropriate Docker permissions

```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify Docker access
docker ps
```

## Quick Start

1. **Install dependencies**
```bash
pnpm install
```

2. **Set up environment**
```bash
cp .env.example .env
# Edit .env if needed
```

3. **Start development servers**
```bash
pnpm dev
```

This will start:
- Backend API server on http://localhost:3001
- Frontend dev server on http://localhost:5173
- API documentation at http://localhost:3001/docs

## Project Structure

```
docker-management-gui/
├── apps/
│   ├── server/          # Fastify API server
│   │   ├── src/
│   │   │   ├── routes/  # API routes
│   │   │   ├── plugins/ # Fastify plugins
│   │   │   └── index.ts # Server entry point
│   │   └── package.json
│   └── web/             # React frontend
│       ├── src/
│       │   ├── pages/   # React pages
│       │   ├── lib/     # API client & hooks
│       │   └── main.tsx # App entry point
│       └── package.json
├── packages/
│   └── shared-types/    # Shared TypeScript types
└── package.json         # Root package.json
```

## API Endpoints

### System
- `GET /api/health` - Health check
- `GET /api/system/info` - Docker system information
- `GET /api/system/df` - Disk usage information
- `POST /api/system/prune` - Prune system
- `WS /api/system/events` - Live Docker events

### Containers
- `GET /api/containers` - List containers
- `GET /api/containers/:id` - Get container details
- `POST /api/containers/:id/start` - Start container
- `POST /api/containers/:id/stop` - Stop container
- `POST /api/containers/:id/restart` - Restart container
- `DELETE /api/containers/:id` - Remove container
- `WS /api/containers/:id/logs` - Stream logs
- `WS /api/containers/:id/stats` - Stream stats
- `POST /api/containers/prune` - Prune containers

### Images
- `GET /api/images` - List images
- `POST /api/images/pull` - Pull image
- `DELETE /api/images/:id` - Remove image
- `POST /api/images/prune` - Prune images

### Volumes
- `GET /api/volumes` - List volumes
- `POST /api/volumes` - Create volume
- `DELETE /api/volumes/:name` - Remove volume
- `POST /api/volumes/prune` - Prune volumes

### Networks
- `GET /api/networks` - List networks
- `POST /api/networks` - Create network
- `DELETE /api/networks/:id` - Remove network
- `POST /api/networks/:id/connect` - Connect container
- `POST /api/networks/:id/disconnect` - Disconnect container
- `POST /api/networks/prune` - Prune networks

## Development

### Available Scripts

```bash
# Root level
pnpm dev          # Start both server and client
pnpm build        # Build all packages
pnpm test         # Run all tests
pnpm lint         # Lint all packages
pnpm format       # Format all code

# Server specific
pnpm --filter server dev    # Start server only
pnpm --filter server build  # Build server
pnpm --filter server test   # Test server

# Web specific
pnpm --filter web dev       # Start frontend only
pnpm --filter web build     # Build frontend
pnpm --filter web preview   # Preview build
```

### Environment Variables

Create `.env` file in the root:

```bash
# API Configuration
PORT=3001
HOST=localhost
LOG_LEVEL=info

# Docker Configuration
DOCKER_SOCKET_PATH=/var/run/docker.sock

# Frontend Configuration (apps/web/.env.local)
VITE_API_URL=http://localhost:3001/api
```

## Security Considerations

- The application connects to Docker socket - ensure proper permissions
- For remote Docker daemons, use TLS certificates
- Consider running in docker group or with appropriate sudo access
- The API runs on localhost by default - configure firewalls appropriately

## Building for Production

```bash
# Build all packages
pnpm build

# Start production server
cd apps/server && pnpm start

# Serve frontend (after build)
cd apps/web && pnpm preview
```

## Docker Deployment

This repo includes Dockerfiles and a compose stack to run the API and web UI.

```bash
# Build images
docker compose build

# Start stack (bind-mounts host Docker socket)
docker compose up -d

# Check
curl -s http://localhost:3001/api/health | jq
open http://localhost:8080

# Stop
docker compose down
```

Notes:
- The web UI is served by nginx on port 8080 and proxies API calls to the server service.
- The API runs on port 3001 and requires access to /var/run/docker.sock provided by compose.
- The frontend defaults to using a relative API base path `/api`; override with `VITE_API_URL` for non-proxied setups.

## Desktop Application (Optional)

To package as a desktop application using Tauri:

```bash
# Install Tauri CLI
cargo install tauri-cli

# Setup Tauri app
cd apps/desktop
pnpm tauri init

# Build desktop app
pnpm tauri build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Roadmap

- [ ] Container exec terminal
- [ ] Image build from Dockerfile
- [ ] Docker Compose support
- [ ] Container resource monitoring
- [ ] User authentication
- [ ] Multi-host Docker management
- [ ] Backup/restore functionality
- [ ] Plugin system

## Troubleshooting

### Docker Connection Issues
```bash
# Check Docker daemon
sudo systemctl status docker

# Check Docker socket permissions
ls -la /var/run/docker.sock

# Add user to docker group
sudo usermod -aG docker $USER
```

### Port Conflicts
- Backend default: 3001
- Frontend default: 5173
- Change ports in .env file if needed

### Permission Issues
- Ensure user has Docker access
- Check if Docker daemon is running
- Verify socket path in configuration
