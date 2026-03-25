create table if not exists user_growth_memory (
  user_id uuid primary key references auth.users(id) on delete cascade,
  recurring_weakness text[] not null default '{}'::text[],
  recent_improvement text[] not null default '{}'::text[],
  last_session_summary text not null default '',
  updated_at timestamptz not null default now()
);

alter table user_growth_memory enable row level security;

drop policy if exists "Users can view own growth memory" on user_growth_memory;
create policy "Users can view own growth memory"
  on user_growth_memory
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own growth memory" on user_growth_memory;
create policy "Users can insert own growth memory"
  on user_growth_memory
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own growth memory" on user_growth_memory;
create policy "Users can update own growth memory"
  on user_growth_memory
  for update
  using (auth.uid() = user_id);
