/*
Create a React page component called Interview.

Goal:
Provide a minimal UI for the adaptive interview system.

Use:
useAdaptiveInterview hook from "../hooks/useAdaptiveInterview"

UI Requirements:
- Show current question
- Show difficulty label
- Textarea for answer input
- Submit button
- Loading indicator
- Display feedback after evaluation

Behavior:
- On mount → startInterview("recursion")
- Submit button calls submitAnswer()
- Disable button while loading

Style:
- Simple functional layout
- No external UI libraries
- Clean readable JSX

Generate complete React component in TypeScript.
*/

import { useEffect, useState } from 'react';
import { useAdaptiveInterview } from '../hooks/useAdaptiveInterview';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Interview() {
  const { user } = useAuth();
  const {
    question,
    difficulty,
    feedback,
    mentorInsight,
    loading,
    error,
    startInterview,
    submitAnswer,
  } = useAdaptiveInterview();

  const [answer, setAnswer] = useState<string>('');
  const [topic, setTopic] = useState<string>('recursion');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionState, setQuestionState] = useState<string>('');
  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const styleId = 'interview-syne-font';
    if (document.getElementById(styleId)) return;

    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;700;800&display=swap');
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleSheet);
  }, []);

  // Topics list
  const topics = [
    "recursion",
    "arrays",
    "linked list",
    "stack",
    "queue",
    "binary tree",
    "dynamic programming",
    "operating systems",
    "database management",
    "computer networks"
  ];

  // Generate question function - reads from state and calls edge function
  const generateQuestion = async () => {
    setLocalLoading(true);
    setLocalError(null);

    try {
      // Get access token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session - user must be logged in');
      }
      const accessToken = session.access_token;

      // Read topic and difficulty from state
      const topicValue = topic;
      const difficultyValue = selectedDifficulty;

      console.log('📡 Generating question...', { topic: topicValue, difficulty: difficultyValue });

      // Call edge function
      const { data, error: invokeError } = await supabase.functions.invoke('generate-question', {
        body: {
          topic: topicValue,
          difficulty: difficultyValue,
          accessToken,
        },
      });

      if (invokeError) {
        console.error('❌ generate-question error:', invokeError);
        throw new Error(`Failed to generate question: ${invokeError.message}`);
      }

      if (!data || !data.success) {
        console.error('❌ generate-question unsuccessful');
        throw new Error('Question generation failed');
      }

      console.log('✅ Question generated successfully:', data);

      // Save returned question into state
      setQuestionState(data.question);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate question';
      setLocalError(errorMessage);
      console.error('❌ Error generating question:', err);
    } finally {
      setLocalLoading(false);
    }
  };

  // Handle generate question button click
  const handleGenerateQuestion = async () => {
    await generateQuestion();
  };

  // Handle answer submission
  const handleSubmit = async () => {
    if (!answer.trim() || !user) return;

    await submitAnswer(answer, user.id, topic, selectedDifficulty);
    setAnswer(''); // Clear textarea after submission
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Adaptive Interview</h1>
        
        {/* Topic and Difficulty */}
        <div style={styles.infoBar}>
          {/* Topic Selector */}
          <div style={styles.difficultySelector}>
            <label style={styles.difficultyLabel}>Select Topic:</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              style={styles.difficultyDropdown}
            >
              {topics.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          
          {/* Difficulty Selector */}
          <div style={styles.difficultySelector}>
            <label style={styles.difficultyLabel}>Select Difficulty:</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              style={styles.difficultyDropdown}
            >
              <option value="easy">Easy</option>
              <option value="medium">Moderate</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Generate Question Button */}
        <button
          style={{
            ...styles.button,
            ...(!topic || !selectedDifficulty || !user || localLoading ? styles.buttonDisabled : {}),
            marginBottom: '1.5rem',
          }}
          onClick={handleGenerateQuestion}
          disabled={!topic || !selectedDifficulty || !user || localLoading}
        >
          {localLoading ? 'Generating...' : 'Generate Question'}
        </button>

        {/* Error Display */}
        {(error || localError) && (
          <div style={styles.error}>
            {localError || error}
          </div>
        )}

        {/* Feedback Display */}
        {feedback && (
          <div style={styles.feedback}>
            <strong>Feedback:</strong> {feedback}
          </div>
        )}

        {/* Mentor Insight Display */}
        {mentorInsight && (
          <div style={styles.mentorInsightCard}>
            <div style={styles.mentorInsightHeader}>
              <span style={styles.mentorInsightIcon}>🧠</span>
              <span style={styles.mentorInsightTitle}>Adaptive Mentor Insight</span>
            </div>
            <div style={styles.mentorInsightDivider}></div>
            <p style={styles.mentorInsightText}>{mentorInsight}</p>
          </div>
        )}

        {/* Question Display */}
        {questionState ? (
          <div style={styles.questionBox}>
            <h3 style={styles.questionLabel}>Question:</h3>
            <p style={styles.questionText}>{questionState}</p>
          </div>
        ) : (
          !localLoading && !localError && (
            <div style={styles.placeholder}>
              Click "Generate Question" above to get started.
            </div>
          )
        )}

        {/* Answer Input */}
        <div style={styles.inputSection}>
          <label style={styles.label} htmlFor="answer">
            Your Answer:
          </label>
          <textarea
            id="answer"
            style={styles.textarea}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            rows={6}
            disabled={loading || localLoading || !questionState}
          />
        </div>

        {/* Submit Button */}
        <button
          style={{
            ...styles.button,
            ...(loading || localLoading || !answer.trim() || !user ? styles.buttonDisabled : {}),
          }}
          onClick={handleSubmit}
          disabled={loading || localLoading || !answer.trim() || !user}
        >
          {loading ? 'Processing...' : 'Submit Answer'}
        </button>

        {/* Loading Indicator */}
        {(loading || localLoading) && (
          <div style={styles.loadingBar}>
            <div style={styles.spinner}></div>
            <span>Loading...</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function for difficulty badge colors
function getDifficultyColor(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return '#22c55e';
    case 'medium':
      return '#f59e0b';
    case 'hard':
      return '#ef4444';
    default:
      return '#6b7280';
  }
}

// Simple inline styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    padding: '2rem',
    backgroundColor: 'transparent',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    fontFamily: "'Syne', sans-serif",
  },
  card: {
    maxWidth: '800px',
    width: '100%',
    backgroundColor: '#0a0a18',
    borderRadius: '12px',
    border: '1px solid #1a1a2e',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
    padding: '2rem',
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontSize: '2.625rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    marginBottom: '1.5rem',
    color: '#e2e2f0',
  },
  infoBar: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  badge: {
    padding: '0.375rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: '#3b82f6',
    color: 'white',
  },
  difficultySelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  difficultyLabel: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#9ca3af',
  },
  difficultyDropdown: {
    padding: '0.375rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: '#0f1121',
    color: '#e2e2f0',
    border: '1px solid #1a1a2e',
    cursor: 'pointer',
    outline: 'none',
  },
  error: {
    padding: '0.75rem',
    marginBottom: '1rem',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '4px',
    fontSize: '0.875rem',
  },
  feedback: {
    padding: '1rem',
    marginBottom: '1.5rem',
    backgroundColor: '#17255466',
    color: '#93c5fd',
    borderRadius: '4px',
    fontSize: '0.95rem',
  },
  mentorInsightCard: {
    padding: '1.25rem',
    marginBottom: '1.5rem',
    backgroundColor: '#f0fdf4',
    borderRadius: '8px',
    border: '1px solid #bbf7d0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  mentorInsightHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  mentorInsightIcon: {
    fontSize: '1.25rem',
  },
  mentorInsightTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#166534',
    letterSpacing: '0.01em',
  },
  mentorInsightDivider: {
    height: '1px',
    backgroundColor: '#bbf7d0',
    marginBottom: '0.75rem',
  },
  mentorInsightText: {
    fontSize: '0.95rem',
    lineHeight: '1.6',
    color: '#15803d',
    margin: 0,
  },
  questionBox: {
    padding: '1.5rem',
    marginBottom: '1.5rem',
    backgroundColor: '#0f1121',
    borderRadius: '6px',
    borderLeft: '4px solid #6366f1',
    border: '1px solid #1a1a2e',
  },
  questionLabel: {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: '#9ca3af',
  },
  questionText: {
    fontSize: '1rem',
    lineHeight: '1.6',
    color: '#e2e2f0',
    margin: 0,
  },
  placeholder: {
    padding: '2rem',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '0.95rem',
  },
  inputSection: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    fontSize: '0.95rem',
    fontWeight: '500',
    marginBottom: '0.5rem',
    color: '#9ca3af',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '0.95rem',
    lineHeight: '1.5',
    backgroundColor: '#0f1121',
    color: '#e2e2f0',
    border: '1px solid #1a1a2e',
    borderRadius: '4px',
    resize: 'vertical',
    fontFamily: 'inherit',
    outline: 'none',
  },
  button: {
    width: '100%',
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
  },
  loadingBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    marginTop: '1rem',
    padding: '0.75rem',
    color: '#6b7280',
    fontSize: '0.875rem',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #e5e7eb',
    borderTop: '2px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
