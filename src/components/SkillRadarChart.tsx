/*
Create SkillRadarChart component using recharts.

Input:
skill_progression array from experiment metrics.

Compute:
- correctness skill
- depth skill
- confidence skill
- clarity skill

Mock values if unavailable:
derive from average skill score.

Chart Type:
RadarChart

Display labels:
Correctness
Concept Depth
Confidence
Clarity

Make responsive container.
No external state management.
Strict TypeScript typing.
*/

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface SkillRadarChartProps {
  skill_progression: number[];
}

interface RadarDataPoint {
  skill: string;
  score: number;
  fullMark: number;
}

export default function SkillRadarChart({ skill_progression }: SkillRadarChartProps) {
  // Calculate average skill score
  const calculateAverageScore = (): number => {
    if (skill_progression.length === 0) return 0;
    const sum = skill_progression.reduce((acc, score) => acc + score, 0);
    return sum / skill_progression.length;
  };

  // Get latest skill score or use average as fallback
  const getLatestScore = (): number => {
    if (skill_progression.length === 0) return 0;
    return skill_progression[skill_progression.length - 1];
  };

  const averageScore = calculateAverageScore();
  const latestScore = getLatestScore();

  // Derive mock skill dimensions from average and latest scores
  // Add slight variations to create a realistic radar pattern
  const deriveSkillDimensions = (): RadarDataPoint[] => {
    const baseScore = averageScore * 100; // Convert to percentage

    // Create variations around the base score
    const correctnessScore = Math.min(100, Math.max(0, latestScore * 100 * 1.05));
    const depthScore = Math.min(100, Math.max(0, baseScore * 0.95));
    const confidenceScore = Math.min(100, Math.max(0, latestScore * 100 * 0.98));
    const clarityScore = Math.min(100, Math.max(0, baseScore * 1.02));

    return [
      { skill: 'Correctness', score: Math.round(correctnessScore), fullMark: 100 },
      { skill: 'Concept Depth', score: Math.round(depthScore), fullMark: 100 },
      { skill: 'Confidence', score: Math.round(confidenceScore), fullMark: 100 },
      { skill: 'Clarity', score: Math.round(clarityScore), fullMark: 100 },
    ];
  };

  const radarData = deriveSkillDimensions();

  // Empty state
  if (skill_progression.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-gray-400">
        No skill data available yet. Complete practice questions to see your skill breakdown.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={radarData}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis 
          dataKey="skill" 
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 100]} 
          tick={{ fill: '#6b7280', fontSize: 10 }}
        />
        <Radar
          name="Skill Level"
          dataKey="score"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.6}
          strokeWidth={2}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
          formatter={(value: number | undefined) => value !== undefined ? [`${value}%`, 'Skill Level'] : ['—', 'Skill Level']}
        />
        <Legend 
          wrapperStyle={{
            paddingTop: '20px'
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
