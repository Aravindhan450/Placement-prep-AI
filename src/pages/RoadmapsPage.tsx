/*
This roadmap feature will be rebuilt using adaptive learning data.

Goal:
Replace this file with a placeholder component
so project compiles without legacy dependencies.

Requirements:
- React functional component named RoadmapsPage
- Display text:
  "Adaptive roadmap coming soon"
- No useAuth
- No supabase
- No API calls
- Minimal JSX
- Export default component

Generate complete safe file.
*/

export default function RoadmapsPage() {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Career Roadmaps</h1>
        <p style={styles.message}>Adaptive roadmap coming soon</p>
        <p style={styles.submessage}>
          This feature is being rebuilt with adaptive learning technology.
        </p>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    padding: '2rem',
  },
  content: {
    textAlign: 'center',
    maxWidth: '600px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '1rem',
  },
  message: {
    fontSize: '1.25rem',
    color: '#6b7280',
    marginBottom: '0.5rem',
  },
  submessage: {
    fontSize: '1rem',
    color: '#9ca3af',
  },
};
