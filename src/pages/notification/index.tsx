import React, { useState, useMemo } from 'react';
import { View, Text, Image, Textarea, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import NotificationItem from '@/components/NotificationItem';
import { notificationList, problemReports as defaultReports } from '@/data/notification';
import { repertoireList } from '@/data/repertoire';
import { ProblemReport, Notification, VoicePart } from '@/types';
import { useChoirStore } from '@/store';
import classnames from 'classnames';

type TabType = 'notification' | 'feedback';

const voicePartList: { key: VoicePart; label: string }[] = [
  { key: 'soprano', label: '女高音' },
  { key: 'alto', label: '女低音' },
  { key: 'tenor', label: '男高音' },
  { key: 'bass', label: '男低音' },
  { key: 'full', label: '全合唱' },
];

const NotificationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('notification');
  const [showReportModal, setShowReportModal] = useState(false);
  const [problemContent, setProblemContent] = useState('');
  const [selectedRepertoireId, setSelectedRepertoireId] = useState('');
  const [selectedVoicePart, setSelectedVoicePart] = useState<VoicePart>('soprano');
  const [showRepertoirePicker, setShowRepertoirePicker] = useState(false);
  const [showVoicePartPicker, setShowVoicePartPicker] = useState(false);

  const {
    notifications,
    setNotifications,
    markAsRead,
    markAllAsRead,
    problemReports,
    addProblemReport,
    setProblemReports,
    updateProblemStatus,
  } = useChoirStore();

  React.useEffect(() => {
    if (notifications.length === 0) {
      setNotifications(notificationList);
    }
    if (problemReports.length === 0) {
      setProblemReports(defaultReports as ProblemReport[]);
    }
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const pendingCount = useMemo(
    () => problemReports.filter((r) => r.status === 'pending').length,
    [problemReports]
  );

  const selectedRepertoire = repertoireList.find((r) => r.id === selectedRepertoireId);
  const selectedPartLabel = voicePartList.find((p) => p.key === selectedVoicePart)?.label;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    Taro.showModal({
      title: notification.title,
      content: notification.content,
      showCancel: false,
      confirmText: '我知道了',
    });
  };

  const submitReport = () => {
    if (!selectedRepertoireId) {
      Taro.showToast({ title: '请选择相关曲目', icon: 'none' });
      return;
    }
    if (!problemContent.trim()) {
      Taro.showToast({ title: '请描述具体问题', icon: 'none' });
      return;
    }

    addProblemReport({
      repertoireId: selectedRepertoireId,
      voicePart: selectedVoicePart,
      content: problemContent.trim(),
    });

    console.log('[Notification] 问题上报:', {
      repertoire: selectedRepertoire?.title,
      voicePart: selectedPartLabel,
      content: problemContent,
    });

    Taro.showToast({ title: '问题已提交，指挥会尽快回复', icon: 'success' });
    setShowReportModal(false);
    setProblemContent('');
    setSelectedRepertoireId('');
    setSelectedVoicePart('soprano');
  };

  const getStatusConfig = (status: ProblemReport['status']) => {
    switch (status) {
      case 'resolved':
        return { text: '已解决', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
      case 'replied':
        return { text: '指挥已回复', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' };
      default:
        return { text: '待回复', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' };
    }
  };

  const getReportRepertoire = (report: ProblemReport) => {
    return repertoireList.find((r) => r.id === report.repertoireId);
  };

  const getReportPartLabel = (part: VoicePart) => {
    return voicePartList.find((p) => p.key === part)?.label || part;
  };

  return (
    <View className={styles.page}>
      <View className={styles.tabBar}>
        <View
          className={classnames(styles.tabItem, activeTab === 'notification' && styles.tabActive)}
          onClick={() => setActiveTab('notification')}
        >
          <Text className={styles.tabText}>临时通知</Text>
          {unreadCount > 0 && <View className={styles.tabBadge}>{unreadCount}</View>}
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'feedback' && styles.tabActive)}
          onClick={() => setActiveTab('feedback')}
        >
          <Text className={styles.tabText}>问题反馈</Text>
          {pendingCount > 0 && (
            <View className={classnames(styles.tabBadge, styles.badgeWarning)}>
              {pendingCount}
            </View>
          )}
        </View>
      </View>

      {activeTab === 'notification' && (
        <View className={styles.notificationSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>最新通知</Text>
            {unreadCount > 0 && (
              <Text className={styles.markAllRead} onClick={markAllAsRead}>
                全部已读
              </Text>
            )}
          </View>

          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onClick={() => handleNotificationClick(n)}
            />
          ))}

          {notifications.length === 0 && (
            <View
              style={{
                textAlign: 'center',
                padding: '100rpx 0',
                background: '#fff',
                borderRadius: '16rpx',
              }}
            >
              <Text style={{ fontSize: '56rpx', marginBottom: '16rpx', display: 'block' }}>
                📭
              </Text>
              <Text style={{ color: '#94a3b8' }}>暂无新通知</Text>
            </View>
          )}
        </View>
      )}

      {activeTab === 'feedback' && (
        <View className={styles.notificationSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>我的反馈</Text>
            <View
              style={{
                display: 'flex',
                gap: '12rpx',
              }}
            >
              <View
                style={{
                  fontSize: '22rpx',
                  padding: '6rpx 14rpx',
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#f59e0b',
                  borderRadius: '20rpx',
                }}
              >
                待回复 {pendingCount}
              </View>
              <View
                style={{
                  fontSize: '22rpx',
                  padding: '6rpx 14rpx',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  borderRadius: '20rpx',
                }}
              >
                已解决 {problemReports.filter((r) => r.status === 'resolved').length}
              </View>
            </View>
          </View>

          {problemReports.map((report) => {
            const rep = getReportRepertoire(report);
            const statusCfg = getStatusConfig(report.status);
            return (
              <View
                key={report.id}
                className={styles.feedbackCard}
                onClick={() =>
                  Taro.navigateTo({
                    url: `/pages/feedback-detail/index?id=${report.id}`,
                  })
                }
              >
                <View className={styles.feedbackHeader}>
                  <View style={{ display: 'flex', alignItems: 'center', gap: '12rpx', flexWrap: 'wrap' }}>
                    {rep ? (
                      <View
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8rpx',
                          marginRight: '8rpx',
                        }}
                      >
                        <Image
                          src={rep.cover}
                          style={{ width: '40rpx', height: '40rpx', borderRadius: '8rpx' }}
                          mode='aspectFill'
                        />
                        <Text style={{ fontSize: '26rpx', fontWeight: 600, color: '#1e293b' }}>
                          {rep.title}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={{
                          fontSize: '26rpx',
                          fontWeight: 600,
                          color: '#1e293b',
                        }}
                      >
                        其他问题
                      </Text>
                    )}
                    <View
                      style={{
                        fontSize: '20rpx',
                        padding: '4rpx 12rpx',
                        background:
                          'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
                        color: '#6366f1',
                        borderRadius: '16rpx',
                        fontWeight: 500,
                      }}
                    >
                      {getReportPartLabel(report.voicePart)}声部
                    </View>
                  </View>
                  <View
                    style={{
                      fontSize: '22rpx',
                      padding: '6rpx 16rpx',
                      background: statusCfg.bg,
                      color: statusCfg.color,
                      borderRadius: '20rpx',
                      fontWeight: 600,
                    }}
                  >
                    {statusCfg.text}
                  </View>
                </View>

                <Text className={styles.feedbackContent}>{report.content}</Text>

                {report.replyContent && (
                  <View
                    style={{
                      marginTop: '16rpx',
                      padding: '16rpx 20rpx',
                      background:
                        report.status === 'resolved'
                          ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
                          : 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
                      borderRadius: '12rpx',
                      borderLeft:
                        report.status === 'resolved'
                          ? '6rpx solid #10b981'
                          : '6rpx solid #6366f1',
                    }}
                  >
                    <View
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8rpx',
                        marginBottom: '8rpx',
                      }}
                    >
                      <Text style={{ fontSize: '24rpx' }}>🎤</Text>
                      <Text
                        style={{
                          fontSize: '24rpx',
                          fontWeight: 600,
                          color: report.status === 'resolved' ? '#10b981' : '#6366f1',
                        }}
                      >
                        指挥回复
                      </Text>
                      {report.replyTime && (
                        <Text style={{ fontSize: '20rpx', color: '#64748b' }}>
                          · {report.replyTime}
                        </Text>
                      )}
                    </View>
                    <Text style={{ fontSize: '24rpx', color: '#374151', lineHeight: 1.7 }}>
                      {report.replyContent}
                    </Text>
                  </View>
                )}

                <View className={styles.feedbackFooter}>
                  <Text className={styles.feedbackTime}>{report.createdAt}</Text>
                  <View
                    style={{
                      fontSize: '22rpx',
                      color: '#6366f1',
                      fontWeight: 500,
                    }}
                  >
                    查看对话 ›
                  </View>
                </View>
              </View>
            );
          })}

          {problemReports.length === 0 && (
            <View
              style={{
                textAlign: 'center',
                padding: '100rpx 0',
                background: '#fff',
                borderRadius: '16rpx',
              }}
            >
              <Text style={{ fontSize: '56rpx', marginBottom: '16rpx', display: 'block' }}>
                ✨
              </Text>
              <Text style={{ color: '#94a3b8', display: 'block', marginBottom: '8rpx' }}>
                暂无反馈记录
              </Text>
              <Text style={{ color: '#cbd5e1', fontSize: '24rpx' }}>
                遇到问题点击右下角按钮上报
              </Text>
            </View>
          )}
        </View>
      )}

      <View className={styles.fab} onClick={() => setShowReportModal(true)}>
        <Text className={styles.fabIcon}>✏️</Text>
        <Text className={styles.fabText}>上报问题</Text>
      </View>

      {showReportModal && (
        <View
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={() => setShowReportModal(false)}
        >
          <View
            style={{
              width: '100%',
              background: '#fff',
              borderTopLeftRadius: '24rpx',
              borderTopRightRadius: '24rpx',
              padding: '24rpx 32rpx 60rpx',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <View
              style={{
                width: '60rpx',
                height: '8rpx',
                background: '#e2e8f0',
                borderRadius: '4rpx',
                margin: '0 auto 24rpx',
              }}
            />
            <Text
              style={{
                fontSize: '32rpx',
                fontWeight: 700,
                color: '#1e293b',
                marginBottom: '32rpx',
                display: 'block',
                textAlign: 'center',
              }}
            >
              上报练习问题
            </Text>

            <View style={{ marginBottom: '24rpx' }}>
              <Text style={{ fontSize: '26rpx', color: '#475569', marginBottom: '12rpx', display: 'block', fontWeight: 500 }}>
                相关曲目 <Text style={{ color: '#ef4444' }}>*</Text>
              </Text>
              <View
                style={{
                  padding: '0 24rpx',
                  height: '88rpx',
                  background: '#f8fafc',
                  border: '1rpx solid #e2e8f0',
                  borderRadius: '12rpx',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                onClick={() => setShowRepertoirePicker(true)}
              >
                {selectedRepertoire ? (
                  <View style={{ display: 'flex', alignItems: 'center', gap: '12rpx' }}>
                    <Image
                      src={selectedRepertoire.cover}
                      style={{ width: '48rpx', height: '48rpx', borderRadius: '10rpx' }}
                      mode='aspectFill'
                    />
                    <View>
                      <Text style={{ fontSize: '28rpx', color: '#1e293b', fontWeight: 500 }}>
                        {selectedRepertoire.title}
                      </Text>
                      <Text style={{ fontSize: '22rpx', color: '#94a3b8' }}>
                        {selectedRepertoire.composer}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={{ fontSize: '28rpx', color: '#94a3b8' }}>点击选择曲目</Text>
                )}
                <Text style={{ color: '#94a3b8', fontSize: '32rpx' }}>›</Text>
              </View>
            </View>

            <View style={{ marginBottom: '24rpx' }}>
              <Text style={{ fontSize: '26rpx', color: '#475569', marginBottom: '12rpx', display: 'block', fontWeight: 500 }}>
                所属声部 <Text style={{ color: '#ef4444' }}>*</Text>
              </Text>
              <View
                style={{ display: 'flex', gap: '12rpx', flexWrap: 'wrap' }}
              >
                {voicePartList.map((p) => (
                  <View
                    key={p.key}
                    style={{
                      padding: '14rpx 24rpx',
                      borderRadius: '32rpx',
                      fontSize: '26rpx',
                      fontWeight: 500,
                      background:
                        selectedVoicePart === p.key
                          ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                          : '#f1f5f9',
                      color: selectedVoicePart === p.key ? '#fff' : '#64748b',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => setSelectedVoicePart(p.key)}
                  >
                    {p.label}
                  </View>
                ))}
              </View>
            </View>

            <View style={{ marginBottom: '32rpx' }}>
              <Text style={{ fontSize: '26rpx', color: '#475569', marginBottom: '12rpx', display: 'block', fontWeight: 500 }}>
                问题描述 <Text style={{ color: '#ef4444' }}>*</Text>
              </Text>
              <Textarea
                placeholder='请详细描述您遇到的问题，如：某一段节奏不太准、高音部分唱不上去、和其他声部合不上等...'
                value={problemContent}
                onInput={(e) => setProblemContent(e.detail.value)}
                maxlength={300}
                style={{
                  width: '100%',
                  minHeight: '180rpx',
                  padding: '20rpx',
                  background: '#f8fafc',
                  border: '1rpx solid #e2e8f0',
                  borderRadius: '12rpx',
                  fontSize: '28rpx',
                  color: '#1e293b',
                  boxSizing: 'border-box',
                }}
              />
              <Text
                style={{
                  fontSize: '22rpx',
                  color: '#94a3b8',
                  textAlign: 'right',
                  display: 'block',
                  marginTop: '8rpx',
                }}
              >
                {problemContent.length}/300
              </Text>
            </View>

            <View style={{ display: 'flex', gap: '16rpx' }}>
              <View
                style={{
                  flex: 1,
                  height: '96rpx',
                  borderRadius: '48rpx',
                  background: '#f1f5f9',
                  color: '#64748b',
                  fontSize: '30rpx',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => setShowReportModal(false)}
              >
                取消
              </View>
              <View
                style={{
                  flex: 2,
                  height: '96rpx',
                  borderRadius: '48rpx',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: '#fff',
                  fontSize: '30rpx',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8rpx 24rpx rgba(99, 102, 241, 0.35)',
                }}
                onClick={submitReport}
              >
                提交反馈
              </View>
            </View>
          </View>
        </View>
      )}

      {showRepertoirePicker && (
        <View
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={() => setShowRepertoirePicker(false)}
        >
          <View
            style={{
              width: '100%',
              background: '#fff',
              borderTopLeftRadius: '24rpx',
              borderTopRightRadius: '24rpx',
              maxHeight: '70vh',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <View
              style={{
                width: '60rpx',
                height: '8rpx',
                background: '#e2e8f0',
                borderRadius: '4rpx',
                margin: '16rpx auto 16rpx',
              }}
            />
            <View
              style={{
                padding: '16rpx 32rpx 24rpx',
                borderBottom: '1rpx solid #f1f5f9',
              }}
            >
              <Text
                style={{
                  fontSize: '30rpx',
                  fontWeight: 700,
                  color: '#1e293b',
                  textAlign: 'center',
                  display: 'block',
                }}
              >
                选择曲目
              </Text>
            </View>
            <ScrollView scrollY style={{ maxHeight: '55vh' }}>
              {repertoireList.map((rep) => (
                <View
                  key={rep.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16rpx',
                    padding: '24rpx 32rpx',
                    borderBottom: '1rpx solid #f8fafc',
                    background:
                      selectedRepertoireId === rep.id
                        ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.08) 0%, transparent 100%)'
                        : '#fff',
                  }}
                  onClick={() => {
                    setSelectedRepertoireId(rep.id);
                    setShowRepertoirePicker(false);
                  }}
                >
                  <Image
                    src={rep.cover}
                    style={{ width: '72rpx', height: '72rpx', borderRadius: '12rpx', flexShrink: 0 }}
                    mode='aspectFill'
                  />
                  <View style={{ flex: 1, overflow: 'hidden' }}>
                    <Text
                      style={{
                        fontSize: '28rpx',
                        color: '#1e293b',
                        fontWeight: selectedRepertoireId === rep.id ? 600 : 500,
                        display: 'block',
                      }}
                    >
                      {rep.title}
                    </Text>
                    <Text style={{ fontSize: '22rpx', color: '#94a3b8', marginTop: '4rpx' }}>
                      {rep.category} · {rep.composer} · {rep.duration}
                    </Text>
                  </View>
                  {selectedRepertoireId === rep.id && (
                    <Text style={{ color: '#6366f1', fontSize: '32rpx', flexShrink: 0 }}>✓</Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

export default NotificationPage;
