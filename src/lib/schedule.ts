import { differenceInCalendarWeeks, getDay } from 'date-fns'

// Fixed assignments (0=Sunday, 1=Monday...) -> Fallback if no config provided
const FIXED_SCHEDULE_DEFAULT: Record<number, string> = {
    0: 'Andrés Corea',
    1: 'Josué Jimenez',
    2: 'Itsary Gomez',
    3: 'Gabriel Núñez',
    4: 'Diego Bolaños',
    6: 'Alex Blanco'
}

// Rotation for Friday (5) - KEPT AS IS for now unless config overrides it specifically (we can treat 5 as just another day in config)
const ROTATION_LIST = ['Alex Blanco', 'Gabriel Núñez', 'Andrés Corea', 'Josué Jimenez', 'Itsary Gomez', 'Diego Bolaños']
const REF_DATE = new Date('2025-12-12T12:00:00')
const REF_INDEX = 1

export function getBitcentralUser(
    date: Date,
    overrides: Record<string, string> = {},
    baseSchedule: Record<string, string> = {}
): { name: string, isRotation: boolean, isOverride: boolean } {
    const day = getDay(date)
    const toISO = (d: Date) => (isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0])
    const dateKey = toISO(date)

    // 1. Check DB Override (Vacation Mode)
    if (overrides[dateKey]) {
        return { name: overrides[dateKey], isRotation: false, isOverride: true }
    }

    // 2. Check Dynamic Base Schedule (Configured)
    // baseSchedule keys are strings of day index "0", "1", etc.
    if (baseSchedule[day.toString()]) {
        return { name: baseSchedule[day.toString()], isRotation: false, isOverride: false }
    }

    // 3. Fallback: Fixed Days (Legacy)
    if (FIXED_SCHEDULE_DEFAULT[day]) {
        return { name: FIXED_SCHEDULE_DEFAULT[day], isRotation: false, isOverride: false }
    }

    // 4. Friday Rotation (Legacy Logic if not configured in baseSchedule)
    if (day === 5) {
        const weeksDiff = differenceInCalendarWeeks(date, REF_DATE, { weekStartsOn: 1 })
        const len = ROTATION_LIST.length
        const index = ((REF_INDEX + weeksDiff) % len + len) % len
        return { name: ROTATION_LIST[index], isRotation: true, isOverride: false }
    }

    return { name: "N/A", isRotation: false, isOverride: false }
}
