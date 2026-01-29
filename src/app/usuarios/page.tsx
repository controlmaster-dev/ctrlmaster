"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, User, Mail, Shield, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { motion } from "framer-motion"

interface User {
  id: string
  name: string
  email: string
  role: string
  image?: string
  reportCount?: number
  isAvailable?: boolean
  scheduleLabel?: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Update local clock for reference
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Re-check frontend logic not needed as API provides snapshot, 
  // but ideally we'd re-fetch or calc locally. 
  // For simplicity, we trust the API snapshot or user refresh.

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050505] text-slate-100 selection:bg-[#FF0C60] selection:text-white pb-20">

      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4000ms' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#FF0C60]/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '7000ms' }} />
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 pt-24 md:pt-32 space-y-8 relative z-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              Usuarios
              <Badge className="bg-[#FF0C60]/10 text-[#FF0C60] hover:bg-[#FF0C60]/20 border-0">{users.length}</Badge>
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Administración de personal. <span className="opacity-50">Hora actual: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </p>
          </div>

          {/* Actions? Add User button could go here later */}
        </motion.div>

        {/* Filter Bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-white/80 dark:bg-[#0F0F11]/80 backdrop-blur-md border-slate-200 dark:border-white/5 shadow-xl">
            <CardContent className="pt-6">
              <div className="relative max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre o correo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white dark:bg-[#18181B] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-[#FF0C60]/50"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Users Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-[#121214]/60 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden rounded-3xl">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="text-slate-500 dark:text-slate-400 h-12 pl-6">Usuario</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 h-12">Rol</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 h-12">Horario</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 h-12">Estado Actual</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 h-12 text-right pr-6">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Cargando usuarios...</TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        No se encontraron usuarios.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                        <TableCell className="pl-6 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9 border border-slate-200 dark:border-white/10">
                              <AvatarImage src={user.image} />
                              <AvatarFallback className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-medium">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-200">{user.name}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {user.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`font-normal ${user.role === 'BOSS' ? 'bg-[#FF0C60]/10 text-[#FF0C60] border-[#FF0C60]/20' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'}`}>
                            {user.role === 'BOSS' ? <Shield className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                            {user.role === 'BOSS' ? 'Coordinador' : 'Operador'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {user.scheduleLabel || 'Sin Asignar'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {user.isAvailable ? (
                            <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md w-fit">
                              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                              <span className="text-xs font-medium text-emerald-500">Disponible</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-2 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md w-fit opacity-60">
                              <div className="h-2 w-2 rounded-full bg-slate-400" />
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Fuera de turno</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white dark:bg-[#18181B] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 shadow-xl">
                              {/* Actions placeholder if needed later */}
                              <DropdownMenuItem disabled className="text-slate-400 text-xs">
                                Sin acciones disponibles
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
