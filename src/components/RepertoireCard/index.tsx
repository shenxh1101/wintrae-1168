import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { Repertoire } from '@/types';
import { getDifficultyStars, getProficiencyColor } from '@/utils';

interface RepertoireCardProps {
  repertoire: Repertoire;
}

const RepertoireCard: React.FC<RepertoireCardProps> = ({ repertoire }) => {
  const handleClick = () => {
    Taro.navigateTo({
      url: `/pages/repertoire-detail/index?id=${repertoire.id}`,
    });
  };

  const proficiencyColor = getProficiencyColor(repertoire.proficiency || 0);

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.cover}>
        <Image
          className={styles.coverImage}
          src={repertoire.cover}
          mode='aspectFill'
        />
        <View className={styles.categoryTag}>{repertoire.category}</View>
        <View className={styles.difficultyTag}>
          {getDifficultyStars(repertoire.difficulty)}
        </View>
      </View>
      <View className={styles.info}>
        <Text className={styles.title}>{repertoire.title}</Text>
        <Text className={styles.composer}>{repertoire.composer}</Text>
        <View className={styles.bottomRow}>
          <View className={styles.proficiency}>
            <Text className={styles.proficiencyLabel}>熟练度</Text>
            <View className={styles.proficiencyBar}>
              <View
                className={styles.proficiencyFill}
                style={{
                  width: `${repertoire.proficiency || 0}%`,
                  backgroundColor: proficiencyColor,
                }}
              />
            </View>
          </View>
          <Text className={styles.duration}>{repertoire.duration}</Text>
        </View>
      </View>
    </View>
  );
};

export default RepertoireCard;
