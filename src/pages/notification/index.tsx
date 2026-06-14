import React, { useState } from 'react';
import { View, Text, Input, Textarea, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import NotificationItem from '@/components/NotificationItem';
import { notificationList, problemReports } from '@/data/notification';
import { repertoireList } from '@/data/repertoire';
import { Notification, ProblemReport } from '@/types';
import classnames from 'classnames';

type TabType = 'notice' | 'feedback';

const NotificationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('notice');
  const [notifications, setNotifications] = useState<Notification[]>(notificationList);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportRepertoire, setReportRepertoire] = useState('');
  const [reportPart, setReportPart] = useState('女高音');
  const [reportContent, setReportContent] = useState('');
  const [reports, setReports] = useState<ProblemReport[]>(problemReports);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );
    }

    Taro.showModal({
      title: notification.title,
      content: notification.content,
      showCancel: false,
      confirmText: '知道了',
    });
    console.log('[Notification] 查看通知:', notification.title);
  };

  const handleReport = () => {
    setShowReportModal(true);
  };

  const submitReport = () => {
    if (!reportContent.trim()) {
      Taro.showToast({ title: '请描述您的问题', icon: 'none' });
      return;
    }

    const newReport: ProblemReport = {
      id: `new-${Date.now()}`,
      repertoireId: reportRepertoire,
      part: reportPart,
      description: reportContent,
      createdAt: new Date().toLocaleString('zh-CN'),
      status: 'pending',
    };

    setReports(prev => [newReport, ...prev]);
    setShowReportModal(false);
    setReportRepertoire('');
    setReportContent('');
    setActiveTab('feedback');

    Taro.showToast({ title: '问题已提交', icon: 'success' });
    console.log('[Notification] 提交问题报告:', newReport);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待回复';
      case 'replied':
        return '已回复';
      case 'resolved':
        return '已解决';
      default:
        return '待回复';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return styles.statusPending;
      case 'replied':
        return styles.statusReplied;
      case 'resolved':
        return styles.statusResolved;
      default:
        return styles.statusPending;
    }
  };

  const getRepertoireName = (id: string) => {
    return repertoireList.find(r => r.id === id)?.title || '未指定曲目';
  };

  const partOptions = ['女高音', '女低音', '男高音', '男低音'];

  return (
    <View className={styles.page}>
      <View className={styles.tabs}>
        <View
          className={classnames(
            styles.tabItem,
            activeTab === 'notice' && styles.tabItemActive
          )}
          onClick={() => handleTabChange('notice')}
        >
          通知
          {unreadCount > 0 && (
            <View className={styles.unreadBadge}>{unreadCount}</View>
          )}
          {activeTab === 'notice' && <View className={styles.tabIndicator} />}
        </View>
        <View
          className={classnames(
            styles.tabItem,
            activeTab === 'feedback' && styles.tabItemActive
          )}
          onClick={() => handleTabChange('feedback')}
        >
          问题反馈
          {activeTab === 'feedback' && <View className={styles.tabIndicator} />}
        </View>
      </View>

      {activeTab === 'notice' && (
        <ScrollView scrollY className={styles.listSection}>
          {notifications.length > 0 ? (
            <View className={styles.listCard}>
              {notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
            </View>
          ) : (
            <View className={styles.empty}>
              <Text className={styles.emptyIcon}>📭</Text>
              <Text className={styles.emptyText}>暂无通知</Text>
            </View>
          )}
        </ScrollView>
      )}

      {activeTab === 'feedback' && (
        <ScrollView scrollY className={styles.listSection}>
          {reports.length > 0 ? (
            <View className={styles.listCard}>
              {reports.map(report => (
                <View key={report.id} className={styles.feedbackItem}>
                  <View className={styles.feedbackHeader}>
                    <Text className={styles.feedbackTitle}>
                      {getRepertoireName(report.repertoireId)}
                    </Text>
                    <View
                      className={classnames(
                        styles.feedbackStatus,
                        getStatusClass(report.status)
                      )}
                    >
                      {getStatusText(report.status)}
                    </View>
                  </View>
                  <Text className={styles.feedbackContent}>
                    {report.description}
                  </Text>
                  {report.reply && (
                    <View className={styles.feedbackReply}>
                      <Text className={styles.feedbackReplyLabel}>指挥回复</Text>
                      <Text className={styles.feedbackReplyText}>
                        {report.reply}
                      </Text>
                    </View>
                  )}
                  <Text className={styles.feedbackMeta}>
                    {report.part} · {report.createdAt}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View className={styles.empty}>
              <Text className={styles.emptyIcon}>💬</Text>
              <Text className={styles.emptyText}>暂无反馈记录</Text>
            </View>
          )}
        </ScrollView>
      )}

      <View className={styles.fab} onClick={handleReport}>
        +
      </View>

      {showReportModal && (
        <View
          className={styles.modalOverlay}
          onClick={() => setShowReportModal(false)}
        >
          <View
            className={styles.modalContent}
            onClick={e => e.stopPropagation()}
          >
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>上报问题</Text>
              <View
                className={styles.modalClose}
                onClick={() => setShowReportModal(false)}
              >
                ✕
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>相关曲目（选填）</Text>
              <Input
                className={styles.formInput}
                placeholder='输入曲目名称或留空'
                value={reportRepertoire}
                onInput={e => setReportRepertoire(e.detail.value)}
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>声部</Text>
              <View className={styles.partSelector}>
                {partOptions.map(part => (
                  <View
                    key={part}
                    className={classnames(
                      styles.partOption,
                      reportPart === part && styles.partOptionActive
                    )}
                    onClick={() => setReportPart(part)}
                  >
                    {part}
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>问题描述</Text>
              <Textarea
                className={styles.formTextarea}
                placeholder='请详细描述您遇到的问题...'
                value={reportContent}
                onInput={e => setReportContent(e.detail.value)}
                maxlength={500}
              />
            </View>

            <View className={styles.submitBtn} onClick={submitReport}>
              提交反馈
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default NotificationPage;
