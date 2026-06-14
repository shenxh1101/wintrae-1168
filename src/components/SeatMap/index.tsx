import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import { getPartColor } from '@/utils';
import classnames from 'classnames';

interface Seat {
  id: string;
  name: string;
  part: 'soprano' | 'alto' | 'tenor' | 'bass';
  row: number;
  col: number;
  isMe?: boolean;
}

interface SeatMapProps {
  mySeatId?: string;
}

const defaultSeats: Seat[] = [
  { id: 's1', name: '林小雨', part: 'soprano', row: 0, col: 0 },
  { id: 's2', name: '王思琪', part: 'soprano', row: 0, col: 1, isMe: true },
  { id: 's3', name: '张美琳', part: 'soprano', row: 0, col: 2 },
  { id: 's4', name: '赵雅婷', part: 'soprano', row: 0, col: 3 },
  { id: 's5', name: '陈思雨', part: 'soprano', row: 0, col: 4 },
  { id: 'a1', name: '刘晓华', part: 'alto', row: 1, col: 0 },
  { id: 'a2', name: '周丽娟', part: 'alto', row: 1, col: 1 },
  { id: 'a3', name: '吴秀芳', part: 'alto', row: 1, col: 2 },
  { id: 'a4', name: '郑春梅', part: 'alto', row: 1, col: 3 },
  { id: 'a5', name: '孙丽华', part: 'alto', row: 1, col: 4 },
  { id: 't1', name: '李国栋', part: 'tenor', row: 2, col: 0 },
  { id: 't2', name: '王志强', part: 'tenor', row: 2, col: 1 },
  { id: 't3', name: '陈浩然', part: 'tenor', row: 2, col: 2 },
  { id: 't4', name: '刘建华', part: 'tenor', row: 2, col: 3 },
  { id: 'b1', name: '张大海', part: 'bass', row: 3, col: 0 },
  { id: 'b2', name: '王明远', part: 'bass', row: 3, col: 1 },
  { id: 'b3', name: '赵立伟', part: 'bass', row: 3, col: 2 },
  { id: 'b4', name: '孙振国', part: 'bass', row: 3, col: 3 },
];

const SeatMap: React.FC<SeatMapProps> = ({ mySeatId = 's2' }) => {
  const rows = [0, 1, 2, 3];
  const rowLabels = ['女高音', '女低音', '男高音', '男低音'];

  const getSeatsByRow = (row: number) => {
    return defaultSeats.filter((s) => s.row === row);
  };

  const partNameMap: Record<string, string> = {
    soprano: 'S',
    alto: 'A',
    tenor: 'T',
    bass: 'B',
  };

  return (
    <View className={styles.container}>
      <View className={styles.title}>
        <Text className={styles.titleIcon}>🎭</Text>
        排练站位图
      </View>

      <View className={styles.stage}>
        <Text className={styles.stageText}>✦ 指挥台 / 舞台 ✦</Text>
      </View>

      <View className={styles.seatBlocks}>
        {rows.map((row) => (
          <View key={row}>
            <View
              style={{
                textAlign: 'center',
                fontSize: '20rpx',
                color: getPartColor(
                  row === 0 ? 'soprano' : row === 1 ? 'alto' : row === 2 ? 'tenor' : 'bass'
                ),
                fontWeight: 600,
                marginBottom: '8rpx',
              }}
            >
              {rowLabels[row]}
            </View>
            <View className={styles.seatRow}>
              {getSeatsByRow(row).map((seat) => {
                const isMe = seat.id === mySeatId;
                return (
                  <View
                    key={seat.id}
                    className={classnames(styles.seat, isMe && styles.seatMe)}
                    style={{ backgroundColor: getPartColor(seat.part) }}
                  >
                    {isMe && <View className={styles.seatLabel}>我在这里</View>}
                    {seat.name.slice(0, 2)}
                    <Text style={{ fontSize: '16rpx', opacity: 0.8, marginLeft: '4rpx' }}>
                      {partNameMap[seat.part]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      <View className={styles.legend}>
        <View className={styles.legendTitle}>声部说明</View>
        <View className={styles.legendRow}>
          <View className={styles.legendItem}>
            <View
              className={styles.legendColor}
              style={{ backgroundColor: getPartColor('soprano') }}
            />
            <Text className={styles.legendText}>女高音</Text>
          </View>
          <View className={styles.legendItem}>
            <View
              className={styles.legendColor}
              style={{ backgroundColor: getPartColor('alto') }}
            />
            <Text className={styles.legendText}>女低音</Text>
          </View>
          <View className={styles.legendItem}>
            <View
              className={styles.legendColor}
              style={{ backgroundColor: getPartColor('tenor') }}
            />
            <Text className={styles.legendText}>男高音</Text>
          </View>
          <View className={styles.legendItem}>
            <View
              className={styles.legendColor}
              style={{ backgroundColor: getPartColor('bass') }}
            />
            <Text className={styles.legendText}>男低音</Text>
          </View>
          <View className={styles.legendItem}>
            <View
              className={styles.legendColor}
              style={{
                background:
                  'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: '2rpx solid #fff',
                boxShadow: '0 0 8rpx rgba(99, 102, 241, 0.6)',
              }}
            />
            <Text className={styles.legendText}>我的位置</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default SeatMap;
