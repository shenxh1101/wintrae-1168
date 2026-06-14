import { PracticeRecord } from '@/types';

export const practiceRecords: PracticeRecord[] = [
  {
    id: '1',
    repertoireId: '1',
    date: '2024-01-20',
    duration: 45,
    part: '女高音',
    notes: '第一段落已经熟练，副歌部分还需要加强',
  },
  {
    id: '2',
    repertoireId: '2',
    date: '2024-01-21',
    duration: 30,
    part: '女高音',
  },
  {
    id: '3',
    repertoireId: '3',
    date: '2024-01-21',
    duration: 25,
    part: '女高音',
    notes: '转调部分需要多练习',
  },
  {
    id: '4',
    repertoireId: '4',
    date: '2024-01-22',
    duration: 35,
    part: '女高音',
  },
  {
    id: '5',
    repertoireId: '7',
    date: '2024-01-23',
    duration: 40,
    part: '女高音',
    notes: '和声部分进步很大',
  },
];

export const loopSegments = [
  { id: '1', name: '难点片段1', startTime: 30, endTime: 60 },
  { id: '2', name: '副歌部分', startTime: 90, endTime: 150 },
  { id: '3', name: '结尾高潮', startTime: 180, endTime: 240 },
];

export const speedOptions = [
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1, label: '1.0x' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
];
