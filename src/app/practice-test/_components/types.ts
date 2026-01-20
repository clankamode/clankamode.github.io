export interface QuestionBankRow {
  question_number: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: string;
  rationale: string;
}

export interface IncorrectAnswer {
  questionNumber: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  userAnswer: string;
  correctAnswer: string;
  rationale: string;
  unit: string;
  knowledgeArea: string;
}

export interface SessionData {
  sessionId: string;
  answeredQuestions: number[];
  totalQuestions: number;
  allowedQuestionNumbers?: number[];
  isRetakeOfIncorrect?: boolean;
}

export interface NewSessionData {
  sessionId: string;
  allowedQuestionNumbers: number[];
  isRetakeOfIncorrect: boolean;
}

export interface UnitBreakdown {
  unit: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface TestResults {
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  incorrectAnswers: IncorrectAnswer[];
  unitBreakdown: UnitBreakdown[];
}

export interface SessionListItem {
  id: string;
  started_at: string;
  completed_at: string | null;
  total_questions: number;
  correct_answers: number | null;
  score_percentage: number | null;
}

export interface SessionList {
  incomplete: SessionListItem[];
  completed: SessionListItem[];
}

export type TestState = 'session-list' | 'loading' | 'answering' | 'completing' | 'results';
