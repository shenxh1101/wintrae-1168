import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { repertoireList } from '@/data/repertoire';
import { speedOptions, loopSegments } from '@/data/practice';
import { getPartColor } from '@/utils';
import classnames from 'classnames';
import { Repertoire } from '@/types';

const PracticeDetailPage: React.FC = () => {
  const router = useRouter();
  const [repertoire, setRepertoire] = useState<Repertoire | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(240);
  const [speed, setSpeed] = useState(1);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [activeLoop, setActiveLoop] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const partType = router.params.part || 'soprano';

  const partNames: Record<string, string> = {
    soprano: '女高音',
    alto: '女低音',
    tenor: '男高音',
    bass: '男低音',
  };

  useEffect(() => {
    const id = router.params.id;
    const found = repertoireList.find(r => r.id === id);
    if (found) {
      setRepertoire(found);
      Taro.setNavigationBarTitle({ title: found.title });
    }
  }, [router.params.id]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (loopEnabled && activeLoop) {
            const segment = loopSegments.find(s => s.id === activeLoop);
            if (segment && prev >= segment.endTime) {
              return segment.startTime;
            }
          }

          const newTime = prev + speed;
          if (newTime >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, speed, loopEnabled, activeLoop, duration]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    console.log('[Practice] 播放状态:', !isPlaying);
  };

  const handlePrev = () => {
    setCurrentTime(prev => Math.max(0, prev - 10));
  };

  const handleNext = () => {
    setCurrentTime(prev => Math.min(duration, prev + 10));
  };

  const handleSpeedChange = (value: number) => {
    setSpeed(value);
    console.log('[Practice] 速度切换:', value);
    Taro.showToast({
      title: `${value}x 速度`,
      icon: 'none',
      duration: 1000,
    });
  };

  const handleToggleLoop = () => {
    const newState = !loopEnabled;
    setLoopEnabled(newState);
    if (!newState) {
      setActiveLoop(null);
    }
    console.log('[Practice] 循环模式:', newState);
  };

  const handleLoopSelect = (loopId: string) => {
    if (!loopEnabled) {
      setLoopEnabled(true);
    }
    setActiveLoop(loopId === activeLoop ? null : loopId);

    const segment = loopSegments.find(s => s.id === loopId);
    if (segment) {
      setCurrentTime(segment.startTime);
    }
  };

  if (!repertoire) {
    return (
      <View className={styles.page}>
        <View style={{ textAlign: 'center', padding: '100rpx 0', color: '#fff' }}>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  const progress = (currentTime / duration) * 100;

  return (
    <View className={styles.page}>
      <View className={styles.coverSection}>
        <View className={styles.coverContainer}>
          <Image src={repertoire.cover} mode='aspectFill' />
          <View className={styles.coverOverlay} />
        </View>
        <Text className={styles.songTitle}>{repertoire.title}</Text>
        <Text className={styles.songSubtitle}>{repertoire.composer}</Text>
        <View
          className={styles.partBadge}
          style={{ backgroundColor: getPartColor(partType) }}
        >
          {partNames[partType] || '女高音'} 声部
        </View>
      </View>

      <View className={styles.progressSection}>
        <View className={styles.timeRow}>
          <Text className={styles.timeText}>{formatTime(currentTime)}</Text>
          <Text className={styles.timeText}>{formatTime(duration)}</Text>
        </View>
        <View className={styles.progressBar}>
          <View
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
          <View
            className={styles.progressHandle}
            style={{ left: `${progress}%` }}
          />
        </View>
      </View>

      <View className={styles.controls}>
        <View className={styles.controlBtn} onClick={handlePrev}>
          ⏮
        </View>
        <View className={styles.playBtn} onClick={handlePlay}>
          {isPlaying ? '⏸' : '▶'}
        </View>
        <View className={styles.controlBtn} onClick={handleNext}>
          ⏭
        </View>
      </View>

      <View className={styles.speedSection}>
        <Text className={styles.sectionLabel}>播放速度</Text>
        <View className={styles.speedOptions}>
          {speedOptions.map(option => (
            <View
              key={option.value}
              className={classnames(
                styles.speedOption,
                speed === option.value && styles.speedOptionActive
              )}
              onClick={() => handleSpeedChange(option.value)}
            >
              {option.label}
            </View>
          ))}
        </View>
      </View>

      <View className={styles.loopSection}>
        <View className={styles.loopHeader}>
          <Text className={styles.loopTitle}>难点片段循环</Text>
          <View
            className={classnames(
              styles.loopToggle,
              loopEnabled && styles.loopToggleActive
            )}
            onClick={handleToggleLoop}
          >
            {loopEnabled ? '已开启' : '未开启'}
          </View>
        </View>
        <View className={styles.loopList}>
          {loopSegments.map(segment => (
            <View
              key={segment.id}
              className={classnames(
                styles.loopItem,
                activeLoop === segment.id && styles.loopItemActive
              )}
              onClick={() => handleLoopSelect(segment.id)}
            >
              <View className={styles.loopInfo}>
                <Text className={styles.loopName}>{segment.name}</Text>
                <Text className={styles.loopTime}>
                  {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                </Text>
              </View>
              <Text className={styles.loopPlayIcon}>
                {activeLoop === segment.id ? '⏸' : '▶'}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.bottomTip}>
        <Text>💡 提示：先从慢速开始练习，熟练后再逐渐提高速度</Text>
      </View>
    </View>
  );
};

export default PracticeDetailPage;
