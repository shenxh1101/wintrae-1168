import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Taro from '@tarojs/taro';
import { Rehearsal, Notification, ProblemReport, Task, PracticeRecord } from '@/types';

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
  addProblemReport: (report: Omit<ProblemReport, 'id' | 'createdAt' | 'status'>) => void;
  updateProblemStatus: (reportId: string, status: ProblemReport['status'], reply?: string) => void;

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
  addPracticeRecord: (record: Omit<PracticeRecord, 'id'>) => void;
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
      addProblemReport: (report) => {
        const newReport: ProblemReport = {
          ...report,
          id: `report-${Date.now()}`,
          createdAt: new Date().toLocaleString('zh-CN'),
          status: 'pending',
        };
        set((state) => ({
          problemReports: [newReport, ...state.problemReports],
        }));
      },
      updateProblemStatus: (reportId, status, reply) =>
        set((state) => ({
          problemReports: state.problemReports.map((r) =>
            r.id === reportId
              ? {
                  ...r,
                  status,
                  replyContent: reply || r.replyContent,
                  replyTime: new Date().toLocaleString('zh-CN'),
                }
              : r
          ),
        })),

      // ===== 个人进度 =====
      checkInDates: [],
      addCheckIn: (date) =>
        set((state) => {
          if (state.checkInDates.includes(date)) return state;
          const newDates = [...state.checkInDates, date].sort();
          // 计算连续打卡
          let streak = 0;
          const today = new Date(date);
          for (let i = 0; i < newDates.length; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];
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
      addPracticeRecord: (record) => {
        const newRecord: PracticeRecord = {
          ...record,
          id: `practice-${Date.now()}`,
        };
        set((state) => ({
          practiceRecords: [newRecord, ...state.practiceRecords],
        }));
      },
    }),
    {
      name: 'choir-app-storage',
      storage: createJSONStorage(() => TaroStorage),
    }
  )
);
