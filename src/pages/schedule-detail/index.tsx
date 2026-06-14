import React, { useState, useEffect } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { rehearsalList } from '@/data/schedule';
import { repertoireList } from '@/data/repertoire';
import { Rehearsal } from '@/types';
import classnames from 'classnames';

const ScheduleDetailPage: React.FC = () => {
  const router = useRouter();
  const [rehearsal, setRehearsal] = useState<Rehearsal | null>(null);

  useEffect(() => {
    const id = router.params.id;
    const found = rehearsalList.find(r => r.id === id);
    if (found) {
      setRehearsal(found);
      Taro.setNavigationBarTitle({ title: found.title });
    }
  }, [router.params.id]);

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

  const getRepertoires = () => {
    if (!rehearsal) return [];
    return rehearsal.repertoireIds
      .map(id => repertoireList.find(r => r.id === id))
      .filter(Boolean);
  };

  const handleSignIn = () => {
    if (rehearsal?.signedIn) {
      Taro.showToast({ title: '您已签到', icon: 'none' });
      return;
    }
    Taro.showToast({ title: '签到成功', icon: 'success' });
    console.log('[ScheduleDetail] 签到成功:', rehearsal?.title);
  };

  const handleLeave = () => {
    Taro.showToast({ title: '请假功能请返回列表操作', icon: 'none' });
  };

  const handleViewScore = (repId: string) => {
    Taro.navigateTo({
      url: `/pages/repertoire-detail/index?id=${repId}`,
    });
  };

  if (!rehearsal) {
    return (
      <View className={styles.page}>
        <View style={{ textAlign: 'center', padding: '100rpx 0' }}>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  const repertoires = getRepertoires();

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>{rehearsal.title}</Text>
        <Text className={styles.subtitle}>
          {rehearsal.date} {rehearsal.startTime} - {rehearsal.endTime}
        </Text>
        <View className={styles.statusBadge}>{getStatusText()}</View>
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
            <Text className={styles.infoValue}>
              约 {
                (parseInt(rehearsal.endTime.split(':')[0]) * 60 + parseInt(rehearsal.endTime.split(':')[1])) -
                (parseInt(rehearsal.startTime.split(':')[0]) * 60 + parseInt(rehearsal.startTime.split(':')[1]))
              } 分钟
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>排练曲目</Text>
        <View className={styles.repertoireList}>
          {repertoires.map(rep => rep && (
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
              <Text className={styles.arrow}>›</Text>
            </View>
          ))}
        </View>
      </View>

      {rehearsal.status !== 'completed' && (
        <View className={styles.actionBar}>
          <View
            className={classnames(styles.actionBtn, styles.btnSecondary)}
            onClick={handleLeave}
          >
            请假申请
          </View>
          <View
            className={classnames(styles.actionBtn, styles.btnPrimary)}
            onClick={handleSignIn}
          >
            {rehearsal.signedIn ? '已签到 ✓' : '立即签到'}
          </View>
        </View>
      )}
    </View>
  );
};

export default ScheduleDetailPage;
