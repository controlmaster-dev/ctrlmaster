"use client"

import { useMemo, useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Timer, Edit2, ChevronLeft, ChevronRight, User, Trash2, Plane, CalendarDays } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
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
}

interface WeeklyCalendarProps {
    operators: Operator[]
    onUpdateSchedule?: (userId: string, newShifts: Shift[], weekStart: string) => Promise<void>
    currentWeekStart: string // The week being VIEWED
    onWeekChange?: (newDate: string) => void
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function WeeklyCalendar({ operators, onUpdateSchedule, currentWeekStart, onWeekChange }: WeeklyCalendarProps) {
    const isEditingEnabled = !!onUpdateSchedule

    // Calculate dates for headers
    const weekDates = useMemo(() => {
        const start = new Date(currentWeekStart + 'T12:00:00') // Avoid timezone shift
        return DAYS.map((d, i) => {
            const date = new Date(start)
            date.setDate(start.getDate() + i)
            return {
                name: d,
                dateStr: date.getDate(), // Just the number
                fullDate: date.toISOString().split('T')[0]
            }
        })
    }, [currentWeekStart])

    // Auto-Correct Week Alignment (Fix Saturday drift)
    useEffect(() => {
        if (!onWeekChange) return
        const start = new Date(currentWeekStart + 'T12:00:00')
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
        const originalOp = operators.find(o => o.id === originalOpId)
        if (!originalOp) return

        // 1. Clean Original
        const cleanOriginalShifts: Shift[] = []
        originalOp.shifts?.forEach(s => {
            if (s.days.includes(dayIndex)) {
                const remainingDays = s.days.filter(d => d !== dayIndex)
                if (remainingDays.length > 0) {
                    cleanOriginalShifts.push({ ...s, days: remainingDays })
                }
            } else {
                cleanOriginalShifts.push(s)
            }
        })

        // 2. Add back
        const shiftsForOriginal = shifts.filter(s => s.targetOpId === originalOpId)
        shiftsForOriginal.forEach(s => {
            cleanOriginalShifts.push({
                days: [dayIndex],
                start: s.start,
                end: s.end
            })
        })
        onUpdateSchedule(originalOpId, cleanOriginalShifts, currentWeekStart)

        // 3. Handle Swaps
        const swaps = shifts.filter(s => s.targetOpId !== originalOpId)
        const shiftsByTarget: Record<string, EditingShift[]> = {}
        swaps.forEach(s => {
            if (!shiftsByTarget[s.targetOpId]) shiftsByTarget[s.targetOpId] = []
            shiftsByTarget[s.targetOpId].push(s)
        })

        Object.keys(shiftsByTarget).forEach(targetId => {
            const targetOp = operators.find(o => o.id === targetId)
            if (!targetOp) return
            const newShiftsForTarget = [...(targetOp.shifts || [])]
            shiftsByTarget[targetId].forEach(s => {
                newShiftsForTarget.push({
                    days: [dayIndex],
                    start: s.start,
                    end: s.end
                })
            })
            onUpdateSchedule(targetId, newShiftsForTarget, currentWeekStart)
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
        if (!onWeekChange) return
        const date = new Date(currentWeekStart + 'T12:00:00') // Force Noon to avoid TZ drift
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
        <div className="bg-[#050505]/40 backdrop-blur-[40px] md:rounded-3xl border border-white/[0.03] overflow-hidden flex flex-col h-full md:h-[750px] w-full shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative font-light tracking-wide">
            {/* Noise Texture Overlay - Subtle */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

            {/* Week Navigation */}
            <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-gradient-to-b from-white/[0.02] to-transparent border-b border-white/[0.05] gap-4 z-20 sticky top-0 md:relative">
                <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-[#FF0C60]" />
                    <h2 className="text-lg font-bold text-white tracking-wide">Semana del {currentWeekStart}</h2>
                    {isCurrentRealWeek && <Badge className="bg-[#FF0C60] text-white border-none shadow-[0_0_15px_#FF0C60]">Semana Actual</Badge>}
                </div>
                {onWeekChange && (
                    <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end">
                        <Button variant="outline" size="sm" onClick={() => adjustWeek('prev')} className="border-white/10 bg-white/5 hover:bg-white/10 hover:text-white backdrop-blur-md rounded-lg"><ChevronLeft className="w-4 h-4 mr-1" /> Anterior</Button>
                        <Button variant="outline" size="sm" onClick={() => adjustWeek('next')} className="border-white/10 bg-white/5 hover:bg-white/10 hover:text-white backdrop-blur-md rounded-lg">Siguiente <ChevronRight className="w-4 h-4 ml-1" /></Button>
                    </div>
                )}
            </div>

            <ScrollArea className="flex-1 w-full z-10">
                {/* DESKTOP VIEW: Grid (Hidden on Mobile) */}
                <div className="hidden md:grid grid-cols-7 divide-x divide-white/5 min-h-[600px] bg-[#070708]/20">
                    {/* Headers */}
                    <div className="contents">
                    </div>

                    {dayColumns.map((col, i) => {
                        const isToday = isCurrentRealWeek && new Date().getDay() === i

                        // Current Hour for Highlighting
                        const now = new Date()
                        const currentHour = now.getHours()

                        return (
                            <div key={col.dayIndex} className={`flex flex-col border-r border-white/[0.02] last:border-r-0 transition-colors duration-500 ${isToday ? 'bg-white/[0.015]' : 'hover:bg-white/[0.01]'}`}>
                                <div className={`py-5 text-center text-xs font-medium border-b border-white/[0.02] tracking-[0.2em] uppercase ${isToday ? 'text-[#FF0C60]' : 'text-zinc-500'}`}>
                                    <span className="capitalize block">{col.dateLabel.split(' ')[0]}</span>
                                    <span className="text-lg opacity-80">{col.dateLabel.split(' ')[1]}</span>
                                </div>

                                <div className="p-2 space-y-2 flex-1 relative min-h-[200px]">
                                    {col.shifts.map((item, idx) => {
                                        // Is this shift ACTIVE NOW?
                                        const isActiveNow = isToday && currentHour >= item.shift.start && currentHour < (item.shift.end === 0 ? 24 : item.shift.end)

                                        return (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.05 }}
                                                key={`${item.op.id}-${idx}`}
                                                onClick={() => handleEditClick(item.op, col.dayIndex)}
                                                className={`
                                                backdrop-blur-md border rounded-xl p-3 
                                                hover:border-white/20 hover:bg-white/[0.03] transition-all duration-300 group relative overflow-hidden
                                                cursor-${isEditingEnabled ? 'pointer' : 'default'} shadow-lg
                                                ${isActiveNow
                                                        ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                                                        : 'bg-[#121214]/60 border-white/[0.06]'}
                                            `}
                                            >
                                                <div className="flex items-center gap-2.5 mb-2">
                                                    <Avatar className="w-7 h-7 border border-white/10 ring-2 ring-transparent group-hover:ring-[#FF0C60]/20 transition-all">
                                                        <AvatarImage src={item.op.image} />
                                                        <AvatarFallback className="text-[10px] bg-slate-800 text-slate-300 font-bold">{item.op.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs font-bold text-slate-200 truncate flex-1">{item.op.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono bg-black/40 rounded-md px-2 py-1.5 w-fit border border-white/5 group-hover:border-[#FF0C60]/20 group-hover:text-[#FF0C60] transition-colors">
                                                    <Timer className="w-3 h-3" />
                                                    {formatTime(item.shift.start)} - {formatTime(item.shift.end)}
                                                </div>
                                                {item.op.isTempSchedule && (
                                                    <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#FF0C60] rounded-full shadow-[0_0_6px_#FF0C60]" title="Horario Modificado" />
                                                )}
                                                {isActiveNow && (
                                                    <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981] animate-pulse" title="En Vivo" />
                                                )}
                                            </motion.div>
                                        )
                                    })}

                                    {isEditingEnabled && col.shifts.length === 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                                            {/* Placeholder */}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* MOBILE VIEW: Stack (Visible on Mobile) */}
                <div className="md:hidden flex flex-col gap-8 p-4 w-full pb-20">
                    {dayColumns.map((col, i) => {
                        const isToday = isCurrentRealWeek && new Date().getDay() === i
                        return (
                            <div key={col.dayIndex} className="space-y-4">
                                <div className={`flex items-center justify-between sticky top-0 z-10 p-4 rounded-xl backdrop-blur-2xl border border-white/10 shadow-2xl ${isToday ? 'bg-[#FF0C60]/10 border-[#FF0C60]/30 text-[#FF0C60]' : 'bg-[#121214]/80 text-slate-200'}`}>
                                    <h3 className="font-black text-xl capitalize flex items-baseline gap-2">
                                        {col.dateLabel.split(' ')[0]}
                                        <span className="text-sm opacity-60 font-medium">{col.dateLabel.split(' ')[1]}</span>
                                    </h3>
                                    {isToday && <Badge className="bg-[#FF0C60] text-white border-none shadow-[0_0_10px_#FF0C60]">Hoy</Badge>}
                                </div>

                                <div className="grid grid-cols-1 gap-3 pl-3 border-l-2 border-dashed border-white/10 group-hover:border-[#FF0C60]/20 transition-colors">
                                    {col.shifts.length === 0 ? (
                                        <div className="text-sm text-slate-600 italic py-4 pl-2 flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-slate-700" /> Sin turnos asignados
                                        </div>
                                    ) : (
                                        col.shifts.map((item, idx) => (
                                            <div
                                                key={`${item.op.id}-${idx}`}
                                                onClick={() => handleEditClick(item.op, col.dayIndex)}
                                                className="bg-[#18181b] border border-white/5 rounded-xl p-4 flex items-center justify-between active:scale-[0.98] transition-all shadow-md active:bg-[#18181b]/80"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="w-12 h-12 border-2 border-white/5 shadow-inner">
                                                        <AvatarImage src={item.op.image} />
                                                        <AvatarFallback className="text-sm bg-slate-800 font-bold">{item.op.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-bold text-base text-slate-100 mb-1">{item.op.name}</div>
                                                        <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono bg-black/30 rounded px-2 py-1 w-fit">
                                                            <Timer className="w-3 h-3 text-[#FF0C60]" />
                                                            {formatTime(item.shift.start)} - {formatTime(item.shift.end)}
                                                        </div>
                                                    </div>
                                                </div>
                                                {isEditingEnabled && <div className="bg-white/5 rounded-full p-2 text-slate-500"><Edit2 className="w-4 h-4" /></div>}
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
                <DialogContent className="bg-[#121214]/95 backdrop-blur-2xl border-white/10 text-white max-w-lg mb-0 rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden p-0 max-h-[85vh] flex flex-col">
                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                        <div className="flex justify-between items-start border-b border-white/5 pb-4">
                            <div>
                                <h3 className="font-bold text-2xl tracking-tight">
                                    Editar Turno
                                </h3>
                                <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#FF0C60]" />
                                    {editingState && DAYS[editingState.dayIndex]} ({editingState && weekDates[editingState.dayIndex].dateStr})
                                </p>
                            </div>

                            {/* Vacation / Clear Week Button */}
                            {isEditingEnabled && editingState && (
                                <Dialog open={confirmingVacation} onOpenChange={setConfirmingVacation}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 border-rose-500/20"
                                        >
                                            <Plane className="w-4 h-4 mr-2" />
                                            Vacaciones V2
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-[#18181b] border-white/10 max-w-sm">
                                        <div className="flex flex-col items-center text-center gap-4 py-4">
                                            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2">
                                                <CalendarDays className="w-6 h-6" />
                                            </div>
                                            <h3 className="text-lg font-bold">Planificar Vacaciones (V2)</h3>
                                            <p className="text-sm text-slate-400">
                                                Seleccione el rango de fechas.
                                                <br />
                                                <span className="text-xs opacity-70">Los turnos en este periodo serán eliminados.</span>
                                            </p>

                                            <div className="grid grid-cols-2 gap-4 w-full mt-2">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase font-bold text-slate-500">Desde</label>
                                                    <Input
                                                        type="date"
                                                        value={vacationStart}
                                                        onChange={(e) => setVacationStart(e.target.value)}
                                                        className="bg-black/30 border-white/10 text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase font-bold text-slate-500">Hasta</label>
                                                    <Input
                                                        type="date"
                                                        value={vacationEnd}
                                                        onChange={(e) => setVacationEnd(e.target.value)}
                                                        className="bg-black/30 border-white/10 text-xs"
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
                                <div key={shift.tempId} className="bg-[#18181b] p-5 rounded-2xl border border-white/5 space-y-5 relative group shadow-lg">

                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1.5 flex-1">
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Horario</div>
                                            <div className="flex items-center gap-2 w-full">
                                                <Select value={String(shift.start)} onValueChange={v => updateEditingShift(shift.tempId, 'start', Number(v))}>
                                                    <SelectTrigger className="h-10 text-sm bg-black/40 border-white/10 rounded-lg flex-1 font-mono"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {Array.from({ length: 24 }, (_, i) => i).map(h => <SelectItem key={h} value={String(h)}>{formatTime(h)}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <span className="text-slate-600 font-bold">-</span>
                                                <Select value={String(shift.end)} onValueChange={v => updateEditingShift(shift.tempId, 'end', Number(v))}>
                                                    <SelectTrigger className="h-10 text-sm bg-black/40 border-white/10 rounded-lg flex-1 font-mono"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {Array.from({ length: 25 }, (_, i) => i).map(h => <SelectItem key={h} value={String(h)}>{formatTime(h)}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 -mr-2" onClick={() => removeShiftFromEdit(shift.tempId)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Asignado A</div>
                                        <Select value={shift.targetOpId} onValueChange={v => updateEditingShift(shift.tempId, 'targetOpId', v)}>
                                            <SelectTrigger className={`h-10 text-sm border-white/10 rounded-lg ${shift.targetOpId !== editingState.originalOpId ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-black/40'}`}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {operators.map(op => (
                                                    <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {shift.targetOpId !== editingState.originalOpId && (
                                        <div className="bg-amber-500/10 text-amber-500/90 p-2.5 rounded-lg text-xs flex items-center gap-2 border border-amber-500/20">
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

                    <div className="p-4 bg-[#121214] border-t border-white/5 flex gap-3">
                        <Button variant="ghost" onClick={() => setEditingState(null)} className="flex-1 rounded-xl hover:bg-white/5">Cancelar</Button>
                        <Button className="bg-[#FF0C60] hover:bg-[#d90a50] flex-1 rounded-xl shadow-[0_4px_20px_rgba(255,12,96,0.3)] hover:shadow-[0_4px_25px_rgba(255,12,96,0.4)] transition-all font-bold tracking-wide" onClick={saveChanges}>Guardar Cambios</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
