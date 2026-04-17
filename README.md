# Professor IA

**Professor IA** is an AI-powered learning SaaS application. Users can create and interact with AI "companions" — virtual tutors representing subjects like Math, Science, History, etc. Each session is a real-time voice conversation powered by AI, and session history is tracked per user.

---

## Features

- Browse and create AI learning companions
- Live voice sessions with AI tutors (speak & listen)
- Session history tracking per user
- User authentication with Clerk
- Full-stack with a self-hosted PostgreSQL database

---

## Tech Stack

| Tool                      | Purpose                                             |
| ------------------------- | --------------------------------------------------- |
| **Next.js 16**            | Full-stack React framework (app router, API routes) |
| **TypeScript**            | Type safety across the codebase                     |
| **Clerk**                 | User authentication & session management            |
| **Vapi AI**               | Real-time AI voice conversations                    |
| **PostgreSQL**            | Persistent database for companions & sessions       |
| **Docker**                | Runs the PostgreSQL database locally in a container |
| **Tailwind CSS**          | Utility-first styling                               |
| **shadcn/ui**             | Pre-built accessible UI components                  |
| **Zod + React Hook Form** | Form validation                                     |

---

## Project Structure

```
professor_ia/
├── app/                        # Next.js pages & API routes
│   ├── page.tsx                # Home page
│   ├── companions/             # Browse, create, and view companions
│   ├── my-journey/             # User session history
│   ├── subscription/           # Subscription page
│   ├── sign-in/                # Clerk sign-in
│   └── api/companions/         # REST API for companions (CRUD)
├── components/                 # Reusable React components
├── lib/
│   ├── db.ts                   # PostgreSQL connection pool
│   ├── utils.ts                # Shared utilities
│   ├── vapi.sdk.ts             # Vapi AI client setup
│   └── actions/                # Server actions (companion logic)
├── migrations/
│   └── init.sql                # Database schema
├── scripts/
│   └── test-db.js              # Script to verify DB connection
├── docker-compose.yml          # PostgreSQL Docker setup
└── types/                      # TypeScript type definitions
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- A [Clerk](https://clerk.com/) account (free)
- A [Vapi AI](https://vapi.ai/) account (for voice features)

---

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd professor_ia
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root of the project:

```env
# PostgreSQL (matches docker-compose defaults)
DB_USER=postgres
DB_PASSWORD=postgres123
DB_HOST=localhost
DB_PORT=5432
DB_NAME=professor_ia

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Vapi AI (for voice sessions)
NEXT_PUBLIC_VAPI_WEB_TOKEN=your_vapi_web_token

# App URL
NEXT_PUBLIC_API_URL=http://localhost:3000
```

> Get your Clerk keys at [dashboard.clerk.com](https://dashboard.clerk.com)  
> Get your Vapi token at [dashboard.vapi.ai](https://dashboard.vapi.ai)

### 4. Start the database

```bash
docker-compose up -d
```

This starts a PostgreSQL 16 container and automatically creates the `professor_ia` database.

### 5. Run database migrations

**Windows:**

```bash
.\init-db.bat
```

**Linux / macOS:**

```bash
./init-db.sh
```

Or manually:

```bash
docker-compose exec postgres psql -U postgres -d professor_ia -f migrations/init.sql
```

### 6. (Optional) Test the database connection

```bash
node scripts/test-db.js
```

### 7. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command                | Description                    |
| ---------------------- | ------------------------------ |
| `npm run dev`          | Start the development server   |
| `npm run build`        | Build for production           |
| `npm run start`        | Start the production server    |
| `npm run lint`         | Run ESLint                     |
| `docker-compose up -d` | Start the PostgreSQL container |
| `docker-compose down`  | Stop the PostgreSQL container  |
