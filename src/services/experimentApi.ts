/*
You are creating a TypeScript analytics service
for a React + Supabase adaptive learning system.

Goal:
Fetch experiment evaluation data from Supabase.

Table: attempt_history
columns:
- topic
- skill_index
- difficulty
- created_at

Functions to create:

getAllAttempts()
  → fetch all attempts ordered by created_at ASC

getTopicAttempts(topic:string)
  → fetch attempts for one topic ordered ASC

Requirements:
- use supabase.from().select()
- throw error on failure
- return typed data
- no UI logic
- minimal clean code

User authentication already handled by Supabase session.

Generate complete code.
*/

import { supabase } from '../lib/supabase';

// Type definition
export interface AttemptRecord {
  user_id: string;
  topic: string;
  skill_index: number;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
  correctness?: number;
  depth?: number;
  confidence?: number;
  clarity?: number;
}

// Get all attempts for current user ordered by creation time
export async function getAllAttempts(): Promise<AttemptRecord[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('attempt_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch attempts: ${error.message}`);
  }

  return data || [];
}

// Get attempts for a specific topic ordered by creation time
export async function getTopicAttempts(topic: string): Promise<AttemptRecord[]> {
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
    throw new Error(`Failed to fetch topic attempts: ${error.message}`);
  }

  return data || [];
}
