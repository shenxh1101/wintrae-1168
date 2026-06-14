import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Taro from '@tarojs/taro';
import {
  Rehearsal,
  Notification,
  ProblemReport,
  Task,
  PracticeRecord,
  FeedbackMessage,
  VoicePart,
  DifficultSegment,
} from '@/types';

interface ChoirStore {
  // ===== 排练状态 =====
  rehearsals: (Rehearsal & { leaveReason?: string })[];
  setRehearsals: (rehearsals: (Rehearsal & { leaveReason?: string })[]) => void;
  signIn: (rehearsalId: string) => void;
  submitLeave: (rehearsalId: string, reason: string) => void;

  // ===== 通知状态 =====
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;

  // ===== 问题反馈 =====
  problemReports: ProblemReport[];
  setProblemReports: (reports: ProblemReport[]) => void;
  addProblemReport: (report: Omit<ProblemReport, 'id' | 'createdAt' | 'status' | 'messages'>) => void;
  updateProblemStatus: (
    reportId: string,
    status: ProblemReport['status'],
    reply?: string,
    conductorNote?: string
  ) => void;
  addFeedbackMessage: (
    reportId: string,
    role: FeedbackMessage['role'],
    content: string,
    statusNote?: string
  ) => void;

  // ===== 个人进度 =====
  checkInDates: string[];
  addCheckIn: (date: string) => void;
  streak: number;
  totalPracticeDays: number;
  totalPracticeHours: number;

  // ===== 熟练度 =====
  repertoireProficiencies: Record<string, number>;
  setProficiency: (repertoireId: string, value: number) => void;
  incrementProficiency: (repertoireId: string, delta: number) => void;

  // ===== 任务 =====
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  toggleTask: (taskId: string) => void;
  addTask: (task: Omit<Task, 'id' | 'completed'>) => void;

  // ===== 练习记录 =====
  practiceRecords: PracticeRecord[];
  setPracticeRecords: (records: PracticeRecord[]) => void;
  addPracticeRecord: (
    record: Omit<PracticeRecord, 'id' | 'createdAt' | 'date'> & {
      date?: string;
    }
  ) => void;
}

const TaroStorage = {
  getItem: (name: string) => {
    try {
      return Promise.resolve(Taro.getStorageSync(name) || null);
    } catch {
      return Promise.resolve(null);
    }
  },
  setItem: (name: string, value: string) => {
    try {
      Taro.setStorageSync(name, value);
      return Promise.resolve();
    } catch {
      return Promise.resolve();
    }
  },
  removeItem: (name: string) => {
    try {
      Taro.removeStorageSync(name);
      return Promise.resolve();
    } catch {
      return Promise.resolve();
    }
  },
};

const todayStr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const useChoirStore = create<ChoirStore>()(
  persist(
    (set, get) => ({
      // ===== 排练状态 =====
      rehearsals: [],
      setRehearsals: (rehearsals) => set({ rehearsals }),
      signIn: (rehearsalId) =>
        set((state) => ({
          rehearsals: state.rehearsals.map((r) =>
            r.id === rehearsalId ? { ...r, signedIn: true } : r
          ),
        })),
      submitLeave: (rehearsalId, reason) =>
        set((state) => ({
          rehearsals: state.rehearsals.map((r) =>
            r.id === rehearsalId ? { ...r, leaveApplied: true, leaveReason: reason } : r
          ),
        })),

      // ===== 通知状态 =====
      notifications: [],
      setNotifications: (notifications) => set({ notifications }),
      markAsRead: (notificationId) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          ),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        })),

      // ===== 问题反馈 =====
      problemReports: [],
      setProblemReports: (problemReports) => set({ problemReports }),
      addProblemReport: (report) => {
        const initialMessage: FeedbackMessage = {
          id: `msg-${Date.now()}-init`,
          role: 'member',
          content: report.content,
          createdAt: new Date().toLocaleString('zh-CN'),
          statusNote: '提交反馈，等待处理',
        };
        const systemMessage: FeedbackMessage = {
          id: `msg-${Date.now()}-sys`,
          role: 'system',
          content: '已通知指挥处理，通常会在24小时内回复',
          createdAt: new Date().toLocaleString('zh-CN'),
          statusNote: '状态变更：待回复',
        };
        const newReport: ProblemReport = {
          ...report,
          id: `report-${Date.now()}`,
          createdAt: new Date().toLocaleString('zh-CN'),
          status: 'pending',
          messages: [initialMessage, systemMessage],
        };
        set((state) => ({
          problemReports: [newReport, ...state.problemReports],
        }));
      },
      updateProblemStatus: (reportId, status, reply, conductorNote) =>
        set((state) => ({
          problemReports: state.problemReports.map((r) => {
            if (r.id !== reportId) return r;
            const nextMessages: FeedbackMessage[] = [...r.messages];
            if (reply) {
              nextMessages.push({
                id: `msg-${Date.now()}-rep`,
                role: 'conductor',
                content: reply,
                createdAt: new Date().toLocaleString('zh-CN'),
                statusNote: conductorNote,
              });
            }
            const statusMap: Record<ProblemReport['status'], string> = {
              pending: '待指挥回复',
              replied: '指挥已回复，等待成员确认',
              resolved: '问题已解决，已结案',
              escalated: '已升级，等待处理方案',
            };
            nextMessages.push({
              id: `msg-${Date.now()}-status`,
              role: 'system',
              content: conductorNote || statusMap[status],
              createdAt: new Date().toLocaleString('zh-CN'),
              statusNote: `状态变更：${statusMap[status]}`,
            });
            return {
              ...r,
              status,
              replyContent: reply || r.replyContent,
              replyTime: new Date().toLocaleString('zh-CN'),
              resolution: status === 'resolved' ? reply || conductorNote : r.resolution,
              messages: nextMessages,
            };
          }),
        })),
      addFeedbackMessage: (reportId, role, content, statusNote) =>
        set((state) => ({
          problemReports: state.problemReports.map((r) => {
            if (r.id !== reportId) return r;
            const msg: FeedbackMessage = {
              id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              role,
              content,
              createdAt: new Date().toLocaleString('zh-CN'),
              statusNote,
            };
            const autoStatus =
              role === 'member' && r.status === 'replied' ? 'replied' : r.status;
            return {
              ...r,
              messages: [...r.messages, msg],
              status: autoStatus,
            };
          }),
        })),

      // ===== 个人进度 =====
      checkInDates: [],
      addCheckIn: (date) =>
        set((state) => {
          if (state.checkInDates.includes(date)) return state;
          const newDates = [...state.checkInDates, date].sort();
          let streak = 0;
          const today = new Date(date);
          for (let i = 0; i < newDates.length; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = todayStr(checkDate);
            if (newDates.includes(dateStr)) {
              streak++;
            } else {
              break;
            }
          }
          return {
            checkInDates: newDates,
            streak,
            totalPracticeDays: newDates.length,
          };
        }),
      streak: 0,
      totalPracticeDays: 0,
      totalPracticeHours: 0,

      // ===== 熟练度 =====
      repertoireProficiencies: {},
      setProficiency: (repertoireId, value) =>
        set((state) => ({
          repertoireProficiencies: {
            ...state.repertoireProficiencies,
            [repertoireId]: Math.max(0, Math.min(100, value)),
          },
        })),
      incrementProficiency: (repertoireId, delta) =>
        set((state) => ({
          repertoireProficiencies: {
            ...state.repertoireProficiencies,
            [repertoireId]: Math.max(
              0,
              Math.min(100, (state.repertoireProficiencies[repertoireId] || 0) + delta)
            ),
          },
          totalPracticeHours: state.totalPracticeHours + delta / 60,
        })),

      // ===== 任务 =====
      tasks: [],
      setTasks: (tasks) => set({ tasks }),
      toggleTask: (taskId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          ),
        })),
      addTask: (task) => {
        const newTask: Task = {
          ...task,
          id: `task-${Date.now()}`,
          completed: false,
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },

      // ===== 练习记录 =====
      practiceRecords: [],
      setPracticeRecords: (practiceRecords) => set({ practiceRecords }),
      addPracticeRecord: (record) => {
        const now = new Date();
        const dateVal = record.date || todayStr(now);
        const proficiencyDelta =
          record.proficiencyDelta || Math.max(1, Math.ceil(record.durationMinutes / 5));
        const newRecord: PracticeRecord = {
          ...record,
          date: dateVal,
          id: `practice-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: now.toLocaleString('zh-CN'),
          proficiencyDelta,
          voicePart: record.voicePart || 'full',
          speed: record.speed || 1,
        };
        set((state) => {
          const checkInDates = state.checkInDates.includes(dateVal)
            ? state.checkInDates
            : [...state.checkInDates, dateVal].sort();
          let streak = 0;
          const today = new Date(dateVal);
          for (let i = 0; i < checkInDates.length; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const ds = todayStr(checkDate);
            if (checkInDates.includes(ds)) streak++;
            else break;
          }
          const newProfs = { ...state.repertoireProficiencies };
          newProfs[newRecord.repertoireId] = Math.max(
            0,
            Math.min(100, (newProfs[newRecord.repertoireId] || 0) + proficiencyDelta)
          );
          return {
            practiceRecords: [newRecord, ...state.practiceRecords],
            totalPracticeDays: checkInDates.length,
            streak,
            checkInDates,
            totalPracticeHours:
              state.totalPracticeHours + newRecord.durationMinutes / 60,
            repertoireProficiencies: newProfs,
          };
        });
      },
    }),
    {
      name: 'choir-app-storage',
      storage: createJSONStorage(() => TaroStorage),
    }
  )
);

export function groupPracticeRecordsByRepertoire(
  records: PracticeRecord[],
  repertoireId: string
) {
  return records.filter((r) => r.repertoireId === repertoireId);
}

export function groupPracticeRecordsByVoicePart(records: PracticeRecord[]) {
  const map: Record<VoicePart, PracticeRecord[]> = {
    soprano: [],
    alto: [],
    tenor: [],
    bass: [],
    full: [],
  };
  records.forEach((r) => {
    if (map[r.voicePart]) map[r.voicePart].push(r);
  });
  return map;
}

export function aggregateDifficultSegments(records: PracticeRecord[]) {
  const agg: Record<string, DifficultSegment & { _count: number }> = {};
  records.forEach((r) => {
    (r.difficultSegments || []).forEach((seg) => {
      if (!agg[seg.id]) {
        agg[seg.id] = { ...seg, _count: 0 };
      }
      agg[seg.id]._count += 1;
      agg[seg.id].occurredCount = agg[seg.id]._count;
    });
  });
  return Object.values(agg).sort((a, b) => b._count - a._count);
}
