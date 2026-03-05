# AI Chat Web App

AI-Powered Conversational Chat Platform

Full-stack AI chat application built with Next.js and PostgreSQL, featuring JWT-based authentication with secure httpOnly cookies. Integrates Groq API (Llama 3.3-70B) for intelligent responses, with a two-tier memory system using Redis for short-term context and automatic summarization for long-term recall. Supports multi-chat management with persistent message history.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Next.js API Routes, Drizzle ORM |
| Database | PostgreSQL 16, Redis 7 |
| AI | Groq SDK (Llama 3.3-70B) |
| Auth | JWT (jose), bcryptjs |
| State | Zustand, TanStack React Query |
| DevOps | Docker, pnpm |

## Features

- **Authentication** — Register, login, and logout with JWT-based sessions stored in secure httpOnly cookies
- **Multi-Chat Management** — Create and switch between multiple conversations, each with its own history
- **AI Responses** — Powered by Groq API using Llama 3.3-70B model with deterministic output
- **Two-Tier Memory** — Last 5 messages cached in Redis for quick context; automatic summarization when chat exceeds 20 messages
- **Persistent Storage** — All messages stored in PostgreSQL with soft-delete support
- **Security Headers** — X-Frame-Options, X-Content-Type-Options, and route protection via Next.js proxy

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) & Docker Compose

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd ai-chat-web-app
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

```bash
cp dummy.env .env
```

Fill in the `.env` file:

```env
# AI
GROQ_API_KEY=           # Get from https://console.groq.com
TAVILY_API_KEY=         # Get from https://tavily.com
DEBUG=false

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=ai_chat
DB_PASSWORD=ai_chat_password
DB_NAME=ai_chat

# Auth
JWT_SECRET=             # Generate with: openssl rand -hex 32
```

### 4. Start Docker services

```bash
docker compose up -d
```

This starts:

| Service | Port |
|---------|------|
| PostgreSQL | 5432 |
| Redis | 6379 |
| Redis Insight (GUI) | 5540 |

### 5. Run database migrations

```bash
pnpm db:migrate
```

### 6. Start the dev server

```bash
pnpm dev
```

App runs at **http://localhost:4000**

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server on port 4000 |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm db:drop` | Drop database migrations |

## Project Structure

```
ai-chat-web-app/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   ├── me/route.ts
│   │   │   └── logout/route.ts
│   │   ├── chat/
│   │   │   ├── route.ts          # POST — send message & get AI response
│   │   │   └── generate.ts       # Groq API integration
│   │   └── chats/
│   │       ├── route.ts          # GET — list user's chats
│   │       └── [chatId]/
│   │           └── messages/
│   │               └── route.ts  # GET — chat message history
│   ├── chat/page.tsx             # Main chat interface
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── layout.tsx
├── db/
│   ├── db.ts                     # Drizzle + pg pool setup
│   ├── schema/
│   │   ├── user.schema.ts
│   │   ├── chat.schema.ts
│   │   └── messages.schema.ts
│   └── migrations/
├── lib/
│   ├── auth.ts                   # JWT, password hashing, cookie utils
│   ├── axios.ts                  # Axios instance with interceptors
│   └── query-provider.tsx        # React Query provider
├── store/
│   └── auth.store.ts             # Zustand auth state
├── proxy.ts                      # Route protection
├── docker-compose.yml
├── drizzle.config.ts
└── package.json
```

## Database Schema

**users** — `id` (UUID) · `firstName` · `lastName` · `email` (unique) · `password` · `role` (user/admin/guest) · timestamps

**chats** — `id` (UUID) · `userId` (FK → users) · `summary` (nullable) · timestamps

**messages** — `id` (UUID) · `chatId` (FK → chats) · `role` (user/assistant) · `content` · timestamps

All tables support soft deletion via `archiveAt` and use cascade deletes on foreign keys.

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT cookie |
| GET | `/api/auth/me` | Get current authenticated user |
| POST | `/api/auth/logout` | Clear auth cookie |
| GET | `/api/chats` | List user's chats |
| POST | `/api/chat` | Send message and get AI response |
| GET | `/api/chats/[chatId]/messages` | Get messages for a chat |
