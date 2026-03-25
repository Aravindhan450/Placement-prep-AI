/*
Create a React Dashboard page using TypeScript.

Use:
- useDashboard hook
- recharts library

Layout sections:

SECTION 1 — Interview Readiness
Display large percentage score.

SECTION 2 — Skill Radar Chart
Use RadarChart from recharts.
Data: skills (topic vs skill_score)

SECTION 3 — Skill Progress Line Chart
Use LineChart.
X-axis: created_at
Y-axis: skill_index

SECTION 4 — Recent Attempts Table
Columns:
- topic
- difficulty
- skill_index
- created_at

Requirements:
- Responsive layout
- Simple clean styling
- Show loading indicator
- No external CSS frameworks
- Functional components only

Charts must render safely even if data empty.

Generate complete working component.
*/

import { useDashboard } from '../hooks/useDashboard';
import ExperimentPanel from '../components/ExperimentPanel';
import FocusRecommendationCard from '../components/FocusRecommendationCard';
import NextStepCard from '../components/NextStepCard';
import DailyMissionCard from '../components/DailyMissionCard';
import { generateFocusExplanation } from '../utils/focusRecommendation';
import { generateProgressNarrative } from '../utils/progressNarrative';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    recentAttempts,
    interviewReadinessScore,
    focusTopic,
    nextStep,
    skillDimensions,
    readinessPrediction,
    dailyMission,
    momentum,
    loading,
    error,
  } = useDashboard();

  const recommendedTopic = focusTopic ?? "problem solving";
  const explanation = focusTopic
    ? generateFocusExplanation(focusTopic, interviewReadinessScore)
    : "Keep practicing across topics to unlock a personalized focus recommendation.";
  const progressNarrative = generateProgressNarrative([...recentAttempts].reverse());
  const skillMapData = skillDimensions
    ? [
        { metric: 'Problem Solving', value: Math.round(skillDimensions.problem_solving * 100) },
        { metric: 'Concept Depth', value: Math.round(skillDimensions.concept_depth * 100) },
        { metric: 'Communication', value: Math.round(skillDimensions.communication * 100) },
        { metric: 'Confidence', value: Math.round(skillDimensions.confidence * 100) },
        { metric: 'Consistency', value: Math.round(skillDimensions.consistency * 100) },
      ]
    : [];
  const handleStartMission = () => {
    if (!dailyMission) return;

    const missionSession = {
      topic: dailyMission.topic,
      questionIndex: 0,
      totalQuestions: dailyMission.targetQuestions,
      sessionId: crypto.randomUUID(),
    };
    localStorage.setItem("activeInterviewSession", JSON.stringify(missionSession));
    navigate("/practice");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070f] p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto border-4 border-[#1a1a2e] border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#07070f] p-8 flex items-center justify-center">
        <div className="glass-card p-8 max-w-md text-center border-red-500/30">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070f] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-8">Performance Dashboard</h1>

        {/* SECTION 1 — Interview Readiness */}
        <div className="glass-card p-8 mb-8 text-center">
          <h2 className="text-2xl font-semibold text-white mb-6">Interview Readiness</h2>
          <div className="my-8">
            <span className="text-7xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {Math.round(interviewReadinessScore)}
            </span>
            <span className="text-3xl text-gray-400">%</span>
          </div>
          {readinessPrediction && Number.isFinite(readinessPrediction.sessionsToReady) && (
            <p className="text-gray-300">
              At your current pace, you may reach interview-ready level in ~
              {Math.max(0, Math.round(readinessPrediction.sessionsToReady))} sessions.
            </p>
          )}
        </div>

        <div className="glass-card p-6 mb-8 border-orange-500/30">
          <p className="text-3xl font-bold text-orange-300 mb-2">
            🔥 {Math.max(0, momentum?.streakDays ?? 0)} Day Momentum
          </p>
          <p className="text-gray-300">Consistency improves interview performance.</p>
        </div>

        {dailyMission && (
          <DailyMissionCard
            topic={dailyMission.topic}
            completed={dailyMission.completed}
            targetQuestions={dailyMission.targetQuestions}
            onStart={handleStartMission}
          />
        )}

        {nextStep && (
          <NextStepCard
            topic={nextStep.topic}
            avgSkill={nextStep.avgSkill}
          />
        )}

        <FocusRecommendationCard
          topic={recommendedTopic}
          explanation={explanation}
        />

        <div className="glass-card p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Your Interview Skill Map</h2>
          {skillMapData.length > 0 ? (
            <ResponsiveContainer width="100%" height={340}>
              <RadarChart data={skillMapData}>
                <PolarGrid stroke="#1a1a2e" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#6b7280' }} />
                <Radar
                  dataKey="value"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.25}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0a18',
                    border: '1px solid #1a1a2e',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-10 text-center text-gray-400">
              Complete a few interview attempts to generate your skill map.
            </div>
          )}
        </div>

        {/* SECTION 2 — Recent Attempts Table */}
        <div className="glass-card p-6 mb-8">
          <div className="mb-4 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-200">
            {progressNarrative}
          </div>
          <h2 className="text-xl font-semibold text-white mb-4">Recent Attempts</h2>
          {recentAttempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1a1a2e]">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Topic</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Difficulty</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Skill Index</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttempts.map((attempt, index) => (
                    <tr key={index} className="border-b border-[#1a1a2e]">
                      <td className="px-4 py-3 text-sm text-gray-300">{attempt.topic}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyClass(attempt.difficulty)}`}>
                          {attempt.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {Math.round(attempt.skill_index * 100)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {new Date(attempt.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400">
              No recent attempts found.
            </div>
          )}
        </div>

        {/* SECTION 3 — Experiment Results */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Adaptive Learning Experiment Results</h2>
          <ExperimentPanel />
        </div>
      </div>
    </div>
  );
}

// Helper function for difficulty badge classes
function getDifficultyClass(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'bg-green-500/20 text-green-400 border border-green-500/30';
    case 'medium':
      return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    case 'hard':
      return 'bg-red-500/20 text-red-400 border border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  }
}
