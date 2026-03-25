/*
Create a React hook called useExperiment for PlacementPrep AI.

Purpose:
Track adaptive learning experiment metrics for research evaluation.

Requirements:

State:
- session_id (uuid)
- start_time
- questions_attempted
- skill_progression (array of numbers)
- difficulty_history (easy | medium | hard)[]
- improvement_rate
- experiment_active (boolean)

Functions:
- startExperiment()
    creates session_id
    resets metrics

- recordAttempt(skillScore, difficulty)
    increment attempts
    push skillScore into skill_progression
    push difficulty into difficulty_history

- endExperiment()
    calculate improvement_rate =
        (last skill - first skill) / attempts

Return:
{
 startExperiment,
 recordAttempt,
 endExperiment,
 experiment_active,
 metrics
}

Use TypeScript strictly.
No any types.
*/

import { useState, useEffect } from 'react';

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

interface ExperimentState {
  session_id: string;
  start_time: number;
  questions_attempted: number;
  skill_progression: number[];
  difficulty_history: Difficulty[];
  improvement_rate: number;
  experiment_active: boolean;
}

interface ExperimentMetrics {
  session_id: string;
  questions_attempted: number;
  skill_progression: number[];
  improvement_rate: number;
  learning_velocity: number;
  difficulty_distribution: DifficultyDistribution;
}

interface UseExperimentReturn {
  startExperiment: () => void;
  recordAttempt: (skillScore: number, difficulty: Difficulty) => void;
  endExperiment: () => void;
  experiment_active: boolean;
  metrics: ExperimentMetrics;
}

const initialState: ExperimentState = {
  session_id: '',
  start_time: 0,
  questions_attempted: 0,
  skill_progression: [],
  difficulty_history: [],
  improvement_rate: 0,
  experiment_active: false,
};

// Helper: Calculate learning velocity (average of differences between consecutive skill scores)
function calculateLearningVelocity(skill_progression: number[]): number {
  if (skill_progression.length < 2) return 0;

  let totalDifference = 0;
  for (let i = 1; i < skill_progression.length; i++) {
    totalDifference += skill_progression[i] - skill_progression[i - 1];
  }

  const numDifferences = skill_progression.length - 1;
  return numDifferences > 0 ? totalDifference / numDifferences : 0;
}

// Helper: Count difficulty distribution
function calculateDifficultyDistribution(difficulty_history: Difficulty[]): DifficultyDistribution {
  const distribution: DifficultyDistribution = {
    easy: 0,
    medium: 0,
    hard: 0,
  };

  for (const difficulty of difficulty_history) {
    distribution[difficulty]++;
  }

  return distribution;
}

export function useExperiment(): UseExperimentReturn {
  const [state, setState] = useState<ExperimentState>(initialState);

  // Auto-initialize experiment session when activated without existing session
  useEffect(() => {
    if (state.experiment_active && !state.session_id) {
      const session_id = crypto.randomUUID();
      const start_time = Date.now();

      setState((prevState) => ({
        ...prevState,
        session_id,
        start_time,
        questions_attempted: 0,
        skill_progression: [],
        difficulty_history: [],
        improvement_rate: 0,
      }));
    }
  }, [state.experiment_active, state.session_id]);

  const startExperiment = (): void => {
    const session_id = crypto.randomUUID();
    const start_time = Date.now();

    setState({
      session_id,
      start_time,
      questions_attempted: 0,
      skill_progression: [],
      difficulty_history: [],
      improvement_rate: 0,
      experiment_active: true,
    });
  };

  const recordAttempt = (skillScore: number, difficulty: Difficulty): void => {
    setState((prevState) => ({
      ...prevState,
      questions_attempted: prevState.questions_attempted + 1,
      skill_progression: [...prevState.skill_progression, skillScore],
      difficulty_history: [...prevState.difficulty_history, difficulty],
    }));
  };

  const endExperiment = (): void => {
    setState((prevState) => {
      const { skill_progression, questions_attempted } = prevState;

      let improvement_rate = 0;

      if (skill_progression.length >= 2 && questions_attempted > 0) {
        const firstSkill = skill_progression[0];
        const lastSkill = skill_progression[skill_progression.length - 1];
        improvement_rate = (lastSkill - firstSkill) / questions_attempted;
      }

      return {
        ...prevState,
        improvement_rate,
        experiment_active: false,
      };
    });
  };

  // Calculate derived metrics
  const learning_velocity = calculateLearningVelocity(state.skill_progression);
  const difficulty_distribution = calculateDifficultyDistribution(state.difficulty_history);

  const metrics: ExperimentMetrics = {
    session_id: state.session_id,
    questions_attempted: state.questions_attempted,
    skill_progression: state.skill_progression,
    improvement_rate: state.improvement_rate,
    learning_velocity,
    difficulty_distribution,
  };

  return {
    startExperiment,
    recordAttempt,
    endExperiment,
    experiment_active: state.experiment_active,
    metrics,
  };
}
