/*
Create a React component called ExperimentPanel.

Goal:
Display experiment evaluation metrics visually.

Use:
useExperimentMetrics hook.

Display cards:

1. Learning Gain
   (positive → green, negative → red)

2. Consistency Score
   percentage format

3. Improvement Rate
   show arrow ↑ or ↓

4. Readiness Trend Chart
   using recharts LineChart

Requirements:
- safe rendering if no data
- loading indicator
- clean minimal UI
- no external styling frameworks

Generate complete component.
*/

import { useExperimentMetrics } from '../hooks/useExperimentMetrics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ExperimentPanel() {
  const { learningGain, consistencyScore, improvementRate, readinessTrend, loading } = useExperimentMetrics();

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-400 text-lg py-10">Loading experiment data...</div>
      </div>
    );
  }

  const hasData = readinessTrend.length > 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Learning Gain Card */}
        <div className="glass-card p-6">
          <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Learning Gain</h3>
          <div className={`text-3xl font-bold mb-2 ${learningGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {hasData ? learningGain.toFixed(3) : '—'}
          </div>
          <div className="text-sm text-gray-500">
            {hasData ? (learningGain >= 0 ? 'Improvement' : 'Decline') : 'No data'}
          </div>
        </div>

        {/* Consistency Score Card */}
        <div className="glass-card p-6">
          <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Consistency Score</h3>
          <div className="text-3xl font-bold text-white mb-2">
            {hasData ? `${(consistencyScore * 100).toFixed(1)}%` : '—'}
          </div>
          <div className="text-sm text-gray-500">
            {hasData ? 'Performance stability' : 'No data'}
          </div>
        </div>

        {/* Improvement Rate Card */}
        <div className="glass-card p-6">
          <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Improvement Rate</h3>
          <div className="text-3xl font-bold text-white mb-2">
            {hasData ? (
              <>
                {improvementRate >= 0 ? '↑' : '↓'} {Math.abs(improvementRate).toFixed(4)}
              </>
            ) : (
              '—'
            )}
          </div>
          <div className="text-sm text-gray-500">
            {hasData ? 'Learning slope' : 'No data'}
          </div>
        </div>
      </div>

      {/* Readiness Trend Chart */}
      <div className="glass-card p-6">
        <h3 className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">Readiness Trend</h3>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={readinessTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
              <XAxis
                dataKey="attempt"
                label={{ value: 'Attempt Number', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
                stroke="#6b7280"
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis
                label={{ value: 'Skill Index', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                stroke="#6b7280"
                tick={{ fill: '#9ca3af' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0a0a18', 
                  border: '1px solid #1a1a2e', 
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: '#6366f1', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-16 text-gray-500">No attempt data available yet</div>
        )}
      </div>
    </div>
  );
}
