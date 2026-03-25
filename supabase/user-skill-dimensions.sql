create table if not exists user_skill_dimensions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  problem_solving numeric not null default 0,
  concept_depth numeric not null default 0,
  communication numeric not null default 0,
  confidence numeric not null default 0,
  consistency numeric not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_skill_dimensions_updated_at on user_skill_dimensions(updated_at desc);

alter table user_skill_dimensions enable row level security;

drop policy if exists "Users can view own skill dimensions" on user_skill_dimensions;
create policy "Users can view own skill dimensions"
  on user_skill_dimensions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own skill dimensions" on user_skill_dimensions;
create policy "Users can insert own skill dimensions"
  on user_skill_dimensions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own skill dimensions" on user_skill_dimensions;
create policy "Users can update own skill dimensions"
  on user_skill_dimensions
  for update
  using (auth.uid() = user_id);
