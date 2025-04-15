import { format, startOfMonth, endOfMonth, addMonths, subMonths, startOfWeek, addDays, isSameMonth, isSameDay } from "date-fns";

export function getCalendarDays(month: Date) {
  // Get days in month
  const startDate = startOfMonth(month);
  const endDate = endOfMonth(month);
  const daysInMonth = endDate.getDate();
  
  // Get day of week of the first day (0 = Sunday, 6 = Saturday)
  const firstDayOfMonth = startDate.getDay();
  
  // Get days from previous month to fill the first week
  const prevMonthDays = [];
  const prevMonth = subMonths(startDate, 1);
  const prevMonthLastDay = endOfMonth(prevMonth).getDate();
  
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    prevMonthDays.push({
      date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonthLastDay - i),
      isCurrentMonth: false,
      isToday: false
    });
  }
  
  // Current month days
  const currentMonthDays = [];
  const today = new Date();
  
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(month.getFullYear(), month.getMonth(), i);
    currentMonthDays.push({
      date,
      isCurrentMonth: true,
      isToday: isSameDay(date, today)
    });
  }
  
  // Next month days to fill remaining slots in the grid
  const nextMonthDays = [];
  const totalDaysToShow = 42; // 6 rows x 7 days
  const remainingDays = totalDaysToShow - (prevMonthDays.length + currentMonthDays.length);
  
  for (let i = 1; i <= remainingDays; i++) {
    nextMonthDays.push({
      date: new Date(month.getFullYear(), month.getMonth() + 1, i),
      isCurrentMonth: false,
      isToday: false
    });
  }
  
  return {
    days: [...prevMonthDays, ...currentMonthDays, ...nextMonthDays],
    currentMonth: month,
    daysInMonth
  };
}

export function formatDate(date: Date, formatStr: string = "yyyy-MM-dd") {
  return format(date, formatStr);
}

export function getMonthName(date: Date) {
  return format(date, "MMMM yyyy");
}

export function getNextMonth(date: Date) {
  return addMonths(date, 1);
}

export function getPreviousMonth(date: Date) {
  return subMonths(date, 1);
}

export function getWeekDays(locale = 'en-US') {
  const baseDate = new Date(2021, 0, 3); // Sunday, Jan 3rd 2021
  const weekDays = [];
  
  for (let i = 0; i < 7; i++) {
    const date = addDays(baseDate, i);
    weekDays.push(format(date, 'EEE', { locale }));
  }
  
  return weekDays;
}

export function isToday(date: Date) {
  return isSameDay(date, new Date());
}
