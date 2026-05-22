/** 对话流时间展示：昨天 18:24 / 今天 06:15 */
export function formatChatSessionTime(date: Date): string {
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const clock = `${hh}:${mm}`;

  if (isToday) return `今天 ${clock}`;
  if (isYesterday) return `昨天 ${clock}`;
  return `${date.getMonth() + 1}/${date.getDate()} ${clock}`;
}
