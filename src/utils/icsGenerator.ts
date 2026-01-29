export const generateICS = (
    shifts: { days: number[], start: number, end: number }[] | Record<string, { days: number[], start: number, end: number }[]>,
    startWeekDate: string, // YYYY-MM-DD
    operatorName: string,
    numWeeks: number = 1 // Default to 1 week
) => {
    const events: string[] = []

    // Helper to format date for ICS: YYYYMMDDTHHmm00
    const formatLocal = (date: Date) => {
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        const h = String(date.getHours()).padStart(2, '0')
        const min = String(date.getMinutes()).padStart(2, '0')
        return `${y}${m}${d}T${h}${min}00`
    }

    // Helper to format date for Key lookup: YYYY-MM-DD
    const formatKey = (date: Date) => {
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
    }

    const [y, m, d] = startWeekDate.split('-').map(Number)
    const baseSunday = new Date(y, m - 1, d)

    // Loop for Number of Weeks
    for (let w = 0; w < numWeeks; w++) {
        // Calculate Sunday for this specific week iteration
        const currentSunday = new Date(baseSunday)
        currentSunday.setDate(baseSunday.getDate() + (w * 7)) // Add 7 days per week iteration

        let weekShifts: { days: number[], start: number, end: number }[] = []

        if (Array.isArray(shifts)) {
            weekShifts = shifts
        } else if (typeof shifts === 'object' && shifts !== null) {
            // It's a map: keys are Sunday dates (YYYY-MM-DD)
            const key = formatKey(currentSunday)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            weekShifts = (shifts as any)[key] || []
        }

        if (!weekShifts || !Array.isArray(weekShifts)) continue

        weekShifts.forEach(shift => {
            if (!shift || !shift.days || !Array.isArray(shift.days)) return

            shift.days.forEach(dayIndex => { // 0=Sun, 1=Mon...
                // Calculate actual date for this shift
                const shiftDate = new Date(currentSunday)
                shiftDate.setDate(currentSunday.getDate() + dayIndex)

                // Start Time
                const startHour = Math.floor(shift.start)
                const startMin = (shift.start % 1) * 60
                shiftDate.setHours(startHour, startMin, 0, 0)
                const dtStart = formatLocal(shiftDate)

                // End Time
                const endDate = new Date(shiftDate)
                // Handle midnight/next day
                const endHourIs = shift.end === 0 ? 24 : shift.end
                const endHour = Math.floor(endHourIs)
                const endMin = (endHourIs % 1) * 60

                // If it crosses midnight or is exactly midnight of next day
                endDate.setHours(endHour, endMin, 0, 0)

                const dtEnd = formatLocal(endDate)

                events.push(`BEGIN:VEVENT
SUMMARY:Turno Control Master - ${operatorName}
DTSTART;TZID=America/Costa_Rica:${dtStart}
DTEND;TZID=America/Costa_Rica:${dtEnd}
DESCRIPTION:Turno asignado en Enlace.
STATUS:CONFIRMED
END:VEVENT`)
            })
        })
    }

    const cal = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Enlace//Operator Schedule//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Horario ${operatorName}
X-WR-TIMEZONE:America/Costa_Rica
BEGIN:VTIMEZONE
TZID:America/Costa_Rica
X-LIC-LOCATION:America/Costa_Rica
BEGIN:STANDARD
TZOFFSETFROM:-0600
TZOFFSETTO:-0600
TZNAME:CST
DTSTART:19700101T000000
END:STANDARD
END:VTIMEZONE
${events.join('\n')}
END:VCALENDAR`

    return cal
}

export const downloadICS = (content: string, filename: string) => {
    // Check if running in browser
    if (typeof window !== 'undefined') {
        const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }
}

