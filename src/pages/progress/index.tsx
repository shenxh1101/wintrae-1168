import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { userProgress, weeklyPracticeData } from '@/data/progress';
import { repertoireList } from '@/data/repertoire';
import { Task } from '@/types';
import { getProficiencyColor, formatDuration } from '@/utils';
import classnames from 'classnames';

const ProgressPage: React.FC = () => {
  const [checkedIn, setCheckedIn] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(userProgress.recentTasks);
  const [streak, setStreak] = useState(userProgress.streak);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastCheckIn = Taro.getStorageSync('lastCheckIn');
    if (lastCheckIn === today) {
      setCheckedIn(true);
    }
  }, []);

  const handleCheckIn = () => {
    if (checkedIn) {
      Taro.showToast({ title: '今日已打卡', icon: 'none' });
      return;
    }

    const today = new Date().toDateString();
    Taro.setStorageSync('lastCheckIn', today);
    setCheckedIn(true);
    setStreak(prev => prev + 1);

    Taro.showToast({ title: '打卡成功！', icon: 'success' });
    console.log('[Progress] 练习打卡成功');
  };

  const handleTaskToggle = (taskId: string) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
    );
  };

  const getTaskTypeText = (type: string) => {
    switch (type) {
      case 'practice':
        return '练习';
      case 'rehearsal':
        return '排练';
      case 'assignment':
        return '作业';
      default:
        return '任务';
    }
  };

  const isUrgent = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffDays = Math.ceil(
      (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 2 && diffDays >= 0;
  };

  const maxMinutes = Math.max(...weeklyPracticeData.map(d => d.minutes));
  const weeklyTotal = weeklyPracticeData.reduce((sum, d) => sum + d.minutes, 0);

  const sortedRepertoire = [...repertoireList].sort(
    (a, b) => (b.proficiency || 0) - (a.proficiency || 0)
  );

  const pendingTasks = tasks.filter(t => !t.completed).length;

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>🎵</View>
          <View className={styles.userDetails}>
            <Text className={styles.userName}>张同学</Text>
            <Text className={styles.userPart}>女高音 · 合唱团成员</Text>
          </View>
        </View>

        <View className={styles.checkInSection}>
          <View className={styles.streakInfo}>
            <Text className={styles.streakNumber}>{streak}</Text>
            <Text className={styles.streakLabel}>天连续练习</Text>
          </View>
          <View
            className={classnames(
              styles.checkInBtn,
              checkedIn && styles.checkInBtnDone
            )}
            onClick={handleCheckIn}
          >
            {checkedIn ? '已打卡 ✓' : '今日打卡'}
          </View>
        </View>
      </View>

      <View className={styles.statsSection}>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{userProgress.totalPracticeDays}</Text>
          <Text className={styles.statLabel}>练习天数</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{userProgress.totalPracticeHours}</Text>
          <Text className={styles.statLabel}>总时长(小时)</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{userProgress.masteredCount}</Text>
          <Text className={styles.statLabel}>已掌握</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{pendingTasks}</Text>
          <Text className={styles.statLabel}>待完成</Text>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>本周练习</Text>
          <Text className={styles.sectionMore}>共 {weeklyPracticeData.length} 天</Text>
        </View>
        <View className={styles.weeklyChart}>
          <View className={styles.chartBars}>
            {weeklyPracticeData.map((day, idx) => (
              <View key={idx} className={styles.chartBarItem}>
                <View
                  className={styles.chartBar}
                  style={{
                    height: `${(day.minutes / maxMinutes) * 100}%`,
                    minHeight: '8rpx',
                  }}
                />
                <Text className={styles.chartDay}>{day.day}</Text>
              </View>
            ))}
          </View>
          <View className={styles.chartTotal}>
            本周累计练习 <strong>{formatDuration(weeklyTotal)}</strong>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>近期任务</Text>
          <Text className={styles.sectionMore}>
            {pendingTasks} 项待完成
          </Text>
        </View>
        <View className={styles.taskList}>
          {tasks.map(task => (
            <View
              key={task.id}
              className={styles.taskItem}
              onClick={() => handleTaskToggle(task.id)}
            >
              <View
                className={classnames(
                  styles.taskCheckbox,
                  task.completed && styles.taskCheckboxDone
                )}
              >
                {task.completed && (
                  <Text className={styles.taskCheckIcon}>✓</Text>
                )}
              </View>
              <View className={styles.taskContent}>
                <Text
                  className={classnames(
                    styles.taskTitle,
                    task.completed && styles.taskTitleDone
                  )}
                >
                  {task.title}
                </Text>
                <View className={styles.taskMeta}>
                  <Text className={styles.taskType}>
                    {getTaskTypeText(task.type)}
                  </Text>
                  <Text
                    className={classnames(
                      styles.taskDeadline,
                      isUrgent(task.deadline) &&
                        !task.completed &&
                        styles.taskDeadlineUrgent
                    )}
                  >
                    截止：{task.deadline}
                  </Text>
                </View>
              </View>
            </View>
          ))}
          {tasks.length === 0 && (
            <View className={styles.empty}>
              <Text className={styles.emptyIcon}>✅</Text>
              <Text className={styles.emptyText}>暂无任务</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>曲目熟练度</Text>
          <Text className={styles.sectionMore}>共 {repertoireList.length} 首</Text>
        </View>
        <View className={styles.repertoireList}>
          {sortedRepertoire.slice(0, 5).map(rep => (
            <View key={rep.id} className={styles.repItem}>
              <Image
                className={styles.repCover}
                src={rep.cover}
                mode='aspectFill'
              />
              <View className={styles.repInfo}>
                <Text className={styles.repName}>{rep.title}</Text>
                <View className={styles.repProgress}>
                  <View className={styles.repProgressBar}>
                    <View
                      className={styles.repProgressFill}
                      style={{
                        width: `${rep.proficiency || 0}%`,
                        backgroundColor: getProficiencyColor(rep.proficiency || 0),
                      }}
                    />
                  </View>
                  <Text className={styles.repProgressText}>
                    {rep.proficiency || 0}%
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default ProgressPage;
