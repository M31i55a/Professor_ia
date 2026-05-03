# Professor IA

**Professor IA** is an AI-powered learning SaaS application. Users can create AI "companions" — virtual tutors for subjects like Maths, Science, History, Coding, and more — either by uploading a PDF or filling in details manually. Each session is a real-time voice conversation powered by Vapi AI, with the AI grounded on the companion's content via RAG (Retrieval-Augmented Generation). Session history and bookmarks are tracked per user.

---

## Features

- Browse, create, and bookmark AI learning companions
- **PDF upload**: extract subject, topic, and content automatically using an LLM
- **RAG-powered voice sessions**: PDF text is chunked and searched at runtime so the AI answers from the full document, not just a short excerpt
- Live voice sessions with AI tutors (speak & listen) via Vapi AI
- Session history tracking per user (`/my-journey`)
- Dark / light theme toggle
- User authentication with Clerk
- Subscription page
- Self-hosted PostgreSQL database (Docker)

---

## Tech Stack

| Tool                        | Purpose                                                      |
| --------------------------- | ------------------------------------------------------------ |
| **Next.js 16**              | Full-stack React framework (App Router, API routes)          |
| **TypeScript**              | Type safety across the codebase                              |
| **Clerk**                   | User authentication & session management                     |
| **Vapi AI**                 | Real-time AI voice conversations                             |
| **OpenRouter (OpenAI SDK)** | LLM calls for PDF extraction & companion grounding           |
| **PostgreSQL**              | Persistent database for companions, chunks, users & sessions |
| **Docker**                  | Runs the PostgreSQL database locally in a container          |
| **Tailwind CSS**            | Utility-first styling                                        |
| **shadcn/ui**               | Pre-built accessible UI components                           |
| **next-themes**             | Dark / light theme support                                   |
| **vanilla-tilt**            | 3-D tilt effect on companion cards                           |
| **pdf-parse**               | Server-side PDF text extraction                              |
| **Zod + React Hook Form**   | Form validation                                              |

---

## Project Structure

```
professor_ia/
├── app/
│   ├── page.tsx                        # Home page
│   ├── layout.tsx                      # Root layout (Clerk, ThemeProvider)
│   ├── companions/                     # Browse & create companions
│   │   ├── page.tsx
│   │   ├── new/page.tsx                # Create companion (PDF or manual)
│   │   └── [id]/page.tsx              # Companion detail / voice session
│   ├── bookmarked/page.tsx            # Bookmarked companions
│   ├── my-journey/page.tsx            # Session history
│   ├── subscription/page.tsx          # Subscription page
│   ├── sign-in/                        # Clerk sign-in
│   └── api/
│       ├── companions/                 # REST API for companions (CRUD)
│       ├── extract-pdf/route.ts        # PDF upload → LLM extraction + chunking
│       └── vapi/search-content/        # VAPI tool-call webhook (RAG search)
├── components/                         # Reusable React components
│   ├── CompanionForm.tsx               # Create companion form (PDF / manual mode)
│   ├── CompanionComponent.tsx          # Voice session UI
│   ├── BookmarkButton.tsx              # Bookmark toggle
│   ├── ThemeProvider.tsx / ThemeToggle.tsx
│   └── ui/                             # shadcn/ui primitives
├── lib/
│   ├── db.ts                           # PostgreSQL connection pool
│   ├── utils.ts                        # Shared utilities
│   ├── vapi.sdk.ts                     # Vapi AI client setup
│   └── actions/companion.actions.ts    # Server actions (companion CRUD, sessions)
├── migrations/
│   ├── init.sql                        # Core schema (companions, users, sessions)
│   ├── add_pdf_content.sql             # Adds pdf_content column to companions
│   └── add_book_chunks.sql             # Creates companion_chunks table for RAG
├── scripts/
│   ├── test-db.js                      # Verify DB connection
│   └── generate-tutorial.js            # Generate tutorial companion data
├── constants/index.ts                  # Subjects, voices, styles
├── docker-compose.yml                  # PostgreSQL Docker setup
└── types/                              # TypeScript type definitions
```

---

## How PDF RAG Works

1. The user uploads a PDF on the **Create Companion** page.
2. `/api/extract-pdf` parses the file with `pdf-parse`, splits the text into 500-word overlapping chunks, and sends a sample to the LLM (via OpenRouter) to detect the subject and generate a topic name.
3. The full text and all chunks are saved to `companions.pdf_content` and the `companion_chunks` table.
4. During a voice session, the Vapi assistant calls the `searchContent` tool webhook at `/api/vapi/search-content`, which runs a PostgreSQL full-text search over the chunks and returns the 3 most relevant passages to the LLM in real time.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- A [Clerk](https://clerk.com/) account (free)
- A [Vapi AI](https://vapi.ai/) account (for voice features)
- An [OpenRouter](https://openrouter.ai/) account (for PDF extraction)

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

# OpenRouter (for PDF extraction via OpenAI-compatible API)
OPENROUTER_API_KEY=your_openrouter_api_key

# App URL
NEXT_PUBLIC_API_URL=http://localhost:3000
```

> Get your Clerk keys at [dashboard.clerk.com](https://dashboard.clerk.com)  
> Get your Vapi token at [dashboard.vapi.ai](https://dashboard.vapi.ai)  
> Get your OpenRouter key at [openrouter.ai/keys](https://openrouter.ai/keys)

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
docker-compose exec postgres psql -U postgres -d professor_ia -f migrations/add_pdf_content.sql
docker-compose exec postgres psql -U postgres -d professor_ia -f migrations/add_book_chunks.sql
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

| Command                   | Description                    |
| ------------------------- | ------------------------------ |
| `npm run dev`             | Start the development server   |
| `npm run build`           | Build for production           |
| `npm run start`           | Start the production server    |
| `npm run lint`            | Run ESLint                     |
| `docker-compose up -d`    | Start the PostgreSQL container |
| `docker-compose down`     | Stop the PostgreSQL container  |
| `node scripts/test-db.js` | Verify the database connection |
