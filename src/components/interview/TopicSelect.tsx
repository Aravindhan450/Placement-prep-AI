import { useNavigate } from "react-router-dom";
import { TOPICS } from '../../data/topics';
import type { InterviewSession } from '../../types/interview';

export default function TopicSelect() {
  const navigate = useNavigate();

  const handleTopicSelect = (topicId: string) => {
    const session: InterviewSession = {
      topic: topicId,
      questionIndex: 0,
      totalQuestions: 10,
      sessionId: crypto.randomUUID(),
    };

    localStorage.setItem("activeInterviewSession", JSON.stringify(session));
    navigate("/practice");
  };

  return (
    <div className="min-h-screen py-16 px-4">
      {/* Hero Section */}
      <section className="text-center pt-12 pb-8">
        <span className="text-xs tracking-widest text-indigo-400 uppercase font-semibold">
          Adaptive Intelligence Engine
        </span>
        
        <h1 className="text-5xl md:text-6xl font-extrabold mt-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Choose your battle ground.
        </h1>
        
        <p className="text-gray-400 mt-4 max-w-md mx-auto text-lg">
          AI adapts question difficulty automatically based on your performance.
        </p>
      </section>

      {/* Topic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-14">
        {TOPICS.map((topic) => (
          <div
            key={topic.id}
            onClick={() => handleTopicSelect(topic.id)}
            className="glass-card ai-hover cursor-pointer p-6 group"
          >
            <div className="text-3xl mb-3 opacity-80 group-hover:scale-110 transition duration-300">
              {topic.icon}
            </div>
            
            <h3 className="font-semibold text-lg text-white">
              {topic.title}
            </h3>
            
            <p className="text-sm text-gray-400 mt-1">
              {topic.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Info Banner */}
      <div className="max-w-4xl mx-auto mt-12">
        <div className="glass-card p-4 text-center border-indigo-500/30">
          <p className="text-sm text-gray-400">
            💡 <span className="text-indigo-400 font-semibold">Adaptive Mode:</span> Questions adapt to your skill level automatically
          </p>
        </div>
      </div>
    </div>
  );
}
