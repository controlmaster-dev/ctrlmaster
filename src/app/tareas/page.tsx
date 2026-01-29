"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { format, addDays, startOfWeek, parseISO, isValid } from "date-fns"
import { es } from "date-fns/locale"
import {
    AlertCircle, Plus, Trash2, Clock, Layout, ListTodo, MessageSquare, CheckCircle
} from "lucide-react"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskCard } from "@/components/TaskCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmModal } from "@/components/ConfirmModal"

// Types
interface Task {
    id: string
    title: string
    description?: string
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
    deadline?: string
    scheduledDate: string // YYYY-MM-DD
    status: 'PENDING' | 'COMPLETED' | 'INCOMPLETE'
    comment?: string
    completedAt?: string
    reminderSent?: boolean
}

interface UserData {
    id: string
    name: string
    email: string
    role: string
    image?: string
}

export default function TasksPage() {
    const { user } = useAuth()
    const router = useRouter()
    const isAdmin = user?.email === 'knunez@enlace.org' || user?.email === 'ablanco@enlace.org' || user?.role === 'BOSS'

    const [activeTab, setActiveTab] = useState("my-agenda")

    // Auth Protection
    useEffect(() => {
        if (!user) return
        if (user.role === 'ENGINEER') { router.push('/'); return }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    if (!user) return null

    if (isAdmin) {

        return (
            <div className="min-h-screen relative">
                {/* Ambient Background */}
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4000ms' }} />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#FF0C60]/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '7000ms' }} />
                </div>

                <div className="p-4 md:p-8 pt-24 md:pt-32 max-w-[1600px] mx-auto relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500 tracking-tighter">
                            {activeTab === 'manage' ? 'Gestión de Equipos' : 'Mis Tareas'}
                        </h1>
                        <div className="flex items-center gap-2">
                            {/* Tab Switcher for Admin */}
                            <div className="bg-black/40 p-1 rounded-2xl flex gap-1 border border-white/5 backdrop-blur-xl">
                                <button
                                    onClick={() => setActiveTab('manage')}
                                    className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'manage' ? 'bg-white/10 text-[#FF0C60] shadow-lg backdrop-blur-md' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Layout className="w-4 h-4 inline mr-2" />
                                    Gestionar
                                </button>
                                <button
                                    onClick={() => setActiveTab('my-agenda')}
                                    className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'my-agenda' ? 'bg-white/10 text-[#FF0C60] shadow-lg backdrop-blur-md' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    <ListTodo className="w-4 h-4 inline mr-2" />
                                    Mi Agenda
                                </button>
                            </div>        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === 'manage' && (
                            <motion.div
                                key="manage"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="h-full"
                            >
                                <AdminView user={user} />
                            </motion.div>
                        )}
                        {activeTab === 'my-agenda' && (
                            <motion.div
                                key="agenda"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <OperatorView user={user} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        )
    }

    // Standard Operator
    return (
        <div className="min-h-screen relative">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4000ms' }} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#FF0C60]/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '7000ms' }} />
            </div>
            <div className="p-4 md:p-8 pt-24 md:pt-32 relative z-10">
                <OperatorView user={user} />
            </div>
        </div>
    )
}

// --- SUB COMPONENTS ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function OperatorView({ user }: { user: any }) {
    // const isAdmin = user?.email === 'knunez@enlace.org' || user?.email === 'ablanco@enlace.org' || user?.role === 'BOSS'
    // const searchParams = useSearchParams()

    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)

    // Calendar State
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [weekDates, setWeekDates] = useState<Date[]>([])

    // Modals & Actions
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [comment, setComment] = useState("")
    const [actionType, setActionType] = useState<'COMPLETE' | 'JUSTIFY' | 'EDIT' | 'VIEW'>('VIEW')
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        // Calculate current week (Mon-Sun)
        const start = startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
        const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i))
        setWeekDates(days)
    }, [])

    const loadData = async (date: Date) => {
        setLoading(true)
        const dateStr = format(date, 'yyyy-MM-dd')
        // Direct fetch
        const res = await fetch(`/api/tasks?userId=${user.id}&date=${dateStr}`, { cache: 'no-store' })
        setTasks(await res.json())
        setLoading(false)
    }

    useEffect(() => {
        loadData(selectedDate)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.id, selectedDate])

    const handleAction = async () => {
        if (!selectedTask) return

        // Determine Status based on Action
        let status = undefined
        if (actionType === 'COMPLETE') status = 'COMPLETED'
        if (actionType === 'JUSTIFY') status = 'INCOMPLETE'
        // 'EDIT' does not change status

        await fetch('/api/tasks', {
            method: 'PATCH',
            body: JSON.stringify({
                id: selectedTask.id,
                status: status,
                comment: comment
            })
        })
        setIsModalOpen(false)
        loadData(selectedDate)
    }

    const openTaskModal = (task: Task) => {
        setSelectedTask(task)
        setComment(task.comment || "")
        // Default mode based on status
        if (task.status === 'PENDING') setActionType('VIEW')
        else setActionType('EDIT') // If done, default to View/Edit
        setIsModalOpen(true)
    }

    const isToday = (d: Date) => {
        const now = new Date()
        return d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
    }

    const isSelectedDateToday = isToday(selectedDate)
    const completedCount = tasks.filter(t => t.status === 'COMPLETED').length
    const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0

    // Date formatting functions
    const getDayName = (d: Date) => format(d, 'EEE', { locale: es }).toUpperCase().replace('.', '')
    const getDayNumber = (d: Date) => format(d, 'd')

    if (loading && tasks.length === 0) return <div className="text-center p-10 font-mono text-slate-400">Cargando...</div>

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header & Calendar */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500 tracking-tighter">
                        Hola, {user.name.split(' ')[0]}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        Agenda Semanal
                    </p>
                </div>

                {/* Week Calendar */}
                <div className="grid grid-cols-7 bg-gradient-to-b from-white/5 via-black/5 to-black/40 p-2 rounded-3xl shadow-2xl border border-white/5 gap-2 backdrop-blur-xl ring-1 ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                    {weekDates.map((d) => {
                        const isSelected = d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth()
                        const today = isToday(d)

                        return (
                            <button
                                key={format(d, 'yyyy-MM-dd')}
                                onClick={() => setSelectedDate(d)}
                                className={`
                                    flex flex-col items-center justify-center w-full h-24 rounded-2xl transition-all relative
                                    ${isSelected
                                        ? 'bg-[#FF0C60] text-white shadow-lg shadow-[#FF0C60]/30 scale-105 z-10'
                                        : 'text-slate-500 hover:bg-white/10 hover:text-slate-200'
                                    }
                                `}
                            >
                                <span className="text-[10px] font-bold tracking-wider opacity-80">{getDayName(d)}</span>
                                <span className="text-xl font-bold">{getDayNumber(d)}</span>
                                {today && (
                                    <div className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#FF0C60]'}`} />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Progress Bar (Only visible if Today) */}
                {isSelectedDateToday && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                            <span>Progreso Diario</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-gradient-to-r from-[#FF0C60] to-orange-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Tasks List */}
            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4 bg-black/40 p-1 rounded-2xl border border-white/5 backdrop-blur-xl">
                    <TabsTrigger value="pending" className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-[#FF0C60] data-[state=active]:shadow-lg data-[state=active]:backdrop-blur-md text-slate-500 hover:text-white hover:bg-white/5 transition-all duration-300">
                        Pendientes ({tasks.filter(t => t.status === 'PENDING').length})
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-emerald-500 data-[state=active]:shadow-lg data-[state=active]:backdrop-blur-md text-slate-500 hover:text-white hover:bg-white/5 transition-all duration-300">
                        Completadas ({tasks.filter(t => t.status === 'COMPLETED').length})
                    </TabsTrigger>
                    <TabsTrigger value="justified" className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-amber-500 data-[state=active]:shadow-lg data-[state=active]:backdrop-blur-md text-slate-500 hover:text-white hover:bg-white/5 transition-all duration-300">
                        Justificadas ({tasks.filter(t => t.status === 'INCOMPLETE').length})
                    </TabsTrigger>
                </TabsList>

                <div className="pb-24">
                    {!isSelectedDateToday && (
                        <div className="p-4 bg-white/5 rounded-2xl text-center text-slate-500 text-xs font-medium mb-4 border border-dashed border-white/20 mx-1">
                            Vista Histórica: {format(selectedDate, "d 'de' MMMM", { locale: es })}
                        </div>
                    )}

                    <TabsContent value="pending" className="space-y-3 mt-0 focus-visible:ring-0 outline-none">
                        {tasks.filter(t => t.status === 'PENDING').length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 opacity-50">
                                <div className="bg-white/5 p-4 rounded-full mb-3 border border-white/5">
                                    <CheckCircle className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-sm font-medium">¡Todo listo por hoy!</p>
                            </div>
                        ) : (
                            tasks.filter(t => t.status === 'PENDING').map(task => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    isToday={isSelectedDateToday}
                                    onClick={() => {
                                        if (isSelectedDateToday) {
                                            openTaskModal(task)
                                        }
                                    }}
                                />
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="completed" className="space-y-3 mt-0 focus-visible:ring-0 outline-none">
                        {tasks.filter(t => t.status === 'COMPLETED').length === 0 ? (
                            <div className="text-center py-16 opacity-40">
                                <p className="text-xs">No hay tareas completadas aún.</p>
                            </div>
                        ) : (
                            tasks.filter(t => t.status === 'COMPLETED').map(task => (
                                <TaskCard key={task.id} task={task} isToday={isSelectedDateToday} isCompleted
                                    onClick={() => openTaskModal(task)}
                                />
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="justified" className="space-y-3 mt-0 focus-visible:ring-0 outline-none">
                        {tasks.filter(t => t.status === 'INCOMPLETE').length === 0 ? (
                            <div className="text-center py-16 opacity-40">
                                <p className="text-xs">No hay tareas justificadas.</p>
                            </div>
                        ) : (
                            tasks.filter(t => t.status === 'INCOMPLETE').map(task => (
                                <TaskCard key={task.id} task={task} isToday={isSelectedDateToday} isCompleted
                                    onClick={() => openTaskModal(task)}
                                />
                            ))
                        )}
                    </TabsContent>
                </div>
            </Tabs>

            {/* Rich Task Detail Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {actionType === 'COMPLETE' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                            {actionType === 'JUSTIFY' && <AlertCircle className="w-5 h-5 text-amber-500" />}
                            {actionType === 'EDIT' && <MessageSquare className="w-5 h-5 text-blue-500" />}
                            {actionType === 'VIEW' && <ListTodo className="w-5 h-5 text-slate-500" />}

                            {selectedTask?.title}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedTask?.description || "Sin descripción adicional."}
                        </DialogDescription>
                    </DialogHeader>

                    {/* View Mode Actions (Initial State for Pending) */}
                    {actionType === 'VIEW' && (
                        <div className="grid grid-cols-2 gap-3 py-4">
                            <Button
                                className="bg-emerald-500 hover:bg-emerald-600 text-white h-24 flex flex-col gap-2 shadow-lg shadow-emerald-500/20"
                                onClick={() => setActionType('COMPLETE')}
                            >
                                <CheckCircle className="w-8 h-8" />
                                <span className="font-bold">Confirmar</span>
                                <span className="text-[10px] opacity-80 font-normal">Tarea Realizada</span>
                            </Button>

                            <Button
                                variant="secondary"
                                className="bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 text-amber-600 dark:text-amber-500 h-24 flex flex-col gap-2 border border-amber-200 dark:border-amber-800"
                                onClick={() => {
                                    setComment("")
                                    setActionType('JUSTIFY')
                                }}
                            >
                                <AlertCircle className="w-8 h-8" />
                                <span className="font-bold">Justificar</span>
                                <span className="text-[10px] opacity-80 font-normal">No se pudo realizar</span>
                            </Button>
                        </div>
                    )}

                    {/* Input Modes (Complete, Justify, Edit) */}
                    {actionType !== 'VIEW' && (
                        <div className="space-y-4 py-2">
                            <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-lg text-sm text-slate-600 dark:text-slate-300">
                                {actionType === 'COMPLETE' && "Añade un comentario opcional sobre la ejecución."}
                                {actionType === 'JUSTIFY' && "Es obligatorio indicar por qué no se pudo realizar la tarea."}
                                {actionType === 'EDIT' && "Modifica el comentario de esta tarea."}
                            </div>

                            <Textarea
                                autoFocus
                                placeholder={actionType === 'JUSTIFY' ? "Motivo de la justificación..." : "Observaciones..."}
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        {actionType !== 'VIEW' && (
                            <Button variant="ghost" onClick={() => {
                                // Return to View if Pending, or Close if Edit
                                if (selectedTask?.status === 'PENDING') setActionType('VIEW')
                                else setIsModalOpen(false)
                            }}>
                                Atrás
                            </Button>
                        )}

                        {actionType !== 'VIEW' && (
                            <Button
                                onClick={handleAction}
                                disabled={actionType === 'JUSTIFY' && comment.trim().length < 5}
                                className={`
                                    ${actionType === 'COMPLETE' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                                    ${actionType === 'JUSTIFY' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                                    ${actionType === 'EDIT' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                                    text-white
                                `}
                            >
                                {actionType === 'EDIT' ? 'Guardar Cambios' : 'Confirmar'}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AdminView({ user: _user }: { user: any }) {
    const [users, setUsers] = useState<UserData[]>([])
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [tasks, setTasks] = useState<Task[]>([])

    // Add logic
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [selectedDays, setSelectedDays] = useState<Date[]>([])
    const [newTasks, setNewTasks] = useState([{ title: "", priority: "MEDIUM", deadline: "" }])

    // Generate upcoming dates for selector
    // const [weekOptions, setWeekOptions] = useState<Date[]>([])
    useEffect(() => {
        // const start = startOfWeek(new Date(), { weekStartsOn: 1 })
        // const days = Array.from({ length: 14 }).map((_, i) => addDays(start, i)) // 2 weeks
        // setWeekOptions(days)
        // Default to Today
        setSelectedDays([new Date()])
    }, [])

    // Delete Modal
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
    // View Comment Modal
    const [viewComment, setViewComment] = useState<{ title: string, comment: string } | null>(null)

    useEffect(() => {
        const init = async () => {
            const uRes = await fetch('/api/users')
            const uData = await uRes.json()
            setUsers(uData)
            if (uData.length > 0) setSelectedUserId(uData[0].id)
        }
        init()
    }, [])

    useEffect(() => {
        if (selectedUserId) {
            // Fetch ALL scheduled
            fetch(`/api/tasks?userId=${selectedUserId}`)
                .then(r => r.json())
                .then(setTasks)
        }
    }, [selectedUserId])

    const handleSave = async () => {
        if (!selectedUserId) return
        const valid = newTasks.filter(t => t.title.trim() !== "")
        if (valid.length === 0 || selectedDays.length === 0) return

        await fetch('/api/tasks', {
            method: 'POST',
            body: JSON.stringify({
                userId: selectedUserId,
                tasks: valid,
                dates: selectedDays.map(d => format(d, 'yyyy-MM-dd'))
            })
        })
        setIsAddOpen(false)
        setNewTasks([{ title: "", priority: "MEDIUM", deadline: "" }])
        setSelectedDays([new Date()])

        // Refresh
        const res = await fetch(`/api/tasks?userId=${selectedUserId}`)
        setTasks(await res.json())
    }

    const handleDelete = async () => {
        if (!taskToDelete) return
        await fetch(`/api/tasks?id=${taskToDelete}`, { method: 'DELETE' })
        setTaskToDelete(null)
        // Refresh
        if (selectedUserId) {
            const res = await fetch(`/api/tasks?userId=${selectedUserId}`)
            setTasks(await res.json())
        }
    }

    const toggleDay = (d: Date) => {
        const str = format(d, 'yyyy-MM-dd')
        const exists = selectedDays.find(sd => format(sd, 'yyyy-MM-dd') === str)
        if (exists) {
            setSelectedDays(selectedDays.filter(sd => format(sd, 'yyyy-MM-dd') !== str))
        } else {
            setSelectedDays([...selectedDays, d])
        }
    }

    // Report Logic
    const [isReportOpen, setIsReportOpen] = useState(false)
    const [reportEmails, setReportEmails] = useState("knunez@enlace.org")
    const [sendingReport, setSendingReport] = useState(false)

    const handleSendReport = async () => {
        setSendingReport(true)
        try {
            const emails = reportEmails.split(',').map(e => e.trim()).filter(e => e.length > 0)
            await fetch('/api/cron/weekly-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emails })
            })
            setIsReportOpen(false)
            alert("Reporte enviado correctamente.")
        } catch (e) {
            alert("Error enviando reporte.")
        } finally {
            setSendingReport(false)
        }
    }

    const selectedUserName = users.find(u => u.id === selectedUserId)?.name

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'HIGH': return 'border-red-200 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
            case 'MEDIUM': return 'border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
            default: return 'border-slate-200 text-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
        }
    }

    // Group Tasks by Date for Display
    // Sort tasks by date
    // Safe sort
    const sortedTasks = [...tasks].sort((a, b) => {
        const dA = parseISO(a.scheduledDate); const dB = parseISO(b.scheduledDate)
        return (isValid(dB) ? dB.getTime() : 0) - (isValid(dA) ? dA.getTime() : 0)
    })

    return (
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)]">
            <ConfirmModal
                isOpen={!!taskToDelete}
                title="¿Eliminar Tarea?"
                message="Esta acción no se puede deshacer. La tarea desaparecerá de la lista del operador para este día."
                onConfirm={handleDelete}
                onCancel={() => setTaskToDelete(null)}
            />

            <Dialog open={!!viewComment} onOpenChange={(open) => !open && setViewComment(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-500" />
                            {viewComment?.title}
                        </DialogTitle>
                        <DialogDescription>Observaciones / Justificación</DialogDescription>
                    </DialogHeader>
                    <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-xl text-slate-700 dark:text-slate-300 italic border border-slate-100 dark:border-white/5">
                        "{viewComment?.comment}"
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setViewComment(null)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Sidebar */}
            <Card className="w-full md:w-80 h-full flex flex-col border border-white/5 shadow-2xl bg-gradient-to-b from-white/5 via-black/5 to-black/40 backdrop-blur-xl rounded-3xl overflow-hidden ring-1 ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                <CardHeader className="pb-4 border-b border-white/5">
                    <CardTitle className="flex items-center gap-2 text-sm uppercase text-slate-500">
                        Equipos
                    </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {users.filter(u => u.role === 'OPERATOR').map(u => (
                            <button
                                key={u.id}
                                onClick={() => setSelectedUserId(u.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${selectedUserId === u.id ? 'bg-[#FF0C60] text-white shadow-lg shadow-[#FF0C60]/30' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${selectedUserId === u.id ? 'bg-white/20' : 'bg-white/5 text-slate-500'}`}>
                                    {u.name[0]}
                                </div>
                                <span className="font-medium truncate">{u.name}</span>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </Card>

            {/* Main */}
            <div className="flex-1 flex flex-col h-full space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <ListTodo className="w-8 h-8 text-slate-400" />
                            {selectedUserName}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400">Plan de trabajo.</p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" className="h-12 border-slate-200 dark:border-white/10" onClick={() => setIsReportOpen(true)}>
                            Reporte Semanal
                        </Button>
                    </div>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#FF0C60] hover:bg-[#D90A50] text-white shadow-lg shadow-[#FF0C60]/20 rounded-xl px-6 h-12">
                                <Plus className="w-5 h-5 mr-2" /> Planificar
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">

                            <DialogHeader>
                                <DialogTitle>Planificar para {selectedUserName}</DialogTitle>
                            </DialogHeader>
                            <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto">



                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-3 rounded-lg">
                                        <div className="space-y-1">
                                            <Label>Fechas de Planificación</Label>
                                            <p className="text-[11px] text-slate-500">Selecciona los días para asignar estas tareas. (Mostrando próximas 8 semanas)</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSelectedDays([])}>Limpiar</Button>
                                        </div>
                                    </div>

                                    {/* Weeks Grid */}
                                    <div className="space-y-6">
                                        {Array.from({ length: 8 }).map((_, weekIndex) => {
                                            // Get start of this week relative to today
                                            const today = new Date()
                                            const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 })
                                            const weekStart = addDays(startOfCurrentWeek, weekIndex * 7)

                                            // Generate 7 days for this week
                                            const weekDays = Array.from({ length: 7 }).map((_, dayIndex) => addDays(weekStart, dayIndex))

                                            // Check if all days in this week are selected
                                            const allSelected = weekDays.every(d =>
                                                selectedDays.some(sd => format(sd, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd'))
                                            )

                                            return (
                                                <div key={weekIndex} className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-xs font-bold uppercase text-slate-400">
                                                            Semana {format(weekStart, 'd MMM')} - {format(addDays(weekStart, 6), 'd MMM', { locale: es })}
                                                        </h4>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={`h-5 text-[10px] px-2 ${allSelected ? 'text-red-500' : 'text-blue-500'}`}
                                                            onClick={() => {
                                                                if (allSelected) {
                                                                    // Deselect all this week
                                                                    const toRemove = weekDays.map(d => format(d, 'yyyy-MM-dd'))
                                                                    setSelectedDays(selectedDays.filter(sd => !toRemove.includes(format(sd, 'yyyy-MM-dd'))))
                                                                } else {
                                                                    // Select all this week (merge)
                                                                    const existing = selectedDays.map(d => format(d, 'yyyy-MM-dd'))
                                                                    const newDays = weekDays.filter(d => !existing.includes(format(d, 'yyyy-MM-dd')))
                                                                    setSelectedDays([...selectedDays, ...newDays])
                                                                }
                                                            }}
                                                        >
                                                            {allSelected ? 'Deseleccionar' : 'Seleccionar Todo'}
                                                        </Button>
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-1">
                                                        {weekDays.map(d => {
                                                            const s = format(d, 'yyyy-MM-dd')
                                                            const isSel = selectedDays.some(sd => format(sd, 'yyyy-MM-dd') === s)
                                                            const isWeekend = d.getDay() === 0 || d.getDay() === 6

                                                            return (
                                                                <button
                                                                    key={s}
                                                                    onClick={() => toggleDay(d)}
                                                                    className={`
                                                                        flex flex-col items-center justify-center p-2 rounded-lg transition-all border
                                                                        ${isSel
                                                                            ? 'bg-[#FF0C60] text-white border-[#FF0C60] shadow-md shadow-[#FF0C60]/20'
                                                                            : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-300'
                                                                        }
                                                                        ${isWeekend && !isSel ? 'bg-slate-50 opacity-70' : ''}
                                                                    `}
                                                                >
                                                                    <span className="text-[9px] uppercase opacity-70 mb-0.5">{format(d, 'EEE', { locale: es })}</span>
                                                                    <span className="text-sm font-bold">{format(d, 'd')}</span>
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t">
                                    {newTasks.map((t, idx) => (
                                        <div key={idx} className="flex gap-2 items-start">
                                            <div className="grid gap-1 flex-1">
                                                <Label className="text-[10px] uppercase text-slate-400">Tarea</Label>
                                                <Input value={t.title} onChange={e => {
                                                    const copy = [...newTasks]; copy[idx].title = e.target.value; setNewTasks(copy)
                                                }} />
                                            </div>
                                            <div className="grid gap-1 w-28">
                                                <Label className="text-[10px] uppercase text-slate-400">Prioridad</Label>
                                                <Select value={t.priority} onValueChange={v => {
                                                    const copy = [...newTasks]; copy[idx].priority = v; setNewTasks(copy)
                                                }}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="HIGH">Alta</SelectItem>
                                                        <SelectItem value="MEDIUM">Media</SelectItem>
                                                        <SelectItem value="LOW">Baja</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-1 w-28">
                                                <Label className="text-[10px] uppercase text-slate-400">Hora</Label>
                                                <Input type="time" value={t.deadline} onChange={e => {
                                                    const copy = [...newTasks]; copy[idx].deadline = e.target.value; setNewTasks(copy)
                                                }} />
                                            </div>
                                            {newTasks.length > 1 && (
                                                <div className="pt-6">
                                                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => {
                                                        const copy = [...newTasks]; copy.splice(idx, 1); setNewTasks(copy)
                                                    }}><Trash2 className="w-4 h-4" /></Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <Button variant="outline" className="w-full border-dashed" onClick={() => setNewTasks([...newTasks, { title: "", priority: "MEDIUM", deadline: "" }])}>
                                        <Plus className="w-4 h-4 mr-2" /> Agregar Línea
                                    </Button>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600 text-white">Guardar</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Weekly Report Modal */}
                    <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Enviar Reporte Semanal</DialogTitle>
                                <DialogDescription>
                                    Genera y envía el reporte de rendimiento de la semana pasada (Lunes-Domingo) en formato PDF.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 py-4">
                                <Label>Enviar a:</Label>
                                <Input
                                    value={reportEmails}
                                    onChange={e => setReportEmails(e.target.value)}
                                    placeholder="ejemplo@correo.com, jefe@enlace.org"
                                />
                                <p className="text-xs text-slate-400">Separa múltiples correos con comas.</p>
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={handleSendReport}
                                    disabled={sendingReport}
                                    className="bg-[#FF0C60] hover:bg-[#D90A50] text-white"
                                >
                                    {sendingReport ? 'Enviando...' : 'Enviar Reporte'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <ScrollArea className="flex-1">
                    <div className="grid gap-3 pb-20">
                        {sortedTasks.map(task => (
                            <div
                                key={task.id}
                                className="flex items-center justify-between p-4 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl text-slate-400 ${task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' :
                                        task.status === 'INCOMPLETE' ? 'bg-amber-100 text-amber-600' :
                                            'bg-slate-50 dark:bg-white/5'
                                        }`}>
                                        <ListTodo className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className={`font-semibold ${task.status === 'COMPLETED' ? 'text-emerald-700 line-through' :
                                            task.status === 'INCOMPLETE' ? 'text-amber-700 line-through' :
                                                'text-slate-900 dark:text-white'
                                            }`}>
                                            {task.title}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                                {task.priority === 'HIGH' ? 'ALTA' : task.priority === 'MEDIUM' ? 'MEDIA' : 'BAJA'}
                                            </Badge>
                                            {task.reminderSent && (
                                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800 text-[10px] h-5 px-2">
                                                    Recordatorio enviado
                                                </Badge>
                                            )}
                                            {task.deadline && (
                                                <Badge variant="secondary" className="bg-slate-100 dark:bg-white/5 text-slate-500">
                                                    <Clock className="w-3 h-3 mr-1" /> {task.deadline}
                                                </Badge>
                                            )}
                                            <div className="text-xs text-slate-400 flex items-center gap-1 ml-2">
                                                <span className="font-bold text-slate-600 dark:text-slate-300">
                                                    {(() => {
                                                        const d = parseISO(task.scheduledDate)
                                                        return isValid(d) ? format(d, "EEEE d", { locale: es }) : "Fecha Inválida"
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button size="icon" variant="ghost" className="text-slate-300 hover:text-red-500 hover:bg-red-500/10" onClick={() => setTaskToDelete(task.id)}>
                                        <Trash2 className="w-5 h-5" />
                                    </Button>

                                    {/* Admin "View Reason" button */}
                                    {(task.status === 'INCOMPLETE' || task.status === 'COMPLETED') && task.comment && (
                                        <Button size="icon" variant="ghost" className="text-slate-300 hover:text-blue-500" onClick={() => setViewComment({ title: task.title, comment: task.comment! })}>
                                            <MessageSquare className="w-5 h-5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
