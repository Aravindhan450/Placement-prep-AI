/*
You are writing a TypeScript service layer for a React app
using Supabase JS v2.

Goal:
Fetch analytics data for an Adaptive Interview Dashboard.

Database tables:

1. skill_state
columns:
- topic
- skill_score
- attempts
- updated_at

2. attempt_history
columns:
- topic
- skill_index
- difficulty
- created_at

Requirements:

Create async functions:

getSkillState()
  → returns all skill_state rows for current user

getSkillHistory(topic:string)
  → returns ordered attempt_history for a topic

getRecentAttempts()
  → returns last 10 attempts ordered by created_at DESC

Use supabase.from().select()

User is already authenticated via Supabase session.

Throw errors if query fails.

Return clean typed data.

Generate complete code.
*/

import { supabase } from '../lib/supabase';

// Type definitions
export interface SkillState {
  user_id: string;
  topic: string;
  skill_score: number;
  attempts: number;
  updated_at: string;
}

export interface AttemptHistory {
  user_id: string;
  topic: string;
  correctness: number;
  depth: number;
  confidence: number;
  clarity: number;
  skill_index: number;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
}

// Get all skill states for current user
export async function getSkillState(): Promise<SkillState[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('skill_state')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to fetch skill state: ${error.message}`);
  }

  return data || [];
}

// Get skill history for a specific topic
export async function getSkillHistory(topic: string): Promise<AttemptHistory[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('attempt_history')
    .select('*')
    .eq('user_id', user.id)
    .eq('topic', topic)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch skill history: ${error.message}`);
  }

  return data || [];
}

// Get recent attempts (last 10)
export async function getRecentAttempts(): Promise<AttemptHistory[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('attempt_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(`Failed to fetch recent attempts: ${error.message}`);
  }

  return data || [];
}
