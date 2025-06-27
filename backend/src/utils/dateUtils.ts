import { format, formatISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export class DateUtils {
  // 获取当前本地时间
  static getCurrentLocalTime(): Date {
    return new Date();
  }

  // 获取当前本地时间的ISO字符串（带时区信息）
  static getCurrentLocalISOString(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localTime = new Date(now.getTime() - (offset * 60 * 1000));
    return localTime.toISOString();
  }

  // 获取当前本地时间的格式化字符串（用于数据库）
  static getCurrentLocalString(): string {
    const now = new Date();
    return format(now, 'yyyy-MM-dd HH:mm:ss');
  }

  // 格式化日期为中文显示
  static formatToChinese(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'yyyy年MM月dd日 HH:mm:ss', { locale: zhCN });
  }

  // 格式化日期为简短中文显示
  static formatToChineseShort(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MM月dd日 HH:mm', { locale: zhCN });
  }

  // 格式化日期为日期字符串（YYYY-MM-DD）
  static formatToDateString(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'yyyy-MM-dd');
  }

  // 格式化日期为日期时间字符串（YYYY-MM-DD HH:mm:ss）
  static formatToDateTimeString(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'yyyy-MM-dd HH:mm:ss');
  }

  // 检查日期是否为今天
  static isToday(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return format(dateObj, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  }

  // 检查日期是否为昨天
  static isYesterday(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return format(dateObj, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd');
  }

  // 获取相对时间描述
  static getRelativeTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return '刚刚';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}分钟前`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}小时前`;
    } else if (diffInMinutes < 43200) {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}天前`;
    } else {
      return this.formatToChineseShort(dateObj);
    }
  }
} 