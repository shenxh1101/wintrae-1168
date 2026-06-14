import { UserProgress, Task, PracticeRecord } from '@/types';

export const userProgress: UserProgress = {
  totalPracticeDays: 28,
  totalPracticeHours: 35,
  streak: 7,
  masteredCount: 5,
  learningCount: 8,
  recentTasks: [
    {
      id: '1',
      title: '练习《黄河大合唱》第一乐章',
      type: 'practice',
      deadline: '2024-01-25',
      completed: true,
      repertoireId: '1',
    },
    {
      id: '2',
      title: '周五常规排练',
      type: 'rehearsal',
      deadline: '2024-01-26',
      completed: false,
    },
    {
      id: '3',
      title: '熟悉《茉莉花》和声部分',
      type: 'practice',
      deadline: '2024-01-27',
      completed: false,
      repertoireId: '3',
    },
    {
      id: '4',
      title: '新年音乐会彩排',
      type: 'rehearsal',
      deadline: '2024-01-28',
      completed: false,
    },
    {
      id: '5',
      title: '完成《天路》全曲练习',
      type: 'assignment',
      deadline: '2024-01-29',
      completed: false,
      repertoireId: '6',
    },
  ],
};

export const weeklyPracticeData = [
  { day: '周一', minutes: 45 },
  { day: '周二', minutes: 30 },
  { day: '周三', minutes: 60 },
  { day: '周四', minutes: 40 },
  { day: '周五', minutes: 90 },
  { day: '周六', minutes: 120 },
  { day: '周日', minutes: 60 },
];

export const recentPracticeRecords: PracticeRecord[] = [
  {
    id: '1',
    repertoireId: '1',
    date: '2024-01-24',
    duration: 45,
    part: '女高音',
  },
  {
    id: '2',
    repertoireId: '7',
    date: '2024-01-23',
    duration: 30,
    part: '女高音',
  },
  {
    id: '3',
    repertoireId: '2',
    date: '2024-01-22',
    duration: 25,
    part: '女高音',
  },
  {
    id: '4',
    repertoireId: '4',
    date: '2024-01-21',
    duration: 35,
    part: '女高音',
  },
  {
    id: '5',
    repertoireId: '3',
    date: '2024-01-20',
    duration: 50,
    part: '女高音',
  },
];

export const proficiencyLevels = [
  { label: '初学', value: 25, color: '#ef4444' },
  { label: '进阶', value: 50, color: '#f59e0b' },
  { label: '熟练', value: 75, color: '#3b82f6' },
  { label: '精通', value: 100, color: '#10b981' },
];
