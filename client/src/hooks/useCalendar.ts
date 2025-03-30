import { useState, useMemo } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameMonth as dateFnsIsSameMonth,
  isSameDay as dateFnsIsSameDay,
  addMonths,
  subMonths 
} from "date-fns";

export function useCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get the current month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get the days in the current month
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentMonth, currentYear]);

  // Get the day of the week of the first day of the month (0-6, 0 is Sunday)
  const firstDayOfMonth = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentMonth, currentYear]);

  // Navigation functions
  const nextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const prevMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Helper functions
  const formatMonthYear = (date: Date) => {
    return format(date, "MMMM yyyy");
  };

  const isCurrentMonth = (date: Date) => {
    return dateFnsIsSameMonth(date, currentDate);
  };

  const isCurrentDay = (date: Date) => {
    return dateFnsIsSameDay(date, new Date());
  };

  // Get an array of all the days in the current month
  const getDaysInMonth = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Get a 2D array representing weeks and days for the current month
  const getCalendarWeeks = useMemo(() => {
    const days = getDaysInMonth;
    const weeks: Date[][] = [];
    let week: Date[] = [];

    // Fill in days from the previous month
    const firstDay = days[0];
    const firstDayOfWeek = firstDay.getDay();
    if (firstDayOfWeek > 0) {
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const prevDate = new Date(firstDay);
        prevDate.setDate(firstDay.getDate() - (i + 1));
        week.push(prevDate);
      }
    }

    // Fill in days of the current month
    days.forEach(day => {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    });

    // Fill in days from the next month
    if (week.length > 0) {
      const lastDay = days[days.length - 1];
      let daysToAdd = 7 - week.length;
      for (let i = 1; i <= daysToAdd; i++) {
        const nextDate = new Date(lastDay);
        nextDate.setDate(lastDay.getDate() + i);
        week.push(nextDate);
      }
      weeks.push(week);
    }

    return weeks;
  }, [getDaysInMonth]);

  return {
    currentDate,
    currentMonth,
    currentYear,
    daysInMonth,
    firstDayOfMonth,
    getDaysInMonth,
    getCalendarWeeks,
    nextMonth,
    prevMonth,
    goToToday,
    isCurrentMonth,
    isCurrentDay,
    formatMonthYear
  };
}
