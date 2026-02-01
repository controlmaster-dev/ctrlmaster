"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Edit2 } from "lucide-react"
import { startOfWeek, addDays, format, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { getBitcentralUser } from "@/lib/schedule"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function BitcentralWidget({ users }: { users: any[] }) {
    const [today] = useState(new Date())
    const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [overrides, setOverrides] = useState<any[]>([])
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    // Fetch overrides
    const fetchOverrides = async () => {
        if (!weekStart || isNaN(weekStart.getTime())) return
        const end = addDays(weekStart, 7)
        const res = await fetch(`/api/schedule?start=${weekStart.toISOString()}&end=${end.toISOString()}`)
        if (res.ok) {
            setOverrides(await res.json())
        }
    }

    useEffect(() => {
        fetchOverrides()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [weekStart])

    const handleOverride = async (userId: string) => {
        if (!selectedDate || isNaN(selectedDate.getTime())) return
        const res = await fetch('/api/schedule', {
            method: 'POST',
            body: JSON.stringify({ date: selectedDate.toISOString(), userId })
        })
        if (res.ok) {
            fetchOverrides()
            setSelectedDate(null)
        }
    }

    const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))

    // Helper to get formatted name map
    const overrideMap = overrides.reduce((acc, curr) => {
        acc[new Date(curr.date).toDateString()] = curr.user.name
        return acc
    }, {} as Record<string, string>)

    const getDisplayInfo = (date: Date) => {
        const dateKey = date.toDateString()
        if (overrideMap[dateKey]) {
            return { name: overrideMap[dateKey], isOverride: true, isRotation: false }
        }
        return getBitcentralUser(date)
    }

    const getInitials = (name: string) => {
        return (name || "").split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    }

    return (
        <Card className="bg-black/40 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden ring-1 ring-white/5">
            <CardHeader className="p-4 border-b border-white/5 flex flex-row items-center justify-between space-y-0 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                        <CalIcon className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="font-semibold text-white text-sm tracking-tight">Pauta Bitcentral</span>
                </div>
                <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/5">
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors" onClick={() => setWeekStart(addDays(weekStart, -7))}>
                        <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <span className="text-[10px] font-mono text-slate-400 px-2 min-w-[80px] text-center select-none">
                        {format(weekStart, 'd MMM', { locale: es })} - {format(addDays(weekStart, 6), 'd MMM', { locale: es })}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors" onClick={() => setWeekStart(addDays(weekStart, 7))}>
                        <ChevronRight className="w-3 h-3" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="flex flex-col">
                    {days.map((date) => {
                        const info = getDisplayInfo(date)
                        const isToday = isSameDay(date, today)
                        const toISO = (d: Date) => (isNaN(d.getTime()) ? `invalid-${Math.random()}` : d.toISOString())

                        return (
                            <div key={toISO(date)}
                                className={`group flex items-center gap-3 p-3 transition-all cursor-pointer border-l-[3px] ${isToday ? 'bg-blue-500/5 border-blue-500 shadow-inner' : 'hover:bg-white/5 border-transparent hover:border-white/10'}`}
                                onClick={() => setSelectedDate(date)}
                            >
                                {/* Date Col */}
                                <div className="flex flex-col items-center justify-center w-12 shrink-0">
                                    <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">{format(date, 'EEE', { locale: es })}</span>
                                    <span className={`text-lg font-light leading-none mt-0.5 ${isToday ? 'text-blue-400 font-normal' : 'text-slate-300'}`}>{format(date, 'd')}</span>
                                </div>

                                {/* Divider */}
                                <div className="h-8 w-px bg-white/5" />

                                {/* User Info */}
                                <div className="flex-1 flex items-center gap-3 min-w-0">
                                    {/* Avatar */}
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${isToday
                                        ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.2)]'
                                        : 'bg-slate-800 text-slate-400 border-white/10 group-hover:border-white/20'
                                        }`}>
                                        {getInitials(info.name)}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className={`text-sm font-medium truncate ${isToday ? 'text-white' : 'text-slate-300 group-hover:text-white transition-colors'}`}>
                                            {info.name}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {info.isOverride ? (
                                                <span className="flex items-center gap-1.5 text-[10px] text-yellow-500 font-medium">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]" />
                                                    Vacaciones
                                                </span>
                                            ) : info.isRotation ? (
                                                <span className="flex items-center gap-1.5 text-[10px] text-purple-500 font-medium">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.5)]" />
                                                    Rotativo
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-slate-600 font-medium flex items-center gap-1.5">
                                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                                    Regular
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action */}
                                <div className="pr-2 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0 translate-x-2 duration-300">
                                    <div className="p-1.5 rounded-md bg-white/10 text-white hover:bg-blue-500 hover:shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all">
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>

            <Dialog open={!!selectedDate} onOpenChange={(o) => { if (!o) setSelectedDate(null) }}>
                <DialogContent className="!bg-transparent bg-gradient-to-b from-slate-900/90 to-black/90 backdrop-blur-2xl border border-white/10 text-white shadow-2xl sm:rounded-3xl ring-1 ring-white/10">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit2 className="w-5 h-5 text-blue-500" />
                            Editar Horario: <span className="text-blue-400">{selectedDate && format(selectedDate, 'EEEE d MMMM', { locale: es })}</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-sm text-slate-400 mb-3">Selecciona quién cubrirá este turno (Modo Vacaciones/Cambio):</p>
                            <Select onValueChange={handleOverride}>
                                <SelectTrigger className="bg-black/20 border-white/10 focus:ring-blue-500/50 text-white h-11">
                                    <SelectValue placeholder="Seleccionar operador..." />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-white/10 text-white">
                                    <SelectItem value="reset" className="text-red-400 focus:text-red-400 font-bold focus:bg-red-500/10">
                                        <div className="flex items-center gap-2">
                                            <span>🔁</span> Restaurar Original
                                        </div>
                                    </SelectItem>
                                    {users.map(u => (
                                        <SelectItem key={u.id} value={u.id} className="focus:bg-blue-500/20">{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
