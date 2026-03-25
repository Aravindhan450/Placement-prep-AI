import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import Navbar from "./components/Navbar";
import { SignInForm } from "./SignInForm";
import TopicSelect from "./components/interview/TopicSelect";
import PracticePage from "./pages/PracticePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import DashboardPage from "./pages/DashboardPage";
import RoadmapPage from "./pages/RoadmapPage";
import SummaryPage from "./pages/SummaryPage";
import InterviewSimulationPage from "./pages/InterviewSimulationPage";
import ResumePage from "./pages/ResumePage";
import { useAuth } from "./contexts/AuthContext";

function AppContent() {
  const { user } = useAuth();

  // Show sign-in page during reset
  if (!user) {
    return (
      <div className="min-h-screen bg-[#07070f] text-white relative">
        <div className="dark-ambient" />
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8 relative z-10">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                PlacementPrep AI
              </h1>
              <p className="text-lg text-gray-400">
                Your AI-powered college placement preparation platform
              </p>
            </div>
            <SignInForm />
          </div>
        </main>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070f] text-white relative">
      <div className="dark-ambient" />
      <Navbar />
      <main className="flex-1 relative z-10">
        <Routes>
          <Route path="/" element={<TopicSelect />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="/interview" element={<InterviewSimulationPage />} />
          {/* Backward compatibility for old URL */}
          <Route path="/company-interview" element={<InterviewSimulationPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/experiment-dashboard" element={<AnalyticsPage />} />
          <Route path="/roadmaps" element={<RoadmapPage />} />
          <Route path="/resume" element={<ResumePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
