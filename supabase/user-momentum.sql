create table if not exists user_momentum (
  user_id uuid primary key references auth.users(id) on delete cascade,
  streak_days int not null default 0,
  last_active_date date
);

alter table user_momentum enable row level security;

drop policy if exists "Users can view own momentum" on user_momentum;
create policy "Users can view own momentum"
  on user_momentum
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own momentum" on user_momentum;
create policy "Users can insert own momentum"
  on user_momentum
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own momentum" on user_momentum;
create policy "Users can update own momentum"
  on user_momentum
  for update
  using (auth.uid() = user_id);
