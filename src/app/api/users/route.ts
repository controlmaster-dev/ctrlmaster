import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { toZonedTime, formatInTimeZone } from 'date-fns-tz'

export const dynamic = 'force-dynamic'

const TIMEZONE = 'America/Costa_Rica'

// Helper to ignore accents/case
const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

function getZonedWeekStart() {
    const now = new Date()
    // Get day index in CST (0=Sun, 1-6=Mon-Sat)
    // formatInTimeZone 'i' returns ISO day (1=Mon ... 7=Sun)
    // We want 0=Sun.
    const isoDayStr = formatInTimeZone(now, TIMEZONE, 'i')
    let dayIndex = parseInt(isoDayStr)
    if (dayIndex === 7) dayIndex = 0

    // Get current time in CST to manipulate date
    const zonedNow = toZonedTime(now, TIMEZONE)

    // Calculate Sunday
    // Note: zonedNow IS the date in the timezone.
    // Operating strictly on "Year-Month-Day" values is safest to avoid UTC shifts back.
    const sunday = new Date(zonedNow)
    sunday.setDate(zonedNow.getDate() - dayIndex)

    // Format manually to ensure we use the 'local' values of this shifted date
    const year = sunday.getFullYear()
    const month = String(sunday.getMonth() + 1).padStart(2, '0')
    const day = String(sunday.getDate()).padStart(2, '0')

    const result = `${year}-${month}-${day}`

    return result
}

export async function GET(request: Request) {
    try {
        const users = await prisma.user.findMany({
            include: {
                _count: {
                    select: { reports: true }
                }
            },
            orderBy: [
                { role: 'asc' },
                { name: 'asc' }
            ]
        })

        // Schedule Logic (Refactored for multi-shift support)
        type Shift = { days: number[], start: number, end: number, label?: string }
        const schedules: Record<string, { shifts: Shift[], label: string }> = {
            'Gabriel': {
                shifts: [{ days: [0, 1, 2, 3, 4], start: 6, end: 18 }],
                label: 'Dom-Jue 6am-6pm'
            },
            'Diego': {
                shifts: [
                    { days: [1, 2], start: 0, end: 6 },      // Lun-Mar 12am-6am
                    { days: [3, 4], start: 18, end: 24 },    // Mie-Jue 6pm-12am
                    { days: [6], start: 6, end: 12 }         // Sab 6am-12pm
                ],
                label: 'Mixto (Lun-Mar Madrugada, Mie-Jue Tarde, Sab Mañana)'
            },
            'Alex': {
                shifts: [{ days: [1, 2, 3, 4, 5], start: 6, end: 15 }],
                label: 'Lun-Vie 6am-3pm'
            },
            'Andres': {
                shifts: [{ days: [4, 5, 6, 0, 1], start: 8, end: 18 }],
                label: 'Jue-Lun 8am-6pm'
            },
            'Josue': {
                shifts: [{ days: [3, 4, 5, 6, 0], start: 0, end: 6 }],
                label: 'Mie-Dom 12am-6am'
            },
            'Itsary': {
                shifts: [{ days: [5, 6, 0, 1, 2], start: 18, end: 24 }],
                label: 'Vie-Mar 6pm-12am'
            },
            'Ronald': {
                shifts: [{ days: [1, 2, 3, 4, 5], start: 8, end: 16 }],
                label: 'Lun-Vie 8am-4pm'
            }
        }

        // Time logic for "isAvailable"
        const now = new Date()

        // Get Day (0-6)
        const dayStr = formatInTimeZone(now, TIMEZONE, 'i')
        let currentDay = parseInt(dayStr)
        if (currentDay === 7) currentDay = 0

        // Get Hour (0-23)
        const hourStr = formatInTimeZone(now, TIMEZONE, 'H')
        const currentHour = parseInt(hourStr)

        const { searchParams } = new URL(request.url)
        const requestedWeekStart = searchParams.get('weekStart')

        const currentWeekStart = requestedWeekStart || getZonedWeekStart()

        const mappedUsers = users.map(user => {
            let isAvailable = false
            let scheduleLabel = 'Sin horario'
            let shifts: Shift[] = []
            let isTempSchedule = false

            // 1. Check for TEMPORARY Schedule first (Override for specific week)
            if (user.tempSchedule) {
                try {
                    const parsed = JSON.parse(user.tempSchedule)

                    if (Array.isArray(parsed)) {
                        // Legacy: treat as current week if we are in current week
                        shifts = parsed as Shift[]
                        isTempSchedule = true
                    } else if (typeof parsed === 'object') {
                        // New Map structure
                        const weekShifts = parsed[currentWeekStart] as Shift[]

                        // CRITICAL: We check if `weekShifts` is NOT undefined to treat it as an override.
                        // An empty array [] means "No Shifts" (Vacation/Day Off) for that week.
                        if (Array.isArray(weekShifts)) {
                            shifts = weekShifts
                            isTempSchedule = true
                        }
                    }
                } catch (e) {
                    console.error("Error parsing temp schedule", e)
                }
            }

            // 2. If no temp, try Permanent DB Schedule
            if (!isTempSchedule && shifts.length === 0 && user.schedule) {
                try {
                    const parsedShifts = JSON.parse(user.schedule) as Shift[]
                    if (parsedShifts.length > 0) {
                        shifts = parsedShifts
                    }
                } catch (e) {
                    console.error("Error parsing schedule for user", user.name, e)
                }
            }

            // 3. Fallback to Hardcoded (Legacy)
            if (!isTempSchedule && shifts.length === 0) {
                const scheduleKey = Object.keys(schedules).find(key => normalize(user.name).includes(normalize(key)))
                if (scheduleKey) {
                    const s = schedules[scheduleKey]
                    shifts = s.shifts
                }
            }

            // Determine availability based on final shifts
            if (shifts.length > 0) {
                const currentShift = shifts.find(shift => {
                    // CRITICAL FIX: Handle 0 as 24 (Midnight)
                    const shiftEnd = shift.end === 0 ? 24 : shift.end
                    return shift.days.includes(currentDay) &&
                        currentHour >= shift.start &&
                        currentHour < shiftEnd
                })
                isAvailable = !!currentShift

                // Generate schedule label
                if (isTempSchedule) {
                    if (shifts.length === 0) {
                        scheduleLabel = 'Vacaciones'
                    } else if (shifts.length === 1) {
                        const shift = shifts[0]
                        scheduleLabel = `Temporal (${getDayRangeLabel(shift.days)} ${formatTime(shift.start)}-${formatTime(shift.end)})`
                    } else {
                        scheduleLabel = 'Temporal' + ` (${shifts.length} turnos)`
                    }
                } else if (user.schedule && shifts.length > 0) {
                    // Permanent schedule
                    scheduleLabel = 'Fijo'
                    if (shifts.length === 1) {
                        const shift = shifts[0]
                        scheduleLabel = `Fijo (${getDayRangeLabel(shift.days)} ${formatTime(shift.start)}-${formatTime(shift.end)})`
                    } else {
                        scheduleLabel += ` (${shifts.length} turnos)`
                    }
                } else {
                    // Hardcoded
                    const scheduleKey = Object.keys(schedules).find(key => normalize(user.name).includes(normalize(key)))
                    if (scheduleKey) {
                        scheduleLabel = schedules[scheduleKey].label
                    }
                }
            } else if (isTempSchedule) {
                scheduleLabel = 'Vacaciones'
            }

            return {
                ...user,
                avatar: user.image,
                reportCount: user._count.reports,
                isAvailable,
                scheduleLabel,
                schedule: undefined,
                tempSchedule: undefined,
                shifts: shifts,
                isTempSchedule,
                lastLogin: user.lastLogin,
                lastLoginIP: user.lastLoginIP,
                lastLoginCountry: user.lastLoginCountry,
                currentPath: user.currentPath,
                lastActive: user.lastActive
            }
        })

        return NextResponse.json(mappedUsers)
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}

// Helpers for label generation
function getDayRangeLabel(days: number[]) {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']

    // Sort days to ensure numerical order (0-6)
    const sorted = [...days].sort((a, b) => a - b)

    // Check for common patterns
    if (sorted.length === 5 && sorted.join(',') === '1,2,3,4,5') return 'Lun-Vie'
    if (sorted.length === 6 && sorted.join(',') === '1,2,3,4,5,6') return 'Lun-Sab'
    if (sorted.length === 7) return 'Todos los días'
    if (sorted.length === 2 && sorted.includes(0) && sorted.includes(6)) return 'Fines de Sem'

    // Map specific names if short
    return sorted.map(d => dayNames[d]).join(',')
}

function formatTime(hour: number) {
    const ampm = hour >= 12 ? 'pm' : 'am'
    const h = hour % 12 || 12
    return `${h}${ampm}`
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json()
        const { id, name, email, role, schedule, image } = body

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

        // Logic for tempSchedule atomic update of a specific week key
        let finalTempScheduleString = undefined

        if (body.tempSchedule !== undefined) {
            // We need to fetch the CURRENT user first to get existing map, or we overwrite
            const currentUser = await prisma.user.findUnique({ where: { id: body.id }, select: { tempSchedule: true } })

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let scheduleMap: Record<string, any> = {}
            if (currentUser?.tempSchedule) {
                try {
                    const parsed = JSON.parse(currentUser.tempSchedule)
                    if (Array.isArray(parsed)) {
                        // Migration: If it was an array, assume it belongs to "Current Week"
                        // But we don't know "Current Week" easily here without calc
                        // Let's just reset if array, or put in today's week.
                    } else {
                        scheduleMap = parsed
                    }
                } catch (e) { }
            }

            if (body.weekStart && body.tempSchedule) {
                // Update specific week
                scheduleMap[body.weekStart] = body.tempSchedule
            } else if (body.tempSchedule === null && body.weekStart) {
                // Clear specific week
                delete scheduleMap[body.weekStart]
            } else if (body.tempSchedule === null && !body.weekStart) {
                // Clear ALL (Reset button)
                scheduleMap = {}
            }

            finalTempScheduleString = JSON.stringify(scheduleMap)
        }

        const updatedUser = await prisma.user.update({
            where: { id: body.id },
            data: {
                name,
                email,
                role,
                image,
                schedule: schedule ? JSON.stringify(schedule) : undefined,
                tempSchedule: finalTempScheduleString !== undefined ? finalTempScheduleString : undefined
            }
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, email, password, role, image, schedule } = body

        // Simple validation
        if (!email || !name || !password) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 })
        }

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password,
                role: role || 'OPERATOR',
                image: image || `https://ui-avatars.com/api/?name=${name.replace(' ', '+')}&background=random`,
                schedule: schedule ? JSON.stringify(schedule) : null
            }
        })
        return NextResponse.json(newUser)
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 })
        }

        await prisma.user.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}
