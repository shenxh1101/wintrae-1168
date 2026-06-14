import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, Slider } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { repertoireList } from '@/data/repertoire';
import { Repertoire } from '@/types';
import { getDifficultyStars, getPartColor, getProficiencyColor } from '@/utils';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useChoirStore } from '@/store';
import classnames from 'classnames';

const NOTES_PATTERN = [
  'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
  'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5',
  '♪', '♫', '♬', '♩',
];

const generateNotesForPage = (page: number) => {
  const notes: string[] = [];
  const count = 18 + (page % 3) * 4;
  for (let i = 0; i < count; i++) {
    const idx = (page * 7 + i * 3) % NOTES_PATTERN.length;
    notes.push(NOTES_PATTERN[idx]);
  }
  return notes;
};

const RepertoireDetailPage: React.FC = () => {
  const router = useRouter();
  const [repertoire, setRepertoire] = useState<Repertoire | null>(null);
  const [scorePage, setScorePage] = useState(1);
  const [activePart, setActivePart] = useState<string | null>(null);
  const [showProfEditor, setShowProfEditor] = useState(false);
  const [localProficiency, setLocalProficiency] = useState(0);

  const {
    repertoireProficiencies,
    setProficiency,
    incrementProficiency,
  } = useChoirStore();

  const audio = useAudioPlayer(
    activePart ? repertoire?.parts.find((p) => p.type === activePart)?.audioUrl : undefined,
    activePart || undefined
  );

  useEffect(() => {
    const id = router.params.id;
    const found = repertoireList.find((r) => r.id === id);
    if (found) {
      setRepertoire(found);
      Taro.setNavigationBarTitle({ title: found.title });
      const storedProf = repertoireProficiencies[found.id];
      const initialProf = storedProf !== undefined ? storedProf : found.proficiency || 0;
      setLocalProficiency(initialProf);
    }
  }, [router.params.id]);

  useDidShow(() => {
    if (repertoire) {
      const storedProf = repertoireProficiencies[repertoire.id];
      if (storedProf !== undefined) {
        setLocalProficiency(storedProf);
      }
    }
  });

  useEffect(() => {
    if (repertoire) {
      const storedProf = repertoireProficiencies[repertoire.id];
      const initialProf = storedProf !== undefined ? storedProf : repertoire.proficiency || 0;
      setLocalProficiency(initialProf);
    }
  }, [repertoire, repertoireProficiencies]);

  const currentProficiency = repertoire
    ? repertoireProficiencies[repertoire.id] !== undefined
      ? repertoireProficiencies[repertoire.id]
      : localProficiency
    : 0;

  const totalPages = repertoire?.pages || 1;
  const notes = useMemo(() => generateNotesForPage(scorePage), [scorePage]);

  const handlePlayPart = (partType: string) => {
    if (activePart === partType && audio.isPlaying) {
      audio.pause();
      setActivePart(null);
      return;
    }
    setActivePart(partType);
    setTimeout(() => {
      audio.seek(0);
      audio.play();
    }, 100);
    incrementProficiency(repertoire?.id || '', 1);
    setLocalProficiency((prev) => prev + 1);
    console.log('[RepertoireDetail] 播放声部:', partType);
  };

  const handlePrevPage = () => {
    if (scorePage > 1) setScorePage(scorePage - 1);
  };

  const handleNextPage = () => {
    if (scorePage < totalPages) setScorePage(scorePage + 1);
  };

  const handlePractice = () => {
    if (repertoire) {
      const partToUse = activePart || 'soprano';
      audio.pause();
      Taro.navigateTo({
        url: `/pages/practice-detail/index?id=${repertoire.id}&part=${partToUse}`,
      });
    }
  };

  const handleSaveProficiency = (value: number) => {
    if (repertoire) {
      setProficiency(repertoire.id, value);
      setLocalProficiency(value);
    }
  };

  const handleStarClick = (star: number) => {
    const value = star * 20;
    handleSaveProficiency(value);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
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

  const proficiencyColor = getProficiencyColor(currentProficiency);
  const starCount = Math.ceil(currentProficiency / 20);

  if (!repertoire) {
    return (
      <View className={styles.page}>
        <View style={{ textAlign: 'center', padding: '100rpx 0' }}>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Image className={styles.cover} src={repertoire.cover} mode='aspectFill' />
        <View className={styles.coverOverlay} />
        <View
          className={styles.proficiencyBadge}
          onClick={() => setShowProfEditor(!showProfEditor)}
        >
          熟练度 {currentProficiency}%
        </View>
        <View className={styles.headerInfo}>
          <View className={styles.titleRow}>
            <Text className={styles.title}>{repertoire.title}</Text>
            <View className={styles.categoryTag}>{repertoire.category}</View>
          </View>
          <Text className={styles.subtitle}>
            {repertoire.composer} · 难度 {getDifficultyStars(repertoire.difficulty)}
          </Text>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📋</Text>曲目简介
          </Text>
        </View>
        <Text className={styles.description}>{repertoire.description}</Text>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>ℹ️</Text>基本信息
          </Text>
        </View>
        <View className={styles.infoGrid}>
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
            <Text className={styles.infoValue}>{repertoire.parts.length}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>上次练习</Text>
            <Text className={styles.infoValue}>{repertoire.lastPracticed || '暂无'}</Text>
          </View>
        </View>

        {showProfEditor && (
          <>
            <View className={styles.proficiencySelector}>
              <View className={styles.profSlider}>
                <View
                  className={styles.profFill}
                  style={{ width: `${currentProficiency}%`, backgroundColor: proficiencyColor }}
                />
              </View>
              <Text className={styles.profLabel}>{currentProficiency}%</Text>
            </View>
            <Slider
              min={0}
              max={100}
              step={5}
              value={currentProficiency}
              activeColor={proficiencyColor}
              blockColor={proficiencyColor}
              onChange={(e) => handleSaveProficiency(e.detail.value)}
              style={{ marginTop: '20rpx' }}
            />
            <View className={styles.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Text
                  key={s}
                  className={classnames(styles.star, s <= starCount && styles.active)}
                  onClick={() => handleStarClick(s)}
                >
                  ★
                </Text>
              ))}
            </View>
          </>
        )}
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>🎼</Text>乐谱预览
          </Text>
          <Text className={styles.sectionAction} onClick={() => Taro.previewImage({ urls: [repertoire.cover] })}>
            全屏查看
          </Text>
        </View>
        <View className={styles.scoreViewer}>
          <View className={styles.scorePage}>
            <View className={styles.staffLine} />
            <View className={styles.staffLine} />
            <View className={styles.staffLine} />
            <View className={styles.staffLine} />
            <View className={styles.staffLine} />
            <View className={styles.clef}>𝄞</View>
            <View className={styles.notes}>
              {notes.map((n, i) => (
                <Text key={i} className={styles.note}>{n}</Text>
              ))}
            </View>
          </View>
          <View className={styles.pageNav}>
            <View
              className={classnames(styles.pageBtn, scorePage <= 1 && styles.disabled)}
              onClick={handlePrevPage}
            >
              ← 上一页
            </View>
            <Text className={styles.pageInfo}>
              第 {scorePage} / {totalPages} 页
            </Text>
            <View
              className={classnames(styles.pageBtn, scorePage >= totalPages && styles.disabled)}
              onClick={handleNextPage}
            >
              下一页 →
            </View>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>�</Text>分声部示范
          </Text>
        </View>

        <View className={styles.audioSection}>
          <View className={styles.fullPlayer}>
            <View className={styles.fullPlayerHeader}>
              <Text className={styles.fullPlayerTitle}>
                {activePart
                  ? `${getPartName(activePart)}声部示范 · ${repertoire.title}`
                  : '全曲示范音频'}
              </Text>
              <Text className={styles.fullPlayerTime}>
                {formatTime(audio.currentTime)} / {formatTime(audio.duration || 240)}
              </Text>
            </View>
            <View className={styles.fullPlayerProgress}>
              <View
                className={styles.fullPlayerFill}
                style={{
                  width: `${(audio.currentTime / (audio.duration || 240)) * 100}%`,
                }}
              />
            </View>
            <View className={styles.fullPlayerControls}>
              <View className={styles.ctrlBtn} onClick={() => audio.skipBackward(10)}>
                ⏮
              </View>
              <View
                className={classnames(styles.ctrlBtn, styles.playBtnMain)}
                onClick={audio.togglePlay}
              >
                {audio.isPlaying ? '⏸' : '▶'}
              </View>
              <View className={styles.ctrlBtn} onClick={() => audio.skipForward(10)}>
                ⏭
              </View>
            </View>
          </View>

          <View className={styles.partsList}>
            {repertoire.parts.map((part) => {
              const isActive = activePart === part.type;
              const isPlaying = isActive && audio.isPlaying;
              return (
                <View
                  key={part.id}
                  className={classnames(styles.partItem, isActive && styles.active)}
                >
                  <View
                    className={styles.partColor}
                    style={{ backgroundColor: getPartColor(part.type) }}
                  />
                  <View className={styles.partInfo}>
                    <Text className={styles.partName}>{part.name} 声部</Text>
                    <Text className={styles.partDesc}>
                      {isPlaying ? '正在播放中...' : '点击播放单独声部示范'}
                    </Text>
                  </View>
                  {isPlaying && <Text className={styles.playState}>播放中</Text>}
                  <View className={styles.playIcon} onClick={() => handlePlayPart(part.type)}>
                    {isPlaying ? '⏸' : '▶'}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View className={styles.actionBar}>
        <View
          className={classnames(styles.actionBtn, styles.btnTertiary)}
          onClick={() => Taro.previewImage({ urls: [repertoire.cover] })}
        >
          📄 乐谱
        </View>
        <View
          className={classnames(styles.actionBtn, styles.btnSecondary)}
          onClick={() => setShowProfEditor(!showProfEditor)}
        >
          ⭐ 标记熟练度
        </View>
        <View className={classnames(styles.actionBtn, styles.btnPrimary)} onClick={handlePractice}>
          🎤 进入跟练
        </View>
      </View>
    </View>
  );
};

export default RepertoireDetailPage;
