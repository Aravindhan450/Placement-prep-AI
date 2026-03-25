/*
Create a React component called InsightsCard.

Props:
- readinessScore:number
- weakestTopic:string

Display:

- "Interview Readiness: XX%"
- "Focus Area: {weakestTopic}"

Add simple color logic:
<50 red
50–75 orange
>75 green

Minimal styling.
*/

interface InsightsCardProps {
  readinessScore: number;
  weakestTopic: string | null;
}

export default function InsightsCard({ readinessScore, weakestTopic }: InsightsCardProps) {
  // Determine color based on readiness score
  const getScoreColor = (score: number): string => {
    if (score < 50) return '#ef4444'; // red
    if (score <= 75) return '#f59e0b'; // orange
    return '#22c55e'; // green
  };

  const scoreColor = getScoreColor(readinessScore);

  return (
    <div style={styles.card}>
      <div style={styles.readinessRow}>
        <span style={styles.label}>Interview Readiness:</span>
        <span style={{ ...styles.score, color: scoreColor }}>
          {Math.round(readinessScore)}%
        </span>
      </div>
      
      {weakestTopic && (
        <div style={styles.focusRow}>
          <span style={styles.label}>Focus Area:</span>
          <span style={styles.topic}>{weakestTopic}</span>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    padding: '1.5rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  readinessRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  focusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '1rem',
    color: '#6b7280',
    fontWeight: '500',
  },
  score: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  topic: {
    fontSize: '1rem',
    color: '#1f2937',
    fontWeight: '600',
  },
};
