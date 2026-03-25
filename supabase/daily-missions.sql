create table if not exists daily_missions (
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_date date not null,
  topic text not null,
  target_questions int not null default 3,
  completed int not null default 0,
  status text not null default 'active',
  primary key (user_id, mission_date)
);

create index if not exists idx_daily_missions_user_date on daily_missions(user_id, mission_date desc);

alter table daily_missions enable row level security;

drop policy if exists "Users can view own daily missions" on daily_missions;
create policy "Users can view own daily missions"
  on daily_missions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own daily missions" on daily_missions;
create policy "Users can insert own daily missions"
  on daily_missions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own daily missions" on daily_missions;
create policy "Users can update own daily missions"
  on daily_missions
  for update
  using (auth.uid() = user_id);
