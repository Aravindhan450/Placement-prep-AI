create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  content text not null,
  embedding vector(1536) not null
);

create index if not exists documents_topic_idx
  on public.documents (topic);

create index if not exists documents_embedding_hnsw_idx
  on public.documents
  using hnsw (embedding vector_cosine_ops);

create or replace function public.match_documents(
  query_embedding vector(1536),
  match_count int default 3,
  filter_topic text default null
)
returns table (
  id uuid,
  topic text,
  content text,
  similarity double precision
)
language sql
stable
as $$
  select
    d.id,
    d.topic,
    d.content,
    1 - (d.embedding <=> query_embedding) as similarity
  from public.documents d
  where
    filter_topic is null
    or d.topic = filter_topic
  order by d.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;
