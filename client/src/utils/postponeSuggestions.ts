import { addDays, addHours, addMinutes, format, isAfter, isWeekend } from "date-fns";
import { Task } from "@shared/schema";

/**
 * Find available time slots to suggest when there are scheduling conflicts
 * @param tasksOnDay List of tasks already scheduled that day
 * @param preferredDate The date the user initially wanted to schedule
 * @returns Array of suggested dates for rescheduling
 */
export function findPostponeSuggestions(tasksOnDay: Task[], preferredDate: Date): Date[] {
  // Sort tasks by start time
  const sortedTasks = [...tasksOnDay].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Find available 30-minute slots
  const suggestions: Date[] = [];
  const workdayStart = new Date(preferredDate);
  workdayStart.setHours(9, 0, 0, 0); // 9 AM
  
  const workdayEnd = new Date(preferredDate);
  workdayEnd.setHours(18, 0, 0, 0); // 6 PM
  
  // Generate 3 suggestions
  // 1. Later the same day
  let laterToday = new Date(preferredDate);
  laterToday.setHours(laterToday.getHours() + 2); // 2 hours later
  if (laterToday.getTime() < workdayEnd.getTime()) {
    suggestions.push(laterToday);
  }
  
  // 2. Tomorrow morning
  const tomorrowMorning = new Date(preferredDate);
  tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
  tomorrowMorning.setHours(10, 0, 0, 0); // 10 AM next day
  suggestions.push(tomorrowMorning);
  
  // 3. Tomorrow afternoon
  const tomorrowAfternoon = new Date(preferredDate);
  tomorrowAfternoon.setDate(tomorrowAfternoon.getDate() + 1);
  tomorrowAfternoon.setHours(14, 0, 0, 0); // 2 PM next day
  suggestions.push(tomorrowAfternoon);
  
  return suggestions;
}

/**
 * Generate a random suggestion for postponing a task
 * @returns A random, human-like suggestion
 */
export function generatePostponeSuggestion(): string {
  const suggestions = [
    "Consider moving this task to tomorrow morning when your energy levels are typically higher.",
    "You seem to have a lot on your plate today. How about moving this to later in the week?",
    "Based on your past productivity patterns, tomorrow afternoon might be a better time for this task.",
    "Would you like to reschedule this for the same time tomorrow? You might be more focused then.",
    "This task might fit well with your Friday schedule when you typically have fewer meetings.",
    "Your calendar shows you're quite busy today. Consider moving this task to a less crowded day.",
    "How about postponing this to early next week when you'll have a fresh start?",
    "You tend to complete similar tasks more effectively in the morning. Consider rescheduling to tomorrow morning.",
    "Looking at your schedule, you might have more mental energy for this on Thursday.",
    "This task seems important but not urgent. How about scheduling it for later this week?",
    "Your productivity tends to peak midweek. Would Wednesday be a better fit for this task?",
    "I notice you often complete similar tasks more efficiently in the afternoons. Would tomorrow afternoon work better?",
    "Your calendar shows some free time tomorrow that might be perfect for this task.",
    "Would you prefer to tackle this task on a day when you have fewer other commitments?",
    "Based on your task completion patterns, you might find this easier to accomplish later in the week.",
  ];
  
  return suggestions[Math.floor(Math.random() * suggestions.length)];
}

/**
 * Generates postpone date options based on the current date
 * @returns An array of date options
 */
export function generatePostponeDateOptions(currentDate: Date): Array<{label: string, date: Date}> {
  const options: Array<{label: string, date: Date}> = [];
  const now = new Date();
  
  // Tomorrow
  options.push({
    label: "Tomorrow",
    date: addDays(currentDate, 1)
  });
  
  // Day after tomorrow
  options.push({
    label: "Day after tomorrow",
    date: addDays(currentDate, 2)
  });
  
  // Next week (same day)
  options.push({
    label: "Next week",
    date: addDays(currentDate, 7)
  });
  
  // Later today (only if the current time is before 3pm)
  const laterToday = addHours(now, 3);
  if (now.getHours() < 15 && isAfter(laterToday, now)) {
    options.push({
      label: "Later today",
      date: new Date(currentDate.setHours(now.getHours() + 3, now.getMinutes()))
    });
  }
  
  // Next Monday (if today isn't Monday)
  const nextMonday = new Date(currentDate);
  const dayOfWeek = currentDate.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  nextMonday.setDate(currentDate.getDate() + daysUntilMonday);
  
  if (dayOfWeek !== 1) { // Not Monday
    options.push({
      label: "Next Monday",
      date: nextMonday
    });
  }
  
  // Weekend or next work day
  if (isWeekend(currentDate)) {
    const nextWorkDay = new Date(currentDate);
    nextWorkDay.setDate(currentDate.getDay() === 0 ? currentDate.getDate() + 1 : currentDate.getDate() + 2);
    options.push({
      label: "Next work day",
      date: nextWorkDay
    });
  } else {
    const weekend = new Date(currentDate);
    weekend.setDate(currentDate.getDate() + (6 - currentDate.getDay()));
    options.push({
      label: "Weekend",
      date: weekend
    });
  }
  
  return options;
}