
export enum LiteracyLevel {
  NEW = 'New',
  INTERMEDIATE = 'Intermediate',
  EXPERIENCED = 'Experienced',
  MASTER = 'Master',
}

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
}

export interface CustomQuestion extends Question {
  createdAt: number;
}

export interface QuizResult {
  level: LiteracyLevel;
  feedback: string;
  score: number; // 0-100 concept
}

export interface UserAnswer {
  questionId: string;
  questionText: string;
  selectedOptionText: string;
}

export interface SupportTicket {
  id: string;
  userName: string;
  question: string;
  answer: string | null;
  timestamp: number;
  status: 'pending' | 'resolved';
}

export interface Visitor {
  username: string;
  lastSeen: number;
}

export interface UserProfile {
  email: string;
  name: string;
  totalPoints: number;
  joinedAt: number;
}

export interface ScreenTimeLog {
  id: string;
  email: string;
  dateStr: string; // YYYY-MM-DD
  hours: number;
  points: number;
  timestamp: number;
  imageBase64?: string; // For admin review
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export type AppState = 'WELCOME' | 'LOADING_QUIZ' | 'QUIZ' | 'ANALYZING' | 'RESULT' | 'ERROR' | 'ADMIN_MODE' | 'ADMIN_AUTH' | 'DIGITAL_DETOX';
