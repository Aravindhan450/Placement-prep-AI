import { supabase } from '../lib/supabase';

export interface Evaluation {
  correctness: number;
  concept_depth: number;
  confidence: number;
  clarity: number;
  feedback: string;
}

export interface EvaluateAnswerResponse {
  success: boolean;
  evaluation: Evaluation;
}

export interface EvaluateAnswerPayload {
  userAnswer: string;
  question: string;
  topic: string;
  difficulty: string;
  company: string | null;
  role: string | null;
  expectedConcepts: string[];
  previousMistakes: string[];
}

export interface UpdateSkillResponse {
  success: boolean;
  updated: boolean;
}

export interface GenerateQuestionResponse {
  success: boolean;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  skill_score: number;
  question: string;
  adaptive_difficulty?: 'easy' | 'medium' | 'hard';
  user_overridden?: boolean;
}

export interface GenerateInsightResponse {
  success: boolean;
  insight: string;
  skill_delta: number;
  previous_skill: number;
  current_skill: number;
}

export interface CompanyQuestionResponse {
  success: boolean;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  skill_score: number;
  company: string;
  role: string;
  round_type: string;
  question_id: string;
  generated_at: string;
}

async function getAccessToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No active session - user must be logged in')
  return session.access_token
}

export async function evaluateAnswer(payload: EvaluateAnswerPayload): Promise<Evaluation> {
  const accessToken = await getAccessToken()
  console.log('📡 Invoking evaluate-answer edge function...');

  const { data, error } = await supabase.functions.invoke<EvaluateAnswerResponse>(
    'evaluate-answer',
    {
      body: { ...payload, accessToken },
    }
  );

  if (error) {
    console.error('❌ evaluate-answer error:', error);
    throw new Error(`Failed to evaluate answer: ${error.message}`);
  }
  if (!data || !data.success) {
    console.error('❌ evaluate-answer unsuccessful');
    throw new Error('Evaluation failed');
  }
  console.log('✅ evaluate-answer success:', data.evaluation);
  return data.evaluation;
}

export async function updateSkill(
  user_id: string,
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  evaluation: Evaluation
): Promise<UpdateSkillResponse> {
  console.log('📡 Invoking update-skill edge function...', { topic, difficulty });

  const { data, error } = await supabase.functions.invoke<UpdateSkillResponse>(
    'update-skill',
    {
      body: {
        topic,
        difficulty,
        evaluation: {
          correctness: evaluation.correctness,
          concept_depth: evaluation.concept_depth,
          confidence: evaluation.confidence,
          clarity: evaluation.clarity
        }
      },
    }
  );

  if (error) {
    console.error('❌ update-skill error:', error);
    throw new Error(`Failed to update skill: ${error.message}`);
  }
  if (!data || !data.success) {
    console.error('❌ update-skill unsuccessful');
    throw new Error('Skill update failed');
  }
  console.log('✅ update-skill success - attempt recorded in database:', data);
  return data;
}

export async function generateQuestion(
  topic: string,
  difficulty?: 'easy' | 'medium' | 'hard'
): Promise<GenerateQuestionResponse> {
  const accessToken = await getAccessToken()
  console.log('📡 Invoking generate-question edge function...', { topic, difficulty });

  const { data, error } = await supabase.functions.invoke<GenerateQuestionResponse>(
    'generate-question',
    {
      body: { topic, difficulty, accessToken },
    }
  );

  if (error) {
    console.error('❌ generate-question error:', error);
    throw new Error(`Failed to generate question: ${error.message}`);
  }
  if (!data || !data.success) {
    console.error('❌ generate-question unsuccessful');
    throw new Error('Question generation failed');
  }
  console.log('✅ generate-question success:', { difficulty: data.difficulty, skill_score: data.skill_score });
  return data;
}

export async function generateInsight(
  topic: string
): Promise<GenerateInsightResponse> {
  console.log('📡 Invoking generate-insight edge function...', { topic });

  const { data, error } = await supabase.functions.invoke<GenerateInsightResponse>(
    'generate-insight',
    {
      body: { topic },
    }
  );

  if (error) {
    console.error('❌ generate-insight error:', error);
    throw new Error(`Failed to generate insight: ${error.message}`);
  }
  if (!data || !data.success) {
    console.error('❌ generate-insight unsuccessful');
    throw new Error('Insight generation failed');
  }
  console.log('✅ generate-insight success:', data.insight);
  return data;
}

export async function generateCompanyQuestion(
  company: string,
  role: string,
  roundType: string,
  previousQuestions: string[] = []
): Promise<CompanyQuestionResponse> {
  const accessToken = await getAccessToken();

  const { data, error } = await supabase.functions.invoke<CompanyQuestionResponse>(
    'generate-company-question',
    {
      body: { company, role, roundType, accessToken, previousQuestions },
    }
  );

  if (error) throw new Error(`Failed to generate question: ${error.message}`);
  if (!data || !data.success) throw new Error('Question generation failed');
  return data;
}
