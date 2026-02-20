"use client"

import { useMemo, useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, ChevronLeft, ChevronRight, User, Trash2, Plane, CalendarDays, Shield } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export interface Shift {
    days: number[]
    start: number
    end: number
}

interface Operator {
    id: string
    name: string
    image?: string
    shifts?: Shift[]
    isTempSchedule?: boolean
    role?: string
}

interface WeeklyCalendarProps {
    operators: Operator[]
    onUpdateSchedule?: (userId: string, newShifts: Shift[], weekStart: string) => Promise<void>
    currentWeekStart: string // The week being VIEWED
    onWeekChange?: (newDate: string) => void
    isLoading?: boolean
    onEditUser?: (operator: Operator) => void
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function WeeklyCalendar({ operators, onUpdateSchedule, currentWeekStart, onWeekChange, isLoading = false, onEditUser }: WeeklyCalendarProps) {
    const isEditingEnabled = !!onUpdateSchedule

    // Calculate dates for headers
    const weekDates = useMemo(() => {
        if (!currentWeekStart) return []
        const start = new Date(currentWeekStart.includes('T') ? currentWeekStart : currentWeekStart + 'T12:00:00')
        if (isNaN(start.getTime())) return []

        return DAYS.map((d, i) => {
            const date = new Date(start)
            date.setDate(start.getDate() + i)
            const dayNum = date.getDate()
            const monthNum = date.getMonth() + 1
            return {
                name: d,
                dateStr: `${dayNum}/${monthNum.toString().padStart(2, '0')}`,
                fullDate: date.toISOString().split('T')[0]
            }
        })
    }, [currentWeekStart])

    // Auto-Correct Week Alignment (Fix Saturday drift)
    useEffect(() => {
        if (!onWeekChange || !currentWeekStart) return
        const start = new Date(currentWeekStart + 'T12:00:00')
        if (isNaN(start.getTime())) return // Extra safety
        if (start.getDay() !== 0) {
            console.log("Auto-correcting Week Start from", currentWeekStart)
            const diff = start.getDay()
            start.setDate(start.getDate() - diff)
            const y = start.getFullYear()
            const m = String(start.getMonth() + 1).padStart(2, '0')
            const d = String(start.getDate()).padStart(2, '0')
            onWeekChange(`${y}-${m}-${d}`)
        }
    }, [currentWeekStart, onWeekChange])

    // Verify if the week being viewed is actually the CURRENT REAL WORLD week
    const isCurrentRealWeek = useMemo(() => {
        const now = new Date()
        const nowStr = now.toISOString().split('T')[0]
        // Very basic check: is "today" inside the weekDates?
        return weekDates.some(wd => wd.fullDate === nowStr)
    }, [weekDates])

    // Group shifts by day
    const dayColumns = useMemo(() => {
        const columns: { dateLabel: string, dayIndex: number, shifts: { op: Operator, shift: Shift, shiftIndex: number }[] }[] = weekDates.map((d, i) => ({
            dateLabel: `${d.name} ${d.dateStr}`,
            dayIndex: i,
            shifts: []
        }))

        operators.forEach(op => {
            if (!op.shifts) return
            op.shifts.forEach((shift, shiftIndex) => {
                shift.days.forEach(dayIndex => {
                    if (columns[dayIndex]) {
                        columns[dayIndex].shifts.push({ op, shift, shiftIndex })
                    }
                })
            })
        })

        // Sort shifts by start time
        columns.forEach(col => {
            col.shifts.sort((a, b) => a.shift.start - b.shift.start)
        })

        return columns
    }, [operators, weekDates])

    const formatTime = (h: number) => {
        const ampm = h >= 12 ? 'PM' : 'AM'
        const hour = h % 12 || 12
        return `${hour}:00 ${ampm}`
    }

    // Modal State
    interface EditingShift extends Shift {
        targetOpId: string
        tempId: string
    }

    const [editingState, setEditingState] = useState<{
        originalOpId: string,
        dayIndex: number,
        shifts: EditingShift[]
    } | null>(null)

    // State for Vacation Confirmation Dialog
    const [confirmingVacation, setConfirmingVacation] = useState(false)
    const [vacationStart, setVacationStart] = useState("")
    const [vacationEnd, setVacationEnd] = useState("")

    const handleEditClick = (op: Operator, dayIndex: number) => {
        if (!isEditingEnabled) return

        // If external edit handler is provided (e.g., from Configuration Page), use it to open the full editor
        if (onEditUser) {
            onEditUser(op)
            return
        }

        const userShiftsForDay = op.shifts?.filter(s => s.days.includes(dayIndex)) || []
        const shifts: EditingShift[] = userShiftsForDay.map((s) => ({
            ...s,
            targetOpId: op.id,
            tempId: Math.random().toString(36).substr(2, 9)
        }))
        setEditingState({
            originalOpId: op.id,
            dayIndex,
            shifts
        })
    }

    // VACATION MODE: Date Range Logic
    const handleVacationMode = async () => {
        if (!onUpdateSchedule || !editingState || !vacationStart || !vacationEnd) return

        const start = new Date(vacationStart + 'T12:00:00')
        const end = new Date(vacationEnd + 'T12:00:00')

        if (isNaN(start.getTime()) || isNaN(end.getTime())) return

        // Group dates by Week Start to handle "Partial Future Weeks"
        const datesByWeek: Record<string, number[]> = {}

        const current = new Date(start)
        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0]

            // Calculate which week this date belongs to
            const dateObj = new Date(dateStr + 'T12:00:00')
            const day = dateObj.getDay()
            const diff = dateObj.getDate() - day
            const sunday = new Date(dateObj)
            sunday.setDate(diff)
            const y = sunday.getFullYear()
            const m = String(sunday.getMonth() + 1).padStart(2, '0')
            const d = String(sunday.getDate()).padStart(2, '0')
            const weekKey = `${y}-${m}-${d}`

            if (!datesByWeek[weekKey]) datesByWeek[weekKey] = []

            // Add the day index (0-6)
            datesByWeek[weekKey].push(day)

            current.setDate(current.getDate() + 1)
        }

        // Process each affected week SEQUENTIALLY
        const weekKeys = Object.keys(datesByWeek)

        for (const weekKey of weekKeys) {
            const daysToClear = datesByWeek[weekKey]
            console.log(`Processing Week ${weekKey}. Days to Clear: ${daysToClear}`)

            // 1. If it's the CURRENT VIEW, use the data we already have in 'operators'
            if (weekKey === currentWeekStart) {
                const op = operators.find(o => o.id === editingState.originalOpId)
                if (op && op.shifts) {
                    const newShifts: Shift[] = []
                    op.shifts.forEach(s => {
                        const remainingDays = s.days.filter(d => !daysToClear.includes(d))
                        if (remainingDays.length > 0) newShifts.push({ ...s, days: remainingDays })
                    })
                    await onUpdateSchedule(editingState.originalOpId, newShifts, weekKey)
                }
            }
            // 2. If it's a FUTURE/DIFFERENT week, we must FETCH the data first to know what to keep!
            else {
                try {
                    const res = await fetch(`/api/users?weekStart=${weekKey}`, { cache: 'no-store' })
                    if (res.ok) {
                        const data = await res.json()
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const op = data.find((u: any) => u.id === editingState.originalOpId)

                        if (op && op.shifts) {
                            const newShifts: Shift[] = []
                            op.shifts.forEach((s: Shift) => {
                                const remainingDays = s.days.filter(d => !daysToClear.includes(d))
                                if (remainingDays.length > 0) newShifts.push({ ...s, days: remainingDays })
                            })
                            // If newShifts is empty, it means FULL VACATION for that week
                            // If not empty, it means PARTIAL VACATION (e.g. returning mid-week)
                            await onUpdateSchedule(editingState.originalOpId, newShifts, weekKey)
                        } else {
                            // If no shifts found (maybe free week?), ensure it stays clear or whatever logic required.
                            // But usually we assume if they exist in DB they return something. 
                            // If they have no shifts, sending [] doesn't hurt.
                            await onUpdateSchedule(editingState.originalOpId, [], weekKey)
                        }
                    }
                } catch (e) {
                    console.error(`Error processing future week ${weekKey}`, e)
                }
            }
        }

        // NUCLEAR OPTION: Force full reload to verify server state
        window.location.reload()
    }

    const saveChanges = () => {
        if (!editingState || !onUpdateSchedule) return
        const { originalOpId, dayIndex, shifts } = editingState

        // Group new shifts by Target Operator
        const shiftsByOp: Record<string, EditingShift[]> = {}

        // Initialize with default/original operator shifts just in case
        shiftsByOp[originalOpId] = []

        shifts.forEach(s => {
            if (!shiftsByOp[s.targetOpId]) shiftsByOp[s.targetOpId] = []
            shiftsByOp[s.targetOpId].push(s)
        })

        // Identify ALL Ops involved (Original + Any new targets)
        const opsToUpdate = new Set([...Object.keys(shiftsByOp), originalOpId])

        opsToUpdate.forEach(opId => {
            const op = operators.find(o => o.id === opId)
            if (!op) return

            // 1. Determine which days are being "Overwritten" by the new edits FOR THIS OPERATOR
            // Note: If I move a shift FROM Op A TO Op B, Op A loses it, Op B gains it.
            // But we need to handle "Clearing" properly.

            // Logic:
            // For the Original Operator (the one we opened):
            // We must clear 'dayIndex' (the clicked day) because we are definitely processing it.
            // PLUS we must clear any days that are claimed by shifts remaining assigned to Original Operator?
            // AND the user might have UNCHECKED days from a multi-day shift.

            // Simpler "Bulk Apply" Logic:
            // We collect all days mentioned in the 'shifts' array (regardless of target).
            // These are the days the user is "Touching".
            // BUT wait, if I move a shift from A -> B on Monday.
            // A loses Monday. B gains Monday.

            // What if I only unchecked Monday for A?
            // Then A loses Monday.

            // Correct Logic per Operator:
            // "shifts" contains the FINAL DESIRED STATE for the days involved in the edit *originated* from dayIndex.

            // Let's define "Days Affected by Edit Context":
            // It's the set of days that the user explicitly interacted with? 
            // No, the user sees a list of shifts.
            // Implicitly, we are overwriting the schedule for the 'selected days' in those shifts.

            // CRITICAL: We also need to clear 'dayIndex' for the originalOpId, 
            // because if the user deleted all shifts, 'shifts' is empty, 
            // so we must ensure dayIndex is cleared.

            // So:
            // 1. Get original shifts for this Op.
            // 2. Filter out any shift that overlaps with:
            //    a) 'dayIndex' (only if opId === originalOpId) -> We are definitely editing this day.
            //    b) Any day included in the NEW shifts assigned to this opId. (Overwrite logic)

            // Wait, if I assign Mon-Tue to Op A.
            // I should clear Mon-Tue from Op A's existing schedule, then add the new Mon-Tue shift.

            const daysToClear = new Set<number>()

            if (opId === originalOpId) {
                daysToClear.add(dayIndex)
            }

            const myNewShifts = shiftsByOp[opId] || []
            myNewShifts.forEach(s => s.days.forEach(d => daysToClear.add(d)))

            const cleanOriginalShifts: Shift[] = []

            op.shifts?.forEach(s => {
                // If this shift overlaps with daysToClear, we allow it BUT shrink it (remove affected days)
                const remainingDays = s.days.filter(d => !daysToClear.has(d))

                if (remainingDays.length > 0) {
                    cleanOriginalShifts.push({ ...s, days: remainingDays })
                }
            })

            // 3. Add the New Shifts
            // We need to merge them? `myNewShifts` are EditingShift objects.
            const finalShifts = [...cleanOriginalShifts]
            myNewShifts.forEach(s => {
                if (s.days.length > 0) {
                    finalShifts.push({
                        days: s.days,
                        start: s.start,
                        end: s.end
                    })
                }
            })

            onUpdateSchedule(opId, finalShifts, currentWeekStart)
        })

        setEditingState(null)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateEditingShift = (tempId: string, field: keyof EditingShift, value: any) => {
        if (!editingState) return
        setEditingState({
            ...editingState,
            shifts: editingState.shifts.map(s => s.tempId === tempId ? { ...s, [field]: value } : s)
        })
    }

    const removeShiftFromEdit = (tempId: string) => {
        if (!editingState) return
        setEditingState({
            ...editingState,
            shifts: editingState.shifts.filter(s => s.tempId !== tempId)
        })
    }

    const addNewShiftToEdit = () => {
        if (!editingState) return
        setEditingState({
            ...editingState,
            shifts: [...editingState.shifts, {
                days: [editingState.dayIndex],
                start: 9,
                end: 17,
                targetOpId: editingState.originalOpId,
                tempId: Math.random().toString(36).substr(2, 9)
            }]
        })
    }

    const adjustWeek = (direction: 'prev' | 'next') => {
        if (!onWeekChange || !currentWeekStart) return
        const date = new Date(currentWeekStart.includes('T') ? currentWeekStart : currentWeekStart + 'T12:00:00') // Force Noon to avoid TZ drift
        if (isNaN(date.getTime())) return

        date.setDate(date.getDate() + (direction === 'next' ? 7 : -7))

        // Safety Snap to Sunday (if drifted)
        const day = date.getDay()
        if (day !== 0) {
            date.setDate(date.getDate() - day)
        }

        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        onWeekChange(`${y}-${m}-${d}`)
    }

    return (
        <div className="bg-card md:rounded-md border border-border overflow-hidden flex flex-col h-full w-full relative">
            {/* Toolbar / Navigation */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono font-medium opacity-70">
                        {currentWeekStart}
                    </Badge>
                    {isCurrentRealWeek && <Badge className="bg-[#FF0C60] text-white border-none shadow-sm text-[10px] px-1.5 h-5">Actual</Badge>}
                </div>

                {onWeekChange && (
                    <div className="flex items-center gap-1 bg-card rounded-md border border-border p-0.5 shadow-sm">
                        <Button variant="ghost" size="icon" onClick={() => adjustWeek('prev')} className="h-7 w-7 text-muted-foreground hover:text-foreground">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="h-4 w-[1px] bg-border mx-1" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2">Navegar</span>
                        <div className="h-4 w-[1px] bg-border mx-1" />
                        <Button variant="ghost" size="icon" onClick={() => adjustWeek('next')} className="h-7 w-7 text-muted-foreground hover:text-foreground">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>

            <ScrollArea className="flex-1 w-full bg-background/50 z-10 relative">
                {isLoading && (
                    <div className="absolute inset-0 z-50 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-2 border-[#FF0C60] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-bold text-[#FF0C60] animate-pulse">Cargando...</span>
                        </div>
                    </div>
                )}
                {/* Desktop Grid */}
                <div className="hidden md:grid grid-cols-7 divide-x divide-border h-full min-w-[1200px]">
                    {dayColumns.map((col, i) => {
                        const isToday = isCurrentRealWeek && new Date().getDay() === i
                        return (
                            <div key={col.dayIndex} className={`flex flex-col relative group transition-colors ${isToday ? 'bg-[#FF0C60]/[0.02]' : 'hover:bg-muted/10'}`}>
                                {/* Column Header */}
                                <div className={`sticky top-0 z-10 py-3 text-center border-b backdrop-blur-md ${isToday ? 'bg-[#FF0C60]/10 border-[#FF0C60]/20 text-[#FF0C60]' : 'bg-background/80 border-border text-muted-foreground'}`}>
                                    <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5">{col.dateLabel.split(' ')[0]}</span>
                                    <span className="text-lg font-bold leading-none">{col.dateLabel.split(' ')[1]}</span>
                                </div>

                                <div className="p-2 space-y-2 flex-1 pb-10">
                                    {col.shifts.map((item, idx) => {
                                        const isActiveNow = isToday && new Date().getHours() >= item.shift.start && new Date().getHours() < (item.shift.end === 0 ? 24 : item.shift.end)
                                        return (
                                            <motion.div
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                key={`${item.op.id}-${idx}`}
                                                onClick={() => handleEditClick(item.op, col.dayIndex)}
                                                className={`
                                                    relative overflow-hidden rounded-md border p-2 cursor-pointer transition-all duration-200
                                                    hover:shadow-md hover:border-[#FF0C60]/40 group/card
                                                    ${isActiveNow
                                                        ? 'bg-card border-[#FF0C60] shadow-sm ring-1 ring-[#FF0C60]/20'
                                                        : 'bg-card border-border shadow-none hover:bg-muted/30'}
                                                `}
                                            >
                                                {/* Active Indicator */}
                                                {isActiveNow && <div className="absolute top-0 right-0 w-2 h-2 m-1.5 bg-[#FF0C60] rounded-full animate-pulse" />}

                                                <div className="flex items-center gap-2 mb-2">
                                                    <Avatar className="w-6 h-6 rounded-md border border-border">
                                                        <AvatarImage src={item.op.image} />
                                                        <AvatarFallback className="rounded-md bg-muted text-[9px] font-bold text-muted-foreground">{item.op.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[11px] font-bold text-foreground truncate leading-tight">{item.op.name}</div>
                                                        <div className="text-[9px] text-muted-foreground truncate font-medium">
                                                            {(item.op.role === 'BOSS' || item.op.role === 'Boss') ? 'Admin' : 'Operador'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={`
                                                    flex items-center justify-between text-[10px] font-mono px-1.5 py-1 rounded
                                                    ${isActiveNow ? 'bg-[#FF0C60]/10 text-[#FF0C60] font-bold' : 'bg-muted/50 text-muted-foreground'}
                                                `}>
                                                    <span>{formatTime(item.shift.start)}</span>
                                                    <span className="opacity-30">-</span>
                                                    <span>{formatTime(item.shift.end)}</span>
                                                </div>

                                                {item.op.isTempSchedule && (
                                                    <div className="absolute bottom-1 right-1 w-1 h-1 bg-amber-500 rounded-full" title="Horario temporal" />
                                                )}
                                            </motion.div>
                                        )
                                    })}

                                    {isEditingEnabled && (
                                        <button
                                            className="w-full py-1.5 rounded border border-dashed border-border/50 text-xs text-muted-foreground/50 hover:text-[#FF0C60] hover:border-[#FF0C60]/30 hover:bg-[#FF0C60]/5 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1"
                                            onClick={() => {
                                                if (operators.length > 0) handleEditClick(operators[0], col.dayIndex)
                                            }}
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Mobile View */}
                <div className="md:hidden flex flex-col w-full pb-20 divide-y divide-border">
                    {dayColumns.map((col, i) => {
                        const isToday = isCurrentRealWeek && new Date().getDay() === i
                        return (
                            <div key={col.dayIndex} className={`flex flex-col ${isToday ? 'bg-[#FF0C60]/[0.02]' : ''}`}>
                                {/* Sticky Day Header */}
                                <div className={`sticky top-0 z-20 px-4 py-2 flex items-center justify-between backdrop-blur-xl border-b border-border/50 ${isToday ? 'bg-[#FF0C60]/5 border-[#FF0C60]/20' : 'bg-background/90'}`}>
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-sm font-bold capitalize ${isToday ? 'text-[#FF0C60]' : 'text-foreground'}`}>{col.dateLabel.split(' ')[0]}</span>
                                        <span className="text-xs text-muted-foreground font-medium">{col.dateLabel.split(' ')[1]}</span>
                                    </div>
                                    {isToday && <span className="text-[10px] font-bold text-[#FF0C60] bg-[#FF0C60]/10 px-2 py-0.5 rounded-full">HOY</span>}
                                </div>

                                <div className="p-3 grid grid-cols-1 gap-2">
                                    {col.shifts.length === 0 ? (
                                        <div className="text-xs text-muted-foreground/40 italic py-2 text-center">Sin turnos</div>
                                    ) : (
                                        col.shifts.map((item, idx) => (
                                            <div
                                                key={`${item.op.id}-${idx}`}
                                                onClick={() => handleEditClick(item.op, col.dayIndex)}
                                                className="bg-card border border-border rounded-lg p-3 flex items-center justify-between active:scale-[0.99] transition-transform shadow-sm"
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <Avatar className="w-9 h-9 border border-border shrink-0">
                                                        <AvatarImage src={item.op.image} />
                                                        <AvatarFallback className="text-[10px] bg-muted text-muted-foreground font-bold">{item.op.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-sm text-foreground truncate">{item.op.name}</div>
                                                        <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                                                            {(item.op.role === 'BOSS' || item.op.role === 'Boss') ? (
                                                                <span className="text-amber-500 flex items-center gap-1"><Shield className="w-3 h-3" /> Admin</span>
                                                            ) : 'Operador'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end shrink-0 pl-2">
                                                    <div className="text-xs font-mono font-bold text-foreground">
                                                        {formatTime(item.shift.start)}
                                                    </div>
                                                    <div className="text-[10px] font-mono text-muted-foreground">
                                                        {formatTime(item.shift.end)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>

            {/* EDITOR MODAL */}
            <Dialog open={!!editingState} onOpenChange={(o) => { if (!o) setEditingState(null) }}>
                <DialogContent className="bg-card backdrop-blur-2xl border-border text-foreground max-w-lg mb-0 rounded-md shadow-none ring-1 ring-border overflow-hidden p-0 max-h-[85vh] flex flex-col">
                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                        <div className="flex justify-between items-start border-b border-border pb-4">
                            <div>
                                <DialogTitle className="font-bold text-2xl tracking-tight text-foreground">
                                    Editar Turno
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#FF0C60]" />
                                    {editingState && DAYS[editingState.dayIndex]} ({editingState && weekDates[editingState.dayIndex].dateStr})
                                </DialogDescription>
                            </div>

                            {/* Vacation / Clear Week Button */}
                            {isEditingEnabled && editingState && (
                                <Dialog open={confirmingVacation} onOpenChange={setConfirmingVacation}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 border-rose-200"
                                        >
                                            <Plane className="w-4 h-4 mr-2" />
                                            Vacaciones
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-card border-border max-w-sm">
                                        <DialogTitle className="sr-only">Confirmar Vacaciones</DialogTitle>
                                        <DialogDescription className="sr-only">Seleccione el rango de fechas para las vacaciones.</DialogDescription>
                                        <div className="flex flex-col items-center text-center gap-4 py-4">
                                            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2">
                                                <CalendarDays className="w-6 h-6" />
                                            </div>
                                            <h3 className="text-lg font-bold">Planificar Vacaciones</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Seleccione el rango de fechas.
                                                <br />
                                                <span className="text-xs opacity-70">Los turnos en este periodo serán eliminados.</span>
                                            </p>

                                            <div className="grid grid-cols-2 gap-4 w-full mt-2 text-left">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-muted-foreground">Desde</label>
                                                    <Input
                                                        type="date"
                                                        value={vacationStart}
                                                        onChange={(e) => setVacationStart(e.target.value)}
                                                        className="bg-muted/10 border-border text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-muted-foreground">Hasta</label>
                                                    <Input
                                                        type="date"
                                                        value={vacationEnd}
                                                        onChange={(e) => setVacationEnd(e.target.value)}
                                                        className="bg-muted/10 border-border text-xs"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex gap-3 w-full mt-4">
                                                <Button variant="ghost" onClick={() => setConfirmingVacation(false)} className="flex-1">Cancelar</Button>
                                                <Button onClick={handleVacationMode} disabled={!vacationStart || !vacationEnd} className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:opacity-50">
                                                    Aplicar
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        <div className="space-y-4">
                            {editingState?.shifts.length === 0 && (
                                <div className="text-center text-slate-500 text-sm py-8 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                                    No hay turnos asignados.
                                </div>
                            )}

                            {editingState?.shifts.map((shift) => (
                                <div key={shift.tempId} className="bg-muted/30 p-5 rounded-2xl border border-border space-y-5 relative group shadow-sm">

                                    {/* Days Selector */}
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-bold text-muted-foreground tracking-tight">Días aplicables</div>
                                        <div className="flex gap-1 flex-wrap">
                                            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((dayLabel, index) => {
                                                const isSelected = shift.days.includes(index)
                                                return (
                                                    <button
                                                        key={index}
                                                        onClick={() => {
                                                            const newDays = isSelected
                                                                ? shift.days.filter(d => d !== index)
                                                                : [...shift.days, index]
                                                            updateEditingShift(shift.tempId, 'days', newDays)
                                                        }}
                                                        className={`
                                                            w-8 h-8 rounded-md text-xs font-bold transition-all border
                                                            ${isSelected
                                                                ? 'bg-[#FF0C60] text-white border-[#FF0C60] shadow-md shadow-[#FF0C60]/20'
                                                                : 'bg-card text-muted-foreground border-border hover:bg-muted hover:border-border'
                                                            }
                                                        `}
                                                        title={DAYS[index]}
                                                    >
                                                        {dayLabel}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1.5 flex-1">
                                            <div className="text-[10px] font-bold text-muted-foreground tracking-tight">Horario</div>
                                            <div className="flex items-center gap-2 w-full">
                                                <Select value={String(shift.start)} onValueChange={v => updateEditingShift(shift.tempId, 'start', Number(v))}>
                                                    <SelectTrigger className="h-10 text-sm bg-card border-border rounded-md flex-1 font-mono text-foreground font-bold"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-card border-border">
                                                        {Array.from({ length: 24 }, (_, i) => i).map(h => <SelectItem key={h} value={String(h)}>{formatTime(h)}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <span className="text-muted-foreground font-bold">-</span>
                                                <Select value={String(shift.end)} onValueChange={v => updateEditingShift(shift.tempId, 'end', Number(v))}>
                                                    <SelectTrigger className="h-10 text-sm bg-card border-border rounded-md flex-1 font-mono text-foreground font-bold"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-card border-border">
                                                        {Array.from({ length: 25 }, (_, i) => i).map(h => <SelectItem key={h} value={String(h)}>{formatTime(h)}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 -mt-1" onClick={() => removeShiftFromEdit(shift.tempId)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="text-[10px] font-bold text-muted-foreground tracking-tight">Asignado a</div>
                                        <Select value={shift.targetOpId} onValueChange={v => updateEditingShift(shift.tempId, 'targetOpId', v)}>
                                            <SelectTrigger className={`h-10 text-sm border-border rounded-md ${shift.targetOpId !== editingState.originalOpId ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold' : 'bg-card text-foreground'}`}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-border">
                                                {operators.map(op => (
                                                    <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {shift.targetOpId !== editingState.originalOpId && (
                                        <div className="bg-amber-500/10 text-amber-500/90 p-2.5 rounded-md text-xs flex items-center gap-2 border border-amber-500/20">
                                            <User className="w-3 h-3" /> Se moverá a <span className="font-bold">{operators.find(o => o.id === shift.targetOpId)?.name}</span>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <Button variant="outline" onClick={addNewShiftToEdit} className="w-full h-12 border-dashed border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">
                                <Plus className="w-4 h-4 mr-2" /> Agregar Turno
                            </Button>
                        </div>
                    </div>

                    <div className="p-4 bg-muted/20 border-t border-border flex gap-3">
                        <Button variant="ghost" onClick={() => setEditingState(null)} className="flex-1 rounded-md hover:bg-muted/50">Cancelar</Button>
                        <Button className="bg-[#FF0C60] hover:bg-[#d90a50] text-white flex-1 rounded-md shadow-lg shadow-rose-900/20 transition-all font-bold tracking-wide" onClick={saveChanges}>Guardar Cambios</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    )
}
