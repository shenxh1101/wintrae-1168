import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Slider } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { repertoireList } from '@/data/repertoire';
import { loopSegments, speedOptions } from '@/data/practice';
import { getPartColor } from '@/utils';
import { useAudioPlayer, LoopSegment } from '@/hooks/useAudioPlayer';
import { useChoirStore } from '@/store';
import { Repertoire, VoicePart, DifficultSegment } from '@/types';
import classnames from 'classnames';

const PracticeDetailPage: React.FC = () => {
  const router = useRouter();
  const [repertoire, setRepertoire] = useState<Repertoire | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [practiceConfirmed, setPracticeConfirmed] = useState(false);
  const [selectedDifficultSegments, setSelectedDifficultSegments] = useState<string[]>([]);
  const startTimeRef = useRef<number>(Date.now());

  const partType = ((router.params.part as string) || 'soprano') as VoicePart;

  const {
    addPracticeRecord,
  } = useChoirStore();

  const audio = useAudioPlayer(
    undefined,
    partType,
    loopSegments as LoopSegment[]
  );

  useEffect(() => {
    const id = router.params.id;
    const found = repertoireList.find((r) => r.id === id);
    if (found) {
      setRepertoire(found);
      Taro.setNavigationBarTitle({ title: `练习 - ${found.title}` });
      Taro.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#1e1b4b',
      });
    }
    startTimeRef.current = Date.now();
  }, [router.params.id]);

  useEffect(() => {
    if (!audio.isPlaying) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 60000);
      setElapsedMinutes(elapsed);
    }, 30000);
    return () => clearInterval(interval);
  }, [audio.isPlaying]);

  useEffect(() => {
    return () => {
      if (audio.isPlaying) {
        audio.pause();
      }
    };
  }, []);

  const handleBack = () => {
    audio.pause();
    Taro.navigateBack();
  };

  const handleSpeedChange = (value: number) => {
    audio.setSpeed(value);
    Taro.showToast({
      title: `已切换到 ${value}x 速度`,
      icon: 'none',
      duration: 1000,
    });
    console.log('[Practice] 速度切换:', value, 'x');
  };

  const handleToggleLoop = () => {
    audio.setLoopEnabled(!audio.loopEnabled);
    Taro.showToast({
      title: audio.loopEnabled ? '已关闭循环' : '已开启循环',
      icon: 'none',
      duration: 1000,
    });
  };

  const handleLoopSelect = (loopId: string) => {
    if (audio.activeLoopId === loopId) {
      audio.setActiveLoop(null);
      return;
    }
    audio.setActiveLoop(loopId);
    setSelectedDifficultSegments((prev) =>
      prev.includes(loopId) ? prev : [...prev, loopId]
    );
    Taro.showToast({
      title: '已选中难点片段',
      icon: 'none',
      duration: 800,
    });
    console.log('[Practice] 选中难点循环:', loopId);
  };

  const handleConfirmPractice = () => {
    if (!repertoire) return;
    const minutes = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 60000));

    const activeLoopNames = loopSegments
      .filter((s) => selectedDifficultSegments.includes(s.id) || audio.activeLoopId === s.id)
      .map((s) => s.name);

    const difficultSegments: DifficultSegment[] = (
      selectedDifficultSegments.includes(audio.activeLoopId || '')
        ? selectedDifficultSegments
        : audio.activeLoopId
        ? [...selectedDifficultSegments, audio.activeLoopId]
        : selectedDifficultSegments
    )
      .map((sid) => loopSegments.find((s) => s.id === sid))
      .filter(Boolean)
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        startTime: s.startTime,
        endTime: s.endTime,
      }));

    addPracticeRecord({
      repertoireId: repertoire.id,
      durationMinutes: minutes,
      voicePart: partType,
      speed: audio.speed,
      loopSegments: activeLoopNames,
      difficultSegments,
      notes: minutes >= 10 ? (audio.speed < 1 ? '使用慢速练习' : audio.speed > 1 ? '提速练习完成' : '正常速度练习') : '短练一次',
    });
    setPracticeConfirmed(true);
    Taro.showToast({
      title: `已记录 ${minutes} 分钟练习`,
      icon: 'success',
    });
    console.log('[Practice] 确认练习完成:', minutes, '分钟, 速度:', audio.speed, '声部:', partType);
  };

  const handleProgressChange = (e: any) => {
    const percent = e.detail.value;
    const targetTime = (percent / 100) * (audio.duration || 240);
    audio.seek(targetTime);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getPartName = (type: string) => {
    const names: Record<string, string> = {
      soprano: '女高音',
      alto: '女低音',
      tenor: '男高音',
      bass: '男低音',
    };
    return names[type] || type;
  };

  const progressPercent = audio.duration
    ? (audio.currentTime / audio.duration) * 100
    : 0;

  const duration = audio.duration || 240;

  if (!repertoire) {
    return (
      <View className={styles.page}>
        <View style={{ textAlign: 'center', padding: '100rpx 0', color: '#fff' }}>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.pageHeader}>
        <View className={styles.backBtn} onClick={handleBack}>
          ‹
        </View>
        <Text className={styles.headerTitle}>跟练模式</Text>
        <View className={styles.headerAction} onClick={() => Taro.showToast({ title: '练习模式帮助', icon: 'none' })}>
          ?
        </View>
      </View>

      <View className={styles.coverSection}>
        <View
          className={classnames(styles.coverContainer, audio.isPlaying && styles.playing)}
        >
          <Image src={repertoire.cover} mode='aspectFill' />
          <View className={styles.coverHole} />
        </View>
        <Text className={styles.songTitle}>{repertoire.title}</Text>
        <Text className={styles.songSubtitle}>{repertoire.composer}</Text>
        <View
          className={styles.partBadge}
          style={{ backgroundColor: getPartColor(partType) }}
        >
          🎤 {getPartName(partType)} · 跟练
        </View>
        <View className={styles.practiceStats}>
          <View className={styles.statCol}>
            <Text className={styles.statValue}>
              {Math.floor((Date.now() - startTimeRef.current) / 60000)}分
            </Text>
            <Text className={styles.statLabel}>已练习</Text>
          </View>
          <View className={styles.statCol}>
            <Text className={styles.statValue}>{audio.speed}x</Text>
            <Text className={styles.statLabel}>播放速度</Text>
          </View>
          <View className={styles.statCol}>
            <Text className={styles.statValue}>
              {audio.activeLoopId ? '循环中' : '正常'}
            </Text>
            <Text className={styles.statLabel}>模式</Text>
          </View>
        </View>
      </View>

      <View className={styles.progressSection}>
        <View className={styles.timeRow}>
          <Text className={styles.timeText}>{formatTime(audio.currentTime)}</Text>
          <Text className={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        <Slider
          min={0}
          max={100}
          step={0.1}
          value={progressPercent}
          activeColor='#6366f1'
          backgroundColor='rgba(255,255,255,0.1)'
          blockColor='#ffffff'
          blockSize={22}
          onChange={handleProgressChange}
          style={{ margin: 0, padding: 0 }}
        />

        {loopSegments.length > 0 && (
          <View className={styles.loopMarkers}>
            {loopSegments.map((seg) => (
              <View
                key={seg.id}
                className={classnames(
                  styles.loopMarker,
                  audio.activeLoopId === seg.id && styles.active
                )}
                style={{
                  left: `${(seg.startTime / duration) * 100}%`,
                  width: `${((seg.endTime - seg.startTime) / duration) * 100}%`,
                  opacity: audio.activeLoopId === seg.id ? 1 : 0.5,
                }}
              />
            ))}
          </View>
        )}
      </View>

      <View className={styles.controls}>
        <View className={styles.controlBtn} onClick={() => audio.skipBackward(15)}>
          ⏮
        </View>
        <View
          className={styles.playBtn}
          onClick={() => {
            audio.togglePlay();
            if (!audio.isPlaying) {
              startTimeRef.current = Date.now() - elapsedMinutes * 60000;
            }
          }}
        >
          {audio.isPlaying ? '⏸' : '▶'}
        </View>
        <View className={styles.controlBtn} onClick={() => audio.skipForward(15)}>
          ⏭
        </View>
      </View>

      <View className={styles.bottomPanels}>
        <View className={styles.panel}>
          <View className={styles.panelHeader}>
            <Text className={styles.panelTitle}>
              <Text className={styles.panelIcon}>⚡</Text>播放速度
            </Text>
          </View>
          <View className={styles.speedOptions}>
            {speedOptions.map((opt) => (
              <View
                key={opt.value}
                className={classnames(
                  styles.speedOption,
                  audio.speed === opt.value && styles.active
                )}
                onClick={() => handleSpeedChange(opt.value)}
              >
                {opt.label}
              </View>
            ))}
          </View>
        </View>

        <View className={styles.panel}>
          <View className={styles.panelHeader}>
            <Text className={styles.panelTitle}>
              <Text className={styles.panelIcon}>🔁</Text>难点片段循环
            </Text>
            <View
              className={classnames(
                styles.toggleSwitch,
                audio.loopEnabled && styles.active
              )}
              onClick={handleToggleLoop}
            >
              {audio.loopEnabled ? '已开启' : '未开启'}
            </View>
          </View>
          <View className={styles.loopList}>
            {loopSegments.map((seg) => (
              <View
                key={seg.id}
                className={classnames(
                  styles.loopItem,
                  audio.activeLoopId === seg.id && styles.active
                )}
                onClick={() => handleLoopSelect(seg.id)}
              >
                <View className={styles.loopInfo}>
                  <Text className={styles.loopName}>🎯 {seg.name}</Text>
                  <Text className={styles.loopTime}>
                    {formatTime(seg.startTime)} - {formatTime(seg.endTime)}（共 {seg.endTime - seg.startTime} 秒）
                  </Text>
                </View>
                <View className={styles.loopActions}>
                  <View
                    className={styles.playSmall}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (audio.activeLoopId !== seg.id) {
                        handleLoopSelect(seg.id);
                      }
                      audio.play();
                    }}
                  >
                    {audio.activeLoopId === seg.id && audio.isPlaying ? '⏸' : '▶'}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {elapsedMinutes >= 1 && !practiceConfirmed ? (
        <View className={styles.confirmBar}>
          <View className={styles.confirmInfo}>
            <Text className={styles.confirmText}>已练习 {elapsedMinutes} 分钟</Text>
            <Text className={styles.confirmSubtext}>点击确认记录本次练习并更新熟练度</Text>
          </View>
          <View className={styles.confirmBtn} onClick={handleConfirmPractice}>
            确认完成 ✓
          </View>
        </View>
      ) : null}

      {practiceConfirmed && (
        <View
          className={styles.confirmBar}
          style={{ background: 'rgba(16, 185, 129, 0.2)', borderColor: 'rgba(16, 185, 129, 0.4)' }}
        >
          <View className={styles.confirmInfo}>
            <Text className={styles.confirmText}>✓ 练习已记录</Text>
            <Text className={styles.confirmSubtext}>
              熟练度 +{Math.ceil(elapsedMinutes / 5)}%，继续加油！
            </Text>
          </View>
        </View>
      )}

      <View className={styles.tipBar}>
        💡 建议从 0.75x 慢速开始跟练，熟练后再逐步加速到 1.0x
        {'\n'}选中难点片段可反复循环练习
      </View>
    </View>
  );
};

export default PracticeDetailPage;
