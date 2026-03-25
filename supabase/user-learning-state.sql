-- Persistent learning memory for adaptive interviews
create table if not exists user_learning_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  weak_concepts text[] not null default '{}'::text[],
  strong_concepts text[] not null default '{}'::text[],
  readiness_score double precision not null default 0,
  last_updated timestamptz not null default now(),
  unique(user_id, topic)
);

alter table if exists user_learning_state
  add column if not exists readiness_score double precision not null default 0;

create index if not exists idx_user_learning_state_user_id on user_learning_state(user_id);
create index if not exists idx_user_learning_state_topic on user_learning_state(topic);

alter table user_learning_state enable row level security;

drop policy if exists "Users can view own learning state" on user_learning_state;
create policy "Users can view own learning state"
  on user_learning_state
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own learning state" on user_learning_state;
create policy "Users can insert own learning state"
  on user_learning_state
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own learning state" on user_learning_state;
create policy "Users can update own learning state"
  on user_learning_state
  for update
  using (auth.uid() = user_id);
