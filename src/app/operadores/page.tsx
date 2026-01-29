"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogIn, Shield, Calendar, Info, Download } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { WeeklyCalendar } from "@/components/WeeklyCalendar"
import { useAuth } from "@/contexts/AuthContext"



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
}

interface Prediction {
    nextOperator: Operator
    timeUntil: string
    shiftLabel: string
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

    // Modal Fetcher (Navigable Week)
    useEffect(() => {
        const fetchModalOperators = async () => {
            try {
                const res = await fetch(`/api/users?weekStart=${modalWeekStart}`, { cache: 'no-store' })
                if (!res.ok) throw new Error("Error fetching modal users")
                const data = await res.json()
                const sorted = sortOperators(data)
                setModalOperators(sorted)
            } catch (e) {
                console.error(e)
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
        <div className="min-h-screen bg-[#070708] text-white font-sans selection:bg-[#FF0C60] selection:text-white">

            {/* Glassmorphism Header */}
            <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-4 flex justify-between items-center bg-transparent backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center gap-3">
                    <img src="https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png" alt="Logo" className="w-8 h-8 object-contain" />
                    <span className="font-bold text-lg tracking-tight hidden md:block">Control Master</span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Calendar Modal Trigger */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 gap-2 backdrop-blur-md">
                                <Calendar className="w-4 h-4" />
                                <span className="hidden md:inline">Ver Calendario Completo</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-6xl bg-[#0f0f11]/95 backdrop-blur-xl border-white/10 text-white p-0 overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Distribución Semanal</h2>
                                    <p className="text-slate-400 text-sm">Vista global de turnos.</p>
                                </div>
                                <div className="flex gap-4 items-center">
                                    {user && (
                                        <div className="flex items-center gap-2">
                                            {/* Duration Selector */}
                                            <div className="relative">
                                                <select
                                                    className="bg-black/20 border border-white/10 text-white text-xs rounded-lg px-2 py-2 outline-none focus:border-white/30 appearance-none pr-8 cursor-pointer"
                                                    value={weeksDuration}
                                                    onChange={(e) => setWeeksDuration(Number(e.target.value))}
                                                >
                                                    <option value={4}>4 Semanas</option>
                                                    <option value={8}>8 Semanas</option>
                                                    <option value={12}>3 Meses</option>
                                                    <option value={24}>6 Meses</option>
                                                </select>
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                    <Calendar className="w-3 h-3" />
                                                </div>
                                            </div>

                                            <div className="flex bg-white/5 rounded-lg border border-white/10 p-0.5">
                                                <Button
                                                    onClick={() => handleSubscribe(true)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-xs h-8 gap-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
                                                >
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    Suscribir
                                                </Button>

                                                <div className="w-[1px] bg-white/10 my-1 mx-0.5" />

                                                <Button
                                                    onClick={() => handleSubscribe(false)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-white"
                                                    title="Descargar Archivo .ics"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-0 md:p-6 h-[80vh] overflow-hidden">
                                <WeeklyCalendar
                                    operators={modalOperators}
                                    currentWeekStart={modalWeekStart}
                                    onWeekChange={setModalWeekStart}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>

                    {user ? (
                        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                            <div className="hidden md:block text-right">
                                <div className="text-sm font-bold text-white">{user.name}</div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{translateRole(user.role)}</div>
                            </div>
                            <Link href="/">
                                <Avatar className="w-9 h-9 border border-white/10 cursor-pointer hover:border-white/30 transition-all">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback className="bg-slate-800 text-xs font-bold">{user.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </Link>
                        </div>
                    ) : (
                        <Link href="/login">
                            <Button variant="ghost" className="text-sm text-slate-400 hover:text-white hover:bg-white/10 gap-2">
                                <LogIn className="w-4 h-4" />
                                <span className="hidden md:inline">Iniciar Sesión</span>
                            </Button>
                        </Link>
                    )}
                </div>
            </header >

            <main className="max-w-7xl mx-auto px-4 md:px-6 pt-16 pb-20 md:py-32 space-y-8">

                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
                            Estado de Operadores
                        </h1>
                        <p className="text-slate-400 text-base md:text-lg">Monitoreo en tiempo real de la semana actual.</p>
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
                                    className="bg-gradient-to-b from-white/10 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-3 md:p-4 flex items-center gap-3 min-w-[220px]"
                                >
                                    <div className="relative">
                                        <Avatar className="w-8 h-8 md:w-10 md:h-10 border border-white/10">
                                            <AvatarImage src={pred.nextOperator.image} />
                                            <AvatarFallback className="bg-slate-800 text-xs font-bold">{pred.nextOperator.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-[#121214]" />
                                    </div>
                                    <div>
                                        <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-blue-400 font-bold mb-0.5">Siguiente ({idx + 1})</div>
                                        <div className="font-bold text-sm">{pred.nextOperator.name}</div>
                                        <div className="text-xs text-slate-500">{pred.timeUntil}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse" />)}
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
                                <Card className={`border-0 relative overflow-hidden h-full backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] ${op.isAvailable ? 'bg-gradient-to-b from-emerald-500/5 via-black/40 to-black/60 ring-1 ring-emerald-500/40 shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)]' : 'bg-gradient-to-b from-white/5 via-black/5 to-black/40 border border-white/5 hover:border-white/20'}`}>
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-20" />

                                    <CardContent className="p-5 md:p-6 flex flex-col gap-5">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <Avatar className={`w-14 h-14 md:w-16 md:h-16 border-2 ${op.isAvailable ? 'border-emerald-500/20' : 'border-white/5'}`}>
                                                    <AvatarImage src={op.image} />
                                                    <AvatarFallback className="bg-slate-800 text-lg font-bold">{op.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[#121214] ${op.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg md:text-xl font-bold truncate">{op.name}</h3>
                                                    {op.role === 'BOSS' && <Shield className="w-4 h-4 text-[#FF0C60]" />}
                                                </div>
                                                <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/5 text-xs font-medium text-slate-400 border border-white/5">
                                                    {op.isAvailable ? <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">En Turno Activo</span> : 'Fuera de Turno'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Current Shift Progress */}
                                        {op.isAvailable && (() => {
                                            const activeStats = getCurrentShiftStats(op)
                                            if (activeStats) {
                                                const { progress, remaining, label } = activeStats
                                                return (
                                                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 space-y-2 relative overflow-hidden">
                                                        <div className="absolute top-0 left-0 w-full h-full bg-emerald-500/5 blur-xl"></div>
                                                        <div className="relative z-10">
                                                            <div className="flex justify-between text-xs font-medium text-emerald-400">
                                                                <span>Turno en Progreso</span>
                                                                <span className="font-mono">{remaining}</span>
                                                            </div>
                                                            <div className="h-1.5 bg-emerald-900/30 rounded-full overflow-hidden mt-2">
                                                                <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all duration-1000" style={{ width: `${progress}%` }} />
                                                            </div>
                                                            <div className="text-[10px] text-emerald-500/60 text-right mt-1 font-mono">{label}</div>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                            return null
                                        })()}

                                        {/* Detailed Schedule View */}
                                        <div className="bg-black/20 rounded-xl p-4 space-y-3 border border-white/5">
                                            <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                                                <span>Horario Semanal</span>
                                                {op.isTempSchedule && <Badge variant="outline" className="text-[#FF0C60] border-[#FF0C60]/30 text-[9px] px-1 py-0 h-4">MODIFICADO</Badge>}
                                            </div>

                                            {op.shifts && op.shifts.length > 0 ? (
                                                <div className="space-y-2">
                                                    {op.shifts.map((shift, sIdx) => {
                                                        // Safety Check
                                                        if (!shift.days || shift.days.length === 0) return null

                                                        // Check if today relative to the VIEWED WEEK (which is always current week here)
                                                        const startOfWeekDate = new Date(currentRealWeek + 'T12:00:00')
                                                        const todayDate = new Date()

                                                        // Correctly calc date for this shift day index
                                                        const formattedDateLabels = shift.days.map(d => {
                                                            const targetDate = new Date(startOfWeekDate)
                                                            targetDate.setDate(startOfWeekDate.getDate() + d)
                                                            const dayName = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'][d]
                                                            return `${dayName} ${targetDate.getDate()}`
                                                        }).join(', ')

                                                        // Highlight if it matches REAL today
                                                        const isTodayReal = shift.days.some(d => {
                                                            const targetDate = new Date(startOfWeekDate)
                                                            targetDate.setDate(startOfWeekDate.getDate() + d)
                                                            return targetDate.toDateString() === todayDate.toDateString()
                                                        })

                                                        return (
                                                            <div key={sIdx} className={`flex justify-between items-center text-sm group ${isTodayReal ? 'text-white' : 'text-slate-500'}`}>
                                                                <span className="font-medium group-hover:text-slate-300 transition-colors">{formattedDateLabels}</span>
                                                                <span className={`px-2 py-0.5 rounded text-xs font-mono ${isTodayReal ? 'bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'bg-white/5 text-slate-500'}`}>
                                                                    {formatTime(shift.start)} - {formatTime(shift.end)}
                                                                </span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-sm text-slate-600 italic py-2">
                                                    <Info className="w-4 h-4" />
                                                    {op.scheduleLabel || "Sin horario asignado"}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div >
    )
}
