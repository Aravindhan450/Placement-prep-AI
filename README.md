# PlacementPrep AI - College Placement Preparation Platform

A comprehensive, AI-powered web application designed to help college students prepare for placements with three core features: AI Chat Assistant, Career Roadmaps, and AI Resume Editor.

## 🚀 Features

### 1. AI Placement Chat Assistant
- **Real-time AI conversations** powered by Claude API
- Specialized in placement preparation topics:
  - Technical interview preparation
  - Company-specific insights
  - HR and behavioral interview questions
  - Aptitude and reasoning practice
  - Career guidance and salary negotiation
- **Conversation history** with multiple chat sessions
- **Suggested prompts** for quick questions
- **Persistent storage** of all chat sessions

### 2. Career Roadmaps
- **7 Pre-built career paths**:
  - Software Developer
  - Data Scientist
  - Product Manager
  - Business Analyst
  - Mechanical Engineer
  - Management Consultant
  - Finance Analyst
- **Interactive skill tracking** with three states:
  - Not started (gray)
  - Learning (yellow)
  - Completed (green)
- **Skill categorization** by difficulty level:
  - Beginner
  - Intermediate
  - Advanced
- **Learning resources** with curated links
- **Project ideas** for hands-on practice
- **Progress tracking** with visual progress bar
- **Search and filter** functionality

### 3. AI Resume Editor & Analyzer
- **Split-screen interface**:
  - Left: Resume editor with structured form
  - Right: Job description input and AI analysis
- **AI-powered analysis**:
  - Match score (0-100%)
  - Missing keywords identification
  - Section-by-section recommendations
  - ATS optimization tips
- **Multiple resume versions** support
- **Three professional templates**:
  - Professional
  - Modern
  - Minimal
- **PDF export** functionality
- **Real-time editing** with auto-save

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **jsPDF** for PDF generation

### Backend
- **Convex** for database and real-time backend
- **Convex Auth** for authentication
- **Claude API (Anthropic)** for AI features

### Key Libraries
- `react-router-dom` - Client-side routing
- `lucide-react` - Icon library
- `jspdf` - PDF generation
- `sonner` - Toast notifications

## 📦 Database Schema

### Tables

#### `chatSessions`
- `userId`: Reference to authenticated user
- `title`: Session name
- `messages`: Array of message objects with role, content, and timestamp

#### `roadmaps`
- `roleName`: Career role name
- `description`: Role description
- `skills`: Array of skill objects (name, level, category)
- `resources`: Array of learning resources
- `timeline`: Expected completion time
- `prerequisites`: Required knowledge
- `projectIdeas`: Suggested projects

#### `userProgress`
- `userId`: Reference to user
- `roadmapId`: Reference to roadmap
- `completedSkills`: Array of completed skill names
- `learningSkills`: Array of in-progress skill names

#### `resumes`
- `userId`: Reference to user
- `title`: Resume name
- `content`: Structured resume data (personal info, summary, education, experience, skills, projects)
- `jobDescription`: Optional JD for analysis
- `analysis`: AI analysis results (match score, missing keywords, suggestions)
- `template`: Selected template style
- `version`: Version number

## 🎨 Features in Detail

### Dark Mode
- System-wide dark mode toggle
- Persistent preference storage
- Smooth transitions between themes

### Responsive Design
- Mobile-first approach
- Hamburger menu for mobile navigation
- Adaptive layouts for all screen sizes

### Authentication
- Username/password authentication via Convex Auth
- Protected routes
- User-specific data isolation

### AI Integration
- Claude 3.5 Sonnet model
- Specialized system prompts for each use case
- Error handling and rate limiting
- Streaming responses for chat

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ installed
- Anthropic API key

### Installation

1. The application is already set up with all dependencies installed

2. **Set up Anthropic API Key**:
   - Open the Convex dashboard (link provided after deployment)
   - Navigate to Settings → Environment Variables
   - Add `ANTHROPIC_API_KEY` with your Anthropic API key
   - Get your API key from: https://console.anthropic.com/

3. **The app is ready to use!**
   - Sign up with a username and password
   - Start exploring the three main features

## 📱 Usage Guide

### AI Chat Assistant
1. Click "New Chat" to start a conversation
2. Type your question or select a suggested prompt
3. Get instant AI-powered responses
4. Switch between multiple chat sessions
5. Delete old conversations as needed

### Career Roadmaps
1. Select a career role from the sidebar
2. View the complete learning path
3. Click on skills to mark as "learning" or "completed"
4. Track your progress with the progress bar
5. Access curated learning resources
6. Get project ideas for practice

### Resume Editor
1. Click "New Resume" to create a resume
2. Fill in your personal information, education, experience, skills, and projects
3. Paste a job description in the right panel
4. Click "Analyze Resume" to get AI feedback
5. Review match score, missing keywords, and suggestions
6. Make improvements based on recommendations
7. Download as PDF when ready

## 🔒 Security & Privacy

- All user data is isolated and secure
- Authentication required for all features
- API keys stored as environment variables
- No data sharing between users

## 🎯 Best Practices

### For Chat
- Be specific with your questions
- Reference your target companies or roles
- Ask for examples and practice problems

### For Roadmaps
- Start with beginner skills
- Mark skills as "learning" when you start
- Complete projects to solidify knowledge
- Update progress regularly

### For Resume
- Keep resume content concise and impactful
- Use action verbs in experience descriptions
- Tailor resume for each job application
- Review AI suggestions carefully
- Test with multiple job descriptions

## 🐛 Troubleshooting

### AI Features Not Working
- Ensure `ANTHROPIC_API_KEY` is set in environment variables
- Check API key is valid and has credits
- Verify internet connection

### Data Not Loading
- Refresh the page
- Check authentication status
- Clear browser cache if needed

### PDF Download Issues
- Ensure all required fields are filled
- Try a different browser
- Check browser's download settings

## 🚀 Future Enhancements

Potential features for future versions:
- Interview scheduling and reminders
- Mock interview practice with AI
- Peer resume review system
- Company-specific preparation guides
- Salary comparison tools
- Placement statistics dashboard
- Email notifications for progress milestones
- Export roadmap progress as PDF
- Resume templates with more customization
- Integration with LinkedIn

## 📄 License

This project is built for educational purposes.

## 🤝 Support

For issues or questions:
- Check the troubleshooting section
- Review Convex documentation: https://docs.convex.dev
- Contact support at the Convex dashboard

---

**Built with ❤️ using Convex, React, and Claude AI**
