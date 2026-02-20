'use client'

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Eye, EyeOff, Copy, CheckCircle, Shield, Trash2, Plus, Server, Globe, Lock, MoreHorizontal, Monitor, Laptop } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    Table,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

// --- Types ---
interface Credential {
    id: string
    service: string
    category: string
    username: string
    password: string
    notes?: string
    updatedAt?: string
}

// --- Icons Map ---
const CategoryIcons: Record<string, any> = {
    'Producción': Monitor,
    'Streaming': Globe,
    'Infraestructura': Server,
    'General': Lock,
    'PC': Laptop,
    'Mac': Laptop,
    'Windows': Monitor,
    'Web': Globe
}

// --- Animation Variants ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
}

export default function CredentialsPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [credentials, setCredentials] = useState<Credential[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [loadingData, setLoadingData] = useState(true)
    const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newCredential, setNewCredential] = useState({ service: '', category: '', username: '', password: '', notes: '' })

    // --- Auth Check ---
    useEffect(() => {
        if (!isLoading && !user) router.replace('/login')
    }, [user, isLoading, router])

    // --- Data Fetching ---
    const fetchCredentials = async () => {
        try {
            // Artificial delay for smooth skeleton demo (optional, remove in prod if needed fast)
            // await new Promise(r => setTimeout(r, 800)) 
            const res = await fetch('/api/credentials')
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setCredentials(data)
        } catch (error) {
            toast.error("Error cargando claves")
        } finally {
            setLoadingData(false)
        }
    }

    useEffect(() => {
        if (user) fetchCredentials()
    }, [user])

    // --- Actions ---
    const handleCreate = async () => {
        if (!newCredential.service || !newCredential.username || !newCredential.password) {
            toast.error("Faltan campos requeridos")
            return
        }

        try {
            const res = await fetch('/api/credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCredential)
            })

            if (!res.ok) throw new Error('Failed to create')

            toast.success("Credencial guardada")
            setIsCreateOpen(false)
            setNewCredential({ service: '', category: '', username: '', password: '', notes: '' })
            fetchCredentials()
        } catch (error) {
            toast.error("Error al crear")
        }
    }

    const handleDelete = async (id: string) => {
        // Optimistic UI update could be added here
        try {
            const res = await fetch(`/api/credentials?id=${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete')
            toast.success("Credencial eliminada")
            fetchCredentials()
        } catch (error) {
            toast.error("Error al eliminar")
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.message("Copiado al portapapeles", {
            icon: <CheckCircle className="w-4 h-4 text-emerald-500" />
        })
    }

    // --- Filtering ---
    const filteredCredentials = credentials.filter(c =>
        c.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (isLoading || !user) return null

    return (
        <div className="min-h-screen bg-background w-full">
            {/* --- Fixed Header Region --- */}
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40 pb-4 pt-24 md:pt-32 px-6 md:px-12">
                <div className="w-full max-w-[95%] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Shield className="w-8 h-8 text-[#FF0C60]" />
                            Bóveda de Claves
                        </h1>
                        <p className="text-muted-foreground mt-1 font-medium">
                            {credentials.length} credenciales seguras
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="flex items-center gap-3 w-full md:w-auto"
                    >
                        <div className="relative w-full md:w-80 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[#FF0C60] transition-colors" />
                            <Input
                                className="pl-10 bg-muted/30 border-border/50 focus:border-[#FF0C60]/50 focus:ring-1 focus:ring-[#FF0C60]/20 transition-all"
                                placeholder="Buscar..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-[#FF0C60] hover:bg-[#D40050] text-white shadow-lg shadow-[#FF0C60]/20 font-bold tracking-wide"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            NUEVA
                        </Button>
                    </motion.div>
                </div>
            </div>

            {/* --- Main Content (Table) --- */}
            <main className="w-full max-w-[95%] mx-auto px-0 py-8 pb-32">
                <div className="rounded-xl border border-border/40 bg-card/30 overflow-hidden backdrop-blur-sm shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-border/40">
                                <TableHead className="w-[300px] text-xs font-bold uppercase tracking-wider text-muted-foreground pl-6">Servicio</TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Usuario</TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contraseña</TableHead>
                                <TableHead className="hidden md:table-cell text-xs font-bold uppercase tracking-wider text-muted-foreground">Notas</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>

                        {/* We use motion.tbody for the stagger effect on rows */}
                        <motion.tbody
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="[&_tr:last-child]:border-0"
                        >
                            {loadingData ? (
                                // --- Skeleton Loading State ---
                                Array.from({ length: 5 }).map((_, i) => (
                                    <motion.tr key={i} variants={itemVariants} className="border-b border-border/40">
                                        <TableCell className="pl-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="w-10 h-10 rounded-lg" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-16" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                                    </motion.tr>
                                ))
                            ) : filteredCredentials.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        No se encontraron resultados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {filteredCredentials.map((cred) => (
                                        <CredentialRow
                                            key={cred.id}
                                            cred={cred}
                                            showPassword={showPassword[cred.id]}
                                            togglePassword={() => setShowPassword(p => ({ ...p, [cred.id]: !p[cred.id] }))}
                                            copyToClipboard={copyToClipboard}
                                            onDelete={() => handleDelete(cred.id)}
                                        />
                                    ))}
                                </AnimatePresence>
                            )}
                        </motion.tbody>
                    </Table>
                </div>
            </main>

            {/* --- Create Modal --- */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-[#FF0C60]" />
                            Nueva Credencial
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Servicio</label>
                                <Input
                                    placeholder="Ej. Adobe Creative Cloud"
                                    value={newCredential.service}
                                    onChange={e => setNewCredential({ ...newCredential, service: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Categoría</label>
                                    <Input
                                        placeholder="Ej. Diseño"
                                        value={newCredential.category}
                                        onChange={e => setNewCredential({ ...newCredential, category: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Usuario</label>
                                    <Input
                                        placeholder="user@example.com"
                                        value={newCredential.username}
                                        onChange={e => setNewCredential({ ...newCredential, username: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Contraseña</label>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        className="font-mono"
                                        placeholder="••••••••••••"
                                        value={newCredential.password}
                                        onChange={e => setNewCredential({ ...newCredential, password: e.target.value })}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Lock className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Notas (Opcional)</label>
                                <Input
                                    placeholder="Detalles adicionales..."
                                    value={newCredential.notes}
                                    onChange={e => setNewCredential({ ...newCredential, notes: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                            <Button onClick={handleCreate} className="bg-[#FF0C60] hover:bg-[#D40050] text-white font-bold">
                                Guardar Credencial
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function CredentialRow({ cred, showPassword, togglePassword, copyToClipboard, onDelete }: any) {
    const Icon = CategoryIcons[cred.category]
    const firstLetter = cred.service.charAt(0).toUpperCase()

    // Using motion.tr for the row
    return (
        <motion.tr
            variants={itemVariants}
            layout
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, x: -20 }}
            className="group border-b border-border/40 hover:bg-muted/20 transition-colors data-[state=selected]:bg-muted"
        >
            {/* Service Column */}
            <TableCell className="pl-6 py-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted/40 flex items-center justify-center border border-border/50 group-hover:border-[#FF0C60]/30 transition-colors">
                        {Icon ? (
                            <Icon className="w-5 h-5 text-foreground/80 group-hover:text-[#FF0C60]" />
                        ) : (
                            <span className="text-lg font-bold text-[#FF0C60]">{firstLetter}</span>
                        )}
                    </div>
                    <div>
                        <div className="font-bold text-sm text-foreground">{cred.service}</div>
                        <Badge variant="outline" className="mt-1 text-[10px] font-bold text-muted-foreground border-border/50 bg-transparent">
                            {cred.category}
                        </Badge>
                    </div>
                </div>
            </TableCell>

            {/* Username Column */}
            <TableCell>
                <div
                    className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors group/user"
                    onClick={() => copyToClipboard(cred.username)}
                >
                    <code className="bg-muted/30 px-2 py-1 rounded text-xs font-mono text-muted-foreground group-hover/user:text-[#FF0C60] transition-colors">
                        {cred.username}
                    </code>
                    <Copy className="w-3 h-3 opacity-0 group-hover/user:opacity-100 transition-opacity text-muted-foreground" />
                </div>
            </TableCell>

            {/* Password Column */}
            <TableCell>
                <div className="flex items-center gap-2">
                    <code className={`font-mono text-xs transition-all ${showPassword ? 'text-[#FF0C60] bg-[#FF0C60]/10' : 'text-muted-foreground tracking-widest'}`}>
                        {showPassword ? cred.password : "••••••••••••"}
                    </code>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={togglePassword}>
                            {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(cred.password)}>
                            <Copy className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
            </TableCell>

            {/* Notes Column */}
            <TableCell className="hidden md:table-cell max-w-[200px]">
                <p className="text-xs text-muted-foreground truncate" title={cred.notes}>
                    {cred.notes || "-"}
                </p>
            </TableCell>

            {/* Actions Column */}
            <TableCell>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card backdrop-blur-xl border-border/50">
                        <DropdownMenuItem onClick={onDelete} className="text-rose-500 focus:text-rose-500 cursor-pointer">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </motion.tr>
    )
}
