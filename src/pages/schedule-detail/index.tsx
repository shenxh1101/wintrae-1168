import React, { useState, useEffect } from 'react';
import { View, Text, Image, Textarea } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { repertoireList } from '@/data/repertoire';
import { useChoirStore } from '@/store';
import SeatMap from '@/components/SeatMap';
import classnames from 'classnames';

const ScheduleDetailPage: React.FC = () => {
  const router = useRouter();
  const rehearsalId = router.params.id;
  const { rehearsals, setRehearsals, signIn, submitLeave } = useChoirStore();
  const rehearsal = rehearsals.find((r) => r.id === rehearsalId);

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showSeatMapModal, setShowSeatMapModal] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');

  useEffect(() => {
    if (rehearsal) {
      Taro.setNavigationBarTitle({ title: rehearsal.title });
    }
  }, [rehearsal?.title]);

  useDidShow(() => {
    Taro.setNavigationBarTitle({ title: rehearsal?.title || '排练详情' });
  });

  const getStatusText = () => {
    if (!rehearsal) return '';
    switch (rehearsal.status) {
      case 'ongoing':
        return '进行中';
      case 'completed':
        return '已结束';
      default:
        return '即将开始';
    }
  };

  const getStatusClass = () => {
    if (!rehearsal) return '';
    switch (rehearsal.status) {
      case 'ongoing':
        return styles.statusOngoing;
      case 'completed':
        return styles.statusCompleted;
      default:
        return styles.statusUpcoming;
    }
  };

  const getRepertoires = () => {
    if (!rehearsal) return [];
    return rehearsal.repertoireIds
      .map((id) => repertoireList.find((r) => r.id === id))
      .filter(Boolean);
  };

  const handleSignIn = () => {
    if (rehearsal?.signedIn) {
      Taro.showToast({ title: '您已签到，状态已同步', icon: 'none' });
      return;
    }
    if (rehearsal) {
      signIn(rehearsal.id);
      Taro.showToast({ title: '签到成功 ✓', icon: 'success' });
      Taro.vibrateShort && Taro.vibrateShort({ type: 'medium' });
      console.log('[ScheduleDetail] 签到:', rehearsal.title);
    }
  };

  const handleLeave = () => {
    if (rehearsal?.leaveApplied) {
      Taro.showModal({
        title: '请假记录',
        content: `您已申请请假\n原因：${rehearsal.leaveReason || '未填写'}\n状态：等待指挥确认`,
        showCancel: false,
      });
      return;
    }
    setLeaveReason('');
    setShowLeaveModal(true);
  };

  const submitLeaveForm = () => {
    if (!leaveReason.trim()) {
      Taro.showToast({ title: '请填写请假原因', icon: 'none' });
      return;
    }
    if (rehearsal) {
      submitLeave(rehearsal.id, leaveReason.trim());
      Taro.showToast({ title: '请假已提交', icon: 'success' });
      console.log('[ScheduleDetail] 请假提交:', rehearsal.title, leaveReason);
    }
    setShowLeaveModal(false);
    setLeaveReason('');
  };

  const handleViewScore = (repId: string) => {
    Taro.navigateTo({
      url: `/pages/repertoire-detail/index?id=${repId}`,
    });
  };

  const startPractice = (repId: string) => {
    Taro.navigateTo({
      url: `/pages/practice-detail/index?id=${repId}`,
    });
  };

  if (!rehearsal) {
    return (
      <View className={styles.page}>
        <View style={{ textAlign: 'center', padding: '100rpx 0' }}>
          <Text style={{ color: '#94a3b8' }}>排练记录不存在或已取消</Text>
        </View>
      </View>
    );
  }

  const repertoires = getRepertoires();
  const durationMin =
    parseInt(rehearsal.endTime.split(':')[0]) * 60 +
    parseInt(rehearsal.endTime.split(':')[1]) -
    (parseInt(rehearsal.startTime.split(':')[0]) * 60 +
      parseInt(rehearsal.startTime.split(':')[1]));

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text className={styles.title}>{rehearsal.title}</Text>
            <Text className={styles.subtitle}>
              {rehearsal.date} {rehearsal.startTime} - {rehearsal.endTime}
            </Text>
          </View>
          <View className={classnames(styles.statusBadge, getStatusClass())}>{getStatusText()}</View>
        </View>

        <View style={{ display: 'flex', gap: '16rpx', marginTop: '24rpx' }}>
          {rehearsal.signedIn && (
            <View
              style={{
                flex: 1,
                padding: '14rpx 20rpx',
                background: 'rgba(16, 185, 129, 0.12)',
                borderRadius: '12rpx',
                display: 'flex',
                alignItems: 'center',
                gap: '8rpx',
              }}
            >
              <Text style={{ fontSize: '28rpx' }}>✅</Text>
              <Text style={{ fontSize: '24rpx', color: '#10b981', fontWeight: 600 }}>
                已签到
              </Text>
            </View>
          )}
          {rehearsal.leaveApplied && (
            <View
              style={{
                flex: 1,
                padding: '14rpx 20rpx',
                background: 'rgba(245, 158, 11, 0.12)',
                borderRadius: '12rpx',
                display: 'flex',
                alignItems: 'center',
                gap: '8rpx',
              }}
            >
              <Text style={{ fontSize: '28rpx' }}>📝</Text>
              <Text style={{ fontSize: '24rpx', color: '#f59e0b', fontWeight: 600 }}>
                已请假
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>排练信息</Text>
        <View className={styles.infoItem}>
          <Text className={styles.infoIcon}>📍</Text>
          <View className={styles.infoContent}>
            <Text className={styles.infoLabel}>排练地点</Text>
            <Text className={styles.infoValue}>{rehearsal.location}</Text>
          </View>
        </View>
        <View className={styles.infoItem}>
          <Text className={styles.infoIcon}>👤</Text>
          <View className={styles.infoContent}>
            <Text className={styles.infoLabel}>指挥</Text>
            <Text className={styles.infoValue}>{rehearsal.conductor}</Text>
          </View>
        </View>
        <View className={styles.infoItem}>
          <Text className={styles.infoIcon}>⏱️</Text>
          <View className={styles.infoContent}>
            <Text className={styles.infoLabel}>时长</Text>
            <Text className={styles.infoValue}>约 {durationMin} 分钟</Text>
          </View>
        </View>

        <View
          className={styles.seatMapLink}
          onClick={() => setShowSeatMapModal(true)}
          style={{
            marginTop: '24rpx',
            padding: '20rpx 24rpx',
            background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
            borderRadius: '12rpx',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View style={{ display: 'flex', alignItems: 'center', gap: '12rpx' }}>
            <Text style={{ fontSize: '32rpx' }}>🎭</Text>
            <View>
              <View style={{ fontSize: '28rpx', fontWeight: 600, color: '#6366f1' }}>
                查看站位 / 座位图
              </View>
              <View style={{ fontSize: '22rpx', color: '#64748b', marginTop: '4rpx' }}>
                提前熟悉自己的位置安排
              </View>
            </View>
          </View>
          <Text style={{ color: '#6366f1', fontSize: '32rpx' }}>›</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>排练曲目</Text>
        <View className={styles.repertoireList}>
          {repertoires.map((rep) =>
            rep ? (
              <View
                key={rep.id}
                className={styles.repertoireItem}
                onClick={() => handleViewScore(rep.id)}
              >
                <Image
                  className={styles.repertoireCover}
                  src={rep.cover}
                  mode='aspectFill'
                />
                <View className={styles.repertoireInfo}>
                  <Text className={styles.repertoireName}>{rep.title}</Text>
                  <Text className={styles.repertoireMeta}>
                    {rep.composer} · {rep.duration}
                  </Text>
                </View>
                <View style={{ display: 'flex', flexDirection: 'column', gap: '8rpx' }}>
                  <Text className={styles.arrow}>›</Text>
                  <View
                    style={{
                      fontSize: '22rpx',
                      color: '#6366f1',
                      background: '#eef2ff',
                      padding: '6rpx 12rpx',
                      borderRadius: '20rpx',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      startPractice(rep.id);
                    }}
                  >
                    去练习
                  </View>
                </View>
              </View>
            ) : null
          )}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>注意事项</Text>
        <View
          style={{
            padding: '20rpx 24rpx',
            background: '#fffbeb',
            borderRadius: '12rpx',
            borderLeft: '6rpx solid #f59e0b',
          }}
        >
          <Text style={{ fontSize: '26rpx', color: '#92400e', lineHeight: 1.8 }}>
            1. 请提前 15 分钟到场签到，更换服装
            {'\n'}2. 携带乐谱和水杯，保管好个人物品
            {'\n'}3. 排练期间请将手机调至静音
            {'\n'}4. 如有特殊情况请提前 24 小时请假
          </Text>
        </View>
      </View>

      {rehearsal.status !== 'completed' && (
        <View className={styles.actionBar}>
          <View
            className={classnames(styles.actionBtn, styles.btnSecondary)}
            onClick={() => setShowSeatMapModal(true)}
          >
            座位图
          </View>
          <View
            className={classnames(
              styles.actionBtn,
              rehearsal.leaveApplied ? styles.btnWarning : styles.btnSecondary
            )}
            onClick={handleLeave}
          >
            {rehearsal.leaveApplied ? '已请假' : '请假申请'}
          </View>
          <View
            className={classnames(
              styles.actionBtn,
              rehearsal.signedIn ? styles.btnSuccess : styles.btnPrimary
            )}
            onClick={handleSignIn}
          >
            {rehearsal.signedIn ? '已签到 ✓' : '立即签到'}
          </View>
        </View>
      )}

      {showLeaveModal && (
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
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40rpx',
          }}
          onClick={() => setShowLeaveModal(false)}
        >
          <View
            style={{
              background: '#fff',
              borderRadius: '16rpx',
              width: '100%',
              maxWidth: '600rpx',
              padding: '32rpx',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Text
              style={{
                fontSize: '32rpx',
                fontWeight: 700,
                color: '#1e293b',
                marginBottom: '16rpx',
                display: 'block',
              }}
            >
              提交请假申请
            </Text>
            <View style={{ fontSize: '26rpx', color: '#64748b', marginBottom: '20rpx' }}>
              排练：{rehearsal.title}
              {'\n'}
              时间：{rehearsal.date} {rehearsal.startTime}
            </View>
            <Textarea
              placeholder='请详细说明请假原因（如病假、事假等）...'
              value={leaveReason}
              onInput={(e) => setLeaveReason(e.detail.value)}
              maxlength={200}
              style={{
                width: '100%',
                minHeight: '160rpx',
                padding: '16rpx',
                border: '1rpx solid #e2e8f0',
                borderRadius: '12rpx',
                fontSize: '28rpx',
                marginBottom: '24rpx',
                background: '#f8fafc',
                boxSizing: 'border-box',
              }}
            />
            <View style={{ display: 'flex', gap: '16rpx' }}>
              <View
                style={{
                  flex: 1,
                  height: '80rpx',
                  borderRadius: '40rpx',
                  background: '#f1f5f9',
                  color: '#64748b',
                  fontSize: '28rpx',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => setShowLeaveModal(false)}
              >
                取消
              </View>
              <View
                style={{
                  flex: 1.5,
                  height: '80rpx',
                  borderRadius: '40rpx',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: '#fff',
                  fontSize: '28rpx',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={submitLeaveForm}
              >
                提交请假
              </View>
            </View>
          </View>
        </View>
      )}

      {showSeatMapModal && (
        <View
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32rpx',
          }}
          onClick={() => setShowSeatMapModal(false)}
        >
          <View
            style={{
              width: '100%',
              maxWidth: '700rpx',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <SeatMap mySeatId='s2' />
            <View
              style={{
                marginTop: '20rpx',
                height: '80rpx',
                background: '#fff',
                borderRadius: '40rpx',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28rpx',
                color: '#6366f1',
                fontWeight: 600,
              }}
              onClick={() => setShowSeatMapModal(false)}
            >
              关闭
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default ScheduleDetailPage;
