/*
 * Форматирование времени сообщений. `timestamp` — Unix-время в секундах, как в GREEN-API; все даты — по локальному времени.
 * Форматтеры `Intl` создаются один раз на модуль: создание дорогое, а вызываются они на каждый элемент списка.
 */

const timeFormat = new Intl.DateTimeFormat("ru", { hour: "2-digit", minute: "2-digit" });
const weekdayFormat = new Intl.DateTimeFormat("ru", { weekday: "short" });
const shortDateFormat = new Intl.DateTimeFormat("ru", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});
const dayMonthFormat = new Intl.DateTimeFormat("ru", { day: "numeric", month: "long" });
const fullDateFormat = new Intl.DateTimeFormat("ru", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const MS_IN_DAY = 24 * 60 * 60 * 1000;

/** Сколько дней последнего сообщения в списке показываются днём недели, а не датой. */
const WEEKDAY_RANGE_DAYS = 6;

function toDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * На сколько календарных дней `date` раньше `now`: 0 — тот же день, 1 — вчера, отрицательное — в будущем.
 *
 * Считается по полуночам, а не по 24-часовым интервалам; округление гасит час разницы при переходе на летнее время.
 */
function getCalendarDayDiff(date: Date, now: Date): number {
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return Math.round((startOfNow.getTime() - startOfDate.getTime()) / MS_IN_DAY);
}

/** Время последнего сообщения в списке чатов: сегодня — `14:05`, за последнюю неделю — день недели (`сб`), раньше — `04.10.25`. */
export function formatChatListTime(timestamp: number, now: Date): string {
  const date = toDate(timestamp);
  const dayDiff = getCalendarDayDiff(date, now);

  if (dayDiff === 0) {
    return timeFormat.format(date);
  }

  if (dayDiff > 0 && dayDiff <= WEEKDAY_RANGE_DAYS) {
    return weekdayFormat.format(date);
  }

  return shortDateFormat.format(date);
}

/** Время сообщения: `14:05`. */
export function formatMessageTime(timestamp: number): string {
  return timeFormat.format(toDate(timestamp));
}

/** Ключ календарного дня по локальному времени: одинаков у всех сообщений одного дня. */
export function getDayKey(timestamp: number): string {
  const date = toDate(timestamp);

  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/** Подпись дня: «Сегодня» / «Вчера» (тексты передаёт вызывающий), в этом году — `4 октября`, раньше — `4 октября 2025 г.` */
export function formatDayLabel(
  timestamp: number,
  now: Date,
  labels: { today: string; yesterday: string },
): string {
  const date = toDate(timestamp);
  const dayDiff = getCalendarDayDiff(date, now);

  if (dayDiff === 0) {
    return labels.today;
  }

  if (dayDiff === 1) {
    return labels.yesterday;
  }

  return date.getFullYear() === now.getFullYear()
    ? dayMonthFormat.format(date)
    : fullDateFormat.format(date);
}
