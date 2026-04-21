-- RAG retrieval RPC using pgvector cosine distance
create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  content text not null,
  embedding vector not null
);

create index if not exists documents_topic_idx
  on public.documents (topic);

create index if not exists documents_embedding_hnsw_idx
  on public.documents
  using hnsw (embedding vector_cosine_ops);

create or replace function public.match_knowledge_documents(
  query_embedding vector,
  match_count int default 3,
  topic_filter text default null
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
    kb.id,
    kb.topic,
    kb.content,
    1 - (kb.embedding <=> query_embedding) as similarity
  from public.documents kb
  where
    topic_filter is null
    or kb.topic = topic_filter
  order by kb.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;
