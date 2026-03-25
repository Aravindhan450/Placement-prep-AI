/*
Create LearningCurveChart component using recharts LineChart.

Input:
metrics.skill_progression

X-axis:
attempt number

Y-axis:
skill score (0–1)

Requirements:
- Smooth line
- Tooltip enabled
- Responsive container
- Auto-scale Y axis between 0 and 1
*/

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LearningCurveChartProps {
  skill_progression: number[];
}

interface ChartDataPoint {
  attempt: number;
  skill: number;
}

export default function LearningCurveChart({ skill_progression }: LearningCurveChartProps) {
  // Transform skill progression data for chart
  const chartData: ChartDataPoint[] = skill_progression.map((score, index) => ({
    attempt: index + 1,
    skill: score,
  }));

  // Empty state
  if (skill_progression.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-gray-400">
        No learning curve data available. Complete practice questions to visualize your progress.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="attempt" 
          label={{ 
            value: 'Attempt Number', 
            position: 'insideBottom', 
            offset: -5,
            style: { fill: '#6b7280', fontSize: 12 }
          }}
          tick={{ fill: '#6b7280', fontSize: 11 }}
          stroke="#9ca3af"
        />
        <YAxis 
          domain={[0, 1]}
          label={{ 
            value: 'Skill Score', 
            angle: -90, 
            position: 'insideLeft',
            style: { fill: '#6b7280', fontSize: 12 }
          }}
          tick={{ fill: '#6b7280', fontSize: 11 }}
          stroke="#9ca3af"
          tickFormatter={(value: number) => value.toFixed(2)}
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
            if (value === undefined) return ['—', 'Skill Score'];
            return [value.toFixed(3), 'Skill Score'];
          }}
          labelFormatter={(label: unknown) => `Attempt ${label}`}
        />
        <Legend 
          wrapperStyle={{
            paddingTop: '15px'
          }}
        />
        <Line
          type="monotone"
          dataKey="skill"
          stroke="#3b82f6"
          strokeWidth={3}
          dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
          name="Skill Score"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
