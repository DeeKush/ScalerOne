const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export function formatRelativeTime(input) {
  const date = input instanceof Date ? input : new Date(input);
  const diffMs = Date.now() - date.getTime();

  if (diffMs < MINUTE) return 'Just now';
  if (diffMs < HOUR) return `${Math.floor(diffMs / MINUTE)}m ago`;
  if (diffMs < DAY) return `${Math.floor(diffMs / HOUR)}h ago`;
  if (diffMs < WEEK) return `${Math.floor(diffMs / DAY)}d ago`;
  return `${Math.floor(diffMs / WEEK)}w ago`;
}
