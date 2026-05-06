# Professor IA

**Professor IA** is an AI-powered voice tutoring SaaS application. Users create AI "companions" — virtual tutors for subjects like Maths, Science, History, Coding, and more — either by uploading a PDF or filling in details manually. Each session is a real-time voice conversation powered by Vapi AI, grounded in the companion's content via semantic RAG (Retrieval-Augmented Generation). Session history, bookmarks, and timed sessions are tracked per user.

---

## Features

- Browse, create, and bookmark AI learning companions
- **PDF upload**: extract subject, topic, and full content automatically using an LLM
- **Semantic RAG**: PDF text is chunked, embedded with `text-embedding-3-small`, and stored in PostgreSQL with pgvector. During a voice session the AI retrieves the most relevant passages using cosine similarity (falls back to full-text search, then keyword search if no OpenAI key is present)
- **Timed sessions**: each companion has a configurable duration; a countdown timer is shown during the session and the call ends automatically when time runs out
- **Session recap**: after a session ends the "Start Session" button becomes "Get Recap" — clicking it starts a new voice call where the AI delivers a spoken summary of what was covered, using the full session transcript
- Live voice sessions (speak & listen) via Vapi AI
- Session history per user (`/my-journey`)
- Dark / light theme toggle
- User authentication with Clerk
- Subscription page
- Deployable to [Vercel](https://vercel.com/) + [Neon](https://neon.tech/) (serverless PostgreSQL with pgvector)

---

## Tech Stack

| Tool                        | Purpose                                                             |
| --------------------------- | ------------------------------------------------------------------- |
| **Next.js 16**              | Full-stack React framework (App Router, API routes, Server Actions) |
| **TypeScript**              | Type safety across the codebase                                     |
| **Clerk**                   | User authentication & session management                            |
| **Vapi AI**                 | Real-time AI voice conversations                                    |
| **OpenRouter (OpenAI SDK)** | LLM calls — PDF extraction, companion grounding, session recap      |
| **OpenAI API**              | `text-embedding-3-small` embeddings for semantic search (optional)  |
| **PostgreSQL + pgvector**   | Persistent database; HNSW cosine index on chunk embeddings          |
| **Docker**                  | Runs the pgvector-enabled PostgreSQL container locally              |
| **Neon** _(production)_     | Serverless PostgreSQL with native pgvector support                  |
| **Tailwind CSS**            | Utility-first styling                                               |
| **shadcn/ui**               | Pre-built accessible UI components                                  |
| **next-themes**             | Dark / light theme support                                          |
| **vanilla-tilt**            | 3-D tilt effect on companion cards                                  |
| **pdf-parse**               | Server-side PDF text extraction                                     |
| **Zod + React Hook Form**   | Form validation                                                     |

---

## Project Structure

```
professor_ia/
├── app/
│   ├── page.tsx                          # Home page
│   ├── layout.tsx                        # Root layout (Clerk, ThemeProvider)
│   ├── companions/
│   │   ├── page.tsx                      # Browse companions
│   │   ├── new/page.tsx                  # Create companion (PDF or manual)
│   │   └── [id]/page.tsx                 # Companion detail / voice session
│   ├── bookmarked/page.tsx               # Bookmarked companions
│   ├── my-journey/page.tsx               # Session history
│   ├── subscription/page.tsx             # Subscription page
│   ├── sign-in/                          # Clerk sign-in
│   └── api/
│       ├── companions/route.ts           # REST CRUD for companions
│       ├── companions/[id]/route.ts      # Single companion REST endpoint
│       ├── extract-pdf/route.ts          # PDF upload → LLM extraction + embeddings
│       └── vapi/search-content/route.ts  # Vapi tool-call webhook (RAG search)
├── components/
│   ├── CompanionComponent.tsx            # Voice session UI (timer, recap, transcript)
│   ├── CompanionForm.tsx                 # Create companion form (PDF / manual mode)
│   ├── CompanionCard.tsx                 # Companion card with tilt effect
│   ├── CompanionsList.tsx                # Filtered companion list
│   ├── BookmarkButton.tsx                # Bookmark toggle
│   ├── SearchInput.tsx / SubjectFilter.tsx
│   ├── ThemeProvider.tsx / ThemeToggle.tsx
│   ├── Navbar.tsx / NavItems.tsx
│   └── ui/                              # shadcn/ui primitives
├── lib/
│   ├── db.ts                             # PostgreSQL pool (local Docker or Neon via DATABASE_URL)
│   ├── utils.ts                          # configureAssistant, buildSystemPrompt, getVoiceId
│   ├── vapi.sdk.ts                       # Vapi client singleton
│   └── actions/companion.actions.ts      # Server actions (CRUD, chunks, sessions, bookmarks)
├── migrations/
│   ├── init.sql                          # Core schema: companions, users, sessions
│   ├── add_pdf_content.sql               # Adds pdf_content column to companions
│   ├── add_book_chunks.sql               # Creates companion_chunks table
│   └── add_pgvector.sql                  # Enables pgvector, adds embedding column + HNSW index
├── constants/index.ts                    # Subjects, voices, styles, durations
├── types/                                # TypeScript type definitions
├── docker-compose.yml                    # pgvector-enabled PostgreSQL container
├── init-db.bat / init-db.sh              # Run all migrations in order
└── scripts/
    ├── test-db.js                        # Verify DB connection
    └── generate-tutorial.js              # Seed tutorial companion data
```

---

## How Semantic RAG Works

1. **Upload** — the user uploads a PDF on the Create Companion page.
2. **Extract** — `/api/extract-pdf` parses the file with `pdf-parse`, sends a sample to the LLM (OpenRouter / GPT-4o-mini) to auto-detect subject and generate a topic name, then splits the full text into 500-word chunks with 50-word overlap.
3. **Embed** — if `OPENAI_API_KEY` is set, each chunk is passed to `text-embedding-3-small` in batches of 100 to produce a 1536-dimensional vector.
4. **Store** — chunks (text + optional embedding) are saved to the `companion_chunks` table. The HNSW index on the `embedding` column enables fast approximate nearest-neighbour queries.
5. **Retrieve** — during a voice session, Vapi calls the `searchContent` tool webhook at `/api/vapi/search-content`. The route embeds the search query, runs a cosine similarity query (`embedding <=> query_vector`) and returns the top 3 passages. If no embedding client is available it falls back to PostgreSQL full-text search (`plainto_tsquery`), then to a keyword ILIKE search.
6. **Recap** — after the session ends, the user can click **Get Recap**. A new Vapi call is started with the full session transcript injected into the system prompt; the AI delivers a 60-90 second spoken summary of what was covered.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- A [Clerk](https://clerk.com/) account (free)
- A [Vapi AI](https://vapi.ai/) account
- An [OpenRouter](https://openrouter.ai/) account (for PDF extraction & companion grounding)
- _(Optional)_ An [OpenAI](https://platform.openai.com/) API key (for semantic vector search — the app works without it using full-text search)

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

Create a `.env.local` file in the project root:

```env
# ── PostgreSQL (local Docker) ──────────────────────────────
DB_USER=postgres
DB_PASSWORD=postgres123
DB_HOST=localhost
DB_PORT=5432
DB_NAME=professor_ia

# When deploying to Vercel + Neon, set DATABASE_URL instead:
# DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# ── Clerk Authentication ───────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# ── Vapi AI (voice sessions) ───────────────────────────────
NEXT_PUBLIC_VAPI_WEB_TOKEN=your_vapi_web_token

# ── OpenRouter (PDF extraction, companion grounding, recap) ─
OPENROUTER_API_KEY=your_openrouter_api_key

# ── OpenAI (optional — semantic vector search) ─────────────
# If absent the app falls back to PostgreSQL full-text search.
OPENAI_API_KEY=your_openai_api_key

# ── App URL ────────────────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:3000
```

> - Clerk keys: [dashboard.clerk.com](https://dashboard.clerk.com)
> - Vapi token: [dashboard.vapi.ai](https://dashboard.vapi.ai)
> - OpenRouter key: [openrouter.ai/keys](https://openrouter.ai/keys)
> - OpenAI key: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### 4. Start the database

```bash
docker-compose up -d
```

This starts a `pgvector/pgvector:pg16` container and creates the `professor_ia` database.

### 5. Run database migrations

**Windows:**

```bat
.\init-db.bat
```

**Linux / macOS:**

```bash
./init-db.sh
```

This runs all four migrations in order:

1. `init.sql` — core schema
2. `add_pdf_content.sql` — pdf_content column
3. `add_book_chunks.sql` — companion_chunks table
4. `add_pgvector.sql` — pgvector extension + embedding column + HNSW index

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

## Deploying to Vercel + Neon

1. Create a [Neon](https://neon.tech/) project (Postgres 16, pgvector enabled by default).
2. Run the four migration files against your Neon database (use the Neon SQL editor or `psql`).
3. Push your code and import the repository in [Vercel](https://vercel.com/).
4. Set the following environment variables in the Vercel dashboard:

| Variable                            | Value                                                            |
| ----------------------------------- | ---------------------------------------------------------------- |
| `DATABASE_URL`                      | Full Neon connection string (`postgresql://...?sslmode=require`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key                                            |
| `CLERK_SECRET_KEY`                  | Clerk secret key                                                 |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`     | `/sign-in`                                                       |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL`     | `/sign-up`                                                       |
| `NEXT_PUBLIC_VAPI_WEB_TOKEN`        | Vapi web token                                                   |
| `OPENROUTER_API_KEY`                | OpenRouter API key                                               |
| `OPENAI_API_KEY`                    | OpenAI API key _(optional — enables semantic search)_            |
| `NEXT_PUBLIC_API_URL`               | Your Vercel deployment URL                                       |

> When `DATABASE_URL` is set it takes precedence over the individual `DB_*` vars, and SSL is enabled automatically.

---

## Available Scripts

| Command                   | Description                               |
| ------------------------- | ----------------------------------------- |
| `npm run dev`             | Start the development server              |
| `npm run build`           | Build for production                      |
| `npm run start`           | Start the production server               |
| `npm run lint`            | Run ESLint                                |
| `docker-compose up -d`    | Start the PostgreSQL (pgvector) container |
| `docker-compose down`     | Stop the container                        |
| `docker-compose down -v`  | Stop and wipe the database volume         |
| `node scripts/test-db.js` | Verify the database connection            |
