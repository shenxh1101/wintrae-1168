import React, { useState, useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import ProgressRing from '@/components/ProgressRing';
import { repertoireList } from '@/data/repertoire';
import { rehearsalList } from '@/data/schedule';
import { useChoirStore } from '@/store';
import { getProficiencyColor, getDifficultyStars } from '@/utils';
import classnames from 'classnames';

const ProgressPage: React.FC = () => {
  const {
    checkInDates,
    addCheckIn,
    streak,
    totalPracticeDays,
    totalPracticeHours,
    repertoireProficiencies,
    setProficiency,
    tasks,
    toggleTask,
    practiceRecords,
    setRehearsals,
    rehearsals,
    setTasks,
  } = useChoirStore();

  const [selectedProficiency, setSelectedProficiency] = useState<string | null>(null);
  const [tempProficiency, setTempProficiency] = useState(0);

  React.useEffect(() => {
    if (rehearsals.length === 0) {
      setRehearsals(rehearsalList);
    }
  }, []);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const isCheckedInToday = checkInDates.includes(todayStr);

  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const record = practiceRecords.filter((r) => r.date === dateStr);
      const minutes = record.reduce((sum, r) => sum + r.durationMinutes, 0);
      days.push({
        date: dateStr,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        minutes,
        isToday: i === 0,
      });
    }
    return days;
  }, [practiceRecords, todayStr]);

  const maxMinutes = Math.max(...last7Days.map((d) => d.minutes), 60);

  const todayRepertoires = useMemo(() => {
    const upcomingIds = new Set(
      rehearsals
        .filter((r) => {
          const diff = (new Date(r.date).getTime() - today.getTime()) / (1000 * 3600 * 24);
          return diff >= 0 && diff < 4;
        })
        .flatMap((r) => r.repertoireIds)
    );
    const lowProf = repertoireList.filter(
      (r) => (repertoireProficiencies[r.id] || 0) < 60
    );
    const fromRehearsal = repertoireList.filter((r) => upcomingIds.has(r.id));
    const merged = [...fromRehearsal];
    lowProf.forEach((r) => {
      if (!merged.find((m) => m.id === r.id)) merged.push(r);
    });
    return merged.slice(0, 4);
  }, [rehearsals, repertoireList, repertoireProficiencies, today]);

  const upcomingRehearsals = useMemo(() => {
    return rehearsals
      .filter((r) => {
        const date = new Date(r.date);
        const diff = Math.ceil(
          (date.getTime() - today.getTime()) / (1000 * 3600 * 24)
        );
        return diff >= 0 && diff < 4;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [rehearsals, today]);

  const pendingTasks = useMemo(() => {
    if (tasks.length === 0) {
      const defaultTasks = [
        { id: 't1', title: '复习《黄河大合唱》副歌部分', completed: false, dueDate: todayStr, type: '练习' as const },
        { id: 't2', title: '参加本周六下午排练', completed: false, dueDate: todayStr, type: '排练' as const },
        { id: 't3', title: '完成《茉莉花》声部打卡', completed: false, dueDate: todayStr, type: '作业' as const },
      ];
      defaultTasks.forEach((t) => {
        if (!tasks.find((x) => x.id === t.id)) {
          setTasks([...tasks, t]);
        }
      });
    }
    return tasks.filter((t) => !t.completed).slice(0, 4);
  }, [tasks, todayStr, setTasks]);

  const handleCheckIn = () => {
    if (isCheckedInToday) {
      Taro.showToast({ title: '今天已打卡，继续加油！', icon: 'none' });
      return;
    }
    addCheckIn(todayStr);
    Taro.showToast({ title: '打卡成功 ✓', icon: 'success' });
    Taro.vibrateShort && Taro.vibrateShort({ type: 'medium' });
    console.log('[Progress] 打卡:', todayStr);
  };

  const handleSetProficiency = (repId: string) => {
    setProficiency(repId, tempProficiency);
    Taro.showToast({ title: '熟练度已更新', icon: 'success' });
    setSelectedProficiency(null);
    console.log('[Progress] 设置熟练度:', repId, tempProficiency);
  };

  const navigateTo = (url: string) => {
    Taro.switchTab({
      url,
      fail: () => {
        Taro.navigateTo({ url });
      },
    });
  };

  const totalMinutes = last7Days.reduce((s, d) => s + d.minutes, 0);
  const avgMinutes = last7Days.length > 0 ? Math.round(totalMinutes / last7Days.length) : 0;
  const completedTaskCount = tasks.filter((t) => t.completed).length;

  const repertoireProgressList = useMemo(() => {
    return repertoireList.map((rep) => ({
      ...rep,
      proficiency: repertoireProficiencies[rep.id] || Math.floor(Math.random() * 40) + 20,
    }));
  }, [repertoireList, repertoireProficiencies]);

  const getDayDiffText = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 3600 * 24));
    if (diff === 0) return '今天';
    if (diff === 1) return '明天';
    if (diff === 2) return '后天';
    return `${diff}天后`;
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>
            <Text style={{ fontSize: '44rpx' }}>🎵</Text>
          </View>
          <View className={styles.userText}>
            <Text className={styles.userName}>王思琪</Text>
            <Text className={styles.userPart}>女高音 · 第二声部长</Text>
          </View>
          <View
            className={classnames(styles.checkInBtn, isCheckedInToday && styles.checkedIn)}
            onClick={handleCheckIn}
          >
            <Text style={{ fontSize: '28rpx', marginRight: '6rpx' }}>
              {isCheckedInToday ? '✓' : '📅'}
            </Text>
            <Text>{isCheckedInToday ? '已打卡' : '打卡'}</Text>
          </View>
        </View>

        <View className={styles.streakRow}>
          <View className={styles.streakItem}>
            <ProgressRing percent={Math.min(streak / 30, 1) * 100} size={120} strokeWidth={10}>
              <View style={{ textAlign: 'center' }}>
                <Text
                  style={{
                    fontSize: '40rpx',
                    fontWeight: 700,
                    color: '#6366f1',
                    display: 'block',
                  }}
                >
                  {streak}
                </Text>
                <Text style={{ fontSize: '18rpx', color: '#64748b' }}>连续打卡</Text>
              </View>
            </ProgressRing>
          </View>
          <View className={styles.statsGrid}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{totalPracticeDays}</Text>
              <Text className={styles.statLabel}>累计天数</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{totalPracticeHours.toFixed(1)}</Text>
              <Text className={styles.statLabel}>练习小时</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{completedTaskCount}</Text>
              <Text className={styles.statLabel}>完成任务</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{avgMinutes}</Text>
              <Text className={styles.statLabel}>日均分</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ padding: '0 32rpx', marginTop: '-40rpx', position: 'relative', zIndex: 10 }}>
        <View
          style={{
            background: '#fff',
            borderRadius: '20rpx',
            padding: '28rpx',
            boxShadow: '0 8rpx 32rpx rgba(99, 102, 241, 0.12)',
          }}
        >
          <View
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24rpx',
            }}
          >
            <View style={{ display: 'flex', alignItems: 'center', gap: '10rpx' }}>
              <Text style={{ fontSize: '32rpx' }}>🎯</Text>
              <Text
                style={{
                  fontSize: '30rpx',
                  fontWeight: 700,
                  color: '#1e293b',
                }}
              >
                今日任务总览
              </Text>
            </View>
            <View
              style={{
                fontSize: '22rpx',
                color: '#6366f1',
                fontWeight: 500,
                background: '#eef2ff',
                padding: '6rpx 16rpx',
                borderRadius: '20rpx',
              }}
            >
              {todayRepertoires.length + upcomingRehearsals.length + pendingTasks.length} 项待办
            </View>
          </View>

          {todayRepertoires.length > 0 && (
            <View style={{ marginBottom: '24rpx' }}>
              <View
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8rpx',
                  marginBottom: '16rpx',
                }}
              >
                <Text style={{ fontSize: '24rpx' }}>🎼</Text>
                <Text style={{ fontSize: '24rpx', color: '#6366f1', fontWeight: 600 }}>
                  今日推荐练习曲目
                </Text>
              </View>
              <View style={{ display: 'flex', flexWrap: 'wrap', gap: '12rpx' }}>
                {todayRepertoires.map((rep) => (
                  <View
                    key={rep.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10rpx',
                      padding: '12rpx 16rpx',
                      background: '#f8fafc',
                      borderRadius: '12rpx',
                      flex: 1,
                      minWidth: '45%',
                    }}
                    onClick={() =>
                      Taro.navigateTo({ url: `/pages/practice-detail/index?id=${rep.id}` })
                    }
                  >
                    <Image
                      src={rep.cover}
                      style={{
                        width: '44rpx',
                        height: '44rpx',
                        borderRadius: '8rpx',
                        flexShrink: 0,
                      }}
                      mode='aspectFill'
                    />
                    <View style={{ flex: 1, overflow: 'hidden' }}>
                      <Text
                        style={{
                          fontSize: '24rpx',
                          color: '#1e293b',
                          fontWeight: 500,
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {rep.title}
                      </Text>
                      <View
                        style={{
                          marginTop: '2rpx',
                          height: '4rpx',
                          background: '#e2e8f0',
                          borderRadius: '2rpx',
                          overflow: 'hidden',
                        }}
                      >
                        <View
                          style={{
                            width: `${repertoireProficiencies[rep.id] || 30}%`,
                            height: '100%',
                            background: getProficiencyColor(
                              repertoireProficiencies[rep.id] || 30
                            ),
                            borderRadius: '2rpx',
                          }}
                        />
                      </View>
                    </View>
                    <Text style={{ color: '#6366f1', fontSize: '24rpx', flexShrink: 0 }}>
                      ›
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {upcomingRehearsals.length > 0 && (
            <View style={{ marginBottom: '24rpx' }}>
              <View
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8rpx',
                  marginBottom: '16rpx',
                }}
              >
                <Text style={{ fontSize: '24rpx' }}>📅</Text>
                <Text style={{ fontSize: '24rpx', color: '#10b981', fontWeight: 600 }}>
                  近期排练提醒
                </Text>
              </View>
              <View style={{ display: 'flex', flexDirection: 'column', gap: '12rpx' }}>
                {upcomingRehearsals.map((r) => (
                  <View
                    key={r.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16rpx 20rpx',
                      background:
                        'linear-gradient(90deg, rgba(16, 185, 129, 0.06) 0%, rgba(99, 102, 241, 0.06) 100%)',
                      borderRadius: '12rpx',
                    }}
                    onClick={() =>
                      Taro.navigateTo({
                        url: `/pages/schedule-detail/index?id=${r.id}`,
                      })
                    }
                  >
                    <View style={{ display: 'flex', alignItems: 'center', gap: '12rpx' }}>
                      <View
                        style={{
                          width: '56rpx',
                          height: '56rpx',
                          borderRadius: '12rpx',
                          background: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2rpx 8rpx rgba(0,0,0,0.06)',
                        }}
                      >
                        <Text style={{ fontSize: '26rpx' }}>🎭</Text>
                      </View>
                      <View>
                        <Text
                          style={{
                            fontSize: '26rpx',
                            fontWeight: 600,
                            color: '#1e293b',
                            display: 'block',
                          }}
                        >
                          {r.title}
                        </Text>
                        <Text style={{ fontSize: '20rpx', color: '#64748b' }}>
                          {r.date} {r.startTime} · {r.location}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{
                        fontSize: '20rpx',
                        color: r.signedIn ? '#10b981' : '#6366f1',
                        fontWeight: 600,
                        background: r.signedIn
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'rgba(99, 102, 241, 0.12)',
                        padding: '6rpx 14rpx',
                        borderRadius: '16rpx',
                      }}
                    >
                      {r.signedIn ? '已签到' : getDayDiffText(r.date)}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {pendingTasks.length > 0 && (
            <View>
              <View
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8rpx',
                  marginBottom: '16rpx',
                }}
              >
                <Text style={{ fontSize: '24rpx' }}>📋</Text>
                <Text style={{ fontSize: '24rpx', color: '#f59e0b', fontWeight: 600 }}>
                  待完成作业任务
                </Text>
              </View>
              <View style={{ display: 'flex', flexDirection: 'column', gap: '10rpx' }}>
                {pendingTasks.map((t) => (
                  <View
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14rpx',
                      padding: '14rpx 18rpx',
                      background: '#fffbeb',
                      borderRadius: '10rpx',
                      borderLeft: '4rpx solid #f59e0b',
                    }}
                    onClick={() => toggleTask(t.id)}
                  >
                    <View
                      style={{
                        width: '36rpx',
                        height: '36rpx',
                        borderRadius: '50%',
                        border: '2rpx solid #fcd34d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {t.completed && (
                        <Text
                          style={{ color: '#f59e0b', fontSize: '22rpx', fontWeight: 700 }}
                        >
                          ✓
                        </Text>
                      )}
                    </View>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: '24rpx',
                        color: t.completed ? '#94a3b8' : '#1e293b',
                        textDecoration: t.completed ? 'line-through' : 'none',
                      }}
                    >
                      {t.title}
                    </Text>
                    <View
                      style={{
                        fontSize: '18rpx',
                        color: '#f59e0b',
                        background: '#fef3c7',
                        padding: '4rpx 10rpx',
                        borderRadius: '10rpx',
                        flexShrink: 0,
                      }}
                    >
                      {t.type}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {todayRepertoires.length === 0 &&
            upcomingRehearsals.length === 0 &&
            pendingTasks.length === 0 && (
              <View style={{ textAlign: 'center', padding: '40rpx 0' }}>
                <Text style={{ fontSize: '44rpx', display: 'block', marginBottom: '12rpx' }}>🎉</Text>
                <Text style={{ color: '#10b981', fontSize: '26rpx', fontWeight: 500 }}>
                  太棒了！今日任务已全部完成
                </Text>
              </View>
            )}
        </View>
      </View>

      <View className={styles.chartSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>本周练习时长</Text>
          <View style={{ display: 'flex', alignItems: 'center', gap: '8rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#6366f1', fontWeight: 700 }}>
              {totalMinutes}
            </Text>
            <Text style={{ fontSize: '22rpx', color: '#94a3b8' }}>分钟 / 周</Text>
          </View>
        </View>

        <View className={styles.chartContainer}>
          {last7Days.map((day, idx) => (
            <View key={idx} className={styles.chartBarWrap}>
              <View className={styles.chartBarBg}>
                <View
                  className={classnames(styles.chartBar, day.isToday && styles.chartBarToday)}
                  style={{
                    height: `${(day.minutes / maxMinutes) * 100}%`,
                  }}
                />
              </View>
              <Text className={classnames(styles.chartLabel, day.isToday && styles.chartLabelToday)}>
                {day.label}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ textAlign: 'center', marginTop: '16rpx' }}>
          <Text style={{ fontSize: '22rpx', color: '#94a3b8' }}>
            共 {practiceRecords.length} 条练习记录，累计 {totalMinutes} 分钟
          </Text>
        </View>
      </View>

      <View className={styles.chartSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>曲目熟练度</Text>
          <Text
            style={{ fontSize: '22rpx', color: '#6366f1' }}
            onClick={() => navigateTo('/pages/repertoire/index')}
          >
            全部曲目 ›
          </Text>
        </View>

        <View className={styles.proficiencyList}>
          {repertoireProgressList.slice(0, 6).map((item) => (
            <View
              key={item.id}
              className={styles.proficiencyItem}
              onClick={() => {
                setSelectedProficiency(item.id);
                setTempProficiency(item.proficiency);
              }}
            >
              <Image
                className={styles.proficiencyCover}
                src={item.cover}
                mode='aspectFill'
              />
              <View className={styles.proficiencyInfo}>
                <View style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text className={styles.proficiencyName}>{item.title}</Text>
                  <Text
                    style={{
                      fontSize: '22rpx',
                      fontWeight: 600,
                      color: getProficiencyColor(item.proficiency),
                    }}
                  >
                    {item.proficiency}%
                  </Text>
                </View>
                <View style={{ display: 'flex', alignItems: 'center', gap: '8rpx', marginTop: '4rpx' }}>
                  <Text style={{ fontSize: '18rpx', color: '#f59e0b' }}>
                    {getDifficultyStars(item.difficulty)}
                  </Text>
                  <Text style={{ fontSize: '20rpx', color: '#94a3b8' }}>· {item.duration}</Text>
                </View>
                <View className={styles.proficiencyBar}>
                  <View
                    className={styles.proficiencyFill}
                    style={{
                      width: `${item.proficiency}%`,
                      background: getProficiencyColor(item.proficiency),
                    }}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {selectedProficiency && (
        <View
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48rpx',
          }}
          onClick={() => setSelectedProficiency(null)}
        >
          <View
            style={{
              width: '100%',
              maxWidth: '620rpx',
              background: '#fff',
              borderRadius: '20rpx',
              padding: '36rpx 32rpx',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Text
              style={{
                fontSize: '32rpx',
                fontWeight: 700,
                color: '#1e293b',
                display: 'block',
                marginBottom: '28rpx',
                textAlign: 'center',
              }}
            >
              调整曲目熟练度
            </Text>
            <View
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '24rpx',
                marginBottom: '20rpx',
              }}
            >
              <Text
                style={{
                  fontSize: '72rpx',
                  fontWeight: 800,
                  color: getProficiencyColor(tempProficiency),
                }}
              >
                {tempProficiency}
              </Text>
              <Text style={{ fontSize: '36rpx', color: '#94a3b8' }}>%</Text>
            </View>
            <Text
              style={{
                fontSize: '26rpx',
                color: '#64748b',
                textAlign: 'center',
                display: 'block',
                marginBottom: '28rpx',
              }}
            >
              {tempProficiency < 30
                ? '刚开始学习，继续加油！'
                : tempProficiency < 60
                ? '学习中，多练习会更好'
                : tempProficiency < 85
                ? '掌握得不错，继续巩固'
                : '非常熟练，可以登台表演了！'}
            </Text>
            <View
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0 16rpx',
                marginBottom: '32rpx',
              }}
            >
              <View style={{ textAlign: 'center' }}>
                <View
                  style={{
                    width: '48rpx',
                    height: '48rpx',
                    borderRadius: '50%',
                    background: tempProficiency >= 0 ? '#fee2e2' : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#ef4444',
                    fontSize: '32rpx',
                  }}
                  onClick={() => setTempProficiency(Math.max(0, tempProficiency - 5))}
                >
                  -
                </View>
                <Text style={{ fontSize: '20rpx', color: '#94a3b8', marginTop: '8rpx' }}>
                  -5%
                </Text>
              </View>
              <View style={{ textAlign: 'center' }}>
                <View
                  style={{
                    width: '48rpx',
                    height: '48rpx',
                    borderRadius: '50%',
                    background: '#dbeafe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#3b82f6',
                    fontSize: '28rpx',
                  }}
                  onClick={() => setTempProficiency(Math.max(0, tempProficiency - 1))}
                >
                  -
                </View>
                <Text style={{ fontSize: '20rpx', color: '#94a3b8', marginTop: '8rpx' }}>
                  -1%
                </Text>
              </View>
              <View style={{ textAlign: 'center' }}>
                <View
                  style={{
                    width: '48rpx',
                    height: '48rpx',
                    borderRadius: '50%',
                    background: '#dbeafe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#3b82f6',
                    fontSize: '28rpx',
                  }}
                  onClick={() => setTempProficiency(Math.min(100, tempProficiency + 1))}
                >
                  +
                </View>
                <Text style={{ fontSize: '20rpx', color: '#94a3b8', marginTop: '8rpx' }}>
                  +1%
                </Text>
              </View>
              <View style={{ textAlign: 'center' }}>
                <View
                  style={{
                    width: '48rpx',
                    height: '48rpx',
                    borderRadius: '50%',
                    background: '#d1fae5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#10b981',
                    fontSize: '32rpx',
                  }}
                  onClick={() => setTempProficiency(Math.min(100, tempProficiency + 5))}
                >
                  +
                </View>
                <Text style={{ fontSize: '20rpx', color: '#94a3b8', marginTop: '8rpx' }}>
                  +5%
                </Text>
              </View>
            </View>
            <View
              style={{
                width: '100%',
                height: '12rpx',
                background: '#f1f5f9',
                borderRadius: '6rpx',
                marginBottom: '16rpx',
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${tempProficiency}%`,
                  height: '100%',
                  background: getProficiencyColor(tempProficiency),
                  borderRadius: '6rpx',
                  transition: 'width 0.2s',
                }}
              />
            </View>
            <View style={{ display: 'flex', gap: '16rpx', marginTop: '36rpx' }}>
              <View
                style={{
                  flex: 1,
                  height: '88rpx',
                  borderRadius: '44rpx',
                  background: '#f1f5f9',
                  color: '#64748b',
                  fontSize: '28rpx',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => setSelectedProficiency(null)}
              >
                取消
              </View>
              <View
                style={{
                  flex: 1.5,
                  height: '88rpx',
                  borderRadius: '44rpx',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: '#fff',
                  fontSize: '28rpx',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8rpx 24rpx rgba(99, 102, 241, 0.35)',
                }}
                onClick={() => handleSetProficiency(selectedProficiency)}
              >
                保存熟练度
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default ProgressPage;
