import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { Repertoire } from '@/types';
import { getProficiencyColor, getPartColor } from '@/utils';

interface PracticeCardProps {
  repertoire: Repertoire;
  partType?: string;
  partName?: string;
  onPractice?: () => void;
}

const PracticeCard: React.FC<PracticeCardProps> = ({
  repertoire,
  partType = 'soprano',
  partName = '女高音',
  onPractice,
}) => {
  const handleClick = () => {
    if (onPractice) {
      onPractice();
    } else {
      Taro.navigateTo({
        url: `/pages/practice-detail/index?id=${repertoire.id}&part=${partType}`,
      });
    }
  };

  const proficiency = repertoire.proficiency || 0;
  const proficiencyColor = getProficiencyColor(proficiency);

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.topRow}>
        <View className={styles.cover}>
          <Image src={repertoire.cover} mode='aspectFill' />
        </View>
        <View className={styles.info}>
          <Text className={styles.title}>{repertoire.title}</Text>
          <Text className={styles.composer}>{repertoire.composer}</Text>
          <View
            className={styles.partTag}
            style={{ backgroundColor: getPartColor(partType) }}
          >
            {partName}
          </View>
        </View>
      </View>

      <View className={styles.progressRow}>
        <View className={styles.progressLabel}>
          <Text className={styles.progressText}>练习进度</Text>
          <Text className={styles.progressPercent}>{proficiency}%</Text>
        </View>
        <View className={styles.progressBar}>
          <View
            className={styles.progressFill}
            style={{
              width: `${proficiency}%`,
              backgroundColor: proficiencyColor,
            }}
          />
        </View>
      </View>

      <View className={styles.bottomRow}>
        <Text className={styles.lastPractice}>
          上次练习：{repertoire.lastPracticed || '暂无'}
        </Text>
        <View className={styles.practiceBtn}>开始练习</View>
      </View>
    </View>
  );
};

export default PracticeCard;
