import React, { useMemo, useState } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useChoirStore, groupPracticeRecordsByVoicePart, aggregateDifficultSegments } from '@/store';
import { repertoireList } from '@/data/repertoire';
import { VoicePart, PracticeRecord } from '@/types';
import { getProficiencyColor, getPartColor } from '@/utils';

const partLabelMap: Record<VoicePart, string> = {
  soprano: '女高音',
  alto: '女低音',
  tenor: '男高音',
  bass: '男低音',
  full: '全合唱',
};

const PracticeArchivePage: React.FC = () => {
  const router = useRouter();
  const repertoireId = router.params.id || '';
  const filterPart = (router.params.part as VoicePart) || 'full';

  const { practiceRecords, repertoireProficiencies } = useChoirStore();
  const [activePart, setActivePart] = useState<VoicePart | 'all'>(
    filterPart === 'full' ? 'all' : filterPart
  );

  const repertoire = repertoireList.find((r) => r.id === repertoireId);
  const proficiency = repertoireProficiencies[repertoireId] || 0;

  const allRecords = useMemo(() => {
    return practiceRecords
      .filter((r) => r.repertoireId === repertoireId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [practiceRecords, repertoireId]);

  const displayedRecords = useMemo(
    () => (activePart === 'all' ? allRecords : allRecords.filter((r) => r.voicePart === activePart)),
    [allRecords, activePart]
  );

  const stats = useMemo(() => {
    const totalMin = allRecords.reduce((s, r) => s + r.durationMinutes, 0);
    const avgSpeed =
      allRecords.length > 0
        ? (allRecords.reduce((s, r) => s + r.speed, 0) / allRecords.length).toFixed(2)
        : '0';
    const byPart = groupPracticeRecordsByVoicePart(allRecords);
    const difficultyRanking = aggregateDifficultSegments(allRecords).slice(0, 5);
    const dateSet = new Set(allRecords.map((r) => r.date));
    return {
      totalMinutes: totalMin,
      sessions: allRecords.length,
      days: dateSet.size,
      avgSpeed,
      byPart,
      difficultyRanking,
    };
  }, [allRecords]);

  React.useEffect(() => {
    if (repertoire) {
      Taro.setNavigationBarTitle({ title: `练习档案 · ${repertoire.title}` });
    }
  }, [repertoire]);

  const goPractice = () => {
    Taro.navigateTo({ url: `/pages/practice-detail/index?id=${repertoireId}` });
  };

  if (!repertoire) {
    return (
      <View style={{ padding: 100, textAlign: 'center' }}>
        <Text>曲目不存在</Text>
      </View>
    );
  }

  const speedLabel = (s: number) =>
    `${(s * 100).toFixed(0)}%`;

  const proficiencyLabel = (p: number) => {
    if (p >= 85) return '非常熟练';
    if (p >= 60) return '掌握良好';
    if (p >= 30) return '学习中';
    return '刚开始';
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Image
            className={styles.cover}
            src={repertoire.cover}
            mode='aspectFill'
          />
          <View style={{ flex: 1 }}>
            <Text className={styles.title}>{repertoire.title}</Text>
            <Text className={styles.subtitle}>
              {repertoire.composer} · {repertoire.duration} · {repertoire.category}
            </Text>
          </View>
        </View>

        <View className={styles.proficiencyRow}>
          <View style={{ flex: 1 }}>
            <View
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 24, color: '#64748b' }}>熟练度</Text>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: getProficiencyColor(proficiency),
                }}
              >
                {proficiency}% · {proficiencyLabel(proficiency)}
              </Text>
            </View>
            <View className={styles.proficiencyBar}>
              <View
                className={styles.proficiencyFill}
                style={{
                  width: `${proficiency}%`,
                  background: getProficiencyColor(proficiency),
                }}
              />
            </View>
          </View>
        </View>

        <View className={styles.statsGrid}>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats.sessions}</Text>
            <Text className={styles.statLabel}>练习次数</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats.totalMinutes}</Text>
            <Text className={styles.statLabel}>累计分钟</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats.days}</Text>
            <Text className={styles.statLabel}>练习天数</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats.avgSpeed}x</Text>
            <Text className={styles.statLabel}>平均速度</Text>
          </View>
        </View>

        <View className={styles.goPracticeBtn} onClick={goPractice}>
          <Text style={{ fontSize: 28 }}>🎼 现在就去练习</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>声部视角</Text>
        <ScrollView scrollX className={styles.partTabs} showScrollbar={false}>
          {[
            { key: 'all', label: '全部' },
            ...Object.keys(partLabelMap).map((k) => ({ key: k, label: partLabelMap[k as VoicePart] })),
          ].map((p) => {
            const count =
              p.key === 'all'
                ? allRecords.length
                : stats.byPart[p.key as VoicePart].length;
            if (p.key !== 'all' && count === 0) return null;
            return (
              <View
                key={p.key}
                className={[styles.partTab, activePart === p.key && styles.partTabActive].join(' ')}
                style={
                  activePart === p.key && p.key !== 'all'
                    ? { background: getPartColor(p.key as VoicePart), borderColor: 'transparent' }
                    : {}
                }
                onClick={() => setActivePart(p.key as any)}
              >
                <Text>{p.label}</Text>
                <Text
                  style={{
                    fontSize: 20,
                    marginLeft: 8,
                    padding: '2rpx 12rpx',
                    borderRadius: 16,
                    background: activePart === p.key ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
                    color: activePart === p.key ? '#fff' : '#64748b',
                  }}
                >
                  {count}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {stats.difficultyRanking.length > 0 && (
        <View className={styles.section}>
          <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text className={styles.sectionTitle}>⚠️ 常卡点排行</Text>
            <Text style={{ fontSize: 22, color: '#94a3b8' }}>按出现次数排序</Text>
          </View>
          <View className={styles.difficultyList}>
            {stats.difficultyRanking.map((seg, idx) => (
              <View key={seg.id} className={styles.difficultyItem}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    background: `linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#991b1b',
                  }}
                >
                  {idx + 1}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 28, fontWeight: 600, color: '#1e293b' }}>
                    {seg.name}
                  </Text>
                  <Text style={{ fontSize: 22, color: '#64748b', marginTop: 4 }}>
                    {Math.floor(seg.startTime / 60)}:{String(seg.startTime % 60).padStart(2, '0')}
                    {' → '}
                    {Math.floor(seg.endTime / 60)}:{String(seg.endTime % 60).padStart(2, '0')}
                    {' · 累计卡在这段 '}
                    <Text style={{ color: '#dc2626', fontWeight: 700 }}>
                      {seg.occurredCount} 次
                    </Text>
                  </Text>
                </View>
                <View
                  onClick={() =>
                    Taro.navigateTo({
                      url: `/pages/practice-detail/index?id=${repertoireId}&loopId=${seg.id}`,
                    })
                  }
                  style={{
                    padding: '10rpx 20rpx',
                    background: '#fef2f2',
                    color: '#dc2626',
                    borderRadius: 20,
                    fontSize: 22,
                    fontWeight: 600,
                  }}
                >
                  针对性练 ›
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={styles.section}>
        <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text className={styles.sectionTitle}>📝 每次练习明细</Text>
          <Text style={{ fontSize: 22, color: '#94a3b8' }}>
            共 {displayedRecords.length} 条
          </Text>
        </View>

        {displayedRecords.length === 0 ? (
          <View
            style={{
              textAlign: 'center',
              padding: '80rpx 0',
              background: '#fff',
              borderRadius: 16,
            }}
          >
            <Text style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>🎤</Text>
            <Text style={{ color: '#94a3b8', display: 'block', marginBottom: 8 }}>
              {activePart === 'all' ? '还没练过这首曲目' : `${partLabelMap[activePart as VoicePart]}声部暂无记录`}
            </Text>
            <Text style={{ color: '#cbd5e1', fontSize: 22 }}>现在开始第一次练习吧！</Text>
          </View>
        ) : (
          displayedRecords.map((rec: PracticeRecord) => (
            <View key={rec.id} className={styles.recordCard}>
              <View className={styles.recordHeader}>
                <View
                  style={{
                    padding: '6rpx 16rpx',
                    background: getPartColor(rec.voicePart),
                    color: '#fff',
                    borderRadius: 16,
                    fontSize: 20,
                    fontWeight: 600,
                  }}
                >
                  {partLabelMap[rec.voicePart]}
                </View>
                <Text style={{ fontSize: 22, color: '#94a3b8' }}>
                  {rec.createdAt}
                </Text>
              </View>

              <View className={styles.recordMainStats}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 36, fontWeight: 700, color: '#6366f1' }}>
                    {rec.durationMinutes}
                  </Text>
                  <Text style={{ fontSize: 20, color: '#64748b' }}>分钟</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: 36,
                      fontWeight: 700,
                      color: rec.speed < 1 ? '#f59e0b' : rec.speed > 1 ? '#10b981' : '#6366f1',
                    }}
                  >
                    {speedLabel(rec.speed)}
                  </Text>
                  <Text style={{ fontSize: 20, color: '#64748b' }}>速度</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 36, fontWeight: 700, color: '#ec4899' }}>
                    {rec.loopSegments && rec.loopSegments.length > 0 ? rec.loopSegments.length : 0}
                  </Text>
                  <Text style={{ fontSize: 20, color: '#64748b' }}>循环段</Text>
                </View>
                {rec.proficiencyDelta ? (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 36, fontWeight: 700, color: '#10b981' }}>
                      +{rec.proficiencyDelta}
                    </Text>
                    <Text style={{ fontSize: 20, color: '#64748b' }}>熟练度</Text>
                  </View>
                ) : null}
              </View>

              {(rec.difficultSegments && rec.difficultSegments.length > 0) ||
              (rec.loopSegments && rec.loopSegments.length > 0) ? (
                <View className={styles.recordSegments}>
                  {rec.loopSegments && rec.loopSegments.length > 0 && (
                    <View style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text style={{ fontSize: 22, color: '#64748b' }}>重点练：</Text>
                      {rec.loopSegments.map((segName) => (
                        <View
                          key={segName}
                          style={{
                            padding: '4rpx 14rpx',
                            background: '#eef2ff',
                            color: '#6366f1',
                            fontSize: 20,
                            borderRadius: 14,
                            fontWeight: 500,
                          }}
                        >
                          {segName}
                        </View>
                      ))}
                    </View>
                  )}
                  {rec.difficultSegments && rec.difficultSegments.length > 0 && (
                    <View style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      <Text style={{ fontSize: 22, color: '#64748b' }}>卡住：</Text>
                      {rec.difficultSegments.map((seg) => (
                        <View
                          key={seg.id}
                          style={{
                            padding: '4rpx 14rpx',
                            background: '#fef2f2',
                            color: '#dc2626',
                            fontSize: 20,
                            borderRadius: 14,
                            fontWeight: 500,
                          }}
                        >
                          {seg.name}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ) : null}

              {rec.notes ? (
                <View className={styles.recordNotes}>
                  <Text style={{ fontSize: 22, color: '#64748b' }}>📝 备注：</Text>
                  <Text style={{ fontSize: 24, color: '#1e293b', lineHeight: 1.6 }}>{rec.notes}</Text>
                </View>
              ) : null}
            </View>
          ))
        )}
      </View>

      <View style={{ height: 60 }} />
    </View>
  );
};

export default PracticeArchivePage;
