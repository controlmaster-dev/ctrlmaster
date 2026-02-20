import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: Fetch shifts for a specific event
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const eventId = searchParams.get('eventId')

        if (!eventId) return NextResponse.json({ error: "Event ID required" }, { status: 400 })

        const shifts = await prisma.specialEventShift.findMany({
            where: { eventId },
            include: { user: { select: { name: true, image: true } } }
        })

        return NextResponse.json(shifts)

    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}

// POST: Save shifts for a user in an event (Bulk Replace)
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { eventId, userId, shifts } = body // shifts: { day, start, end }[]

        if (!eventId || !userId || !Array.isArray(shifts)) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 })
        }

        // Transaction to wipe old shifts for this user-event combo in this DATE RANGE
        // Actually, the UI saves by "Week", so effectively we are replacing shifts for the dates sent?
        // Or do we wipe ALL shifts for this user/event and replace with the new set?
        // If the UI sends the WHOLE event schedule, we wipe all.
        // If the UI sends just a week, we should only wipe those dates?
        // The current SpecialEventsManager sends specific days from WeeklyCalendar.
        // Let's assume the client sends the *Delta* or we wipe everything?
        // Previous logic was: wipe all for userId + eventId.
        // If we want to support multi-week, the UI might only be showing one week.
        // If we wipe ALL, we lose the other weeks.

        // Fix: The Frontend should send the "Week Start" or the "Range" being edited?
        // Or cleaner: The frontend sends a list of shifts. We wipe shifts for this user/event that fall within the *Dates* being edited?
        // But if the user *removes* a shift, it won't be in the list.

        // Better approach for now: 
        // We will wipe *ALL* shifts for this user in this event IF the client indicates it's a "Full Replace" or we accept we are building it incrementally?
        // No, "Marathon Mode" usually implies setting up the whole thing.
        // But if I move to Week 2, I don't want to lose Week 1.

        // Strategy: 
        // 1. Client sends `shifts` array.
        // 2. We presume this is the *entire schema* for this user in this event?
        //    If so, we delete all and re-create.
        //    But if the UI is paginated by week, the user might not have loaded Week 2's shifts.
        //    So the client assumes it has everything?
        //    The `SpecialEventsManager` loads *all* shifts for the event initially: `fetch(/api/special-events/shifts?eventId=...)`.
        //    So yes, the Client HAS all shifts.
        //    So when it saves, it should send ALL shifts for the user.

        //    Let's verify SpecialEventsManager:
        //    `handleUpdateEventSchedule` -> `setEventShifts` overwrites the user's entry.
        //    If `eventShifts` stores ALL shifts for the user, then we are safe to wipe and replace.
        //    `openEventSchedule` fetches ALL shifts.

        await prisma.$transaction(async (tx) => {
            // 1. Delete existing shifts for this user in this event
            await tx.specialEventShift.deleteMany({
                where: {
                    eventId,
                    userId
                }
            })

            // 2. Insert new ones
            if (shifts.length > 0) {
                await tx.specialEventShift.createMany({
                    data: shifts.map((s: any) => ({
                        eventId,
                        userId,
                        date: s.date, // Expect "YYYY-MM-DD"
                        start: s.start,
                        end: s.end
                    }))
                })
            }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}
