"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, UserPlus, Settings, Shield, Crown, Search, Archive, Wrench, MapPin } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { ConfirmModal } from "@/components/ConfirmModal"
import { ScheduleEditor, Shift } from "@/components/ScheduleEditor"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { WeeklyCalendar } from "@/components/WeeklyCalendar"
import { Calendar as CalendarIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoginMap } from "@/components/LoginMap"
import { ActiveUsersWidget } from "@/components/ActiveUsersWidget"

interface User {
    id: string
    name: string
    email: string
    role: string
    image?: string
    schedule?: string | Shift[]
    currentPath?: string
    lastActive?: string
    lastLogin?: string
    lastLoginIP?: string
    lastLoginCountry?: string
}

interface Report {
    id: string
    operatorName: string
    problemDescription: string
    createdAt: string
}

export default function ConfigurationPage() {
    const router = useRouter()
    const [users, setUsers] = useState<User[]>([])
    const [reports, setReports] = useState<Report[]>([])
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'schedule'>('users')

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
    const [currentWeekStart, setCurrentWeekStart] = useState<string>(getInitialWeekStart())

    const [modal, setModal] = useState<{ isOpen: boolean; title: string; message: string; action: () => void; type: 'danger' | 'warning' }>({
        isOpen: false, title: '', message: '', action: () => { }, type: 'danger'
    })

    const [newUser, setNewUser] = useState<{ name: string, email: string, password: string, role: string, schedule: Shift[] }>({
        name: '', email: '', password: 'password123', role: 'OPERATOR', schedule: []
    })
    const [isEditing, setIsEditing] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [error, setError] = useState("")

    useEffect(() => {
        const savedUser = localStorage.getItem("enlace-user")
        if (!savedUser) { router.push("/login"); return }
        const user = JSON.parse(savedUser)

        const allowedEmails = ['knunez@enlace.org', 'rjimenez@enlace.org']
        if (!allowedEmails.includes(user.email)) { router.push("/"); return }

        setIsAdmin(true)
    }, [router])

    useEffect(() => {
        if (isAdmin) {
            fetchData()
            // Poll for updates every 30 seconds to keep "Active Users" alive
            const interval = setInterval(fetchData, 30000)
            return () => clearInterval(interval)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, currentWeekStart])

    const fetchData = async () => {
        try {
            // ... (rest of function remains same, just ensuring variables are correct)
            const [usersRes, reportsRes] = await Promise.all([
                fetch(`/api/users?weekStart=${currentWeekStart}`),
                fetch('/api/reports')
            ])
            const usersData = await usersRes.json()
            const reportsData = await reportsRes.json()

            if (Array.isArray(usersData)) setUsers(usersData)
            if (Array.isArray(reportsData)) setReports(reportsData)
        } catch (e) { console.error("Error fetching data", e) } finally { setLoading(false) }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleEditUser = (user: any) => {
        setIsEditing(true)
        setEditId(user.id)

        let schedule = []
        try {
            schedule = typeof user.schedule === 'string' ? JSON.parse(user.schedule) : (user.schedule || [])
        } catch (e) { }

        setNewUser({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role || 'OPERATOR',
            schedule
        })

        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const cancelEdit = () => {
        setIsEditing(false)
        setEditId(null)
        setNewUser({ name: '', email: '', password: 'password123', role: 'OPERATOR', schedule: [] })
    }

    const handleSaveUser = async () => {
        try {
            const method = isEditing ? 'PATCH' : 'POST'
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const body: any = { ...newUser }

            if (isEditing) {
                body.id = editId
                if (!body.password) delete body.password
            }

            const res = await fetch('/api/users', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (!res.ok) throw new Error("Error guardando usuario")

            await fetchData()
            cancelEdit()
            setModal(prev => ({ ...prev, isOpen: false }))
        } catch (err) {
            setError("No se pudo guardar los cambios")
            setModal(prev => ({ ...prev, isOpen: false }))
        }
    }

    const confirmSaveUser = (e: React.FormEvent) => {
        e.preventDefault()
        setModal({
            isOpen: true,
            title: isEditing ? 'Actualizar Usuario' : 'Crear Usuario',
            message: isEditing
                ? `¿Guardar cambios para "${newUser.name}"?`
                : `¿Crear al usuario "${newUser.name}"?`,
            type: 'warning',
            action: handleSaveUser
        })
    }

    const confirmDeleteUser = (id: string) => {
        setModal({
            isOpen: true,
            title: 'Eliminar Usuario',
            message: '¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.',
            type: 'danger',
            action: async () => {
                await fetch(`/api/users?id=${id}`, { method: 'DELETE' })
                await fetchData()
                setModal(prev => ({ ...prev, isOpen: false }))
            }
        })
    }

    const confirmDeleteReport = (id: string) => {
        setModal({
            isOpen: true,
            title: 'Eliminar Reporte',
            message: '¿Estás seguro de eliminar este reporte permanentemente?',
            type: 'danger',
            action: async () => {
                await fetch(`/api/reports?id=${id}`, { method: 'DELETE' })
                await fetchData()
                setModal(prev => ({ ...prev, isOpen: false }))
            }
        })
    }

    if (!isAdmin && loading) return <div className="min-h-screen bg-[#070708] flex items-center justify-center text-white">Verificando...</div>
    if (!isAdmin) return null

    const handleScheduleUpdate = async (userId: string, newShifts: Shift[], weekStart: string) => {
        try {
            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: userId,
                    tempSchedule: newShifts,
                    weekStart: weekStart
                })
            })

            if (!res.ok) throw new Error("Error actualizando horario")

            await fetchData()
        } catch (err) {
            console.error("Failed to save temp schedule", err)
        }
    }

    const renderUserTable = (title: string, roleFilter: (role: string) => boolean, icon: React.ReactNode) => {
        const filteredUsers = users.filter(u => roleFilter(u.role))
        if (filteredUsers.length === 0) return null

        return (
            <div className="mb-8 last:mb-0">
                <div className="flex items-center gap-2 mb-4 px-2">
                    {icon}
                    <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
                </div>
                <div className="rounded-xl border border-white/5 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-white/[0.02]">
                            <TableRow className="border-slate-200 dark:border-white/5 hover:bg-transparent">
                                <TableHead className="pl-6 h-12 text-slate-500">Usuario</TableHead>
                                <TableHead className="h-12 text-slate-500">Rol</TableHead>
                                <TableHead className="h-12 text-slate-500">Email</TableHead>
                                <TableHead className="h-12 text-slate-500">Último Acceso</TableHead>
                                <TableHead className="text-right pr-6 h-12 text-slate-500">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map(u => (
                                <TableRow key={u.id} className="border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                                    <TableCell className="pl-6 font-medium text-slate-700 dark:text-slate-200">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-8 h-8 border border-white/10">
                                                <AvatarImage src={u.image} />
                                                <AvatarFallback className="bg-slate-800 text-xs">{u.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            {u.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {u.role === 'BOSS' ?
                                            <Badge className="bg-blue-900/40 text-blue-400 border border-blue-800/50 hover:bg-blue-900/60"><Crown className="w-3 h-3 mr-1" /> Coordinador</Badge> :
                                            u.role === 'ENGINEER' ?
                                                <Badge className="bg-purple-900/40 text-purple-400 border border-purple-800/50 hover:bg-purple-900/60"><Wrench className="w-3 h-3 mr-1" /> Ingeniero</Badge> :
                                                <Badge variant="outline" className="border-white/10 text-slate-400">Operador</Badge>
                                        }
                                    </TableCell>
                                    <TableCell className="text-slate-400 text-sm">{u.email}</TableCell>
                                    <TableCell>
                                        {u.lastLogin ? (
                                            <div className="flex flex-col">
                                                <span className="text-slate-300 text-xs font-medium">
                                                    {new Date(u.lastLogin).toLocaleDateString('es-CR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                                    <MapPin className="w-3 h-3" />
                                                    {u.lastLoginCountry || 'Desc.'} • {u.lastLoginIP || '---'}
                                                </div>
                                                {/* Risk Indicator */}
                                                {(u.lastLoginCountry && u.lastLoginCountry !== 'Costa Rica' && u.lastLoginCountry !== 'Localhost' && u.lastLoginCountry !== 'Local Loopback') && (
                                                    <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-400 font-bold animate-pulse">
                                                        <Shield className="w-3 h-3" /> ALERTA DE RIESGO
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-slate-600 text-xs italic">Nunca</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end gap-1">
                                            {/* Details Button */}
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                                                        <Search className="w-4 h-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="bg-[#09090b] border-white/10 text-slate-200 max-w-md">
                                                    <div className="p-4 space-y-4">
                                                        <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                                                            <Avatar className="w-16 h-16 border-2 border-white/10">
                                                                <AvatarImage src={u.image} />
                                                                <AvatarFallback className="bg-slate-800 text-xl">{u.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <h3 className="text-lg font-bold text-white">{u.name}</h3>
                                                                <p className="text-sm text-slate-400">{u.email}</p>
                                                                <div className="mt-1 flex gap-2">
                                                                    <Badge variant="outline" className="border-white/10 text-xs">{u.role}</Badge>
                                                                    {(u.lastLoginCountry && u.lastLoginCountry !== 'Costa Rica' && u.lastLoginCountry !== 'Localhost' && u.lastLoginCountry !== 'Local Loopback') ? (
                                                                        <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/50 hover:bg-rose-500/30">Riesgo Detectado</Badge>
                                                                    ) : (
                                                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30">Seguro</Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Detalles de Acceso</h4>
                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                                                    <p className="text-slate-500 text-xs mb-1">Último Ingreso</p>
                                                                    <p className="text-white font-mono">
                                                                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString('es-CR') : 'N/A'}
                                                                    </p>
                                                                </div>
                                                                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                                                    <p className="text-slate-500 text-xs mb-1">Dirección IP</p>
                                                                    <p className="text-white font-mono">{u.lastLoginIP || 'N/A'}</p>
                                                                </div>
                                                                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                                                    <p className="text-slate-500 text-xs mb-1">Ubicación</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <MapPin className="w-4 h-4 text-[#FF0C60]" />
                                                                        <span className="text-white">{u.lastLoginCountry || 'N/A'}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                                                    <p className="text-slate-500 text-xs mb-1">Estado</p>
                                                                    <p className="text-white">Activo</p>
                                                                </div>
                                                            </div>

                                                            {(u.lastLoginCountry && u.lastLoginCountry !== 'Costa Rica' && u.lastLoginCountry !== 'Localhost') && (
                                                                <Alert className="bg-rose-500/10 border-rose-500/20 text-rose-200">
                                                                    <Shield className="h-4 w-4 text-rose-400" />
                                                                    <AlertDescription className="text-xs ml-2">
                                                                        Este usuario ha ingresado desde una ubicación inusual. Se recomienda verificar su identidad o forzar un cambio de contraseña.
                                                                    </AlertDescription>
                                                                </Alert>
                                                            )}
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>

                                            <Button variant="ghost" size="icon" onClick={() => handleEditUser(u)} className="h-8 w-8 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                                                <Settings className="w-4 h-4" />
                                            </Button>
                                            {u.role !== 'BOSS' && (
                                                <Button variant="ghost" size="icon" onClick={() => confirmDeleteUser(u.id)} className="h-8 w-8 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#050505] text-slate-100 selection:bg-[#FF0C60] selection:text-white pb-20">

            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4000ms' }} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#FF0C60]/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '7000ms' }} />
            </div>

            <div className="relative z-10 text-slate-900 dark:text-slate-200 font-sans">
                <ConfirmModal isOpen={modal.isOpen} title={modal.title} message={modal.message} onConfirm={modal.action} onCancel={() => setModal({ ...modal, isOpen: false })} type={modal.type} />

                <div className="max-w-[1600px] mx-auto p-6 md:p-10 pt-24 md:pt-32 space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500 tracking-tighter flex items-center gap-2">
                                <Settings className="w-8 h-8 text-[#FF0C60]" /> Configuración
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Administración de usuarios y limpieza de base de datos.</p>
                        </div>
                        <div className="flex bg-black/40 backdrop-blur-xl p-1 rounded-xl border border-white/5 ring-1 ring-white/5">
                            <button onClick={() => setActiveTab('users')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-[#FF0C60]/10 text-[#FF0C60]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                                <Shield className="w-4 h-4" /> Usuarios
                            </button>
                            <button onClick={() => setActiveTab('schedule')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'schedule' ? 'bg-[#FF0C60]/10 text-[#FF0C60]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                                <CalendarIcon className="w-4 h-4" /> Horarios
                            </button>
                            <button onClick={() => setActiveTab('reports')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'reports' ? 'bg-[#FF0C60]/10 text-[#FF0C60]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                                <Archive className="w-4 h-4" /> Reportes
                            </button>
                        </div>
                    </div>
                    <AnimatePresence mode="wait">
                        {activeTab === 'users' ? (
                            <motion.div
                                key="users"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                            >
                                <Card className="lg:col-span-2 bg-gradient-to-b from-white/5 via-black/5 to-black/40 backdrop-blur-xl border border-white/5 shadow-2xl rounded-3xl ring-1 ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle className="text-xl text-slate-900 dark:text-white">Equipo Registrado</CardTitle>
                                                <CardDescription>Usuarios con acceso al sistema.</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="md:col-span-2">
                                                <LoginMap users={users} />
                                            </div>
                                            <div>
                                                <ActiveUsersWidget users={users} />
                                            </div>
                                        </div>

                                        <div>
                                            {renderUserTable("Coordinadores", (role) => role === 'BOSS', <Crown className="w-5 h-5 text-blue-500" />)}
                                            {renderUserTable("Ingenieros", (role) => role === 'ENGINEER', <Wrench className="w-5 h-5 text-purple-500" />)}
                                            {renderUserTable("Operadores", (role) => !['BOSS', 'ENGINEER'].includes(role || ''), <Shield className="w-5 h-5 text-slate-500" />)}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-gradient-to-b from-white/5 via-black/5 to-black/40 backdrop-blur-xl border border-white/5 shadow-2xl h-fit sticky top-24 ring-1 ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] rounded-3xl">
                                    <CardHeader>
                                        <div className="w-10 h-10 bg-[#FF0C60]/10 rounded-xl flex items-center justify-center mb-4">
                                            <UserPlus className="w-5 h-5 text-[#FF0C60]" />
                                        </div>
                                        <CardTitle className="text-slate-900 dark:text-white">
                                            {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
                                        </CardTitle>
                                        <CardDescription>
                                            {isEditing ? 'Modificar datos, rol y horario.' : 'Agregar credenciales para un nuevo miembro.'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={confirmSaveUser} className="space-y-4">
                                            {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-sm text-rose-400">{error}</div>}

                                            <div className="space-y-2">
                                                <Label className="text-slate-500 dark:text-slate-400">Nombre Completo</Label>
                                                <Input
                                                    value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                                    className="bg-slate-50 dark:bg-[#18181B] border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 focus:border-[#FF0C60]/50" required placeholder="Ej. Juan Pérez"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-slate-500 dark:text-slate-400">Email Corporativo</Label>
                                                <Input
                                                    type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                                    className="bg-slate-50 dark:bg-[#18181B] border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 focus:border-[#FF0C60]/50" required placeholder="usuario@enlace.org"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-slate-500 dark:text-slate-400">Rol</Label>
                                                <Select value={newUser.role} onValueChange={(val) => setNewUser({ ...newUser, role: val })}>
                                                    <SelectTrigger className="bg-slate-50 dark:bg-[#18181B] border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200">
                                                        <SelectValue placeholder="Seleccionar Rol" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#18181B] border-white/10 text-slate-200">
                                                        <SelectItem value="OPERATOR">Operador</SelectItem>
                                                        <SelectItem value="ENGINEER">Ingeniero</SelectItem>
                                                        <SelectItem value="BOSS">Coordinador</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-slate-500 dark:text-slate-400">
                                                    {isEditing ? 'Nueva Contraseña (Opcional)' : 'Contraseña Temporal'}
                                                </Label>
                                                <Input
                                                    value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                                    className="bg-slate-50 dark:bg-[#18181B] border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 focus:border-[#FF0C60]/50"
                                                    required={!isEditing}
                                                    placeholder={isEditing ? "Dejar en blanco para mantener actual" : "password123"}
                                                />
                                            </div>

                                            <div className="pt-2">
                                                <ScheduleEditor
                                                    value={newUser.schedule}
                                                    onChange={(s) => setNewUser({ ...newUser, schedule: s })}
                                                />
                                            </div>

                                            <div className="flex gap-2 pt-2">
                                                {isEditing && (
                                                    <Button type="button" variant="outline" onClick={cancelEdit} className="flex-1 border-slate-200 dark:border-white/10 text-slate-500">
                                                        Cancelar
                                                    </Button>
                                                )}
                                                <Button type="submit" className="flex-1 bg-[#FF0C60] hover:bg-[#d90a50] text-white">
                                                    {isEditing ? 'Guardar Cambios' : 'Registrar Usuario'}
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ) : activeTab === 'schedule' ? (
                            <motion.div
                                key="schedule"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="bg-gradient-to-b from-white/5 via-black/5 to-black/40 backdrop-blur-xl border border-white/5 shadow-2xl rounded-3xl overflow-hidden h-fit ring-1 ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                                    <WeeklyCalendar
                                        operators={users.map(u => ({
                                            id: u.id,
                                            name: u.name,
                                            image: u.image,
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            shifts: (u as any).shifts || [], // Use the 'shifts' field already processed by API
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            isTempSchedule: (u as any).isTempSchedule
                                        }))}
                                        currentWeekStart={currentWeekStart}
                                        onWeekChange={setCurrentWeekStart}
                                        onUpdateSchedule={handleScheduleUpdate}
                                    />
                                </Card>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="reports"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <Card className="bg-gradient-to-b from-white/5 via-black/5 to-black/40 backdrop-blur-xl border border-white/5 shadow-2xl rounded-3xl ring-1 ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <div className="space-y-1">
                                                <CardTitle className="text-slate-900 dark:text-white">Gestión de Reportes</CardTitle>
                                                <CardDescription>Eliminar reportes erróneos o de prueba de la base de datos.</CardDescription>
                                            </div>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <Input placeholder="Filtrar..." className="pl-9 bg-slate-50 dark:bg-[#18181B] border-slate-200 dark:border-white/10 w-[200px] text-sm h-9 text-slate-900 dark:text-slate-200" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader className="bg-slate-50 dark:bg-white/[0.02]">
                                                <TableRow className="border-slate-200 dark:border-white/5 hover:bg-transparent">
                                                    <TableHead className="pl-6 h-12 text-slate-500">ID</TableHead>
                                                    <TableHead className="h-12 text-slate-500">Fecha</TableHead>
                                                    <TableHead className="h-12 text-slate-500">Operador</TableHead>
                                                    <TableHead className="h-12 text-slate-500 w-[40%]">Descripción</TableHead>
                                                    <TableHead className="text-right pr-6 h-12 text-slate-500">Acciones</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {reports.map((report) => (
                                                    <TableRow key={report.id} className="border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                                                        <TableCell className="pl-6 font-mono text-xs text-slate-500">#{report.id.slice(0, 8)}</TableCell>
                                                        <TableCell className="text-slate-600 dark:text-slate-300 text-sm">{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                                                        <TableCell className="text-slate-600 dark:text-slate-300 text-sm">{report.operatorName}</TableCell>
                                                        <TableCell className="text-slate-500 dark:text-slate-400 text-sm max-w-md truncate">{report.problemDescription}</TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            <Button variant="ghost" size="icon" onClick={() => confirmDeleteReport(report.id)} className="h-8 w-8 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div >
    )
}
