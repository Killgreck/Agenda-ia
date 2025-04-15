/**
 * Holidays utility for Colombia and US
 * This provides utility functions to check if a date falls on a public holiday
 */

type Holiday = {
  date: string; // In YYYY-MM-DD format
  name: string;
  country: string; // 'CO' for Colombia or 'US' for United States
};

// Fixed US holidays
const fixedUSHolidays: { month: number; day: number; name: string }[] = [
  { month: 0, day: 1, name: "New Year's Day" }, // January 1
  { month: 6, day: 4, name: "Independence Day" }, // July 4
  { month: 10, day: 11, name: "Veterans Day" }, // November 11 
  { month: 11, day: 25, name: "Christmas Day" }, // December 25
];

// Fixed Colombian holidays
const fixedColombianHolidays: { month: number; day: number; name: string }[] = [
  { month: 0, day: 1, name: "Año Nuevo" }, // January 1
  { month: 4, day: 1, name: "Día del Trabajo" }, // May 1
  { month: 6, day: 20, name: "Día de la Independencia" }, // July 20
  { month: 7, day: 7, name: "Batalla de Boyacá" }, // August 7
  { month: 11, day: 8, name: "Día de la Inmaculada Concepción" }, // December 8
  { month: 11, day: 25, name: "Navidad" }, // December 25
];

/**
 * Calculate Easter Sunday for a given year using the Butcher's algorithm
 */
function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // Adjusted to 0-based month
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month, day);
}

/**
 * Get all US holidays for a specific year
 */
export function getUSHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = [];
  
  // Add fixed holidays
  fixedUSHolidays.forEach(holiday => {
    holidays.push({
      date: `${year}-${String(holiday.month + 1).padStart(2, '0')}-${String(holiday.day).padStart(2, '0')}`,
      name: holiday.name,
      country: 'US'
    });
  });
  
  // Calculate Martin Luther King Jr. Day (3rd Monday in January)
  const mlkDay = getSpecificMonthDay(year, 0, 3, 1); // January, 3rd, Monday
  holidays.push({
    date: formatDate(mlkDay),
    name: "Martin Luther King Jr. Day",
    country: 'US'
  });
  
  // Presidents Day (3rd Monday in February)
  const presidentsDay = getSpecificMonthDay(year, 1, 3, 1); // February, 3rd, Monday
  holidays.push({
    date: formatDate(presidentsDay),
    name: "Presidents Day",
    country: 'US'
  });
  
  // Memorial Day (Last Monday in May)
  const memorialDay = getLastSpecificDayOfMonth(year, 4, 1); // May, Monday
  holidays.push({
    date: formatDate(memorialDay),
    name: "Memorial Day",
    country: 'US'
  });
  
  // Labor Day (1st Monday in September)
  const laborDay = getSpecificMonthDay(year, 8, 1, 1); // September, 1st, Monday
  holidays.push({
    date: formatDate(laborDay),
    name: "Labor Day",
    country: 'US'
  });
  
  // Columbus Day (2nd Monday in October)
  const columbusDay = getSpecificMonthDay(year, 9, 2, 1); // October, 2nd, Monday
  holidays.push({
    date: formatDate(columbusDay),
    name: "Columbus Day/Indigenous Peoples' Day",
    country: 'US'
  });
  
  // Thanksgiving (4th Thursday in November)
  const thanksgiving = getSpecificMonthDay(year, 10, 4, 4); // November, 4th, Thursday
  holidays.push({
    date: formatDate(thanksgiving),
    name: "Thanksgiving Day",
    country: 'US'
  });
  
  return holidays;
}

/**
 * Get all Colombian holidays for a specific year
 */
export function getColombianHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = [];
  
  // Add fixed holidays
  fixedColombianHolidays.forEach(holiday => {
    holidays.push({
      date: `${year}-${String(holiday.month + 1).padStart(2, '0')}-${String(holiday.day).padStart(2, '0')}`,
      name: holiday.name,
      country: 'CO'
    });
  });
  
  // Calculate Easter and related holidays
  const easter = calculateEaster(year);
  
  // Holy Thursday (3 days before Easter)
  const holyThursday = new Date(easter);
  holyThursday.setDate(easter.getDate() - 3);
  holidays.push({
    date: formatDate(holyThursday),
    name: "Jueves Santo",
    country: 'CO'
  });
  
  // Good Friday (2 days before Easter)
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  holidays.push({
    date: formatDate(goodFriday),
    name: "Viernes Santo",
    country: 'CO'
  });
  
  // Ascension Day (39 days after Easter)
  const ascensionDay = new Date(easter);
  ascensionDay.setDate(easter.getDate() + 39);
  holidays.push({
    date: formatDate(ascensionDay),
    name: "Ascensión del Señor",
    country: 'CO'
  });
  
  // Corpus Christi (60 days after Easter)
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60);
  holidays.push({
    date: formatDate(corpusChristi),
    name: "Corpus Christi",
    country: 'CO'
  });
  
  // Sacred Heart (68 days after Easter)
  const sacredHeart = new Date(easter);
  sacredHeart.setDate(easter.getDate() + 68);
  holidays.push({
    date: formatDate(sacredHeart),
    name: "Sagrado Corazón",
    country: 'CO'
  });
  
  return holidays;
}

/**
 * Get all holidays (both US and Colombian) for a specific year
 */
export function getAllHolidays(year: number): Holiday[] {
  return [...getUSHolidays(year), ...getColombianHolidays(year)];
}

/**
 * Check if a specific date is a holiday
 */
export function isHoliday(date: Date, country?: string): { isHoliday: boolean; holidayName?: string } {
  const year = date.getFullYear();
  const formattedDate = formatDate(date);
  const holidays = country 
    ? (country === 'US' ? getUSHolidays(year) : getColombianHolidays(year)) 
    : getAllHolidays(year);
  
  const holiday = holidays.find(h => h.date === formattedDate);
  if (holiday) {
    return { isHoliday: true, holidayName: holiday.name };
  }
  
  return { isHoliday: false };
}

/**
 * Helper function to format a date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get a specific day of the month (e.g., 3rd Monday)
 * @param year - The year
 * @param month - The month (0-11)
 * @param nth - Which occurrence (1st, 2nd, 3rd, 4th)
 * @param dayOfWeek - Day of week (0 = Sunday, 1 = Monday, etc.)
 */
function getSpecificMonthDay(year: number, month: number, nth: number, dayOfWeek: number): Date {
  const date = new Date(year, month, 1);
  let count = 0;
  
  // Find the first occurrence of the day in the month
  while (date.getDay() !== dayOfWeek) {
    date.setDate(date.getDate() + 1);
  }
  
  // Move to the nth occurrence
  date.setDate(date.getDate() + (nth - 1) * 7);
  
  return date;
}

/**
 * Get the last specific day of a month (e.g., last Monday)
 * @param year - The year
 * @param month - The month (0-11)
 * @param dayOfWeek - Day of week (0 = Sunday, 1 = Monday, etc.)
 */
function getLastSpecificDayOfMonth(year: number, month: number, dayOfWeek: number): Date {
  // Start from the last day of the month
  const date = new Date(year, month + 1, 0);
  
  // Go backwards until we find the specified day of week
  while (date.getDay() !== dayOfWeek) {
    date.setDate(date.getDate() - 1);
  }
  
  return date;
}