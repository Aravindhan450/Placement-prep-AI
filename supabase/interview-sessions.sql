-- Interview session tracking for analytics and progress comparison

create table if not exists interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text,
  role text,
  topic text not null,
  start_time timestamptz not null default now(),
  end_time timestamptz,
  avg_score numeric not null default 0,
  questions_attempted integer not null default 0,
  readiness_score numeric not null default 0
);

alter table if exists interview_sessions
  add column if not exists readiness_score numeric not null default 0;

create index if not exists idx_interview_sessions_user_id on interview_sessions(user_id);
create index if not exists idx_interview_sessions_start_time on interview_sessions(start_time desc);

alter table interview_sessions enable row level security;

drop policy if exists "Users can view own interview sessions" on interview_sessions;
create policy "Users can view own interview sessions"
  on interview_sessions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own interview sessions" on interview_sessions;
create policy "Users can insert own interview sessions"
  on interview_sessions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own interview sessions" on interview_sessions;
create policy "Users can update own interview sessions"
  on interview_sessions
  for update
  using (auth.uid() = user_id);

-- Attach attempts to sessions (safe if column already exists)
alter table if exists attempt_history
  add column if not exists session_id uuid references interview_sessions(id) on delete set null;

create index if not exists idx_attempt_history_session_id on attempt_history(session_id);
