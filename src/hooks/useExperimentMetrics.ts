/*
Create a React hook called useExperimentMetrics.

Goal:
Compute learning metrics from attempt_history data.

Use getAllAttempts() from "../services/experimentApi".

State:
- attempts
- learningGain
- consistencyScore
- improvementRate
- readinessTrend
- loading

Definitions:

learningGain:
  last skill_index - first skill_index

consistencyScore:
  1 - standard deviation of skill_index

improvementRate:
  slope of skill_index over time
  (simple linear trend approximation)

readinessTrend:
  array of { attempt:number, score:number }
  used for charts

Behavior:
- load data on mount
- compute metrics after fetch
- handle empty data safely

Return all metrics.

Generate full TypeScript hook.
*/

import { useState, useEffect } from 'react';
import { getAllAttempts, AttemptRecord } from '../services/experimentApi';

interface ReadinessTrendPoint {
  attempt: number;
  score: number;
}

interface ExperimentMetrics {
  attempts: AttemptRecord[];
  learningGain: number;
  consistencyScore: number;
  improvementRate: number;
  readinessTrend: ReadinessTrendPoint[];
  loading: boolean;
}

// Calculate standard deviation
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(variance);
}

// Calculate linear regression slope (improvement rate)
function calculateSlope(yValues: number[]): number {
  const n = yValues.length;
  if (n < 2) return 0;
  
  // x values are just indices: 0, 1, 2, ...
  const xMean = (n - 1) / 2;
  const yMean = yValues.reduce((sum, val) => sum + val, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = i - xMean;
    const yDiff = yValues[i] - yMean;
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
  }
  
  return denominator === 0 ? 0 : numerator / denominator;
}

export function useExperimentMetrics(): ExperimentMetrics {
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [learningGain, setLearningGain] = useState<number>(0);
  const [consistencyScore, setConsistencyScore] = useState<number>(0);
  const [improvementRate, setImprovementRate] = useState<number>(0);
  const [readinessTrend, setReadinessTrend] = useState<ReadinessTrendPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadMetrics() {
      setLoading(true);
      
      try {
        const data = await getAllAttempts();
        setAttempts(data);
        
        if (data.length === 0) {
          // No data - set defaults
          setLearningGain(0);
          setConsistencyScore(0);
          setImprovementRate(0);
          setReadinessTrend([]);
        } else {
          // Extract skill_index values
          const skillIndices = data.map(a => a.skill_index);
          
          // Learning Gain: last - first
          const gain = skillIndices[skillIndices.length - 1] - skillIndices[0];
          setLearningGain(gain);
          
          // Consistency Score: 1 - std dev
          const stdDev = calculateStdDev(skillIndices);
          const consistency = Math.max(0, 1 - stdDev); // Ensure non-negative
          setConsistencyScore(consistency);
          
          // Improvement Rate: slope of linear trend
          const slope = calculateSlope(skillIndices);
          setImprovementRate(slope);
          
          // Readiness Trend: for chart visualization
          const trend = data.map((attempt, index) => ({
            attempt: index + 1,
            score: attempt.skill_index
          }));
          setReadinessTrend(trend);
        }
      } catch (error) {
        console.error('Failed to load experiment metrics:', error);
        // Set safe defaults on error
        setAttempts([]);
        setLearningGain(0);
        setConsistencyScore(0);
        setImprovementRate(0);
        setReadinessTrend([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadMetrics();
  }, []);

  return {
    attempts,
    learningGain,
    consistencyScore,
    improvementRate,
    readinessTrend,
    loading
  };
}
