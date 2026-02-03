-- Demo schema for Saturn (Supabase)
-- Assumes pgvector extension for embedding search.

create extension if not exists vector;

create table if not exists public.entries (
    id uuid primary key default gen_random_uuid(),
    title text,
    body text not null,
    event_date date not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    tags text[] not null default '{}',
    embedding_status text not null default 'pending',
    embedding vector(1536),
    embedding_error text,
    category text,
    starred boolean not null default false
);

alter table public.entries
    add column if not exists embedding_error text;

create index if not exists entries_event_date_idx on public.entries (event_date desc);
create index if not exists entries_embedding_idx on public.entries using ivfflat (embedding vector_cosine_ops);

create or replace function public.set_entries_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_entries_updated_at
before update on public.entries
for each row execute function public.set_entries_updated_at();

-- RPC used by lib/entries.ts for similarity search
create or replace function public.match_entries(
    query_embedding vector(1536),
    match_count int default 4
)
returns table (
    id uuid,
    similarity float
)
language sql stable as $$
    select
        entries.id,
        1 - (entries.embedding <=> query_embedding) as similarity
    from public.entries
    where entries.embedding is not null
    order by entries.embedding <=> query_embedding
    limit match_count;
$$;

-- Demo RLS: require auth for CRUD. Adjust as needed for public demos.
alter table public.entries enable row level security;

do $$
begin
    if not exists (
        select 1 from pg_policies where schemaname = 'public' and tablename = 'entries' and policyname = 'entries_read'
    ) then
        create policy entries_read on public.entries
            for select
            to authenticated
            using (true);
    end if;

    if not exists (
        select 1 from pg_policies where schemaname = 'public' and tablename = 'entries' and policyname = 'entries_write'
    ) then
        create policy entries_write on public.entries
            for all
            to authenticated
            using (true)
            with check (true);
    end if;
end $$;
