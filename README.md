# Saturn

Saturn is a personal journal app built with Next.js and Supabase. It supports authenticated journaling, Markdown entries, tags, categories, and AI-powered similarity matching so you can jump between related thoughts.

## Features

- **Supabase auth** for sign-in/sign-up and server-side session checks.
- **Create, edit, and delete entries** with autosaved drafts and a distraction-free Zen editor.
- **Markdown + GFM rendering** for rich journal content.
- **Tag + category metadata** plus starred entries for quick recall.
- **Search + infinite scroll** on the entries list.
- **OpenAI embeddings** to surface similar entries.

## Tech stack

- Next.js App Router
- Supabase (Auth + Postgres)
- Tailwind CSS
- OpenAI embeddings API

## Getting started

Install dependencies:

```bash
pnpm install
```

Run the dev server:

```bash
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Environment variables

Create a `.env.local` file and set:

```bash
# Supabase (client + server)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# OpenAI embeddings
OPENAI_API_KEY=...

# Optional: protect the embeddings cron endpoint
EMBED_CRON_SECRET=...

# Optional: disable the PIN gate entirely
# Set to "false" to skip the PIN prompt.
NEXT_PUBLIC_PIN_GATE_ENABLED=false
```

## Supabase setup

Saturn expects a Supabase project with an `entries` table and a `match_entries` RPC for vector similarity. The app reads and writes the following entry fields:

- `id` (uuid)
- `title` (text, nullable)
- `body` (text)
- `event_date` (date or timestamp)
- `tags` (text[])
- `category` (text)
- `starred` (boolean)
- `embedding` (vector/float[])
- `embedding_status` (text)
- `embedding_error` (text, nullable)
- `created_at` / `updated_at` (timestamps)

When a new entry is created, the app will call `/api/embed-entry` to create embeddings. The `/api/embed-pending` endpoint can be run by a cron job to backfill any pending or failed embeddings (authenticated via `EMBED_CRON_SECRET`).

## Scripts

```bash
pnpm dev        # Start Next.js in dev mode
pnpm build      # Build production assets
pnpm start      # Run the production server
pnpm lint       # Run ESLint
pnpm type-check # Run the TypeScript compiler
```

## Project structure

- `app/` — Next.js routes, API handlers, and server actions
- `components/` — UI components (entries list, editor, header)
- `lib/` — Supabase helpers, embeddings, and data types

## License

This project is private and not licensed for redistribution.
