import { useState } from 'react';
import { ROLES } from '../data/roles';
import { ROADMAPS, RoadmapSection } from '../data/roadmaps';
import { ROADMAP_TEMPLATE } from '../config/roadmapTemplate';
import { supabase } from '../lib/supabase';

export default function RoadmapPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [fadeIn, setFadeIn] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedRoadmap, setGeneratedRoadmap] = useState<RoadmapSection[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRoleClick = (roleId: string) => {
    setFadeIn(false);
    setError(null);
    setGeneratedRoadmap(null);
    setTimeout(() => {
      setSelectedRole(roleId);
      setFadeIn(true);
    }, 150);
  };

  const generateAIRoadmap = async () => {
    if (!selectedRole) return;

    setGenerating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const roleTitle = ROLES.find(r => r.id === selectedRole)?.title || selectedRole;

      const response = await supabase.functions.invoke('generate-roadmap', {
        body: { role: roleTitle },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Failed to generate roadmap");
      }

      setGeneratedRoadmap(response.data.roadmap);
      setFadeIn(false);
      setTimeout(() => setFadeIn(true), 150);

    } catch (err) {
      console.error("Error generating roadmap:", err);
      setError(err instanceof Error ? err.message : "Failed to generate roadmap");
    } finally {
      setGenerating(false);
    }
  };

  const currentRoadmap = generatedRoadmap || (selectedRole ? ROADMAPS[selectedRole] : null);
  const selectedRoleTitle = selectedRole 
    ? ROLES.find(r => r.id === selectedRole)?.title 
    : null;

  return (
    <div className="min-h-screen bg-[#07070f] text-white">
      <div className="dark-ambient" />
      
      <div className="relative z-10 py-12 px-4">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Choose Your Career Roadmap
          </h1>
          <p className="text-gray-400 text-lg">
            Structured learning paths for placement preparation
          </p>
        </header>

        {/* Role Selection Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-6xl mx-auto mb-16">
          {ROLES.map((role) => (
            <div
              key={role.id}
              onClick={() => handleRoleClick(role.id)}
              className={`
                glass-card ai-hover cursor-pointer p-4 text-center
                transition-all duration-300
                ${selectedRole === role.id 
                  ? 'border-indigo-500 bg-indigo-500/10' 
                  : 'border-[#1a1a2e]'}
              `}
            >
              <p className="text-sm font-medium text-gray-200">
                {role.title}
              </p>
            </div>
          ))}
        </div>

        {/* Roadmap Visualization */}
        {selectedRole && (
          <div 
            className={`
              max-w-4xl mx-auto mt-16 space-y-8
              transition-opacity duration-500
              ${fadeIn ? 'opacity-100' : 'opacity-0'}
            `}
          >
            {/* Roadmap Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-2">
                {selectedRoleTitle}
              </h2>
              <div className="h-1 w-24 mx-auto bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-6"></div>
              
              {/* AI Generation Button */}
              {!currentRoadmap && (
                <button
                  onClick={generateAIRoadmap}
                  disabled={generating}
                  className="btn-premium px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      🤖 Generate AI Roadmap
                    </>
                  )}
                </button>
              )}

              {/* Error Display */}
              {error && (
                <div className="mt-4 glass-card border-red-500/30 p-4 text-red-400">
                  {error}
                </div>
              )}

              {/* Generated Badge */}
              {generatedRoadmap && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 glass-card border-green-500/30">
                  <span className="text-green-400">✨ AI Generated</span>
                  <button
                    onClick={() => {
                      setGeneratedRoadmap(null);
                      setFadeIn(false);
                      setTimeout(() => setFadeIn(true), 150);
                    }}
                    className="text-xs text-gray-400 hover:text-gray-200"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>

            {currentRoadmap ? (
              /* Roadmap Sections */
              currentRoadmap.map((section: RoadmapSection, sectionIdx: number) => (
                <div key={sectionIdx} className="glass-card p-6">
                  <h3 className="text-xl font-semibold text-indigo-400 mb-6">
                    {section.title}
                  </h3>

                  {/* Vertical Timeline with Connector */}
                  <div className="relative border-l-2 border-[#1a1a2e] ml-3 pl-6 space-y-5">
                    {section.steps.map((step: string, stepIdx: number) => (
                      <div key={stepIdx} className="relative">
                        {/* Node Dot */}
                        <span className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-indigo-500 border-2 border-[#07070f]"></span>

                        {/* Step Card */}
                        <div className="bg-[#0a0a18] border border-[#1a1a2e] rounded-lg px-4 py-3 hover:border-indigo-500 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10">
                          <p className="text-gray-200 font-medium">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              /* Empty State */
              <div className="glass-card p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 mb-4">
                  <svg 
                    className="w-8 h-8 text-indigo-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Roadmap Coming Soon
                </h3>
                <p className="text-gray-400">
                  AI-generated roadmap will be available for this role soon.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Initial State Message */}
        {!selectedRole && (
          <div className="text-center mt-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-500/10 mb-4">
              <svg 
                className="w-10 h-10 text-purple-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" 
                />
              </svg>
            </div>
            <p className="text-xl text-gray-400">
              Select a role above to view your learning roadmap
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
