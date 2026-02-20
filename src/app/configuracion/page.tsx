"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, UserPlus, Settings, Shield, Crown, Search, Archive, Wrench, MapPin, CalendarDays } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { ConfirmModal } from "@/components/ConfirmModal"
import { ScheduleEditor, Shift } from "@/components/ScheduleEditor"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { WeeklyCalendar } from "@/components/WeeklyCalendar"
import { Calendar as CalendarIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoginMap } from "@/components/LoginMap"
import { ActiveUsersWidget } from "@/components/ActiveUsersWidget"
import { SpecialEventsManager } from "@/components/SpecialEventsManager"

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
    defaultShifts?: Shift[]
    birthday?: string
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
    const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'schedule' | 'events'>('users')

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
    const [scheduleMode, setScheduleMode] = useState<'weekly' | 'default'>('weekly')

    const [modal, setModal] = useState<{ isOpen: boolean; title: string; message: string; action: () => void; type: 'danger' | 'warning' }>({
        isOpen: false, title: '', message: '', action: () => { }, type: 'danger'
    })

    const [newUser, setNewUser] = useState<{ name: string, email: string, password: string, role: string, schedule: Shift[], birthday: string }>({
        name: '', email: '', password: 'password123', role: 'OPERATOR', schedule: [], birthday: ''
    })
    const [isEditing, setIsEditing] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [isUserModalOpen, setIsUserModalOpen] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        const savedUser = localStorage.getItem("enlace-user")
        if (!savedUser) { router.push("/login"); return }
        const user = JSON.parse(savedUser)

        const allowedEmails = ['knunez@enlace.org', 'rjimenez@enlace.org']
        const allowedUsernames = ['knunez', 'rjimenez']

        // Ensure user object and fields exist before checking
        const email = user?.email || ""
        const username = user?.username || ""

        if (!allowedEmails.includes(email) && !allowedUsernames.includes(username)) {
            router.push("/")
            return
        }

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
        console.log("User for edit:", user, "Default Shifts:", user.defaultShifts)

        let schedule = []
        try {
            // Use defaultShifts if available (parsed by API)
            // If not, try user.shifts (computed effective schedule)
            // If not, try raw schedule string
            if (user.defaultShifts && Array.isArray(user.defaultShifts) && user.defaultShifts.length > 0) {
                schedule = user.defaultShifts
            } else if (user.shifts && Array.isArray(user.shifts) && user.shifts.length > 0) {
                // Clone to avoid reference issues
                schedule = JSON.parse(JSON.stringify(user.shifts))
            } else {
                schedule = typeof user.schedule === 'string' ? JSON.parse(user.schedule) : (user.schedule || [])
            }
        } catch (e) { }

        setNewUser({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role || 'OPERATOR',
            schedule,
            birthday: user.birthday || ''
        })



        setIsUserModalOpen(true)
    }

    const cancelEdit = () => {
        setIsEditing(false)
        setEditId(null)
        setNewUser({ name: '', email: '', password: 'password123', role: 'OPERATOR', schedule: [], birthday: '' })
        setIsUserModalOpen(false)
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
            // setModal(prev => ({ ...prev, isOpen: false })) // Keep modal open on error?
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

    if (!isAdmin && loading) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Verificando...</div>
    if (!isAdmin) return null

    const handleScheduleUpdate = async (userId: string, newShifts: Shift[], weekStart: string) => {
        try {
            const body: any = { id: userId }

            if (scheduleMode === 'default') {
                // Update Default Schedule (Persistent)
                body.schedule = newShifts
            } else {
                // Update Weekly Override (Temporary)
                body.tempSchedule = newShifts
                body.weekStart = weekStart
            }

            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (!res.ok) throw new Error("Error actualizando horario")

            await fetchData()
        } catch (err) {
            console.error("Failed to save schedule", err)
        }
    }

    const renderUserTable = (title: string, roleFilter: (role: string) => boolean, icon: React.ReactNode) => {
        const filteredUsers = users.filter(u => roleFilter(u.role))
        if (filteredUsers.length === 0) return null

        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <div className="w-8 h-8 rounded-md bg-card border border-border flex items-center justify-center">
                        {icon}
                    </div>
                    <h3 className="text-[10px] font-bold text-muted-foreground tracking-tight">{title}</h3>
                </div>
                <div className="rounded-md border border-border overflow-hidden bg-card/40 backdrop-blur-md shadow-2xl shadow-background">
                    <Table>
                        <TableHeader className="bg-muted/30 border-b border-border">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="pl-6 h-10 text-[10px] font-semibold tracking-tight text-muted-foreground">Usuario / Operador</TableHead>
                                <TableHead className="h-10 text-[10px] font-semibold tracking-tight text-muted-foreground">Rango / Acceso</TableHead>
                                <TableHead className="h-10 text-[10px] font-semibold tracking-tight text-muted-foreground">ID Corporativo</TableHead>
                                <TableHead className="h-10 text-[10px] font-semibold tracking-tight text-muted-foreground">Conexión</TableHead>
                                <TableHead className="text-right pr-6 h-10 text-[10px] font-semibold tracking-tight text-muted-foreground">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-border">
                            {filteredUsers.map(u => (
                                <TableRow key={u.id} className="border-none hover:bg-muted/20 transition-all duration-200 group">
                                    <TableCell className="pl-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-8 h-8 border border-border rounded-md shadow-sm">
                                                <AvatarImage src={u.image} className="rounded-md" />
                                                <AvatarFallback className="bg-muted text-muted-foreground font-bold text-xs rounded-md">{u.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-foreground tracking-tight">{u.name}</span>
                                                <span className="text-[10px] text-muted-foreground font-medium opacity-60">#{u.id.slice(0, 5)}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {u.role === 'BOSS' ?
                                            <div className="inline-flex items-center px-2 py-0.5 rounded-sm bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-semibold tracking-tight"><Crown className="w-3 h-3 mr-1" /> Coordinador</div> :
                                            u.role === 'ENGINEER' ?
                                                <div className="inline-flex items-center px-2 py-0.5 rounded-sm bg-purple-500/10 text-purple-500 border border-purple-500/20 text-[10px] font-semibold tracking-tight"><Wrench className="w-3 h-3 mr-1" /> Ingeniero</div> :
                                                <div className="inline-flex items-center px-2 py-0.5 rounded-sm bg-muted text-muted-foreground border border-border text-[10px] font-semibold tracking-tight">Operador</div>
                                        }
                                    </TableCell>
                                    <TableCell className="text-foreground text-xs font-mono">{u.email}</TableCell>
                                    <TableCell>
                                        {u.lastLogin ? (
                                            <div className="flex flex-col">
                                                <span className="text-foreground text-xs font-semibold">
                                                    {new Date(u.lastLogin).toLocaleDateString('es-CR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium tracking-tight">
                                                    <MapPin className="w-2.5 h-2.5 text-muted-foreground" />
                                                    {u.lastLoginCountry || 'Desc.'}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs font-medium opacity-30 italic">Desconectado</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                        <Search className="w-4 h-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="bg-card border-border text-foreground max-w-md p-0 overflow-hidden shadow-2xl rounded-md ring-1 ring-border">
                                                    <div className="bg-muted/30 border-b border-border p-8">
                                                        <div className="flex items-center gap-6">
                                                            <Avatar className="w-20 h-20 border border-border rounded-md shadow-sm">
                                                                <AvatarImage src={u.image} className="rounded-md" />
                                                                <AvatarFallback className="bg-card text-muted-foreground text-2xl font-bold rounded-md">{u.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="text-[#FF0C60] font-semibold text-[10px] tracking-tight mb-2">{u.role}</div>
                                                                <h3 className="text-3xl font-bold tracking-tighter text-foreground leading-none">{u.name}</h3>
                                                                <p className="text-muted-foreground text-xs font-semibold mt-2 tracking-tight">{u.email}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="p-8 space-y-6">
                                                        <div className="grid grid-cols-2 gap-8">
                                                            <div className="space-y-2">
                                                                <p className="text-muted-foreground text-[10px] font-semibold tracking-tight opacity-50">Último acceso</p>
                                                                <p className="text-foreground font-semibold text-sm">
                                                                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString('es-CR') : 'Nunca'}
                                                                </p>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <p className="text-muted-foreground text-[10px] font-semibold tracking-tight opacity-50">IP de conexión</p>
                                                                <p className="text-foreground font-mono font-semibold text-sm tracking-tighter">{u.lastLoginIP || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>

                                            <Button variant="ghost" size="icon" onClick={() => handleEditUser(u)} className="h-8 w-8 text-muted-foreground hover:text-blue-500">
                                                <Settings className="w-4 h-4" />
                                            </Button>
                                            {u.role !== 'BOSS' && (
                                                <Button variant="ghost" size="icon" onClick={() => confirmDeleteUser(u.id)} className="h-8 w-8 text-muted-foreground hover:text-rose-500">
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
        <div className="min-h-screen relative overflow-hidden text-foreground selection:bg-[#FF0C60] selection:text-white pb-20">

            {/* Ambient Background Removed */}

            <div className="relative z-10 text-foreground">
                <ConfirmModal isOpen={modal.isOpen} title={modal.title} message={modal.message} onConfirm={modal.action} onCancel={() => setModal({ ...modal, isOpen: false })} type={modal.type} />

                {/* User Editor Modal */}
                <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
                    <DialogContent className="max-w-2xl bg-[#030303] border-border/50 text-foreground p-0 overflow-hidden shadow-[0_0_50px_-12px_rgba(255,12,96,0.15)] ring-1 ring-white/5 rounded-xl">
                        <div className="relative">
                            {/* Decorative header gradient */}
                            <div className="absolute inset-0 h-32 bg-gradient-to-br from-[#FF0C60]/10 via-transparent to-transparent pointer-events-none" />

                            <div className="relative bg-muted/5 border-b border-white/5 p-8 flex items-center gap-6">
                                <div className="w-14 h-14 bg-gradient-to-br from-[#FF0C60] to-[#FF0C60]/80 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,12,96,0.3)] ring-1 ring-white/20">
                                    {isEditing ? <Settings className="w-7 h-7 text-white" /> : <UserPlus className="w-7 h-7 text-white" />}
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-semibold tracking-tight text-white mb-1">
                                        {isEditing ? 'Editar Perfil y Horario' : 'Registrar Nuevo Operador'}
                                    </DialogTitle>
                                    <DialogDescription className="text-[10px] font-semibold text-[#FF0C60] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <div className="w-1 h-1 bg-[#FF0C60] rounded-full animate-pulse" />
                                        Gestión de credenciales y turnos fijos
                                    </DialogDescription>
                                </div>
                            </div>

                            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-8">
                                <form id="user-form" onSubmit={confirmSaveUser} className="space-y-10">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-500 font-bold tracking-tight flex items-center gap-3"
                                        >
                                            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                                            {error}
                                        </motion.div>
                                    )}

                                    {/* Personal Data Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-1.5 h-4 bg-[#FF0C60] rounded-full" />
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Datos Personales</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2.5">
                                                <Label className="text-[10px] font-semibold text-muted-foreground tracking-tight opacity-70 ml-1">NOMBRE COMPLETO</Label>
                                                <div className="relative group">
                                                    <Input
                                                        value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                                        className="bg-white/5 border-white/10 text-white focus:border-[#FF0C60]/50 placeholder:text-white/20 h-12 text-sm font-medium uppercase rounded-lg transition-all ring-offset-black focus-visible:ring-1 focus-visible:ring-[#FF0C60]/30"
                                                        required placeholder="EJ. JUAN PÉREZ"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2.5">
                                                <Label className="text-[10px] font-semibold text-muted-foreground tracking-tight opacity-70 ml-1">CORREO CORPORATIVO</Label>
                                                <Input
                                                    type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                                    className="bg-white/5 border-white/10 text-white focus:border-[#FF0C60]/50 placeholder:text-white/20 h-12 text-sm font-medium rounded-lg transition-all ring-offset-black focus-visible:ring-1 focus-visible:ring-[#FF0C60]/30"
                                                    required placeholder="usuario@enlace.org"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Security & Role Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-1.5 h-4 bg-[#FF0C60] rounded-full" />
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Seguridad y Rango</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2.5">
                                                <Label className="text-[10px] font-semibold text-muted-foreground tracking-tight opacity-70 ml-1">CARGO DESIGNADO</Label>
                                                <Select value={newUser.role} onValueChange={(val) => setNewUser({ ...newUser, role: val })}>
                                                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 text-sm font-medium rounded-lg uppercase ring-offset-black focus:ring-1 focus:ring-[#FF0C60]/30">
                                                        <SelectValue placeholder="Seleccionar rol" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                                                        <SelectItem value="OPERATOR" className="focus:bg-[#FF0C60] focus:text-white">Operador</SelectItem>
                                                        <SelectItem value="ENGINEER" className="focus:bg-[#FF0C60] focus:text-white">Ingeniero</SelectItem>
                                                        <SelectItem value="BOSS" className="focus:bg-[#FF0C60] focus:text-white">Coordinador</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2.5">
                                                <Label className="text-[10px] font-semibold text-muted-foreground tracking-tight opacity-70 ml-1">CONTRASEÑA DE ACCESO</Label>
                                                <Input
                                                    value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                                    className="bg-white/5 border-white/10 text-white focus:border-[#FF0C60]/50 placeholder:text-white/20 h-12 text-sm font-medium rounded-lg transition-all ring-offset-black focus-visible:ring-1 focus-visible:ring-[#FF0C60]/30 font-mono"
                                                    required={!isEditing}
                                                    type="password"
                                                    placeholder={isEditing ? "SIN CAMBIOS" : "••••••••"}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Birthday Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-1.5 h-4 bg-[#FF0C60] rounded-full" />
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Celebraciones</h4>
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label className="text-[10px] font-semibold text-muted-foreground tracking-tight opacity-70 ml-1">FECHA DE CUMPLEAÑOS</Label>
                                            <div className="flex gap-4">
                                                <Select
                                                    value={newUser.birthday ? newUser.birthday.split('-')[0] : undefined}
                                                    onValueChange={(m) => {
                                                        const parts = newUser.birthday.split('-');
                                                        const d = parts[1] || '01';
                                                        setNewUser({ ...newUser, birthday: `${m}-${d}` });
                                                    }}
                                                >
                                                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 text-sm font-medium rounded-lg flex-1 ring-offset-black focus:ring-1 focus:ring-[#FF0C60]/30">
                                                        <SelectValue placeholder="MES" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#0A0A0A] border-white/10 text-white max-h-60">
                                                        {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((m) => (
                                                            <SelectItem key={m} value={m} className="focus:bg-[#FF0C60]">
                                                                {new Date(2000, parseInt(m) - 1, 1).toLocaleString('es-CR', { month: 'long' }).toUpperCase()}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <Select
                                                    value={newUser.birthday ? newUser.birthday.split('-')[1] : undefined}
                                                    onValueChange={(d) => {
                                                        const parts = newUser.birthday.split('-');
                                                        const m = parts[0] || '01';
                                                        setNewUser({ ...newUser, birthday: `${m}-${d}` });
                                                    }}
                                                >
                                                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 text-sm font-medium rounded-lg w-32 ring-offset-black focus:ring-1 focus:ring-[#FF0C60]/30">
                                                        <SelectValue placeholder="DÍA" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#0A0A0A] border-white/10 text-white max-h-60">
                                                        {Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0')).map((d) => (
                                                            <SelectItem key={d} value={d} className="focus:bg-[#FF0C60]">{d}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Schedule Section */}
                                    <div className="pt-8 border-t border-white/5">
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="w-1.5 h-4 bg-[#FF0C60] rounded-full" />
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Planificación de Turnos</h4>
                                        </div>
                                        <ScheduleEditor
                                            value={newUser.schedule}
                                            onChange={(s) => setNewUser({ ...newUser, schedule: s })}
                                        />
                                    </div>
                                </form>
                            </div>

                            <div className="p-8 border-t border-white/5 bg-white/[0.02] flex justify-end gap-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={cancelEdit}
                                    className="h-12 px-6 text-xs font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-all"
                                >
                                    CANCELAR
                                </Button>
                                <button
                                    form="user-form"
                                    type="submit"
                                    className="px-8 h-12 bg-[#FF0C60] hover:bg-[#FF0C60]/90 text-white font-semibold text-[11px] uppercase tracking-[0.15em] rounded-lg transition-all shadow-[0_8px_20px_-6px_rgba(255,12,96,0.4)] active:scale-95"
                                >
                                    {isEditing ? 'GUARDAR CAMBIOS' : 'CONFIRMAR REGISTRO'}
                                </button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog >

                <div className="max-w-[1600px] mx-auto p-6 md:p-10 pt-24 md:pt-32 space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight flex items-center gap-2">
                                <Settings className="w-8 h-8 text-[#FF0C60]" /> Configuración
                            </h1>
                            <p className="text-muted-foreground mt-1 text-lg font-medium">Administración de usuarios y limpieza de base de datos.</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button onClick={() => { cancelEdit(); setIsUserModalOpen(true); }} className="bg-[#FF0C60] hover:bg-[#FF0C60]/90 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#FF0C60]/20">
                                <UserPlus className="w-4 h-4 mr-2" /> Nuevo Operador
                            </Button>

                            <div className="flex bg-muted/20 p-1 rounded-md border border-border">
                                <button onClick={() => setActiveTab('users')} className={`px-5 py-2 rounded-md text-xs font-semibold tracking-tight transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-[#FF0C60]/10 text-[#FF0C60]' : 'text-muted-foreground hover:text-foreground'}`}>
                                    <Shield className="w-4 h-4" /> Usuarios
                                </button>
                                <button onClick={() => setActiveTab('schedule')} className={`px-5 py-2 rounded-md text-xs font-semibold tracking-tight transition-all flex items-center gap-2 ${activeTab === 'schedule' ? 'bg-[#FF0C60]/10 text-[#FF0C60]' : 'text-muted-foreground hover:text-foreground'}`}>
                                    <CalendarIcon className="w-4 h-4" /> Horarios
                                </button>
                                <button onClick={() => setActiveTab('events')} className={`px-5 py-2 rounded-md text-xs font-semibold tracking-tight transition-all flex items-center gap-2 ${activeTab === 'events' ? 'bg-[#FF0C60]/10 text-[#FF0C60]' : 'text-muted-foreground hover:text-foreground'}`}>
                                    <CalendarDays className="w-4 h-4" /> Eventos
                                </button>
                                <button onClick={() => setActiveTab('reports')} className={`px-5 py-2 rounded-md text-xs font-semibold tracking-tight transition-all flex items-center gap-2 ${activeTab === 'reports' ? 'bg-[#FF0C60]/10 text-[#FF0C60]' : 'text-muted-foreground hover:text-foreground'}`}>
                                    <Archive className="w-4 h-4" /> Reportes
                                </button>
                            </div>
                        </div>
                    </div>
                    <AnimatePresence mode="wait">
                        {activeTab === 'users' ? (
                            <motion.div
                                key="users"
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="space-y-6"
                            >
                                <div className="space-y-8">
                                    <div className="flex flex-col gap-6">
                                        <LoginMap users={users} />
                                        <ActiveUsersWidget users={users} />
                                    </div>

                                    {/* Simplified User Summary / Quick Stats */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Equipo Total', value: users.length, icon: Shield, color: 'text-blue-500' },
                                            { label: 'Coordinadores', value: users.filter(u => u.role === 'BOSS').length, icon: Crown, color: 'text-amber-500' },
                                            { label: 'Ingenieros', value: users.filter(u => u.role === 'ENGINEER').length, icon: Wrench, color: 'text-purple-500' },
                                            { label: 'Operadores', value: users.filter(u => !['BOSS', 'ENGINEER'].includes(u.role || '')).length, icon: Shield, color: 'text-emerald-500' }
                                        ].map((stat, i) => (
                                            <Card key={i} className="bg-card/40 backdrop-blur-md border-border shadow-none rounded-md ring-1 ring-border p-5 flex items-center justify-between group hover:border-[#FF0C60]/30 transition-all duration-300">
                                                <div>
                                                    <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase opacity-60">{stat.label}</p>
                                                    <p className="text-3xl font-bold text-foreground mt-1 tracking-tighter">{stat.value}</p>
                                                </div>
                                                <div className={`w-12 h-12 bg-muted/30 border border-border rounded-md flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                                                    <stat.icon className="w-6 h-6" />
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>

                                {/* Full Width User List Section */}
                                <Card className="bg-card/20 backdrop-blur-md border border-border shadow-none rounded-md ring-1 ring-border overflow-hidden">
                                    <CardHeader className="bg-muted/30 border-b border-border py-4 px-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-muted/30 text-muted-foreground rounded-md flex items-center justify-center border border-border shadow-inner">
                                                <Search className="w-5 h-5 opacity-50" />
                                            </div>
                                            <h3 className="text-[11px] font-semibold tracking-tight text-muted-foreground">Explorador de Personal</h3>
                                        </div>
                                    </CardHeader>
                                    <div className="p-8">
                                        <div className="space-y-16">
                                            {renderUserTable("Coordinadores", (role) => role === 'BOSS', <Crown className="w-5 h-5 text-amber-500" />)}
                                            {renderUserTable("Ingenieros", (role) => role === 'ENGINEER', <Wrench className="w-5 h-5 text-purple-500" />)}
                                            {renderUserTable("Operadores", (role) => !['BOSS', 'ENGINEER'].includes(role || ''), <Shield className="w-5 h-5 text-blue-500" />)}
                                        </div>
                                    </div>
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
                                <Card className="bg-card/40 backdrop-blur-md border border-border shadow-none rounded-md overflow-hidden h-fit ring-1 ring-border flex flex-col">
                                    <div className="p-4 border-b border-border bg-muted/10 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                                            <h3 className="text-sm font-semibold text-foreground">Gestión de Horarios</h3>
                                        </div>
                                        <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border">
                                            <button
                                                onClick={() => setScheduleMode('weekly')}
                                                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${scheduleMode === 'weekly' ? 'bg-[#FF0C60] text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                Esta Semana (Temp)
                                            </button>
                                            <button
                                                onClick={() => setScheduleMode('default')}
                                                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${scheduleMode === 'default' ? 'bg-[#FF0C60] text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                Fijo (Predeterminado)
                                            </button>
                                        </div>
                                    </div>
                                    <div className="relative">

                                        {scheduleMode === 'default' && (
                                            <div className="absolute top-0 left-0 w-full h-1 bg-[#FF0C60] z-20 animate-pulse" />
                                        )}

                                        <WeeklyCalendar
                                            operators={users.map(u => ({
                                                id: u.id,
                                                name: u.name,
                                                image: u.image,
                                                // IN DEFAULT MODE: Pass defaultShifts. 
                                                // IN WEEKLY MODE: Pass effective shifts (but user might want to edit FROM the base? 
                                                // No, WeeklyCalendar edits what it sees.
                                                // If I pass defaultShifts, the calendar shows default. Updating it updates default.
                                                // If I pass shifts, the calendar shows effective. Updating it updates temp.
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                shifts: (scheduleMode === 'default' ? u.defaultShifts : (u as any).shifts) || [],
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                isTempSchedule: scheduleMode === 'weekly' ? (u as any).isTempSchedule : false
                                            }))}
                                            currentWeekStart={currentWeekStart}
                                            onWeekChange={setCurrentWeekStart}
                                            onUpdateSchedule={handleScheduleUpdate}
                                            onEditUser={handleEditUser}
                                        />
                                    </div>
                                </Card>
                            </motion.div>
                        ) : activeTab === 'events' ? (
                            <motion.div
                                key="events"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <SpecialEventsManager />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="reports"
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                <Card className="bg-card/40 backdrop-blur-md border border-border shadow-none rounded-md ring-1 ring-border">
                                    <CardHeader className="bg-muted/10 p-8 border-b border-border">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                            <div className="space-y-2">
                                                <CardTitle className="text-3xl font-bold text-foreground tracking-tighter leading-none">Gestión de reportes</CardTitle>
                                                <CardDescription className="text-muted-foreground font-semibold text-[10px] tracking-tight mt-2 opacity-60">Filtro y depuración de la base de datos de incidencias.</CardDescription>
                                            </div>
                                            <div className="relative w-full md:w-[300px]">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF0C60]" />
                                                <Input placeholder="Buscar por ID o descripción..." className="pl-12 bg-muted/20 border-2 border-border w-full text-[10px] font-medium tracking-tight h-12 text-foreground focus:border-[#FF0C60] transition-colors rounded-md" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader className="bg-muted/30 border-b border-border">
                                                <TableRow className="border-none hover:bg-transparent">
                                                    <TableHead className="pl-8 h-12 text-[10px] font-semibold tracking-tight text-muted-foreground">ID Interno</TableHead>
                                                    <TableHead className="h-12 text-[10px] font-semibold tracking-tight text-muted-foreground">Marca de Tiempo</TableHead>
                                                    <TableHead className="h-12 text-[10px] font-semibold tracking-tight text-muted-foreground">Operador</TableHead>
                                                    <TableHead className="h-12 text-[10px] font-semibold tracking-tight text-muted-foreground w-[40%]">Descripción del Suceso</TableHead>
                                                    <TableHead className="text-right pr-8 h-12 text-[10px] font-semibold tracking-tight text-muted-foreground">Acciones</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="divide-y divide-border">
                                                {reports.map((report) => (
                                                    <TableRow key={report.id} className="border-none hover:bg-muted/20 transition-all duration-200 group">
                                                        <TableCell className="pl-8 font-mono text-[10px] text-[#FF0C60] font-semibold tracking-tighter">#{report.id.slice(0, 8)}</TableCell>
                                                        <TableCell className="text-foreground text-xs font-semibold tracking-tight">{new Date(report.createdAt).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                                                        <TableCell className="text-foreground text-xs font-semibold tracking-tight">{report.operatorName}</TableCell>
                                                        <TableCell className="text-muted-foreground text-xs font-medium max-w-md truncate">{report.problemDescription}</TableCell>
                                                        <TableCell className="text-right pr-8">
                                                            <Button variant="ghost" size="icon" onClick={() => confirmDeleteReport(report.id)} className="h-9 w-9 text-rose-500 hover:text-white hover:bg-rose-500 transition-all rounded-md">
                                                                <Trash2 className="w-4 h-4 stroke-[3]" />
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
        </div>
    )
}

