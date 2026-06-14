import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import ScheduleCard from '@/components/ScheduleCard';
import SeatMap from '@/components/SeatMap';
import { rehearsalList as defaultRehearsals } from '@/data/schedule';
import { Rehearsal } from '@/types';
import { useChoirStore } from '@/store';
import classnames from 'classnames';

type RehearsalWithLeave = Rehearsal & { leaveReason?: string };

const SchedulePage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showSeatMapModal, setShowSeatMapModal] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [selectedRehearsal, setSelectedRehearsal] = useState<RehearsalWithLeave | null>(null);
  const [seatMapRehearsalId, setSeatMapRehearsalId] = useState<string | null>(null);

  const {
    rehearsals,
    setRehearsals,
    signIn,
    submitLeave,
  } = useChoirStore();

  useEffect(() => {
    if (rehearsals.length === 0) {
      setRehearsals(defaultRehearsals as RehearsalWithLeave[]);
    }
  }, [rehearsals.length, setRehearsals]);

  const monthRehearsals = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return rehearsals
      .filter((r) => {
        const d = new Date(r.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [currentDate, rehearsals]);

  const rehearsalDates = useMemo(() => {
    const dates = new Set<string>();
    monthRehearsals.forEach((r) => dates.add(r.date));
    return dates;
  }, [monthRehearsals]);

  const calendarDays = useMemo(() => {
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
  }, [currentDate]);

  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const isToday = (dateStr: string) => formatDate(new Date()) === dateStr;
  const isSelected = (dateStr: string) => formatDate(selectedDate) === dateStr;

  const handleSignIn = (rehearsal: RehearsalWithLeave) => {
    if (rehearsal.signedIn) {
      Taro.showToast({ title: '您已签到，状态已同步', icon: 'none' });
      return;
    }
    signIn(rehearsal.id);
    Taro.showToast({ title: '签到成功 ✓', icon: 'success' });
    Taro.vibrateShort && Taro.vibrateShort({ type: 'medium' });
    console.log('[Schedule] 签到:', rehearsal.title);
  };

  const handleLeave = (rehearsal: RehearsalWithLeave) => {
    if (rehearsal.leaveApplied) {
      Taro.showModal({
        title: '请假记录',
        content: `您已申请请假\n原因：${rehearsal.leaveReason || '未填写'}`,
        showCancel: false,
      });
      return;
    }
    setSelectedRehearsal(rehearsal);
    setLeaveReason('');
    setShowLeaveModal(true);
  };

  const submitLeaveForm = () => {
    if (!leaveReason.trim()) {
      Taro.showToast({ title: '请填写请假原因', icon: 'none' });
      return;
    }
    if (selectedRehearsal) {
      submitLeave(selectedRehearsal.id, leaveReason.trim());
      Taro.showToast({ title: '请假已提交', icon: 'success' });
      console.log('[Schedule] 请假提交:', selectedRehearsal.title, leaveReason);
    }
    setShowLeaveModal(false);
    setSelectedRehearsal(null);
    setLeaveReason('');
  };

  const handleSeatMap = (rehearsalId: string) => {
    setSeatMapRehearsalId(rehearsalId);
    setShowSeatMapModal(true);
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const upcomingCount = rehearsals.filter((r) => r.status === 'upcoming').length;
  const attendedCount = rehearsals.filter((r) => r.signedIn).length;

  return (
    <View className={styles.page}>
      <View className={styles.calendarSection}>
        <View className={styles.monthHeader}>
          <View
            className={styles.monthArrow}
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
          >
            ‹
          </View>
          <Text className={styles.monthText}>
            {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
          </Text>
          <View
            className={styles.monthArrow}
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
          >
            ›
          </View>
        </View>

        <View className={styles.weekDays}>
          {weekDays.map((d, i) => (
            <View key={i} className={styles.weekDay}>
              {d}
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
              onClick={() => day.isCurrentMonth && setSelectedDate(new Date(day.date))}
            >
              <Text className={styles.dayNumber}>{day.day || ''}</Text>
            </View>
          ))}
        </View>

        <View style={{ display: 'flex', gap: '24rpx', marginTop: '24rpx' }}>
          <View style={{ flex: 1, textAlign: 'center', padding: '16rpx', background: '#eef2ff', borderRadius: '12rpx' }}>
            <View style={{ fontSize: '32rpx', fontWeight: 700, color: '#6366f1' }}>{upcomingCount}</View>
            <View style={{ fontSize: '22rpx', color: '#64748b' }}>待排练</View>
          </View>
          <View style={{ flex: 1, textAlign: 'center', padding: '16rpx', background: '#ecfdf5', borderRadius: '12rpx' }}>
            <View style={{ fontSize: '32rpx', fontWeight: 700, color: '#10b981' }}>{attendedCount}</View>
            <View style={{ fontSize: '22rpx', color: '#64748b' }}>已签到</View>
          </View>
          <View style={{ flex: 1, textAlign: 'center', padding: '16rpx', background: '#fef2f2', borderRadius: '12rpx' }}>
            <View style={{ fontSize: '32rpx', fontWeight: 700, color: '#ef4444' }}>
              {rehearsals.filter((r) => r.leaveApplied).length}
            </View>
            <View style={{ fontSize: '22rpx', color: '#64748b' }}>请假</View>
          </View>
        </View>
      </View>

      <View className={styles.listSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>本月排练安排</Text>
          <Text className={styles.sectionCount}>共 {monthRehearsals.length} 场</Text>
        </View>

        {monthRehearsals.map((r) => (
          <ScheduleCard
            key={r.id}
            rehearsal={r}
            onSignIn={() => handleSignIn(r)}
            onLeave={() => handleLeave(r)}
            onSeatMap={() => handleSeatMap(r.id)}
          />
        ))}

        {monthRehearsals.length === 0 && (
          <View
            style={{
              textAlign: 'center',
              padding: '80rpx 0',
              background: '#fff',
              borderRadius: '16rpx',
            }}
          >
            <Text style={{ fontSize: '48rpx', marginBottom: '16rpx', display: 'block' }}>📅</Text>
            <Text style={{ color: '#94a3b8' }}>本月暂无排练安排</Text>
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
            style={{ background: '#fff', borderRadius: '16rpx', width: '100%', maxWidth: '600rpx' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Text className={styles.leaveTitle}>提交请假申请</Text>
            <View style={{ fontSize: '26rpx', color: '#64748b', marginBottom: '20rpx' }}>
              排练：{selectedRehearsal?.title}
              {'\n'}
              时间：{selectedRehearsal?.date} {selectedRehearsal?.startTime}
            </View>
            <Textarea
              className={styles.leaveInput}
              placeholder='请详细说明请假原因（如病假、事假等）...'
              value={leaveReason}
              onInput={(e) => setLeaveReason(e.detail.value)}
              maxlength={200}
              style={{ width: '100%', minHeight: '160rpx', padding: '16rpx', border: '1rpx solid #e2e8f0', borderRadius: '12rpx', fontSize: '28rpx', marginBottom: '24rpx', background: '#f8fafc', boxSizing: 'border-box' }}
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
                onClick={submitLeaveForm}
              >
                提交请假
              </View>
            </View>
          </View>
        </View>
      )}

      {showSeatMapModal && (
        <View
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32rpx',
          }}
          onClick={() => setShowSeatMapModal(false)}
        >
          <View
            style={{
              width: '100%',
              maxWidth: '700rpx',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <SeatMap mySeatId='s2' />
            <View
              style={{
                marginTop: '20rpx',
                height: '80rpx',
                background: '#fff',
                borderRadius: '40rpx',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28rpx',
                color: '#6366f1',
                fontWeight: 600,
              }}
              onClick={() => setShowSeatMapModal(false)}
            >
              关闭
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default SchedulePage;
