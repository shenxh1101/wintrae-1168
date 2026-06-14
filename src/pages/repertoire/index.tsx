import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import RepertoireCard from '@/components/RepertoireCard';
import { repertoireList, categories } from '@/data/repertoire';
import { Repertoire } from '@/types';
import { useChoirStore } from '@/store';
import classnames from 'classnames';

const RepertoirePage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchText, setSearchText] = useState('');
  const { repertoireProficiencies } = useChoirStore();

  const filteredList = useMemo<Repertoire[]>(() => {
    let list = repertoireList.map((r) => ({
      ...r,
      proficiency: repertoireProficiencies[r.id] ?? r.proficiency,
    }));
    
    if (activeCategory !== 'all') {
      list = list.filter(item => item.category === activeCategory);
    }
    
    if (searchText.trim()) {
      const keyword = searchText.toLowerCase();
      list = list.filter(
        item =>
          item.title.toLowerCase().includes(keyword) ||
          item.composer.toLowerCase().includes(keyword)
      );
    }
    
    return list;
  }, [activeCategory, searchText, repertoireProficiencies]);

  const handlePullDownRefresh = () => {
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 1000);
  };

  useEffect(() => {
    Taro.onPullDownRefresh(handlePullDownRefresh);
    return () => {
      Taro.offPullDownRefresh(handlePullDownRefresh);
    };
  }, []);

  const totalCount = repertoireList.length;
  const masteredCount = repertoireList.filter(
    (r) => (repertoireProficiencies[r.id] ?? r.proficiency ?? 0) >= 80
  ).length;

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.searchBar}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder='搜索曲目或作曲家'
            placeholderClass={styles.placeholder}
            value={searchText}
            onInput={e => setSearchText(e.detail.value)}
          />
        </View>
        <ScrollView
          scrollX
          className={styles.categoryScroll}
          enhanced
          showScrollbar={false}
        >
          {categories.map(cat => (
            <View
              key={cat.id}
              className={classnames(
                styles.categoryItem,
                activeCategory === cat.id
                  ? styles.categoryActive
                  : styles.categoryInactive
              )}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.content}>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{totalCount}</Text>
            <Text className={styles.statLabel}>总曲目</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{masteredCount}</Text>
            <Text className={styles.statLabel}>已掌握</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{totalCount - masteredCount}</Text>
            <Text className={styles.statLabel}>学习中</Text>
          </View>
        </View>

        {filteredList.length > 0 ? (
          <View className={styles.grid}>
            {filteredList.map(item => (
              <View key={item.id} className={styles.gridItem}>
                <RepertoireCard repertoire={item} />
              </View>
            ))}
          </View>
        ) : (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>🎵</Text>
            <Text className={styles.emptyText}>暂无相关曲目</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default RepertoirePage;
