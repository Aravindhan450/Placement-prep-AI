-- ============================================
-- COLLEGE PLACEMENT PREP PLATFORM
-- Supabase Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CHAT SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for chat_sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON chat_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_created_at ON chat_sessions(created_at DESC);

-- ============================================
-- 2. MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at ASC);

-- ============================================
-- 3. RESUMES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  analysis TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for resumes
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resumes"
  ON resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes"
  ON resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes"
  ON resumes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes"
  ON resumes FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_created_at ON resumes(created_at DESC);

-- ============================================
-- 4. ROADMAPS TABLE (Public read)
-- ============================================
CREATE TABLE IF NOT EXISTS roadmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_name TEXT NOT NULL,
  description TEXT,
  skills JSONB NOT NULL DEFAULT '[]'::JSONB,
  resources JSONB DEFAULT '[]'::JSONB,
  timeline TEXT,
  prerequisites TEXT[] DEFAULT ARRAY[]::TEXT[],
  project_ideas TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for roadmaps
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view roadmaps"
  ON roadmaps FOR SELECT
  TO authenticated
  USING (true);

-- Indexes
CREATE INDEX idx_roadmaps_role_name ON roadmaps(role_name);

-- ============================================
-- 5. USER PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  completed_skills INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, roadmap_id)
);

-- RLS Policies for user_progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_roadmap_id ON user_progress(roadmap_id);

-- ============================================
-- SEED DATA: Sample Roadmaps
-- ============================================

INSERT INTO roadmaps (role_name, description, skills, resources, timeline, prerequisites, project_ideas)
VALUES 
(
  'Full Stack Developer',
  'Complete roadmap for becoming a full-stack web developer',
  '[
    {"name": "HTML/CSS", "level": "beginner", "category": "Frontend"},
    {"name": "JavaScript", "level": "beginner", "category": "Frontend"},
    {"name": "React", "level": "intermediate", "category": "Frontend"},
    {"name": "Node.js", "level": "intermediate", "category": "Backend"},
    {"name": "Express", "level": "intermediate", "category": "Backend"},
    {"name": "PostgreSQL", "level": "intermediate", "category": "Database"},
    {"name": "Git", "level": "beginner", "category": "Tools"}
  ]'::JSONB,
  '[
    {"title": "MDN Web Docs", "url": "https://developer.mozilla.org", "type": "documentation"},
    {"title": "React Documentation", "url": "https://react.dev", "type": "documentation"},
    {"title": "Node.js Tutorial", "url": "https://nodejs.org/en/docs", "type": "tutorial"}
  ]'::JSONB,
  '6-12 months',
  ARRAY['Basic computer knowledge', 'Problem-solving skills'],
  ARRAY['Build a blog platform', 'Create a task management app', 'E-commerce website']
),
(
  'Data Scientist',
  'Path to becoming a data scientist with ML expertise',
  '[
    {"name": "Python", "level": "beginner", "category": "Programming"},
    {"name": "Pandas", "level": "intermediate", "category": "Data Analysis"},
    {"name": "NumPy", "level": "intermediate", "category": "Data Analysis"},
    {"name": "Machine Learning", "level": "advanced", "category": "ML"},
    {"name": "SQL", "level": "intermediate", "category": "Database"},
    {"name": "Statistics", "level": "advanced", "category": "Mathematics"}
  ]'::JSONB,
  '[
    {"title": "Python Documentation", "url": "https://docs.python.org", "type": "documentation"},
    {"title": "Kaggle Learn", "url": "https://www.kaggle.com/learn", "type": "course"},
    {"title": "Scikit-learn Docs", "url": "https://scikit-learn.org", "type": "documentation"}
  ]'::JSONB,
  '8-15 months',
  ARRAY['Mathematics basics', 'Programming fundamentals'],
  ARRAY['Predict house prices', 'Image classification', 'Customer churn prediction']
);

-- ============================================
-- COMPLETED
-- ============================================
