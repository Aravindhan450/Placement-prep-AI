export type InterviewStage =
  | "select"
  | "question"
  | "feedback"
  | "summary";

export interface QuestionData {
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
}

export interface Evaluation {
  correctness: number;
  concept_depth: number;
  confidence: number;
  clarity: number;
  feedback: string;
}

export interface InterviewSession {
  topic: string;
  questionIndex: number; // 0 -> 9
  totalQuestions: number; // always 10
  sessionId: string;
}
