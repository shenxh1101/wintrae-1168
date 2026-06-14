import { Notification, ProblemReport } from '@/types';

export const notificationList: Notification[] = [
  {
    id: '1',
    title: '本周五排练时间调整通知',
    content: '各位团员好，本周五（1月26日）的排练时间由原来的19:00调整为18:30开始，请大家提前到达音乐厅A厅。本次排练将重点演练《黄河大合唱》的第四乐章，请大家做好准备。',
    type: 'notice',
    createdAt: '2024-01-24 10:30',
    isRead: false,
    priority: 'high',
  },
  {
    id: '2',
    title: '新年音乐会演出服装确认',
    content: '新年音乐会演出服装已准备就绪，请各位团员于本周三前到办公室试穿并确认尺寸。演出当天请提前一小时到场化妆。',
    type: 'notice',
    createdAt: '2024-01-23 14:20',
    isRead: true,
    priority: 'medium',
  },
  {
    id: '3',
    title: '关于寒假集训的安排',
    content: '寒假集训定于2月5日至2月10日，每天上午9:00-12:00，下午14:00-17:00。集训内容为新年音乐会曲目强化训练，请各位团员安排好时间准时参加。',
    type: 'notice',
    createdAt: '2024-01-22 09:00',
    isRead: true,
    priority: 'medium',
  },
  {
    id: '4',
    title: '系统升级通知',
    content: '系统将于今晚23:00-次日01:00进行升级维护，期间可能无法正常使用，请提前安排好练习计划。',
    type: 'system',
    createdAt: '2024-01-24 16:00',
    isRead: false,
    priority: 'low',
  },
];

export const problemReports: ProblemReport[] = [
  {
    id: '1',
    repertoireId: '1',
    part: '女高音',
    description: '《黄河大合唱》第二乐章高音部分比较难把握，希望能有更多的示范音频。',
    createdAt: '2024-01-20 15:30',
    status: 'replied',
    reply: '已收到您的反馈，我们会尽快补充相关的示范音频。建议先从慢速练习开始，逐步提高音准。',
  },
  {
    id: '2',
    repertoireId: '6',
    part: '女高音',
    description: '《天路》的转调部分总是唱不准，希望指挥能在排练时重点讲解。',
    createdAt: '2024-01-22 10:15',
    status: 'pending',
  },
];
