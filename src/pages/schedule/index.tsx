import React, { useState, useEffect } from 'react';
import { View, Text, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import ScheduleCard from '@/components/ScheduleCard';
import { rehearsalList } from '@/data/schedule';
import { Rehearsal } from '@/types';
import classnames from 'classnames';

const SchedulePage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filteredRehearsals, setFilteredRehearsals] = useState<Rehearsal[]>([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [selectedRehearsal, setSelectedRehearsal] = useState<Rehearsal | null>(null);

  useEffect(() => {
    filterRehearsalsByMonth();
  }, [currentDate]);

  const filterRehearsalsByMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const filtered = rehearsalList.filter(r => {
      const date = new Date(r.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
    
    setFilteredRehearsals(filtered.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ));
  };

  const getRehearsalDates = () => {
    const dates: Set<string> = new Set();
    filteredRehearsals.forEach(r => {
      dates.add(r.date);
    });
    return dates;
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: { day: number; isCurrentMonth: boolean; date: string }[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: 0, isCurrentMonth: false, date: '' });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, isCurrentMonth: true, date: dateStr });
    }

    return days;
  };

  const isToday = (dateStr: string) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return dateStr === todayStr;
  };

  const isSelected = (dateStr: string) => {
    const selStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    return dateStr === selStr;
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleDayClick = (dateStr: string) => {
    if (dateStr) {
      setSelectedDate(new Date(dateStr));
    }
  };

  const handleSignIn = (rehearsal: Rehearsal) => {
    if (rehearsal.signedIn) {
      Taro.showToast({ title: '您已签到', icon: 'none' });
      return;
    }
    Taro.showToast({ title: '签到成功', icon: 'success' });
    console.log('[Schedule] 签到成功:', rehearsal.title);
  };

  const handleLeave = (rehearsal: Rehearsal) => {
    if (rehearsal.leaveApplied) {
      Taro.showToast({ title: '您已提交请假', icon: 'none' });
      return;
    }
    setSelectedRehearsal(rehearsal);
    setShowLeaveModal(true);
  };

  const submitLeave = () => {
    if (!leaveReason.trim()) {
      Taro.showToast({ title: '请填写请假原因', icon: 'none' });
      return;
    }
    console.log('[Schedule] 提交请假:', selectedRehearsal?.title, leaveReason);
    Taro.showToast({ title: '请假已提交', icon: 'success' });
    setShowLeaveModal(false);
    setLeaveReason('');
    setSelectedRehearsal(null);
  };

  const handleSeatMap = () => {
    Taro.showToast({ title: '座位图功能开发中', icon: 'none' });
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const rehearsalDates = getRehearsalDates();
  const calendarDays = generateCalendarDays();

  const upcomingCount = rehearsalList.filter(r => r.status === 'upcoming').length;

  return (
    <View className={styles.page}>
      <View className={styles.calendarSection}>
        <View className={styles.monthHeader}>
          <View className={styles.monthArrow} onClick={handlePrevMonth}>
            ‹
          </View>
          <Text className={styles.monthText}>
            {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
          </Text>
          <View className={styles.monthArrow} onClick={handleNextMonth}>
            ›
          </View>
        </View>

        <View className={styles.weekDays}>
          {weekDays.map((day, idx) => (
            <View key={idx} className={styles.weekDay}>
              {day}
            </View>
          ))}
        </View>

        <View className={styles.daysGrid}>
          {calendarDays.map((day, idx) => (
            <View
              key={idx}
              className={classnames(
                styles.dayItem,
                !day.isCurrentMonth && styles.dayEmpty,
                day.isCurrentMonth && isSelected(day.date) && styles.daySelected,
                day.isCurrentMonth && isToday(day.date) && styles.dayToday,
                day.isCurrentMonth && rehearsalDates.has(day.date) && styles.dayHasRehearsal
              )}
              onClick={() => day.isCurrentMonth && handleDayClick(day.date)}
            >
              <Text className={styles.dayNumber}>{day.day || ''}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.listSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>本月排练</Text>
          <Text className={styles.sectionCount}>
            共 {filteredRehearsals.length} 场
          </Text>
        </View>

        {filteredRehearsals.map(rehearsal => (
          <ScheduleCard
            key={rehearsal.id}
            rehearsal={rehearsal}
            onSignIn={() => handleSignIn(rehearsal)}
            onLeave={() => handleLeave(rehearsal)}
            onSeatMap={handleSeatMap}
          />
        ))}

        {filteredRehearsals.length === 0 && (
          <View style={{ textAlign: 'center', padding: '80rpx 0', color: '#94a3b8' }}>
            <Text style={{ fontSize: '48rpx', marginBottom: '16rpx', display: 'block' }}>📅</Text>
            <Text>本月暂无排练安排</Text>
          </View>
        )}
      </View>

      {showLeaveModal && (
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
            padding: '40rpx',
          }}
          onClick={() => setShowLeaveModal(false)}
        >
          <View
            className={styles.leaveModal}
            style={{
              background: '#fff',
              borderRadius: '16rpx',
              width: '100%',
              maxWidth: '600rpx',
            }}
            onClick={e => e.stopPropagation()}
          >
            <Text className={styles.leaveTitle}>提交请假</Text>
            <Textarea
              className={styles.leaveInput}
              placeholder='请输入请假原因...'
              value={leaveReason}
              onInput={e => setLeaveReason(e.detail.value)}
              maxlength={200}
            />
            <View className={styles.leaveActions}>
              <View
                className={classnames(styles.leaveBtn, styles.leaveCancel)}
                onClick={() => setShowLeaveModal(false)}
              >
                取消
              </View>
              <View
                className={classnames(styles.leaveBtn, styles.leaveSubmit)}
                onClick={submitLeave}
              >
                提交
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default SchedulePage;
