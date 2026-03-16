import { differenceInCalendarWeeks, getDay } from 'date-fns';
const FIXED_SCHEDULE_DEFAULT = {
  0: 'Andrés Corea',
  1: 'Josué Jimenez',
  2: 'Jeremy Alvarado',
  3: 'Gabriel Núñez',
  4: 'Diego Bolaños',
  6: 'Alex Blanco'
};

const ROTATION_LIST = ['Alex Blanco', 'Gabriel Núñez', 'Andrés Corea', 'Josué Jimenez', 'Jeremy Alvarado', 'Diego Bolaños'];
const REF_DATE = new Date('2025-12-12T12:00:00');
const REF_INDEX = 1;

export function getBitcentralUser(
date,
overrides = {},
baseSchedule = {})
{
  const day = getDay(date);
  const toISO = (d) => isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  const dateKey = toISO(date);


  if (overrides[dateKey]) {
    return { name: overrides[dateKey], isRotation: false, isOverride: true };
  }

  if (baseSchedule[day.toString()]) {
    return { name: baseSchedule[day.toString()], isRotation: false, isOverride: false };
  }


  if (FIXED_SCHEDULE_DEFAULT[day]) {
    return { name: FIXED_SCHEDULE_DEFAULT[day], isRotation: false, isOverride: false };
  }


  if (day === 5) {
    const weeksDiff = differenceInCalendarWeeks(date, REF_DATE, { weekStartsOn: 1 });
    const len = ROTATION_LIST.length;
    const index = ((REF_INDEX + weeksDiff) % len + len) % len;
    return { name: ROTATION_LIST[index], isRotation: true, isOverride: false };
  }

  return { name: "N/A", isRotation: false, isOverride: false };
}