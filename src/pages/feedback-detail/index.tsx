import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, Image, Textarea, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useChoirStore } from '@/store';
import { repertoireList } from '@/data/repertoire';
import { FeedbackMessage, VoicePart } from '@/types';
import { getPartColor } from '@/utils';

const partLabelMap: Record<VoicePart, string> = {
  soprano: '女高音',
  alto: '女低音',
  tenor: '男高音',
  bass: '男低音',
  full: '全合唱',
};

const FeedbackDetailPage: React.FC = () => {
  const router = useRouter();
  const reportId = router.params.id || '';
  const scrollRef = useRef<any>(null);

  const { problemReports, addFeedbackMessage, updateProblemStatus } = useChoirStore();

  const [newMessage, setNewMessage] = useState('');
  const [showActions, setShowActions] = useState(false);

  const report = useMemo(
    () => problemReports.find((r) => r.id === reportId),
    [problemReports, reportId]
  );

  const repertoire = useMemo(
    () => (report ? repertoireList.find((r) => r.id === report.repertoireId) : undefined),
    [report]
  );

  useEffect(() => {
    if (report) {
      Taro.setNavigationBarTitle({ title: `反馈详情 · ${repertoire?.title || '问题'}` });
    }
    setTimeout(() => {
      scrollRef.current?.scrollToEnd && scrollRef.current.scrollToEnd({ animated: false });
    }, 500);
  }, [report, repertoire?.title]);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd && scrollRef.current.scrollToEnd({ animated: true });
    }, 100);
  }, [report?.messages.length]);

  if (!report) {
    return (
      <View style={{ padding: 100, textAlign: 'center' }}>
        <Text>反馈记录不存在</Text>
      </View>
    );
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string; border?: string }> = {
    pending: {
      label: '待指挥回复',
      color: '#b45309',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: '1rpx solid rgba(245, 158, 11, 0.25)',
    },
    replied: {
      label: '指挥已回复',
      color: '#4338ca',
      bg: 'rgba(99, 102, 241, 0.12)',
      border: '1rpx solid rgba(99, 102, 241, 0.25)',
    },
    resolved: {
      label: '已解决结案',
      color: '#047857',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: '1rpx solid rgba(16, 185, 129, 0.25)',
    },
    escalated: {
      label: '已升级处理',
      color: '#b91c1c',
      bg: 'rgba(239, 68, 68, 0.12)',
      border: '1rpx solid rgba(239, 68, 68, 0.25)',
    },
  };
  const statusCfg = statusConfig[report.status] || statusConfig.pending;

  const sendMessage = () => {
    const content = newMessage.trim();
    if (!content) {
      Taro.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }
    addFeedbackMessage(report.id, 'member', content, '成员补充说明');
    console.log('[FeedbackDetail] 成员发送:', content);
    setNewMessage('');
    Taro.showToast({ title: '消息已发送，等待指挥回复', icon: 'none' });
  };

  const simulateConductorReply = (type: 'reply' | 'resolve' | 'escalate') => {
    setShowActions(false);
    const map = {
      reply: {
        status: 'replied' as const,
        reply: '收到反馈，排练时会重点关注这个段落。建议先单独用慢速练习该声部的节奏（0.6x），然后再逐步加快。有问题随时联系。',
        note: '指挥已查看并给出处理建议',
      },
      resolve: {
        status: 'resolved' as const,
        reply: '已在排练中专门针对此问题进行了讲解和示范，大家一起练了3遍。相信已经掌握，如还有问题请继续反馈！',
        note: '问题已处理完毕，结案',
      },
      escalate: {
        status: 'escalated' as const,
        reply: '问题较复杂，我们将安排一次专项练习会，具体时间另行通知。请先保持每日打卡练习。',
        note: '已升级为专项问题处理',
      },
    };
    const cfg = map[type];
    updateProblemStatus(report.id, cfg.status, cfg.reply, cfg.note);
    Taro.showToast({ title: '已模拟指挥处理', icon: 'success' });
  };

  const renderMessage = (msg: FeedbackMessage, idx: number) => {
    if (msg.role === 'system') {
      return (
        <View key={msg.id} className={styles.systemMessage}>
          <Text className={styles.systemDot}>●</Text>
          <Text className={styles.systemText}>
            {msg.statusNote || msg.content}
          </Text>
          <Text className={styles.systemTime}>{msg.createdAt}</Text>
        </View>
      );
    }
    const isConductor = msg.role === 'conductor';
    return (
      <View
        key={msg.id}
        className={[styles.messageRow, isConductor ? styles.messageLeft : styles.messageRight].join(' ')}
      >
        {isConductor ? (
          <View className={styles.avatarConductor}>🎤</View>
        ) : (
          <View className={styles.avatarMember}>我</View>
        )}
        <View
          className={[
            styles.messageBubble,
            isConductor ? styles.bubbleConductor : styles.bubbleMember,
          ].join(' ')}
        >
          <View className={styles.bubbleMeta}>
            <Text className={styles.bubbleAuthor}>
              {isConductor ? '李指挥' : '我（王思琪）'}
            </Text>
            <Text className={styles.bubbleTime}>{msg.createdAt}</Text>
          </View>
          <Text className={styles.bubbleContent}>{msg.content}</Text>
          {msg.statusNote && isConductor && (
            <View className={styles.bubbleStatus}>
              <Text style={{ fontSize: 22, color: '#6366f1', fontWeight: 600 }}>
                ⚙ 处理说明：{msg.statusNote}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {repertoire ? (
            <Image
              src={repertoire.cover}
              style={{ width: 88, height: 88, borderRadius: 16 }}
              mode='aspectFill'
            />
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 30, fontWeight: 700, color: '#1e293b', display: 'block', lineHeight: 1.3 }}>
              {repertoire?.title || '其他问题'}
            </Text>
            <View style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              <View
                style={{
                  padding: '4rpx 16rpx',
                  background: getPartColor(report.voicePart),
                  color: '#fff',
                  borderRadius: 14,
                  fontSize: 20,
                  fontWeight: 500,
                }}
              >
                {partLabelMap[report.voicePart]}声部
              </View>
              <Text style={{ fontSize: 22, color: '#64748b' }}>
                提交于 {report.createdAt}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={{
            marginTop: 16,
            padding: 16,
            background: statusCfg.bg,
            border: statusCfg.border,
            borderRadius: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 26 }}>
              {report.status === 'resolved' ? '✅' : report.status === 'pending' ? '⏳' : report.status === 'replied' ? '💬' : '🚨'}
            </Text>
            <Text style={{ fontSize: 26, fontWeight: 700, color: statusCfg.color }}>
              {statusCfg.label}
            </Text>
          </View>
          {report.status !== 'resolved' && (
            <Text
              style={{ fontSize: 22, color: statusCfg.color, fontWeight: 600 }}
              onClick={() => setShowActions(true)}
            >
              处理演示 ›
            </Text>
          )}
        </View>
      </View>

      <ScrollView scrollY className={styles.messageArea} ref={scrollRef} scrollWithAnimation>
        <View style={{ padding: 24 }}>
          {report.messages.map((msg, idx) => renderMessage(msg, idx))}
        </View>
      </ScrollView>

      <View className={styles.composer}>
        <Textarea
          className={styles.composerInput}
          placeholder='补充说明或追问指挥...'
          value={newMessage}
          onInput={(e) => setNewMessage(e.detail.value)}
          maxlength={500}
          confirm-type='send'
          onConfirm={sendMessage}
        />
        <View
          className={[
            styles.sendBtn,
            !newMessage.trim() && styles.sendBtnDisabled,
          ].join(' ')}
          onClick={sendMessage}
        >
          <Text style={{ fontSize: 26 }}>发送</Text>
        </View>
      </View>

      {showActions && (
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
          onClick={() => setShowActions(false)}
        >
          <View
            style={{
              width: '100%',
              background: '#fff',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: '16rpx 32rpx 60rpx',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <View style={{ width: 60, height: 8, background: '#e2e8f0', borderRadius: 4, margin: '0 auto 24rpx' }} />
            <Text style={{ fontSize: 28, fontWeight: 700, color: '#1e293b', textAlign: 'center', marginBottom: 32, display: 'block' }}>
              模拟指挥处理流程（演示用）
            </Text>
            <View style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <View
                onClick={() => simulateConductorReply('reply')}
                style={{
                  padding: 24,
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
                  borderRadius: 16,
                }}
              >
                <Text style={{ fontSize: 28, fontWeight: 700, color: '#6366f1', display: 'block' }}>
                  💬 回复处理建议
                </Text>
                <Text style={{ fontSize: 22, color: '#64748b', marginTop: 6 }}>
                  指挥已查看问题并给出练习建议
                </Text>
              </View>
              <View
                onClick={() => simulateConductorReply('resolve')}
                style={{
                  padding: 24,
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
                  borderRadius: 16,
                }}
              >
                <Text style={{ fontSize: 28, fontWeight: 700, color: '#10b981', display: 'block' }}>
                  ✅ 标记为已解决
                </Text>
                <Text style={{ fontSize: 22, color: '#64748b', marginTop: 6 }}>
                  问题已在排练时讲解处理，结案
                </Text>
              </View>
              <View
                onClick={() => simulateConductorReply('escalate')}
                style={{
                  padding: 24,
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(245, 158, 11, 0.08) 100%)',
                  borderRadius: 16,
                }}
              >
                <Text style={{ fontSize: 28, fontWeight: 700, color: '#ef4444', display: 'block' }}>
                  🚨 升级专项处理
                </Text>
                <Text style={{ fontSize: 22, color: '#64748b', marginTop: 6 }}>
                  问题较复杂，安排专项练习会解决
                </Text>
              </View>
              <View
                style={{
                  height: 88,
                  marginTop: 16,
                  borderRadius: 44,
                  background: '#f1f5f9',
                  color: '#64748b',
                  fontSize: 28,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => setShowActions(false)}
              >
                取消
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default FeedbackDetailPage;
