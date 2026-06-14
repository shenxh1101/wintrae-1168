import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import PracticeCard from '@/components/PracticeCard';
import { repertoireList } from '@/data/repertoire';
import { getPartColor } from '@/utils';
import classnames from 'classnames';

interface PartInfo {
  type: string;
  name: string;
  icon: string;
}

const parts: PartInfo[] = [
  { type: 'soprano', name: '女高音', icon: 'S' },
  { type: 'alto', name: '女低音', icon: 'A' },
  { type: 'tenor', name: '男高音', icon: 'T' },
  { type: 'bass', name: '男低音', icon: 'B' },
];

const PracticePage: React.FC = () => {
  const [activePart, setActivePart] = useState('soprano');

  const getCurrentPartName = () => {
    const part = parts.find(p => p.type === activePart);
    return part?.name || '女高音';
  };

  const handlePartChange = (partType: string) => {
    setActivePart(partType);
    console.log('[Practice] 切换声部:', partType);
  };

  const totalPracticeTime = repertoireList.reduce((sum, r) => sum + (r.proficiency || 0), 0);

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>分声部练习</Text>
        <Text className={styles.headerSubtitle}>选择你的声部，开始专项练习</Text>

        <View className={styles.partSelector}>
          {parts.map(part => (
            <View
              key={part.type}
              className={classnames(
                styles.partItem,
                activePart === part.type && styles.partItemActive
              )}
              onClick={() => handlePartChange(part.type)}
            >
              <View
                className={styles.partIcon}
                style={{ backgroundColor: getPartColor(part.type) }}
              >
                {part.icon}
              </View>
              <Text className={styles.partName}>{part.name}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.listSection}>
        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <Text className={styles.statNumber}>{repertoireList.length}</Text>
            <Text className={styles.statLabel}>可练习曲目</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statNumber}>{Math.floor(totalPracticeTime / 10)}</Text>
            <Text className={styles.statLabel}>累计练习(h)</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statNumber}>{repertoireList.filter(r => (r.proficiency || 0) >= 80).length}</Text>
            <Text className={styles.statLabel}>已掌握</Text>
          </View>
        </View>

        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>{getCurrentPartName()}练习曲目</Text>
          <Text className={styles.sectionSubtitle}>共 {repertoireList.length} 首</Text>
        </View>

        {repertoireList.map(rep => (
          <PracticeCard
            key={rep.id}
            repertoire={rep}
            partType={activePart}
            partName={getCurrentPartName()}
          />
        ))}

        {repertoireList.length === 0 && (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>🎵</Text>
            <Text className={styles.emptyText}>暂无练习曲目</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default PracticePage;
