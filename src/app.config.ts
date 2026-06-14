export default defineAppConfig({
  pages: [
    'pages/repertoire/index',
    'pages/schedule/index',
    'pages/practice/index',
    'pages/notification/index',
    'pages/progress/index',
    'pages/repertoire-detail/index',
    'pages/schedule-detail/index',
    'pages/practice-detail/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '合唱团',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f8fafc',
  },
  tabBar: {
    color: '#94a3b8',
    selectedColor: '#6366f1',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/repertoire/index',
        text: '曲目库',
      },
      {
        pagePath: 'pages/schedule/index',
        text: '排练日程',
      },
      {
        pagePath: 'pages/practice/index',
        text: '分声部练习',
      },
      {
        pagePath: 'pages/notification/index',
        text: '通知反馈',
      },
      {
        pagePath: 'pages/progress/index',
        text: '个人进度',
      },
    ],
  },
})
