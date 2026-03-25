/*
You are implementing a custom React hook in TypeScript.

Hook name: useAdaptiveInterview

Goal:
Control the adaptive interview flow using sequential async calls.

Flow:
submitAnswer():
  1. call evaluateAnswer()
  2. call updateSkill()
  3. call generateQuestion()
  4. update UI state

Environment:
- React functional components
- useState hooks
- API helpers imported from "../services/adaptiveApi"

State to manage:
- question (string)
- difficulty (string)
- feedback (string)
- loading (boolean)

Functions:
- startInterview(topic)
    → calls generateQuestion once
- submitAnswer(userAnswer)

Rules:
- Calls MUST run sequentially using await
- No parallel execution
- Proper try/catch
- loading state handled correctly
- return all state + functions

Export the hook.

Generate complete working code.
*/

import { useState } from 'react';
import {
  evaluateAnswer,
  updateSkill,
  generateQuestion,
  generateInsight,
  type Evaluation,
} from '../services/adaptiveApi';

interface UseAdaptiveInterviewReturn {
  question: string;
  difficulty: string;
  feedback: string;
  mentorInsight: string | null;
  loading: boolean;
  error: string | null;
  startInterview: (topic: string, selectedDifficulty?: 'easy' | 'medium' | 'hard') => Promise<void>;
  submitAnswer: (userAnswer: string, userId: string, topic: string, selectedDifficulty?: 'easy' | 'medium' | 'hard') => Promise<void>;
}

export function useAdaptiveInterview(): UseAdaptiveInterviewReturn {
  const [question, setQuestion] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [mentorInsight, setMentorInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSkillScore, setCurrentSkillScore] = useState<number>(0.5);

  // Start interview by generating first question
  const startInterview = async (topic: string, selectedDifficulty?: 'easy' | 'medium' | 'hard'): Promise<void> => {
    setLoading(true);
    setError(null);
    setFeedback('');
    setMentorInsight(null);

    try {
      const response = await generateQuestion(topic, selectedDifficulty);
      setQuestion(response.question);
      setDifficulty(response.difficulty);
      setCurrentSkillScore(response.skill_score);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start interview';
      setError(errorMessage);
      console.error('Error starting interview:', err);
    } finally {
      setLoading(false);
    }
  };

  // Submit answer and get next question
  const submitAnswer = async (
    userAnswer: string,
    userId: string,
    topic: string,
    selectedDifficulty?: 'easy' | 'medium' | 'hard'
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    setFeedback('');
    setMentorInsight(null);

    try {
      console.log('🚀 Starting adaptive interview loop...');
      console.log('📝 User ID:', userId);
      console.log('📚 Topic:', topic);
      console.log('⚡ Current difficulty:', difficulty);

      // Step 1: Evaluate the answer
      console.log('1️⃣ Calling evaluate-answer...');
      const evaluation: Evaluation = await evaluateAnswer({
        userAnswer,
        question,
        topic,
        difficulty: selectedDifficulty ?? difficulty,
        company: null,
        role: null,
        expectedConcepts: [],
        previousMistakes: [],
      });
      console.log('✅ Evaluation complete:', evaluation);

      // Step 2: Update skill state
      console.log('2️⃣ Calling update-skill...');
      const skillUpdate = await updateSkill(userId, topic, difficulty as 'easy' | 'medium' | 'hard', evaluation);
      console.log('✅ Skill updated and attempt recorded:', skillUpdate);

      // Step 3: Generate mentor insight
      console.log('3️⃣ Calling generate-insight...');
      const insightResponse = await generateInsight(topic);
      console.log('✅ Mentor insight generated:', insightResponse.insight);
      setMentorInsight(insightResponse.insight);

      // Step 4: Generate next question
      console.log('4️⃣ Calling generate-question...');
      const nextQuestion = await generateQuestion(topic, selectedDifficulty);
      console.log('✅ Next question generated:', nextQuestion);

      // Step 5: Update UI state
      setFeedback(evaluation.feedback);
      setQuestion(nextQuestion.question);
      setDifficulty(nextQuestion.difficulty);
      setCurrentSkillScore(nextQuestion.skill_score); // Get updated skill from next question generation
      
      console.log('🎉 Adaptive interview loop complete!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit answer';
      setError(errorMessage);
      console.error('❌ Error in adaptive interview loop:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    question,
    difficulty,
    feedback,
    mentorInsight,
    loading,
    error,
    startInterview,
    submitAnswer,
  };
}
