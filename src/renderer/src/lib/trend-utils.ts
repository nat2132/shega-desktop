export function computeTrend<T extends Record<string, any>>(
  data: T[],
  dateKey: string,
  valueFn: (item: T) => number
): { trend: string; trendType: 'up' | 'down' } {
  if (data.length < 2) return { trend: '0%', trendType: 'up' };

  const dates = data.map(d => new Date(String(d[dateKey])).getTime());
  const maxDate = Math.max(...dates);
  const minDate = Math.min(...dates);
  const totalRange = maxDate - minDate;

  if (totalRange === 0) return { trend: '0%', trendType: 'up' };

  const midPoint = maxDate - totalRange / 2;

  const newer = data.filter(d => new Date(String(d[dateKey])).getTime() >= midPoint);
  const older = data.filter(d => new Date(String(d[dateKey])).getTime() < midPoint);

  const olderSum = older.reduce((s, d) => s + valueFn(d), 0);
  const newerSum = newer.reduce((s, d) => s + valueFn(d), 0);

  if (olderSum === 0) {
    return { trend: newerSum > 0 ? '+100%' : '0%', trendType: 'up' };
  }

  const pct = ((newerSum - olderSum) / olderSum) * 100;
  return {
    trend: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
    trendType: pct >= 0 ? 'up' : 'down'
  };
}
