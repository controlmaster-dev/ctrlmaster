"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogIn, Shield, Calendar, Info, Download, Home, Calendar as CalIcon } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { WeeklyCalendar } from "@/components/WeeklyCalendar"
import { useAuth } from "@/contexts/AuthContext"
import { ThemeToggle } from "@/components/ThemeToggle"



interface Shift {
    days: number[]
    start: number
    end: number
}

interface Operator {
    id: string
    name: string
    image?: string
    role: string
    scheduleLabel?: string
    isAvailable?: boolean
    shifts?: Shift[]
    isTempSchedule?: boolean
    avatar?: string // Matching usage in JSX
}

interface Prediction {
    nextOperator: Operator
    timeUntil: string
    shiftLabel: string
    isReturning?: boolean
}

export default function OperatorsPage() {
    const { user } = useAuth()
    // Current Week Helper
    const getInitialWeekStart = () => {
        const now = new Date()
        const day = now.getDay()
        const diff = now.getDate() - day
        const sunday = new Date(now.setDate(diff))
        const year = sunday.getFullYear()
        const month = String(sunday.getMonth() + 1).padStart(2, '0')
        const d = String(sunday.getDate()).padStart(2, '0')
        return `${year}-${month}-${d}`
    }

    const [currentRealWeek] = useState(getInitialWeekStart())
    const [modalWeekStart, setModalWeekStart] = useState(getInitialWeekStart())
    const [operators, setOperators] = useState<Operator[]>([]) // For Main Page
    const [modalOperators, setModalOperators] = useState<Operator[]>([]) // For Modal (Navigable)
    const [predictions, setPredictions] = useState<Prediction[]>([])
    const [loading, setLoading] = useState(true)
    const [weeksDuration, setWeeksDuration] = useState(4)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [specialEvents, setSpecialEvents] = useState<any[]>([])

    // ... existing helpers ...



    const getDayRangeLabel = (days: number[]) => {
        if (!days || days.length === 0) return ''
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
        const sorted = [...days].sort((a, b) => a - b)
        if (sorted.length === 5 && sorted.join(',') === '1,2,3,4,5') return 'Lun-Vie'
        if (sorted.length === 6 && sorted.join(',') === '1,2,3,4,5,6') return 'Lun-Sab'
        if (sorted.length === 7) return 'Todos los días'
        if (sorted.length === 2 && sorted.includes(0) && sorted.includes(6)) return 'Fines de Sem'
        return sorted.map(d => dayNames[d]).join(',')
    }

    const formatTime = (hour: number) => {
        const ampm = hour >= 12 ? 'pm' : 'am'
        const h = hour % 12 || 12
        return `${h}${ampm}`
    }

    // Fetch Special Events
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch('/api/special-events')
                if (res.ok) {
                    const data = await res.json()
                    setSpecialEvents(data)
                }
            } catch (e) {
                console.error("Error fetching special events:", e)
            }
        }
        fetchEvents()
    }, [])

    // Main Page Fetcher (Current Week)
    useEffect(() => {
        const fetchMainOperators = async () => {
            try {
                const res = await fetch(`/api/users?weekStart=${currentRealWeek}`, { cache: 'no-store' })
                if (!res.ok) throw new Error("Error fetching main users")
                const data = await res.json()
                const sorted = sortOperators(data)
                setOperators(sorted)
                calculatePredictions(data) // Predictions always based on CURRENT week
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchMainOperators()
        const timer = setInterval(() => fetchMainOperators(), 60000)
        return () => clearInterval(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRealWeek])

    const [isModalLoading, setIsModalLoading] = useState(false)

    // Modal Fetcher (Navigable Week)
    useEffect(() => {
        const fetchModalOperators = async () => {
            setIsModalLoading(true)
            try {
                const res = await fetch(`/api/users?weekStart=${modalWeekStart}`, { cache: 'no-store' })
                if (!res.ok) throw new Error("Error fetching modal users")
                const data = await res.json()
                const sorted = sortOperators(data)
                setModalOperators(sorted)
            } catch (e) {
                console.error(e)
            } finally {
                // Small artificial delay for smoothness if it's too fast, or just set false
                setTimeout(() => setIsModalLoading(false), 300)
            }
        }
        fetchModalOperators()
    }, [modalWeekStart])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sortOperators = (data: any[]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.sort((a: any, b: any) => {
            if (a.isAvailable && !b.isAvailable) return -1
            if (!a.isAvailable && b.isAvailable) return 1
            return 0
        })
    }

    const calculatePredictions = (ops: Operator[]) => {
        const now = new Date()
        const currentDay = now.getDay()
        const currentHour = now.getHours()

        const futureShifts: { op: Operator, hoursUntil: number, shift: Shift }[] = []

        ops.forEach(op => {
            if (!op.shifts || op.isAvailable) return

            op.shifts.forEach(shift => {
                if (!shift.days || shift.days.length === 0) return

                let daysUntil = -1
                const sortedDays = [...shift.days].sort((a, b) => a - b)
                let nextDay = sortedDays.find(d => d >= currentDay)

                if (nextDay === currentDay) {
                    if (currentHour < shift.start) {
                        daysUntil = 0
                    } else {
                        nextDay = sortedDays.find(d => d > currentDay)
                    }
                }

                if (nextDay === undefined) {
                    nextDay = sortedDays[0]
                    daysUntil = (7 - currentDay) + nextDay
                } else {
                    if (daysUntil === -1) {
                        daysUntil = nextDay - currentDay
                    }
                }

                const startHour = shift.start
                let totalHoursAway = (daysUntil * 24) + (startHour - currentHour)
                if (totalHoursAway < 0) totalHoursAway += 24 * 7

                futureShifts.push({
                    op,
                    hoursUntil: totalHoursAway,
                    shift
                })
            })
        })

        futureShifts.sort((a, b) => a.hoursUntil - b.hoursUntil)

        const uniquePredictions: Prediction[] = []
        const seenOps = new Set()

        for (const item of futureShifts) {
            if (seenOps.has(item.op.id)) continue
            if (uniquePredictions.length >= 2) break

            seenOps.add(item.op.id)

            let timeLabel = ""
            if (item.hoursUntil < 1) timeLabel = "En menos de 1h"
            else if (item.hoursUntil < 24) timeLabel = `En ${Math.floor(item.hoursUntil)}h`
            else timeLabel = `En ${Math.floor(item.hoursUntil / 24)}d ${Math.floor(item.hoursUntil % 24)}h`

            uniquePredictions.push({
                nextOperator: item.op,
                timeUntil: timeLabel,
                shiftLabel: `${getDayRangeLabel(item.shift.days)} ${formatTime(item.shift.start)}-${formatTime(item.shift.end)}`
            })
        }

        setPredictions(uniquePredictions)
    }

    const getCurrentShiftStats = (op: Operator) => {
        if (!op.shifts) return null

        const now = new Date()
        const currentDay = now.getDay()
        const currentHour = now.getHours() + (now.getMinutes() / 60)

        const activeShift = op.shifts.find(s => {
            const isDay = s.days.includes(currentDay)
            const end = s.end === 0 ? 24 : s.end
            return isDay && currentHour >= s.start && currentHour < end
        })

        if (!activeShift) return null

        const start = activeShift.start
        const end = activeShift.end === 0 ? 24 : activeShift.end
        const duration = end - start
        const elapsed = currentHour - start

        // Progress percentage (0-100)
        const progress = Math.min(100, Math.max(0, (elapsed / duration) * 100))

        // Remaining time text
        const remainingHours = end - currentHour
        const remainingH = Math.floor(remainingHours)
        const remainingM = Math.round((remainingHours - remainingH) * 60)

        const label = `${formatTime(activeShift.start)} - ${formatTime(activeShift.end)}`

        return {
            progress,
            remaining: `${remainingH}h ${remainingM}m`,
            label
        }
    }



    const getActiveEvent = () => {
        if (!specialEvents || specialEvents.length === 0) return null
        const now = new Date()
        return specialEvents.find(e => {
            if (!e.isActive) return false
            const start = new Date(e.startDate)
            const end = new Date(e.endDate)
            return now >= start && now <= end
        })
    }
    const translateRole = (role: string) => {
        switch (role) {
            case 'OPERATOR': return 'OPERADOR'
            case 'ENGINEER': return 'INGENIERO'
            case 'BOSS': return 'ADMINISTRADOR'
            default: return role
        }
    }

    const handleSubscribe = (isWebCal: boolean) => {
        const myOp = modalOperators.find(op => op.id === user?.id || op.name === user?.name)
        if (myOp) {
            let baseUrl = `${window.location.origin}/api/calendar/${myOp.id}?weeks=${weeksDuration}`

            // Fix for local development: 0.0.0.0 is not reachable by Calendar app
            if (baseUrl.includes('0.0.0.0')) {
                baseUrl = baseUrl.replace('0.0.0.0', 'localhost')
            }

            if (isWebCal) {
                // Subscribe (webcal://)
                const webcalUrl = baseUrl.replace(/^https?:/, 'webcal:')
                window.location.href = webcalUrl
            } else {
                // Download (https://)
                window.open(baseUrl, '_blank')
            }
        } else {
            alert("No se pudo identificar tu usuario operador.")
        }
    }

    return (
        <div className="min-h-screen text-foreground selection:bg-[#FF0C60] selection:text-white">

            {/* Simple Clean Header */}
            <header className="fixed top-0 left-0 right-0 z-40 px-4 md:px-6 py-4 flex justify-between items-center bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <img src="https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png" alt="Logo" className="w-8 h-8 object-contain" />
                        <span className="font-bold text-lg tracking-tight hidden md:block text-foreground">Control Master</span>
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    {/* Calendar Modal Trigger */}
                    <Link href="/">
                        <Button variant="outline" size="icon" className="border-border bg-card text-muted-foreground hover:text-[#FF0C60] hover:bg-rose-500/10 rounded-md h-10 w-10">
                            <Home className="w-5 h-5" />
                        </Button>
                    </Link>

                    {/* Calendar Modal Trigger */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted gap-2 backdrop-blur-md">
                                <Calendar className="w-4 h-4" />
                                <span className="hidden md:inline">Ver Calendario Completo</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-full h-full md:h-[90vh] md:max-w-screen-2xl bg-card backdrop-blur-xl border-border text-card-foreground p-0 overflow-hidden shadow-none ring-1 ring-border flex flex-col rounded-none md:rounded-lg duration-500 data-[state=open]:duration-500 data-[state=closed]:duration-500 data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100">
                            <div className="p-6 border-b border-border flex justify-between items-center">
                                <div>
                                    <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
                                        Distribución Semanal
                                    </DialogTitle>
                                    <DialogDescription className="text-muted-foreground text-sm">
                                        Vista global de turnos de todos los operadores.
                                    </DialogDescription>
                                </div>
                                <div className="flex gap-4 items-center">
                                    {user && (
                                        <div className="flex items-center gap-2">
                                            {/* Duration Selector */}
                                            <div className="relative">
                                                <select
                                                    className="bg-muted/50 border border-border text-foreground text-xs rounded-md px-2 py-2 outline-none focus:border-ring appearance-none pr-8 cursor-pointer"
                                                    value={weeksDuration}
                                                    onChange={(e) => setWeeksDuration(Number(e.target.value))}
                                                >
                                                    <option value={4}>4 Semanas</option>
                                                    <option value={8}>8 Semanas</option>
                                                    <option value={12}>3 Meses</option>
                                                    <option value={24}>6 Meses</option>
                                                </select>
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/50">
                                                    <Calendar className="w-3 h-3" />
                                                </div>
                                            </div>

                                            <div className="flex bg-muted/50 rounded-md border border-border p-0.5">
                                                <Button
                                                    onClick={() => handleSubscribe(true)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-xs h-8 gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all"
                                                >
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    Suscribir
                                                </Button>

                                                <div className="w-[1px] bg-slate-200 my-1 mx-0.5" />

                                                <Button
                                                    onClick={() => handleSubscribe(false)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-slate-700"
                                                    title="Descargar Archivo .ics"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-0 md:p-6 flex-1 flex flex-col overflow-hidden">
                                <WeeklyCalendar
                                    operators={modalOperators}
                                    currentWeekStart={modalWeekStart}
                                    onWeekChange={setModalWeekStart}
                                    isLoading={isModalLoading}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>

                    {user ? (
                        <div className="flex items-center gap-3 pl-4 border-l border-border">
                            <div className="hidden md:block text-right">
                                <div className="text-sm font-bold text-foreground">{user.name}</div>
                                <div className="text-[10px] text-muted-foreground tracking-tight font-bold">{translateRole(user.role)}</div>
                            </div>
                            <Link href="/">
                                <Avatar className="w-9 h-9 border border-border cursor-pointer hover:border-[#FF0C60] transition-all">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback className="bg-muted text-xs font-bold text-muted-foreground">{user.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </Link>
                        </div>
                    ) : (
                        <Link href="/login">
                            <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground hover:bg-muted gap-2">
                                <LogIn className="w-4 h-4" />
                                <span className="hidden md:inline">Iniciar Sesión</span>
                            </Button>
                        </Link>
                    )}
                </div>
            </header >

            <main className="w-full max-w-[1600px] mx-auto px-4 md:px-8 pt-32 pb-20 md:py-32 space-y-12">

                <div className="relative z-10 flex flex-col items-start gap-8 py-8 md:py-12 border-b border-border bg-card/50 backdrop-blur-sm rounded-md p-6 md:p-12 overflow-hidden ring-1 ring-border">
                    {/* Background Fade - Made more subtle to not hide grid */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent pointer-events-none" />

                    <div className="relative flex flex-col md:flex-row justify-between items-end w-full gap-8">
                        <div className="space-y-4 max-w-3xl">

                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tighter leading-tight pt-4 pb-2 select-none">
                                Operadores <br className="hidden md:block" />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/70 to-foreground/40">en Turno</span>
                            </h1>

                            <p className="text-muted-foreground text-lg md:text-xl font-medium tracking-wide max-w-lg leading-relaxed border-l-2 border-[#FF0C60]/20 pl-4">
                                Gestión y monitoreo del personal operativo en tiempo real.
                            </p>
                        </div>
                    </div>

                    {/* Predictions Widget */}
                    {!loading && predictions.length > 0 && (
                        <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
                            {predictions.map((pred, idx) => (
                                <motion.div
                                    key={pred.nextOperator.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + (idx * 0.1) }}
                                    className="bg-card/80 backdrop-blur-xl border border-border hover:border-[#FF0C60]/30 rounded-md p-3 md:p-4 flex items-center gap-3 min-w-[220px] group transition-all"
                                >
                                    <div className="relative">
                                        <Avatar className="w-8 h-8 md:w-10 md:h-10 border border-border">
                                            <AvatarImage src={pred.nextOperator.avatar || pred.nextOperator.image} />
                                            <AvatarFallback className="bg-muted text-xs font-bold text-muted-foreground">{pred.nextOperator.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        {pred.isReturning && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-semibold text-foreground truncate group-hover:text-[#FF0C60] transition-colors">{pred.nextOperator.name}</div>
                                        <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                                            {pred.timeUntil}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted rounded-md animate-pulse" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {operators.map((op, idx) => (
                            <motion.div
                                key={op.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card className={`border-0 relative overflow-hidden h-full backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] ${op.isAvailable ? 'bg-card ring-1 ring-emerald-500/30 shadow-md shadow-emerald-500/10' : 'bg-card border border-border hover:border-[#FF0C60]/20'}`}>
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent opacity-20" />

                                    <CardContent className="p-5 md:p-6 flex flex-col gap-5">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <Avatar className={`w-14 h-14 md:w-16 md:h-16 border-2 ${op.isAvailable ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-border'}`}>
                                                    <AvatarImage src={op.avatar || op.image} />
                                                    <AvatarFallback className="bg-muted text-lg font-bold text-muted-foreground">{op.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-card ${op.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg md:text-xl font-bold truncate text-foreground">{op.name}</h3>
                                                    {op.role === 'BOSS' && <Shield className="w-4 h-4 text-[#FF0C60]" />}
                                                </div>
                                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-muted/50 text-[10px] font-semibold tracking-tight text-muted-foreground border border-border">
                                                    {op.isAvailable ? <span className="text-emerald-500 font-semibold">En turno activo</span> : 'Fuera de turno'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Current Shift Progress / Special Event */}
                                        {(() => {
                                            const activeEvent = getActiveEvent()
                                            if (activeEvent) {
                                                const endDate = new Date(activeEvent.endDate)
                                                // Format return date: DD/MM
                                                const returnDateStr = `${endDate.getDate().toString().padStart(2, '0')}/${(endDate.getMonth() + 1).toString().padStart(2, '0')}`

                                                return (
                                                    <div className="bg-rose-500/5 border border-rose-500/20 rounded-md p-4 space-y-2 relative overflow-hidden group/event">
                                                        <div className="relative z-10">
                                                            <div className="flex items-center gap-2 text-xs font-semibold text-[#FF0C60] mb-1">
                                                                <CalIcon className="w-3.5 h-3.5" />
                                                                <span>HORARIO ESPECIAL</span>
                                                            </div>
                                                            <div className="text-sm font-semibold text-foreground">
                                                                {activeEvent.name}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground mt-1 leading-tight italic">
                                                                No se tiene un horario fijo. Revisar fecha que se vuelve: <span className="text-[#FF0C60] font-semibold not-italic">{returnDateStr}</span>
                                                            </div>
                                                        </div>
                                                        <div className="absolute -right-2 -bottom-2 opacity-5 text-[#FF0C60] group-hover/event:scale-110 transition-transform">
                                                            <CalIcon className="w-16 h-16" />
                                                        </div>
                                                    </div>
                                                )
                                            }

                                            if (op.isAvailable) {
                                                const activeStats = getCurrentShiftStats(op)
                                                if (activeStats) {
                                                    const { progress, remaining, label } = activeStats
                                                    return (
                                                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-md p-4 space-y-2 relative overflow-hidden">
                                                            <div className="relative z-10">
                                                                <div className="flex justify-between text-xs font-semibold text-emerald-500">
                                                                    <span>Turno en Progreso</span>
                                                                    <span className="font-mono">{remaining}</span>
                                                                </div>
                                                                <div className="h-1.5 bg-emerald-500/20 rounded-full overflow-hidden mt-2">
                                                                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                                                                </div>
                                                                <div className="text-[10px] text-emerald-500/60 text-right mt-1 font-mono">{label}</div>
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                            }
                                            return null
                                        })()}

                                        {/* Detailed Schedule View */}
                                        {!getActiveEvent() && (
                                            <div className="bg-muted/30 rounded-md p-4 space-y-3 border border-border">
                                                <div className="flex justify-between items-center text-[10px] tracking-tight text-muted-foreground font-semibold">
                                                    <span>Horario semanal</span>
                                                    {op.isTempSchedule && <Badge variant="outline" className="text-[#FF0C60] border-[#FF0C60]/20 bg-[#FF0C60]/10 text-[9px] px-1 py-0 h-4 font-semibold">MODIFICADO</Badge>}
                                                </div>

                                                {op.shifts && op.shifts.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {op.shifts.map((shift, sIdx) => {
                                                            // Safety Check
                                                            if (!shift.days || shift.days.length === 0) return null

                                                            const startOfWeekDate = new Date(currentRealWeek + 'T12:00:00')
                                                            const todayDate = new Date()

                                                            const formattedDateLabels = shift.days.map(d => {
                                                                const targetDate = new Date(startOfWeekDate)
                                                                targetDate.setDate(startOfWeekDate.getDate() + d)
                                                                const dayName = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'][d]
                                                                return `${dayName} ${targetDate.getDate()}`
                                                            }).join(', ')

                                                            const isTodayReal = shift.days.some(d => {
                                                                const targetDate = new Date(startOfWeekDate)
                                                                targetDate.setDate(startOfWeekDate.getDate() + d)
                                                                return targetDate.toDateString() === todayDate.toDateString()
                                                            })

                                                            return (
                                                                <div key={sIdx} className={`flex justify-between items-center text-sm group ${isTodayReal ? 'text-foreground font-semibold' : 'text-muted-foreground/60'}`}>
                                                                    <span className="font-medium group-hover:text-foreground transition-colors">{formattedDateLabels}</span>
                                                                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${isTodayReal ? 'bg-card text-[#FF0C60] shadow-sm border border-[#FF0C60]/20' : 'bg-muted text-muted-foreground/40'}`}>
                                                                        {formatTime(shift.start)} - {formatTime(shift.end)}
                                                                    </span>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground italic py-1">
                                                        <Info className="w-3.5 h-3.5" />
                                                        {op.scheduleLabel || "Sin horario asignado"}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
