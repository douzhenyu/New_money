/**
 * 日期口径：一律用「本地日历日」，不用 UTC。
 * 用 UTC 会让 UTC+8 的用户在早上 8 点前记的账掉到前一天。
 */

/** Date → 'YYYY-MM-DD'（本地时区） */
export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 真实存在的日历日（挡掉 2026-02-30 这种） */
export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [yearText, monthText, dayText] = value.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

/** 'YYYY-MM-DD' → 'YYYY-MM' */
export function monthOf(isoDate: string): string {
  return isoDate.slice(0, 7)
}

/** 'YYYY-MM-DD' → '3 日' / '今天 10 月 28 日' 之类的展示交给调用方，这里只给月日 */
export function dayOfMonth(isoDate: string): number {
  return Number(isoDate.slice(8, 10))
}

/** 当月第一天到最后一天之前的边界判断用 */
export function isInMonth(isoDate: string, month: string): boolean {
  return monthOf(isoDate) === month
}
