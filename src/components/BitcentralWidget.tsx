"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Edit2, Bell, X, Settings } from "lucide-react"
import { startOfWeek, addDays, format, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { getBitcentralUser } from "@/lib/schedule"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function BitcentralWidget({ users }: { users: any[] }) {
    const [today, setToday] = useState(new Date())
    const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [overrides, setOverrides] = useState<any[]>([])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [events, setEvents] = useState<any[]>([])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [baseSchedule, setBaseSchedule] = useState<any[]>([])
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [isManageEventsOpen, setIsManageEventsOpen] = useState(false)
    const [isConfigOpen, setIsConfigOpen] = useState(false)

    // New Event State
    const [newEventName, setNewEventName] = useState("")
    const [newEventStart, setNewEventStart] = useState<Date | undefined>(new Date())
    const [newEventEnd, setNewEventEnd] = useState<Date | undefined>(new Date())

    const [isLoading, setIsLoading] = useState(true)

    // Fetch data
    const fetchData = async () => {
        setIsLoading(true)
        if (!weekStart || isNaN(weekStart.getTime())) return
        const end = addDays(weekStart, 8)

        try {
            // Parallel fetch
            const [overridesRes, eventsRes, configRes] = await Promise.all([
                fetch(`/api/schedule?start=${weekStart.toISOString()}&end=${end.toISOString()}`),
                fetch('/api/special-events'),
                fetch('/api/schedule/config')
            ])

            if (overridesRes.ok) setOverrides(await overridesRes.json())
            if (eventsRes.ok) setEvents(await eventsRes.json())
            if (configRes.ok) setBaseSchedule(await configRes.json())
        } catch (error) {
            console.error("Error fetching schedule data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Prepare Base Schedule Map for helper (day index -> name)
    const baseScheduleMap = baseSchedule.reduce((acc, curr) => {
        if (curr.user) {
            acc[curr.dayOfWeek.toString()] = curr.user.name
        }
        return acc
    }, {} as Record<string, string>)

    // Helper map needed for getDisplayInfo before useEffect uses it
    const overrideMap = overrides.reduce((acc, curr) => {
        acc[new Date(curr.date).toDateString()] = curr.user.name
        return acc
    }, {} as Record<string, string>)

    // Updated getDisplayInfo logic (needed inside effect)
    const getDisplayInfo = (date: Date) => {
        // 1. Check for Special Event
        const validEvents = Array.isArray(events) ? events : [];
        const event = validEvents.find(e => {
            if (!e.isActive) return false
            const start = new Date(e.startDate)
            const end = new Date(e.endDate)
            // Normalize dates to ignore time for comparison
            start.setHours(0, 0, 0, 0)
            end.setHours(23, 59, 59, 999)
            const check = new Date(date)
            check.setHours(12, 0, 0, 0) // midday to be safe
            return check >= start && check <= end
        })

        if (event) {
            return { name: event.name, isEvent: true, eventId: event.id }
        }

        // 2. Check for Override
        const dateKey = date.toDateString()
        if (overrideMap[dateKey]) {
            return { name: overrideMap[dateKey], isOverride: true, isRotation: false }
        }

        // 3. Standard Rotation (Now with Config)
        return getBitcentralUser(date, {}, baseScheduleMap)
    }

    useEffect(() => {
        fetchData()

        // Auto-Refresh Logic
        const interval = setInterval(() => {
            const now = new Date()

            // 1. Day Change Detection (Midnight Update)
            setToday(prev => {
                if (!isSameDay(prev, now)) return now
                return prev
            })

            // 3. Data Refetch (Every 5 minutes)
            if (now.getMinutes() % 5 === 0 && now.getSeconds() < 10) {
                fetchData()
            }

        }, 60000) // Check every minute

        return () => clearInterval(interval)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [weekStart])

    // Reminder Effect
    useEffect(() => {
        if (isLoading) return; // Wait for data to load

        const checkReminder = () => {
            const now = new Date()
            let targetDate = new Date(now)

            // Target logic: < 2am is Today, >= 2am is Tomorrow
            if (now.getHours() >= 2) {
                targetDate = addDays(now, 1)
            }

            const info = getDisplayInfo(targetDate)

            // CRITICAL: Ignore if it is an event (e.g. Maratonica)
            if (info.isEvent) {
                toast.dismiss('shift-reminder')
                return
            }

            // Show persistent custom toast
            const dateLabel = format(targetDate, "EEEE", { locale: es })
            const formattedDateLabel = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)

            toast.custom((t) => (
                <div className="bg-[#050505] border border-[#1e1e20] p-4 rounded-xl shadow-2xl flex items-center gap-4 w-full max-w-md backdrop-blur-3xl ring-1 ring-black/5 pointer-events-auto">
                    <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                        <Bell className="w-5 h-5 text-yellow-500 animate-[pulse_3s_ease-in-out_infinite]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-white tracking-wide">Recordatorio de Pauta</h4>
                        <p className="text-xs text-neutral-400 mt-1 leading-snug font-medium">
                            <span className="text-neutral-200">{info.name}</span>, toca preparar la playlist del <span className="text-yellow-500">{formattedDateLabel}</span>.
                        </p>
                    </div>
                    <button onClick={() => toast.dismiss(t)} className="text-neutral-600 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-md">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ), {
                id: 'shift-reminder',
                duration: Infinity,
                position: 'bottom-center'
            })
        }

        if (overrides !== undefined && events !== undefined) {
            checkReminder()
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [today, events, overrides, baseSchedule, isLoading])

    const handleOverride = async (userId: string) => {
        if (!selectedDate || isNaN(selectedDate.getTime())) return
        const res = await fetch('/api/schedule', {
            method: 'POST',
            body: JSON.stringify({ date: selectedDate.toISOString(), userId })
        })
        if (res.ok) {
            fetchData()
            setSelectedDate(null)
        }
    }

    const handleCreateEvent = async () => {
        if (!newEventName || !newEventStart || !newEventEnd) return

        const res = await fetch('/api/special-events', {
            method: 'POST',
            body: JSON.stringify({
                name: newEventName,
                startDate: newEventStart.toISOString(),
                endDate: newEventEnd.toISOString()
            })
        })

        if (res.ok) {
            fetchData()
            setNewEventName("")
            setIsManageEventsOpen(false)
        }
    }

    const handleDeleteEvent = async (id: string) => {
        const res = await fetch(`/api/special-events?id=${id}`, { method: 'DELETE' })
        if (res.ok) fetchData()
    }

    const handleSaveConfig = async (newSchedule: { dayOfWeek: number, userId: string }[]) => {
        const res = await fetch('/api/schedule/config', {
            method: 'POST',
            body: JSON.stringify({ schedule: newSchedule })
        })
        if (res.ok) {
            toast.success("Horario base actualizado")
            fetchData()
            setIsConfigOpen(false)
        } else {
            toast.error("Error al actualizar horario")
        }
    }

    const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))

    const getInitials = (name: string) => {
        return (name || "").split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    }

    return (
        <Card className="bg-card backdrop-blur-md md:backdrop-blur-xl border-border shadow-sm overflow-hidden ring-1 ring-border rounded-xl relative">
            <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                        <CalIcon className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="font-semibold text-foreground text-sm tracking-tight">Pauta Bitcentral</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10" onClick={() => setIsConfigOpen(true)} title="Configurar Horario Base">
                        <Settings className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10" onClick={() => setIsManageEventsOpen(true)} title="Gestionar Eventos">
                        <Edit2 className="w-3 h-3" />
                    </Button>
                    <div className="flex items-center bg-muted/20 rounded-lg p-0.5 border border-border ml-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" onClick={() => setWeekStart(addDays(weekStart, -7))}>
                            <ChevronLeft className="w-3 h-3" />
                        </Button>
                        <span className="text-[10px] font-mono text-muted-foreground px-2 min-w-[80px] text-center select-none">
                            {format(weekStart, 'd MMM', { locale: es })} - {format(addDays(weekStart, 6), 'd MMM', { locale: es })}
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" onClick={() => setWeekStart(addDays(weekStart, 7))}>
                            <ChevronRight className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-3">
                <div className="flex flex-col gap-2">
                    {isLoading ? (
                        // Skeleton Loader
                        Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 border-l-[3px] border-transparent bg-muted/10 animate-pulse rounded-lg">
                                <div className="flex flex-col items-center justify-center w-12 shrink-0 gap-1">
                                    <div className="h-2 w-6 bg-muted rounded"></div>
                                    <div className="h-4 w-4 bg-muted rounded"></div>
                                </div>
                                <div className="h-8 w-px bg-border/50" />
                                <div className="flex-1 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-muted"></div>
                                    <div className="flex flex-col gap-1.5 w-full">
                                        <div className="h-3 w-24 bg-muted rounded"></div>
                                        <div className="h-2 w-16 bg-muted rounded"></div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        days.map((date) => {
                            const info = getDisplayInfo(date)
                            const isToday = isSameDay(date, today)
                            const toISO = (d: Date) => (isNaN(d.getTime()) ? `invalid-${Math.random()}` : d.toISOString())

                            // Event Styling
                            if (info.isEvent) {
                                return (
                                    <div key={toISO(date)}
                                        className={`group flex items-center gap-3 p-3 transition-all border-l-[3px] bg-yellow-500/5 border-yellow-500`}
                                    >
                                        <div className="flex flex-col items-center justify-center w-12 shrink-0">
                                            <span className="text-[9px] font-bold text-yellow-600/70 tracking-tight">{format(date, 'EEE', { locale: es })}</span>
                                            <span className={`text-lg font-light leading-none mt-0.5 text-yellow-500`}>{format(date, 'd')}</span>
                                        </div>
                                        <div className="h-8 w-px bg-yellow-500/20" />
                                        <div className="flex-1 flex items-center gap-3 min-w-0">
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors bg-yellow-500/10 text-yellow-500 border-yellow-500/30`}>
                                                ★
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-bold truncate text-yellow-500">
                                                    {info.name}
                                                </span>
                                                <span className="text-[10px] text-yellow-600/70 font-medium">Sin horario definido</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }

                            return (
                                <div key={toISO(date)}
                                    className={`group flex items-center gap-3 p-3 transition-all cursor-pointer border-l-[3px] ${isToday ? 'bg-blue-500/5 border-blue-500 shadow-inner' : 'hover:bg-muted/30 border-transparent hover:border-border'}`}
                                    onClick={() => setSelectedDate(date)}
                                >
                                    {/* Date Col */}
                                    <div className="flex flex-col items-center justify-center w-12 shrink-0">
                                        <span className="text-[9px] font-bold text-muted-foreground tracking-tight">{format(date, 'EEE', { locale: es })}</span>
                                        <span className={`text-lg font-light leading-none mt-0.5 ${isToday ? 'text-blue-400 font-normal' : 'text-foreground'}`}>{format(date, 'd')}</span>
                                    </div>

                                    {/* Divider */}
                                    <div className="h-8 w-px bg-border" />

                                    {/* User Info */}
                                    <div className="flex-1 flex items-center gap-3 min-w-0">
                                        {/* Avatar */}
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${isToday
                                            ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.2)]'
                                            : 'bg-secondary text-muted-foreground border-border group-hover:border-foreground/20'
                                            }`}>
                                            {getInitials(info.name)}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className={`text-sm font-medium truncate ${isToday ? 'text-foreground' : 'text-foreground group-hover:text-foreground transition-colors'}`}>
                                                {info.name}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {info.isOverride ? (
                                                    <span className="flex items-center gap-1.5 text-[10px] text-yellow-500 font-medium">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]" />
                                                        Cambio manual
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
                                        <div className="p-1.5 rounded-md bg-muted text-foreground hover:bg-blue-500 hover:text-white hover:shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </CardContent>

            {/* Config Schedule Modal */}
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                <DialogContent className="bg-background/95 backdrop-blur-2xl border border-border shadow-xl sm:rounded-xl max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-foreground">
                            <Settings className="w-5 h-5 text-blue-500" />
                            Configuración de Horario Base
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                        <p className="text-sm text-muted-foreground">Define el operador predeterminado para cada día de la semana. Los cambios aplicarán a todas las semanas futuras excepto donde haya modificaciones manuales.</p>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            const formData = new FormData(e.currentTarget)
                            const updates: { dayOfWeek: number, userId: string }[] = []

                            // Iterate 0-6 (Sun-Sat)
                            for (let i = 0; i < 7; i++) {
                                const userId = formData.get(`day-${i}`) as string
                                if (userId && userId !== 'default') {
                                    updates.push({ dayOfWeek: i, userId })
                                }
                            }
                            handleSaveConfig(updates)
                        }} className="space-y-3">
                            {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => {
                                // Order: Mon(1) -> Sun(0)
                                const dayName = format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), dayIndex === 0 ? 6 : dayIndex - 1), 'EEEE', { locale: es })
                                // Find current config user
                                const currentConfig = baseSchedule.find(s => s.dayOfWeek === dayIndex)

                                return (
                                    <div key={dayIndex} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                                        <span className="capitalize font-medium text-sm w-24 text-foreground">{dayName}</span>
                                        <Select name={`day-${dayIndex}`} defaultValue={currentConfig?.userId || "default"}>
                                            <SelectTrigger className="w-[200px] h-9 text-sm bg-background border-input">
                                                <SelectValue placeholder="Seleccionar..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="default" className="text-muted-foreground font-light">Sin asignar (Legacy)</SelectItem>
                                                {users.map(u => (
                                                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )
                            })}

                            <div className="pt-4 flex justify-end gap-2">
                                <Button variant="outline" type="button" onClick={() => setIsConfigOpen(false)}>Cancelar</Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Guardar Cambios</Button>
                            </div>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Override Dialog */}
            <Dialog open={!!selectedDate} onOpenChange={(o) => { if (!o) setSelectedDate(null) }}>
                <DialogContent className="bg-background/95 backdrop-blur-2xl border border-border shadow-xl sm:rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-foreground">
                            <Edit2 className="w-5 h-5 text-blue-500" />
                            Editar Horario: <span className="text-blue-500">{selectedDate && format(selectedDate, 'EEEE d MMMM', { locale: es })}</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="p-4 rounded-xl bg-muted/50 border border-border">
                            <p className="text-sm text-muted-foreground mb-3">Selecciona quién cubrirá este turno (Modo Vacaciones/Cambio):</p>
                            <Select onValueChange={handleOverride}>
                                <SelectTrigger className="bg-background border-input focus:ring-blue-500/50 text-foreground h-11">
                                    <SelectValue placeholder="Seleccionar operador..." />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                    <SelectItem value="reset" className="text-red-500 focus:text-red-600 font-bold focus:bg-red-500/10">
                                        <div className="flex items-center gap-2">
                                            <span>🔁</span> Restaurar Original
                                        </div>
                                    </SelectItem>
                                    {users.map(u => (
                                        <SelectItem key={u.id} value={u.id} className="focus:bg-accent focus:text-accent-foreground">{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Events Management Dialog */}
            <Dialog open={isManageEventsOpen} onOpenChange={setIsManageEventsOpen}>
                <DialogContent className="bg-background/95 backdrop-blur-2xl border border-border shadow-xl sm:rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-yellow-500">
                            ★ Gestionar Eventos Especiales
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                        {/* Create Form */}
                        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 space-y-4">
                            <h4 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">Nuevo Evento</h4>
                            <div className="grid gap-3">
                                <input
                                    placeholder="Nombre (ej. Maratónica)"
                                    className="w-full bg-background border border-input rounded-lg h-9 px-3 text-sm text-foreground focus:outline-none focus:border-yellow-500/50 placeholder:text-muted-foreground"
                                    value={newEventName}
                                    onChange={e => setNewEventName(e.target.value)}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">Inicio</label>
                                        <input type="date" className="w-full bg-background border border-input rounded-lg h-9 px-3 text-sm text-foreground"
                                            value={newEventStart ? format(newEventStart, 'yyyy-MM-dd') : ''}
                                            onChange={e => setNewEventStart(new Date(e.target.value + 'T12:00:00'))}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">Fin</label>
                                        <input type="date" className="w-full bg-background border border-input rounded-lg h-9 px-3 text-sm text-foreground"
                                            value={newEventEnd ? format(newEventEnd, 'yyyy-MM-dd') : ''}
                                            onChange={e => setNewEventEnd(new Date(e.target.value + 'T12:00:00'))}
                                        />
                                    </div>
                                </div>
                                <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-9" onClick={handleCreateEvent}>
                                    Crear Evento
                                </Button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-muted-foreground">Eventos Activos</h4>
                            <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-2">
                                {events.map(event => (
                                    <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                                        <div>
                                            <div className="font-medium text-foreground text-sm">{event.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {format(new Date(event.startDate), 'd MMM')} - {format(new Date(event.endDate), 'd MMM')}
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-500/10" onClick={() => handleDeleteEvent(event.id)}>
                                            <div className="w-4 h-4">×</div>
                                        </Button>
                                    </div>
                                ))}
                                {events.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">No hay eventos programados.</p>}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
