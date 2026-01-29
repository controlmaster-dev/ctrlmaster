"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus, Clock } from "lucide-react"

export interface Shift {
    days: number[] // 0=Sun, 1=Mon...
    start: number  // 0-23
    end: number    // 0-24
}

interface ScheduleEditorProps {
    value: Shift[] | null
    onChange: (shifts: Shift[]) => void
}

const DAYS = [
    { id: 1, label: 'L', full: 'Lunes' },
    { id: 2, label: 'M', full: 'Martes' },
    { id: 3, label: 'M', full: 'Miércoles' },
    { id: 4, label: 'J', full: 'Jueves' },
    { id: 5, label: 'V', full: 'Viernes' },
    { id: 6, label: 'S', full: 'Sábado' },
    { id: 0, label: 'D', full: 'Domingo' },
]

export function ScheduleEditor({ value, onChange }: ScheduleEditorProps) {
    const [shifts, setShifts] = useState<Shift[]>(value || [])

    // Sync if external value changes (optional, mostly for edit mode)
    useEffect(() => {
        if (value) setShifts(value)
    }, [value])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateShift = (index: number, field: keyof Shift, val: any) => {
        const newShifts = [...shifts]
        newShifts[index] = { ...newShifts[index], [field]: val }
        setShifts(newShifts)
        onChange(newShifts)
    }

    const toggleDay = (shiftIndex: number, dayId: number) => {
        const shift = shifts[shiftIndex]
        const newDays = shift.days.includes(dayId)
            ? shift.days.filter(d => d !== dayId)
            : [...shift.days, dayId]
        updateShift(shiftIndex, 'days', newDays)
    }

    const addShift = () => {
        const newShift: Shift = { days: [1, 2, 3, 4, 5], start: 8, end: 17 }
        const newShifts = [...shifts, newShift]
        setShifts(newShifts)
        onChange(newShifts)
    }

    const removeShift = (index: number) => {
        const newShifts = shifts.filter((_, i) => i !== index)
        setShifts(newShifts)
        onChange(newShifts)
    }

    const formatHour = (h: number) => {
        const ampm = h >= 12 ? 'PM' : 'AM'
        const hour = h % 12 || 12
        return `${hour}:00 ${ampm}`
    }

    // Generate hours options 0-24
    const hours = Array.from({ length: 25 }, (_, i) => ({ value: i, label: formatHour(i) }))

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Label className="text-slate-500 dark:text-slate-400">Horarios de Trabajo</Label>
                <Button type="button" variant="outline" size="sm" onClick={addShift} className="h-7 text-xs border-slate-200 dark:border-white/10 dark:text-slate-300">
                    <Plus className="w-3 h-3 mr-1" /> Agregar Turno
                </Button>
            </div>

            {shifts.length === 0 && (
                <div className="text-sm text-slate-400 italic text-center py-4 border border-dashed border-slate-200 dark:border-white/10 rounded-lg">
                    Sin horario asignado (Siempre inactivo)
                </div>
            )}

            <div className="space-y-3">
                {shifts.map((shift, index) => (
                    <div key={index} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-3 space-y-3 relative group">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeShift(index)}
                            className="absolute top-1 right-1 h-6 w-6 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3 h-3" />
                        </Button>

                        {/* Days Selector */}
                        <div className="flex gap-1 flex-wrap">
                            {DAYS.map(day => (
                                <button
                                    key={day.id}
                                    type="button"
                                    onClick={() => toggleDay(index, day.id)}
                                    className={`w-7 h-7 rounded-full text-xs font-medium flex items-center justify-center transition-all ${shift.days.includes(day.id)
                                        ? 'bg-[#FF0C60] text-white shadow-lg shadow-[#FF0C60]/20'
                                        : 'bg-white dark:bg-black/20 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                                        }`}
                                    title={day.full}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>

                        {/* Time Range */}
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <div className="flex gap-2 items-center flex-1">
                                <Select value={String(shift.start)} onValueChange={(v) => updateShift(index, 'start', parseInt(v))}>
                                    <SelectTrigger className="h-8 text-xs bg-white dark:bg-black/20 border-slate-200 dark:border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {hours.slice(0, 24).map(h => (
                                            <SelectItem key={h.value} value={String(h.value)}>{h.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <span className="text-slate-400">-</span>
                                <Select value={String(shift.end)} onValueChange={(v) => updateShift(index, 'end', parseInt(v))}>
                                    <SelectTrigger className="h-8 text-xs bg-white dark:bg-black/20 border-slate-200 dark:border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {hours.map(h => (
                                            <SelectItem key={h.value} value={String(h.value)}>{h.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
