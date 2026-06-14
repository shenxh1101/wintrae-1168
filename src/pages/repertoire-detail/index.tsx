import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { repertoireList } from '@/data/repertoire';
import { Repertoire } from '@/types';
import { getDifficultyStars, getPartColor, getProficiencyColor } from '@/utils';
import classnames from 'classnames';

const RepertoireDetailPage: React.FC = () => {
  const router = useRouter();
  const [repertoire, setRepertoire] = useState<Repertoire | null>(null);

  useEffect(() => {
    const id = router.params.id;
    const found = repertoireList.find(r => r.id === id);
    if (found) {
      setRepertoire(found);
      Taro.setNavigationBarTitle({ title: found.title });
    }
  }, [router.params.id]);

  const handlePractice = () => {
    if (repertoire) {
      Taro.navigateTo({
        url: `/pages/practice-detail/index?id=${repertoire.id}`,
      });
    }
  };

  const handleViewScore = () => {
    Taro.showToast({
      title: '乐谱预览功能开发中',
      icon: 'none',
    });
  };

  const handlePlayPart = (partName: string) => {
    Taro.showToast({
      title: `正在播放${partName}声部`,
      icon: 'none',
    });
  };

  if (!repertoire) {
    return (
      <View className={styles.page}>
        <View className={styles.empty}>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  const proficiencyColor = getProficiencyColor(repertoire.proficiency || 0);

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Image
          className={styles.cover}
          src={repertoire.cover}
          mode='aspectFill'
        />
        <View className={styles.coverOverlay} />
        <View className={styles.headerInfo}>
          <Text className={styles.title}>{repertoire.title}</Text>
          <Text className={styles.subtitle}>{repertoire.composer} · {repertoire.category}</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📋</Text>
          曲目简介
        </Text>
        <Text className={styles.description}>{repertoire.description}</Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>ℹ️</Text>
          基本信息
        </Text>
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>难度</Text>
            <Text className={styles.infoValue}>{getDifficultyStars(repertoire.difficulty)}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>时长</Text>
            <Text className={styles.infoValue}>{repertoire.duration}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>页数</Text>
            <Text className={styles.infoValue}>{repertoire.pages}页</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>声部数</Text>
            <Text className={styles.infoValue}>{repertoire.parts.length}个声部</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📊</Text>
          我的熟练度
        </Text>
        <View className={styles.proficiencySection}>
          <View
            className={styles.proficiencyCircle}
            style={{
              background: `conic-gradient(${proficiencyColor} ${repertoire.proficiency || 0}%, #e2e8f0 0)`,
            }}
          >
            <View className={styles.proficiencyInner}>
              <Text className={styles.proficiencyText}>{repertoire.proficiency || 0}%</Text>
            </View>
          </View>
          <View className={styles.proficiencyInfo}>
            <Text className={styles.proficiencyTitle}>
              {(repertoire.proficiency || 0) >= 80 ? '已精通' :
               (repertoire.proficiency || 0) >= 60 ? '较熟练' :
               (repertoire.proficiency || 0) >= 40 ? '学习中' : '初学者'}
            </Text>
            <Text className={styles.proficiencyDesc}>
              上次练习：{repertoire.lastPracticed || '暂无记录'}
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>🎵</Text>
          分声部示范
        </Text>
        <View className={styles.partsList}>
          {repertoire.parts.map(part => (
            <View
              key={part.id}
              className={styles.partItem}
              onClick={() => handlePlayPart(part.name)}
            >
              <View
                className={styles.partColor}
                style={{ backgroundColor: getPartColor(part.type) }}
              />
              <View className={styles.partInfo}>
                <Text className={styles.partName}>{part.name}</Text>
                <Text className={styles.partDesc}>点击播放示范音频</Text>
              </View>
              <View className={styles.playBtn}>▶</View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.actionBar}>
        <View
          className={classnames(styles.actionBtn, styles.btnSecondary)}
          onClick={handleViewScore}
        >
          📄 乐谱预览
        </View>
        <View
          className={classnames(styles.actionBtn, styles.btnPrimary)}
          onClick={handlePractice}
        >
          🎤 开始练习
        </View>
      </View>
    </View>
  );
};

export default RepertoireDetailPage;
