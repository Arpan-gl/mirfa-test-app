# Mirfa Test App

A production-ready TurboRepo monorepo with pnpm workspaces, featuring a Next.js 14 frontend and Fastify API backend with AES-256-GCM envelope encryption.

## Project Structure

```
mirfa-test-app/
├── apps/
│   ├── web/      → Next.js 14 App Router (port 3000)
│   └── api/      → Fastify API (port 3001)
└── packages/
    ├── crypto/   → Shared encryption logic (AES-256-GCM)
    └── tsconfig/ → Shared TypeScript configs
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Start both web and api in development mode
pnpm dev
```

- **Web**: http://localhost:3000
- **API**: http://localhost:3001

## Environment Variables

### API (`apps/api/.env`)
```
MASTER_KEY=
PORT=3001
```

### Web (`apps/web/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## API Endpoints

- `POST /tx/encrypt` - Encrypt and store a payload
- `GET /tx/:id` - Retrieve encrypted record
- `POST /tx/:id/decrypt` - Decrypt a record

## Tech Stack

- **TurboRepo** - Monorepo build system
- **pnpm** - Package manager with workspaces
- **TypeScript** - Strict type safety across all apps
- **Next.js 14** - App Router with React Server Components
- **Fastify** - High-performance API framework
- **Node.js crypto** - Native AES-256-GCM encryption

## Features

✅ Shared TypeScript configuration  
✅ Shared crypto package with envelope encryption  
✅ In-memory transaction storage  
✅ Full type safety between frontend and backend  
✅ Hot reload for both apps  
✅ Production-ready error handling  

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start dev servers
pnpm dev

# Lint all packages
pnpm lint
```

## Production Build

```bash
pnpm build
cd apps/api && pnpm start
cd apps/web && pnpm start
```
