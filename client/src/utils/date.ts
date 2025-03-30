import { format, isSameDay, isToday, isTomorrow, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

/**
 * Format a date with a specified format string
 */
export function formatDate(date: Date, formatStr: string = "PP"): string {
  return format(date, formatStr);
}

/**
 * Format time from a date
 */
export function formatTime(date: Date): string {
  return format(date, "h:mm a");
}

/**
 * Check if the date is today
 */
export function checkIsToday(date: Date): boolean {
  return isToday(date);
}

/**
 * Check if the date is tomorrow
 */
export function checkIsTomorrow(date: Date): boolean {
  return isTomorrow(date);
}

/**
 * Get a human-readable string for the date
 */
export function getRelativeDate(date: Date): string {
  const now = new Date();
  
  if (isToday(date)) {
    return "Today";
  } else if (isTomorrow(date)) {
    return "Tomorrow";
  } else if (isSameDay(date, addDays(now, 2))) {
    return "In 2 days";
  } else if (isSameDay(date, addDays(now, 3))) {
    return "In 3 days";
  } else if (isSameDay(date, addDays(now, 4))) {
    return "In 4 days";
  } else if (isSameDay(date, addDays(now, 5))) {
    return "In 5 days";
  } else if (isSameDay(date, addDays(now, 6))) {
    return "In 6 days";
  } else if (isSameDay(date, addDays(now, 7))) {
    return "In a week";
  } else if (isSameDay(date, subDays(now, 1))) {
    return "Yesterday";
  }
  
  // For dates further away, use standard format
  return format(date, "MMM do");
}

/**
 * Get the start and end dates of the current week
 */
export function getCurrentWeek(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 0 }), // 0 = Sunday
    end: endOfWeek(now, { weekStartsOn: 0 })
  };
}

/**
 * Get the start and end dates of the current month
 */
export function getCurrentMonth(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now)
  };
}

/**
 * Format a date range for display
 */
export function formatDateRange(start: Date, end: Date): string {
  if (isSameDay(start, end)) {
    return format(start, "MMMM d, yyyy");
  }
  
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${format(start, "MMMM d")}-${format(end, "d, yyyy")}`;
  }
  
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, "MMMM d")} - ${format(end, "MMMM d, yyyy")}`;
  }
  
  return `${format(start, "MMMM d, yyyy")} - ${format(end, "MMMM d, yyyy")}`;
}

/**
 * Get a CSS class for priority
 */
export function getPriorityClass(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'bg-destructive text-destructive-foreground';
    case 'medium':
      return 'bg-warning text-warning-foreground';
    case 'low':
      return 'bg-success text-success-foreground';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
}
