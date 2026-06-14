import { Notification, ProblemReport, FeedbackMessage } from '@/types';

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

const msgInit = (id: string, content: string, createdAt: string, hasReply: boolean, reply?: string): FeedbackMessage[] => {
  const arr: FeedbackMessage[] = [
    {
      id: `msg-${id}-init`,
      role: 'member',
      content,
      createdAt,
      statusNote: '提交反馈，等待处理',
    },
    {
      id: `msg-${id}-sys1`,
      role: 'system',
      content: '已通知指挥处理，通常会在24小时内回复',
      createdAt,
      statusNote: '状态变更：待回复',
    },
  ];
  if (hasReply && reply) {
    arr.push({
      id: `msg-${id}-rep`,
      role: 'conductor',
      content: reply,
      createdAt: '2024-01-21 09:10',
      statusNote: '指挥已查看并给出处理建议',
    });
    arr.push({
      id: `msg-${id}-sys2`,
      role: 'system',
      content: '指挥已回复，建议查看后继续练习确认问题是否解决',
      createdAt: '2024-01-21 09:10',
      statusNote: '状态变更：指挥已回复，等待成员确认',
    });
  }
  return arr;
};

export const problemReports: ProblemReport[] = [
  {
    id: 'demo-1',
    repertoireId: '1',
    voicePart: 'soprano',
    content:
      '《黄河大合唱》第二乐章的高音部分比较难把握，练习时总是破音，希望有更慢速的示范音频，以及详细的气息控制说明。',
    createdAt: '2024-01-20 15:30',
    status: 'replied',
    replyContent:
      '已收到您的反馈，建议按以下步骤练习：\n1. 先用 0.6x 慢速单独练女高音声部，找到换声点\n2. 高音前注意提前偷气，横膈膜保持支撑\n3. 明日排练时我会让大家单独演唱这一段，现场一对一指导\n\n示范音频我会在今晚上传到服务器，注意查收。',
    replyTime: '2024-01-21 09:10',
    messages: msgInit(
      '1',
      '《黄河大合唱》第二乐章的高音部分比较难把握，练习时总是破音，希望有更慢速的示范音频，以及详细的气息控制说明。',
      '2024-01-20 15:30',
      true,
      '已收到您的反馈，建议按以下步骤练习：\n1. 先用 0.6x 慢速单独练女高音声部，找到换声点\n2. 高音前注意提前偷气，横膈膜保持支撑\n3. 明日排练时我会让大家单独演唱这一段，现场一对一指导\n\n示范音频我会在今晚上传到服务器，注意查收。'
    ),
  },
  {
    id: 'demo-2',
    repertoireId: '6',
    voicePart: 'soprano',
    content:
      '《天路》的转调部分（第37小节起）总是唱不准，跟其他声部合的时候容易跑调，希望指挥能在排练时重点讲解这个转调的技巧。',
    createdAt: '2024-01-22 10:15',
    status: 'pending',
    messages: msgInit(
      '2',
      '《天路》的转调部分（第37小节起）总是唱不准，跟其他声部合的时候容易跑调，希望指挥能在排练时重点讲解这个转调的技巧。',
      '2024-01-22 10:15',
      false
    ),
  },
];
