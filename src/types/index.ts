export interface Repertoire {
  id: string;
  title: string;
  composer: string;
  category: string;
  difficulty: number;
  cover: string;
  description: string;
  duration: string;
  pages: number;
  audioUrl?: string;
  parts: VoicePartDetail[];
  proficiency?: number;
  lastPracticed?: string;
}

export interface VoicePartDetail {
  id: string;
  name: string;
  type: VoicePart;
  audioUrl: string;
}

export type VoicePart = 'soprano' | 'alto' | 'tenor' | 'bass' | 'full';

export interface Rehearsal {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  conductor: string;
  repertoireIds: string[];
  status: 'upcoming' | 'ongoing' | 'completed';
  signedIn?: boolean;
  leaveApplied?: boolean;
  leaveReason?: string;
  seatMapUrl?: string;
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'notice' | 'feedback' | 'system';
  createdAt: string;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface DifficultSegment {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  occurredCount?: number;
}

export interface PracticeRecord {
  id: string;
  repertoireId: string;
  date: string;
  durationMinutes: number;
  voicePart: VoicePart;
  speed: number;
  loopSegments?: string[];
  difficultSegments?: DifficultSegment[];
  notes?: string;
  proficiencyDelta?: number;
  createdAt: string;
}

export interface UserProgress {
  totalPracticeDays: number;
  totalPracticeHours: number;
  streak: number;
  masteredCount: number;
  learningCount: number;
  recentTasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  type: '练习' | '排练' | '作业';
  dueDate: string;
  completed: boolean;
  repertoireId?: string;
}

export type FeedbackMessageRole = 'member' | 'conductor' | 'system';

export interface FeedbackMessage {
  id: string;
  role: FeedbackMessageRole;
  content: string;
  createdAt: string;
  statusNote?: string;
}

export interface ProblemReport {
  id: string;
  repertoireId: string;
  voicePart: VoicePart;
  content: string;
  createdAt: string;
  status: 'pending' | 'replied' | 'resolved' | 'escalated';
  messages: FeedbackMessage[];
  replyContent?: string;
  replyTime?: string;
  resolution?: string;
  tags?: string[];
}
