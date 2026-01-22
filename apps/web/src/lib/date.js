import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from "date-fns";

export function ymd(d) {
  return format(d, "yyyy-MM-dd");
}

export function buildMonthGrid(currentDate, weekStartsOn = 1) {
  const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn });
  const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn });
  const days = [];
  let cursor = start;
  while (cursor <= end) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function isInMonth(day, currentDate) {
  return isSameMonth(day, currentDate);
}

export function isToday(day) {
  return isSameDay(day, new Date());
}

export function parseYMD(s) {
  return parseISO(s);
}
