export function bold(text: string): string {
  return `**${text}**`;
}

export function inline(text: string): string {
  return `\`${text}\``;
}

export function blockquote(text: string): string {
  return `> ${text.replace(/\n/g, '\n> ')}`;
}

export function list(items: string[]): string {
  return items.map((item, i) => `${arabicNumeral(i + 1)}. ${item}`).join('\n');
}

export function pair(key: string, value: string): string {
  return `${key}: ${bold(value)}`;
}

export function sep(): string {
  return ' • ';
}

export function arabicNumeral(n: number): string {
  const nums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(n).split('').map(d => nums[parseInt(d)]).join('');
}

export function formatNumber(n: number): string {
  return n.toLocaleString('ar-SA');
}

export function medal(index: number): string {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `#${index + 1}`;
}

export function prayerStatus(prayed: boolean): string {
  return prayed ? '✅ تم' : '⏳ لم يُصلَ بعد';
}

export function progressBar(current: number, max: number, length = 12): string {
  const filled = Math.round((current / max) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

export const CORRECT = '✅';
export const WRONG = '❌';
export const STAR = '⭐';
