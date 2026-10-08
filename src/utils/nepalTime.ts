/**
 * Nepal Standard Time (NPT) Utilities
 * Timezone: Asia/Kathmandu (UTC + 5:45)
 */

export const NEPAL_TIMEZONE = 'Asia/Kathmandu';

/**
 * Returns the current date in YYYY-MM-DD format in Asia/Kathmandu timezone
 */
export function getNepalDateString(input?: Date | number | string): string {
  const d = input ? (input instanceof Date ? input : new Date(typeof input === 'number' && input < 1e11 ? input * 1000 : input)) : new Date();
  return d.toLocaleDateString('en-CA', { timeZone: NEPAL_TIMEZONE });
}

/**
 * Returns current time in HH:MM:SS format in Asia/Kathmandu timezone
 */
export function getNepalTimeString(input?: Date | number | string): string {
  const d = input ? (input instanceof Date ? input : new Date(typeof input === 'number' && input < 1e11 ? input * 1000 : input)) : new Date();
  return d.toLocaleTimeString('en-US', {
    timeZone: NEPAL_TIMEZONE,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Returns formatted Nepal DateTime string: YYYY-MM-DD HH:MM:SS NPT
 */
export function getNepalDateTimeString(input?: Date | number | string): string {
  return `${getNepalDateString(input)} ${getNepalTimeString(input)} NPT`;
}

/**
 * Determines Nepal Stock Exchange market trading session status
 * Trading hours: Sunday to Thursday, 11:00 AM to 3:00 PM NPT
 * Pre-open: 10:30 AM to 11:00 AM NPT
 */
export function getNepalMarketStatus(): {
  status: 'OPEN' | 'CLOSED' | 'PRE-OPEN';
  description: string;
  isTradingDay: boolean;
} {
  const now = new Date();
  const nptDateStr = now.toLocaleDateString('en-US', {
    timeZone: NEPAL_TIMEZONE,
    weekday: 'short',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });

  const [day, timePart] = nptDateStr.split(', ');
  const [hourStr, minuteStr] = (timePart || '00:00').split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const totalMinutes = hour * 60 + minute;

  // NEPSE trading days: Sunday (Sun), Monday (Mon), Tuesday (Tue), Wednesday (Wed), Thursday (Thu)
  const isTradingDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'].includes(day);

  if (!isTradingDay) {
    return {
      status: 'CLOSED',
      description: 'Market Closed (Weekend / Friday & Saturday)',
      isTradingDay: false,
    };
  }

  // Pre-open: 10:30 (630 mins) to 11:00 (660 mins)
  if (totalMinutes >= 630 && totalMinutes < 660) {
    return {
      status: 'PRE-OPEN',
      description: 'Pre-Open Session (10:30 AM - 11:00 AM NPT)',
      isTradingDay: true,
    };
  }

  // Continuous trading: 11:00 (660 mins) to 15:00 (900 mins)
  if (totalMinutes >= 660 && totalMinutes < 900) {
    return {
      status: 'OPEN',
      description: 'Continuous Trading Session (11:00 AM - 3:00 PM NPT)',
      isTradingDay: true,
    };
  }

  return {
    status: 'CLOSED',
    description: totalMinutes >= 900 ? 'Market Closed for the day (Post-Close EOD)' : 'Market Closed (Pre-Trading)',
    isTradingDay: true,
  };
}
