"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar as CalIcon, Edit } from "lucide-react"
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
    // const [isEditing, setIsEditing] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    // const [loading, setLoading] = useState(false)

    // Fetch overrides
    const fetchOverrides = async () => {
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
        if (!selectedDate) return
        // setLoading(true)
        const res = await fetch('/api/schedule', {
            method: 'POST',
            body: JSON.stringify({ date: selectedDate.toISOString(), userId })
        })
        // setLoading(false)
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

    return (
        <Card className="h-full bg-gradient-to-b from-white/5 via-black/5 to-black/40 backdrop-blur-xl border border-white/5 shadow-xl overflow-hidden ring-1 ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
            <CardHeader className="bg-gradient-to-r from-blue-600/10 to-transparent border-b border-white/5 pb-3">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <CalIcon className="w-5 h-5 text-blue-500" /> Pauta Bitcentral
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>&lt;</Button>
                        <span className="text-xs font-mono py-2">{format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d')}</span>
                        <Button variant="ghost" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>&gt;</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-white/5">
                    {days.map((date) => {
                        const info = getDisplayInfo(date)
                        const isToday = isSameDay(date, today)

                        return (
                            <div key={date.toISOString()}
                                className={`flex items-center justify-between p-3 ${isToday ? 'bg-blue-50 dark:bg-blue-500/10' : ''} hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group`}
                                onClick={() => setSelectedDate(date)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 text-center text-xs font-bold uppercase ${isToday ? 'text-blue-500' : 'text-slate-400'}`}>
                                        {format(date, 'EEE', { locale: es })}
                                        <div className="text-lg font-light text-slate-900 dark:text-white">{format(date, 'd')}</div>
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                            {info.name}
                                            {info.isOverride && <span className="text-[10px] bg-yellow-500/20 text-yellow-600 px-1.5 rounded-full">Vacaciones</span>}
                                            {info.isRotation && <span className="text-[10px] bg-purple-500/20 text-purple-600 px-1.5 rounded-full">Rotativo</span>}
                                        </p>
                                    </div>
                                </div>
                                <Edit className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        )
                    })}
                </div>
            </CardContent>

            <Dialog open={!!selectedDate} onOpenChange={(o) => !o && setSelectedDate(null)}>
                <DialogContent className="!bg-transparent bg-gradient-to-b from-white/10 via-black/20 to-black/60 backdrop-blur-xl border border-white/10 text-white shadow-2xl sm:rounded-3xl ring-1 ring-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                    <DialogHeader>
                        <DialogTitle>Editar Horario: {selectedDate && format(selectedDate, 'EEEE d MMMM', { locale: es })}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <p className="text-sm text-slate-500">Selecciona quién cubrirá este turno (Modo Vacaciones/Cambio):</p>
                        <Select onValueChange={handleOverride}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar operador..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="reset" className="text-red-500 font-bold">🔁 Restaurar Original</SelectItem>
                                {users.map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
