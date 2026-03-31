export function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.min(Math.floor(Math.log(bytesPerSecond) / Math.log(k)), sizes.length - 1);
  const value = bytesPerSecond / Math.pow(k, i);

  // Format with 1 decimal for values >= 10, 2 decimals for values < 10
  const decimals = value >= 10 ? 1 : 2;
  return value.toFixed(decimals) + ' ' + sizes[i];
}

export function formatTime(seconds: number): string {
  // Round to nearest second
  const roundedSeconds = Math.round(seconds);

  if (roundedSeconds < 60) return `${roundedSeconds}s`;

  const mins = Math.floor(roundedSeconds / 60);
  const secs = roundedSeconds % 60;

  // If less than 10 minutes, show minutes and seconds
  if (mins < 10 && secs > 0) {
    return `${mins}m ${secs}s`;
  }

  // For 10+ minutes, just show minutes
  return `${mins}m`;
}
