import { useEffect } from "react";
import { useDashboardData } from "../hooks/useDashboardData";
import { useDashboardContext } from "../contexts/DashboardContext";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function AnalyticsPage() {
  const { loading, analytics, loadDashboardData: loadDashboardAnalytics } = useDashboardData();
  const { dashboardData, loadDashboardData: loadDashboardCounts } = useDashboardContext();

  useEffect(() => {
    void loadDashboardCounts();

    const interval = setInterval(() => {
      void loadDashboardCounts();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadDashboardCounts]);

  useEffect(() => {
    const refresh = () => {
      void loadDashboardAnalytics();
      void loadDashboardCounts();
    };
    window.addEventListener("dashboard-refresh", refresh);
    return () => window.removeEventListener("dashboard-refresh", refresh);
  }, [loadDashboardAnalytics, loadDashboardCounts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070f] p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4" />
          <p className="text-xl text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070f] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Adaptive Intelligence Analytics
          </h1>
          <p className="text-gray-400">Live learning analytics from your interview sessions</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Sessions Tracked"
            value={dashboardData.sessionCount}
            subtitle="Interview sessions in trend chart"
          />
          <MetricCard
            title="Questions Attempted"
            value={dashboardData.attemptCount}
            subtitle="Total across tracked sessions"
          />
          <MetricCard
            title="Weak Concepts"
            value={dashboardData.weakConceptCount}
            subtitle="Concepts marked for revision"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Strengths vs Weaknesses</h2>
            {analytics.radar_data.length > 0 ? (
              <ResponsiveContainer width="100%" height={340}>
                <RadarChart data={analytics.radar_data}>
                  <PolarGrid stroke="#1a1a2e" />
                  <PolarAngleAxis dataKey="topic" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                  <PolarRadiusAxis tick={{ fill: "#6b7280" }} axisLine={false} />
                  <Radar
                    name="Strengths"
                    dataKey="strength"
                    stroke="#4ade80"
                    fill="#4ade80"
                    fillOpacity={0.25}
                  />
                  <Radar
                    name="Weaknesses"
                    dataKey="weakness"
                    stroke="#f87171"
                    fill="#f87171"
                    fillOpacity={0.2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0a0a18",
                      border: "1px solid #1a1a2e",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Legend wrapperStyle={{ color: "#9ca3af" }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState message="No strength/weakness data yet." />
            )}
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Readiness Over Time</h2>
            {analytics.readiness_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={analytics.readiness_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                  <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: "#9ca3af" }} />
                  <YAxis
                    stroke="#6b7280"
                    tick={{ fill: "#9ca3af" }}
                    domain={[0, 100]}
                    label={{ value: "Readiness %", angle: -90, position: "insideLeft", fill: "#9ca3af" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0a0a18",
                      border: "1px solid #1a1a2e",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Legend wrapperStyle={{ color: "#9ca3af" }} />
                  <Line
                    type="monotone"
                    dataKey="readiness"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#a78bfa" }}
                    activeDot={{ r: 6 }}
                    name="Readiness"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState message="No readiness trend data yet." />
            )}
          </div>
        </div>

        <div className="glass-card p-6 border border-amber-500/30">
          <h2 className="text-xl font-semibold text-white mb-2">Weak Concepts To Revise</h2>
          <p className="text-amber-300 text-lg font-medium">{analytics.weak_recommendation}</p>
          {analytics.weak_concepts.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {analytics.weak_concepts.slice(0, 8).map((concept) => (
                <span
                  key={concept}
                  className="px-3 py-1 rounded-full text-sm bg-amber-500/15 border border-amber-500/30 text-amber-200"
                >
                  {concept}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
}

function MetricCard({ title, value, subtitle }: MetricCardProps) {
  return (
    <div className="glass-card bg-gradient-to-br from-indigo-500 to-purple-600 p-6">
      <h3 className="text-sm font-medium text-white/90 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-white/80">{subtitle}</p>
    </div>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return <div className="h-[340px] flex items-center justify-center text-gray-400">{message}</div>;
}
