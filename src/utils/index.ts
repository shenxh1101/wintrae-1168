export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}小时`;
  }
  return `${hours}小时${mins}分钟`;
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[date.getDay()];
  return `${month}月${day}日 ${weekDay}`;
};

export const getDifficultyStars = (difficulty: number): string => {
  return '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
};

export const getProficiencyColor = (proficiency: number): string => {
  if (proficiency >= 80) return '#10b981';
  if (proficiency >= 60) return '#3b82f6';
  if (proficiency >= 40) return '#f59e0b';
  return '#ef4444';
};

export const getPartColor = (partType: string): string => {
  const colors: Record<string, string> = {
    soprano: '#ec4899',
    alto: '#8b5cf6',
    tenor: '#06b6d4',
    bass: '#10b981',
  };
  return colors[partType] || '#6366f1';
};
