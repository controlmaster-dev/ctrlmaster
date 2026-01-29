import { differenceInCalendarWeeks, getDay } from 'date-fns'

// Fixed assignments (0=Sunday, 1=Monday...)
// Sun(0): Andres, Mon(1): Josué, Tue(2): Itsary, Wed(3): Gabriel, Thu(4): Diego, Sat(6): Alex
const FIXED_SCHEDULE: Record<number, string> = {
    0: 'Andres',
    1: 'Josué',
    2: 'Itsary',
    3: 'Gabriel',
    4: 'Diego',
    6: 'Alex'
}

// Rotation for Friday (5)
// User said: Last week (relative to Dec 9) was Alex. This week (Dec 9) is Gabriel.
// Order inferred: Alex, Gabriel, ... (We need the full list. I will assume all operators).
// Let's define a rotation list.
const ROTATION_LIST = ['Alex', 'Gabriel', 'Andres', 'Josué', 'Itsary', 'Diego']
// Reference date: Dec 13, 2024 (A Friday) -> Should be Gabriel.
// Dec 6, 2024 -> Should be Alex.
// Index of Gabriel in list = 1.
// Index of Alex in list = 0.
// Core logic: (weeksSinceRef + refIndex) % length

const REF_DATE = new Date('2025-12-12T12:00:00') // Gabriel's Friday (2025)
const REF_INDEX = 1 // Gabriel

export function getBitcentralUser(date: Date, overrides: Record<string, string> = {}): { name: string, isRotation: boolean, isOverride: boolean } {
    const day = getDay(date)
    const dateKey = date.toISOString().split('T')[0]

    // 1. Check DB Override (Vacation Mode)
    if (overrides[dateKey]) {
        return { name: overrides[dateKey], isRotation: false, isOverride: true }
    }

    // 2. Fixed Days
    if (FIXED_SCHEDULE[day]) {
        return { name: FIXED_SCHEDULE[day], isRotation: false, isOverride: false }
    }

    // 3. Friday Rotation
    if (day === 5) {
        const weeksDiff = differenceInCalendarWeeks(date, REF_DATE, { weekStartsOn: 1 }) // Monday start
        // weeksDiff might be negative if date is before.
        // realIndex = ((REF_INDEX + weeksDiff) % LEN + LEN) % LEN
        const len = ROTATION_LIST.length
        const index = ((REF_INDEX + weeksDiff) % len + len) % len
        return { name: ROTATION_LIST[index], isRotation: true, isOverride: false }
    }

    return { name: "N/A", isRotation: false, isOverride: false }
}
