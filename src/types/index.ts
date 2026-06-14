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
  parts: VoicePart[];
  proficiency?: number;
  lastPracticed?: string;
}

export interface VoicePart {
  id: string;
  name: string;
  type: 'soprano' | 'alto' | 'tenor' | 'bass';
  audioUrl: string;
}

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

export interface PracticeRecord {
  id: string;
  repertoireId: string;
  date: string;
  duration: number;
  part?: string;
  notes?: string;
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
  type: 'practice' | 'rehearsal' | 'assignment';
  deadline: string;
  completed: boolean;
  repertoireId?: string;
}

export interface ProblemReport {
  id: string;
  repertoireId: string;
  part?: string;
  description: string;
  createdAt: string;
  status: 'pending' | 'replied' | 'resolved';
  reply?: string;
}
