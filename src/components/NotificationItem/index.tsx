import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import { Notification } from '@/types';
import classnames from 'classnames';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
}) => {
  const getTypeTag = () => {
    switch (notification.type) {
      case 'notice':
        return { text: '通知', className: styles.typeNotice };
      case 'feedback':
        return { text: '反馈', className: styles.typeFeedback };
      case 'system':
        return { text: '系统', className: styles.typeSystem };
      default:
        return { text: '通知', className: styles.typeNotice };
    }
  };

  const typeTag = getTypeTag();
  const isHighPriority = notification.priority === 'high';

  return (
    <View
      className={classnames(
        styles.item,
        !notification.isRead && styles.itemUnread
      )}
      onClick={onClick}
    >
      <View className={styles.header}>
        <View className={styles.titleRow}>
          {!notification.isRead && <View className={styles.unreadDot} />}
          <Text className={styles.title}>{notification.title}</Text>
        </View>
        <View
          className={classnames(
            styles.typeTag,
            isHighPriority ? styles.priorityHigh : typeTag.className
          )}
        >
          {isHighPriority ? '重要' : typeTag.text}
        </View>
      </View>
      <Text className={styles.content}>{notification.content}</Text>
      <View className={styles.meta}>
        <Text className={styles.time}>{notification.createdAt}</Text>
        <Text className={styles.arrow}>›</Text>
      </View>
    </View>
  );
};

export default NotificationItem;
