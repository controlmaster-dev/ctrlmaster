"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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
        <div className="space-y-6">
            <div className="flex justify-between items-center px-1">
                <div className="flex flex-col">
                    <Label className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase opacity-70">Turnos de Trabajo</Label>
                    <p className="text-[10px] text-muted-foreground/50 font-medium">Define los periodos de actividad semanal</p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addShift}
                    className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest border-white/10 text-white hover:bg-[#FF0C60] hover:border-[#FF0C60] hover:text-white transition-all rounded-lg group shadow-lg active:scale-95"
                >
                    <Plus className="w-3.5 h-3.5 mr-2 group-hover:rotate-90 transition-transform" />
                    AÑADIR TURNO
                </Button>
            </div>

            {shifts.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-[11px] text-muted-foreground/40 font-semibold uppercase tracking-widest text-center py-10 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01]"
                >
                    SISTEMA SIN HORARIO ASIGNADO
                </motion.div>
            )}

            <div className="grid gap-4">
                <AnimatePresence mode="popLayout">
                    {shifts.map((shift, index) => (
                        <motion.div
                            key={index}
                            layout
                            initial={{ opacity: 0, x: -20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-5 relative group hover:border-[#FF0C60]/30 hover:bg-white/[0.05] transition-all shadow-xl"
                        >
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeShift(index)}
                                className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </Button>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#FF0C60]/10 rounded-lg flex items-center justify-center border border-[#FF0C60]/20">
                                    <Clock className="w-4 h-4 text-[#FF0C60]" />
                                </div>
                                <h5 className="text-[10px] font-semibold text-white uppercase tracking-[0.2em]">Configuración del Turno</h5>
                            </div>

                            <div className="grid gap-6">
                                {/* Days Selector */}
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1 opacity-50">Días de actividad</Label>
                                    <div className="flex gap-2 flex-wrap">
                                        {DAYS.map(day => {
                                            const isActive = shift.days.includes(day.id);
                                            return (
                                                <button
                                                    key={day.id}
                                                    type="button"
                                                    onClick={() => toggleDay(index, day.id)}
                                                    className={`h-10 px-4 rounded-xl text-xs font-semibold transition-all border ${isActive
                                                        ? 'bg-[#FF0C60] text-white border-[#FF0C60] shadow-[0_5px_15px_-5px_rgba(255,12,96,0.4)] scale-105 z-10'
                                                        : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/20 hover:bg-white/10'
                                                        }`}
                                                    title={day.full}
                                                >
                                                    {day.full.substring(0, 3).toUpperCase()}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="h-px bg-white/5 w-full" />

                                {/* Time Range */}
                                <div className="flex items-center gap-8">
                                    <div className="flex-1 space-y-3">
                                        <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1 opacity-50">Hora de Inicio</Label>
                                        <Select value={String(shift.start)} onValueChange={(v) => updateShift(index, 'start', parseInt(v))}>
                                            <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white font-semibold ring-offset-black focus:ring-1 focus:ring-[#FF0C60]/30 rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                                                {hours.slice(0, 24).map(h => (
                                                    <SelectItem key={h.value} value={String(h.value)} className="focus:bg-[#FF0C60]">{h.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="mt-8">
                                        <div className="w-6 h-0.5 bg-white/10 rounded-full" />
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1 opacity-50">Hora de Cierre</Label>
                                        <Select value={String(shift.end)} onValueChange={(v) => updateShift(index, 'end', parseInt(v))}>
                                            <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white font-semibold ring-offset-black focus:ring-1 focus:ring-[#FF0C60]/30 rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                                                {hours.map(h => (
                                                    <SelectItem key={h.value} value={String(h.value)} className="focus:bg-[#FF0C60]">{h.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    )
}
