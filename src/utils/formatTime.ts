/**
 * Format ISO date string as relative time in Traditional Chinese.
 * Falls back to locale date string when far in the past / invalid.
 */
export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '時間未知';
  }

  const now = Date.now();
  const diffMs = now - date.getTime();
  const absDiff = Math.abs(diffMs);
  const past = diffMs >= 0;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (absDiff < minute) {
    return past ? '剛剛' : '即將發布';
  }
  if (absDiff < hour) {
    const n = Math.floor(absDiff / minute);
    return past ? `${n} 分鐘前` : `${n} 分鐘後`;
  }
  if (absDiff < day) {
    const n = Math.floor(absDiff / hour);
    return past ? `${n} 小時前` : `${n} 小時後`;
  }
  if (absDiff < week) {
    const n = Math.floor(absDiff / day);
    return past ? `${n} 天前` : `${n} 天後`;
  }

  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Full absolute datetime for title/tooltip */
export function formatAbsoluteTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
