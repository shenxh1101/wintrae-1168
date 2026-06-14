import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { Rehearsal } from '@/types';
import { repertoireList } from '@/data/repertoire';
import classnames from 'classnames';

interface ScheduleCardProps {
  rehearsal: Rehearsal;
  onSignIn?: () => void;
  onLeave?: () => void;
  onSeatMap?: () => void;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({
  rehearsal,
  onSignIn,
  onLeave,
  onSeatMap,
}) => {
  const handleCardClick = () => {
    Taro.navigateTo({
      url: `/pages/schedule-detail/index?id=${rehearsal.id}`,
    });
  };

  const getStatusClass = () => {
    switch (rehearsal.status) {
      case 'ongoing':
        return styles.statusOngoing;
      case 'completed':
        return styles.statusCompleted;
      default:
        return styles.statusUpcoming;
    }
  };

  const getStatusText = () => {
    switch (rehearsal.status) {
      case 'ongoing':
        return '进行中';
      case 'completed':
        return '已结束';
      default:
        return '即将开始';
    }
  };

  const getRepertoireNames = () => {
    return rehearsal.repertoireIds
      .map(id => repertoireList.find(r => r.id === id)?.title)
      .filter(Boolean);
  };

  const handleSignIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSignIn?.();
  };

  const handleLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLeave?.();
  };

  const handleSeatMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSeatMap?.();
  };

  return (
    <View className={styles.card} onClick={handleCardClick}>
      <View className={styles.header}>
        <Text className={styles.title}>{rehearsal.title}</Text>
        <View className={classnames(styles.statusTag, getStatusClass())}>
          {getStatusText()}
        </View>
      </View>

      <View className={styles.infoRow}>
        <Text className={styles.infoIcon}>📅</Text>
        <Text className={styles.infoText}>
          {rehearsal.date} {rehearsal.startTime} - {rehearsal.endTime}
        </Text>
      </View>

      <View className={styles.infoRow}>
        <Text className={styles.infoIcon}>📍</Text>
        <Text className={styles.infoText}>{rehearsal.location}</Text>
      </View>

      <View className={styles.infoRow}>
        <Text className={styles.infoIcon}>👤</Text>
        <Text className={styles.infoText}>指挥：{rehearsal.conductor}</Text>
      </View>

      {getRepertoireNames().length > 0 && (
        <View className={styles.repertoireRow}>
          {getRepertoireNames().map((name, idx) => (
            <View key={idx} className={styles.repertoireTag}>
              {name}
            </View>
          ))}
        </View>
      )}

      {rehearsal.status !== 'completed' && (
        <View className={styles.actions}>
          <View
            className={classnames(
              styles.actionBtn,
              rehearsal.signedIn ? styles.btnSuccess : styles.btnPrimary
            )}
            onClick={handleSignIn}
          >
            {rehearsal.signedIn ? '✓ 已签到' : '✍️ 签到'}
          </View>
          <View
            className={classnames(
              styles.actionBtn,
              rehearsal.leaveApplied ? styles.btnWarning : styles.btnSecondary
            )}
            onClick={handleLeave}
          >
            {rehearsal.leaveApplied ? '已请假' : '请假'}
          </View>
          <View
            className={classnames(styles.actionBtn, styles.btnSecondary)}
            onClick={handleSeatMap}
          >
            座位图
          </View>
        </View>
      )}
    </View>
  );
};

export default ScheduleCard;
