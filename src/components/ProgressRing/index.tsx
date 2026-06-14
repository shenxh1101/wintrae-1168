import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color = '#6366f1',
  label,
}) => {
  const percentage = Math.min(100, (value / max) * 100);
  const sizePx = size;

  const circumference = 2 * Math.PI * (sizePx / 2 - strokeWidth / 2);
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <View
      className={styles.ringContainer}
      style={{ width: `${sizePx}rpx`, height: `${sizePx}rpx` }}
    >
      <View
        className={styles.ringBg}
        style={{
          border: `${strokeWidth}rpx solid #e2e8f0`,
        }}
      />
      <View
        className={styles.ringProgress}
        style={{
          background: `conic-gradient(${color} ${percentage}%, transparent 0)`,
          WebkitMask: `radial-gradient(transparent ${sizePx / 2 - strokeWidth}rpx, black ${sizePx / 2 - strokeWidth + 1}rpx)`,
          mask: `radial-gradient(transparent ${sizePx / 2 - strokeWidth}rpx, black ${sizePx / 2 - strokeWidth + 1}rpx)`,
        }}
      />
      <View className={styles.ringInner}>
        <Text className={styles.ringValue}>{Math.round(value)}</Text>
        {label && <Text className={styles.ringLabel}>{label}</Text>}
      </View>
    </View>
  );
};

export default ProgressRing;
