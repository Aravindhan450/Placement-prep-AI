/*
Create DifficultyDistributionChart using recharts BarChart.

Input:
metrics.difficulty_distribution

Bars:
easy
medium
hard

Show counts visually.

Use simple colors and labels.
*/

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

interface DifficultyDistributionChartProps {
  difficulty_distribution: DifficultyDistribution;
}

interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
}

export default function DifficultyDistributionChart({ difficulty_distribution }: DifficultyDistributionChartProps) {
  // Transform difficulty distribution to chart data
  const chartData: ChartDataPoint[] = [
    { 
      name: 'Easy', 
      value: difficulty_distribution.easy,
      color: '#22c55e' // green
    },
    { 
      name: 'Medium', 
      value: difficulty_distribution.medium,
      color: '#f59e0b' // orange
    },
    { 
      name: 'Hard', 
      value: difficulty_distribution.hard,
      color: '#ef4444' // red
    },
  ];

  // Calculate total questions
  const totalQuestions = difficulty_distribution.easy + 
                          difficulty_distribution.medium + 
                          difficulty_distribution.hard;

  // Empty state
  if (totalQuestions === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-gray-400">
        No difficulty data available. Complete practice questions to see distribution.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="name" 
          tick={{ fill: '#6b7280', fontSize: 12 }}
          stroke="#9ca3af"
        />
        <YAxis 
          label={{ 
            value: 'Question Count', 
            angle: -90, 
            position: 'insideLeft',
            style: { fill: '#6b7280', fontSize: 12 }
          }}
          tick={{ fill: '#6b7280', fontSize: 11 }}
          stroke="#9ca3af"
          allowDecimals={false}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
          labelStyle={{ color: '#374151', fontWeight: 600 }}
          formatter={(value: number | undefined) => {
            if (value === undefined) return ['—', 'Count'];
            return [value, 'Questions'];
          }}
          labelFormatter={(label: unknown) => `Difficulty: ${label}`}
        />
        <Legend 
          wrapperStyle={{
            paddingTop: '15px'
          }}
        />
        <Bar 
          dataKey="value" 
          name="Questions"
          radius={[8, 8, 0, 0]}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
