# Demo deployment (Vercel + Supabase)

This guide mirrors the main branch to a new Vercel/Supabase setup and seeds lorem ipsum data for sharing.

## 1) Create a new Supabase project

1. Create a project in Supabase.
2. In **SQL Editor**, run `supabase/demo-schema.sql` from this repo.
   - This creates the `entries` table, `match_entries` RPC (used for related entries), and demo RLS policies.

## 2) Configure auth (demo)

Enable Email/Password auth in Supabase Auth settings. Create a demo user or allow sign-ups if you want employers to self-register.

## 3) Configure Vercel environment variables

Set these in Vercel (Project Settings → Environment Variables):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (optional; only required if you want embeddings)

## 4) Seed lorem ipsum content

The import script expects `scripts/dreams.md` by default. Copy the demo seed file and run the importer locally:

```bash
cp scripts/demo-lorem.md scripts/dreams.md

# create .env.local with Supabase credentials used by the import script
cat <<'ENV' > .env.local
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ENV

# verify parsing
npx ts-node scripts/import-entries.cts --dry-run

# import rows
npx ts-node scripts/import-entries.cts
```

## 5) Deploy on Vercel

Connect the repo/branch, ensure the environment variables above are set, and deploy.

## Optional: embeddings + related entries

The related entries UI uses embeddings. If you want it to work:

1. Keep `OPENAI_API_KEY` set in Vercel and locally.
2. Run the embed endpoints after seeding (or add a scheduled job) to populate embeddings.

## Notes

- The demo RLS policy grants authenticated users access to all rows. Adjust policies if you want stricter rules.
- The embedding vector length is 1536 (for `text-embedding-3-small`). Adjust if you change the model.
