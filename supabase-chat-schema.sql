-- ============================================
-- MINIMAL CHAT SCHEMA
-- ============================================
-- Execute this in Supabase Dashboard → SQL Editor
-- ============================================

-- chat sessions table
create table chat_sessions (

  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  title text default 'New Chat',

  created_at timestamp with time zone default now()

);

-- messages table
create table messages (

  id uuid primary key default gen_random_uuid(),

  session_id uuid not null references chat_sessions(id) on delete cascade,

  role text not null check (role in ('user', 'assistant')),

  content text not null,

  created_at timestamp with time zone default now()

);

-- enable row level security
alter table chat_sessions enable row level security;
alter table messages enable row level security;

-- chat_sessions policy
create policy "Users can access own sessions"

on chat_sessions

for all

using (auth.uid() = user_id);

-- messages policy
create policy "Users can access messages in own sessions"

on messages

for all

using (

  session_id in (

    select id from chat_sessions

    where user_id = auth.uid()

  )

);

-- ============================================
-- VERIFICATION
-- ============================================
-- Run these queries to verify:
--
-- SELECT * FROM chat_sessions;
-- SELECT * FROM messages;
--
-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('chat_sessions', 'messages');
-- ============================================
