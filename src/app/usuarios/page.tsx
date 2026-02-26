"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, User, Mail, Shield, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetch('/api/users').
    then((res) => res.json()).
    then((data) => {
      setUsers(data);
      setLoading(false);
    }).
    catch(() => setLoading(false));


    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);





  const filteredUsers = users.filter((user) =>
  user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    _jsxs("div", { className: "min-h-screen relative overflow-hidden bg-[#050505] text-slate-100 selection:bg-[#FF0C60] selection:text-white pb-20", children: [


      _jsxs("div", { className: "fixed inset-0 pointer-events-none", children: [
        _jsx("div", { className: "absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse", style: { animationDuration: '4000ms' } }),
        _jsx("div", { className: "absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#FF0C60]/10 rounded-full blur-[120px] mix-blend-screen animate-pulse", style: { animationDuration: '7000ms' } })] }
      ),

      _jsxs("div", { className: "max-w-7xl mx-auto p-4 md:p-8 pt-24 md:pt-32 space-y-8 relative z-10", children: [


        _jsx(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4", children:
          _jsxs("div", { children: [
            _jsxs("h1", { className: "text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3", children: ["Usuarios",

              _jsx(Badge, { className: "bg-[#FF0C60]/10 text-[#FF0C60] hover:bg-[#FF0C60]/20 border-0", children: users.length })] }
            ),
            _jsxs("p", { className: "text-slate-500 dark:text-slate-400", children: ["Administraci\xF3n de personal. ",
              _jsxs("span", { className: "opacity-50", children: ["Hora actual: ", currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })] })] }
            )] }
          ) }


        ),


        _jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.1 }, children:
          _jsx(Card, { className: "bg-white/80 dark:bg-[#0F0F11]/80 backdrop-blur-md border-slate-200 dark:border-white/5 shadow-xl", children:
            _jsx(CardContent, { className: "pt-6", children:
              _jsxs("div", { className: "relative max-w-lg", children: [
                _jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" }),
                _jsx(Input, {
                  placeholder: "Buscar por nombre o correo...",
                  value: searchTerm,
                  onChange: (e) => setSearchTerm(e.target.value),
                  className: "pl-9 bg-white dark:bg-[#18181B] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-[#FF0C60]/50" }
                )] }
              ) }
            ) }
          ) }
        ),


        _jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.1 }, children:
          _jsx(Card, { className: "bg-[#121214]/60 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden rounded-3xl", children:
            _jsx(CardContent, { className: "p-0", children:
              _jsxs(Table, { children: [
                _jsx(TableHeader, { className: "bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5", children:
                  _jsxs(TableRow, { className: "border-none hover:bg-transparent", children: [
                    _jsx(TableHead, { className: "text-slate-500 dark:text-slate-400 h-12 pl-6", children: "Usuario" }),
                    _jsx(TableHead, { className: "text-slate-500 dark:text-slate-400 h-12", children: "Rol" }),
                    _jsx(TableHead, { className: "text-slate-500 dark:text-slate-400 h-12", children: "Horario" }),
                    _jsx(TableHead, { className: "text-slate-500 dark:text-slate-400 h-12", children: "Estado Actual" }),
                    _jsx(TableHead, { className: "text-slate-500 dark:text-slate-400 h-12 text-right pr-6", children: "Acciones" })] }
                  ) }
                ),
                _jsx(TableBody, { children:
                  loading ?
                  _jsx(TableRow, { children:
                    _jsx(TableCell, { colSpan: 5, className: "h-24 text-center text-muted-foreground", children: "Cargando usuarios..." }) }
                  ) :
                  filteredUsers.length === 0 ?
                  _jsx(TableRow, { children:
                    _jsx(TableCell, { colSpan: 5, className: "h-32 text-center text-muted-foreground", children: "No se encontraron usuarios." }

                    ) }
                  ) :

                  filteredUsers.map((user) =>
                  _jsxs(TableRow, { className: "border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group", children: [
                    _jsx(TableCell, { className: "pl-6 py-3", children:
                      _jsxs("div", { className: "flex items-center gap-3", children: [
                        _jsxs(Avatar, { className: "w-9 h-9 border border-slate-200 dark:border-white/10", children: [
                          _jsx(AvatarImage, { src: user.image }),
                          _jsx(AvatarFallback, { className: "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-medium", children:
                            user.name.charAt(0) }
                          )] }
                        ),
                        _jsxs("div", { className: "flex flex-col", children: [
                          _jsx("span", { className: "text-sm font-medium text-slate-900 dark:text-slate-200", children: user.name }),
                          _jsxs("span", { className: "text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1", children: [
                            _jsx(Mail, { className: "w-3 h-3" }), " ", user.email] }
                          )] }
                        )] }
                      ) }
                    ),
                    _jsx(TableCell, { children:
                      _jsxs(Badge, { variant: "outline", className: `font-normal ${user.role === 'BOSS' ? 'bg-[#FF0C60]/10 text-[#FF0C60] border-[#FF0C60]/20' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'}`, children: [
                        user.role === 'BOSS' ? _jsx(Shield, { className: "w-3 h-3 mr-1" }) : _jsx(User, { className: "w-3 h-3 mr-1" }),
                        user.role === 'BOSS' ? 'Coordinador' : 'Operador'] }
                      ) }
                    ),
                    _jsx(TableCell, { children:
                      _jsx("span", { className: "text-xs text-slate-500 dark:text-slate-400 font-medium", children:
                        user.scheduleLabel || 'Sin Asignar' }
                      ) }
                    ),
                    _jsx(TableCell, { children:
                      user.isAvailable ?
                      _jsxs("div", { className: "flex items-center gap-2 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md w-fit", children: [
                        _jsx("div", { className: "h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" }),
                        _jsx("span", { className: "text-xs font-medium text-emerald-500", children: "Disponible" })] }
                      ) :

                      _jsxs("div", { className: "flex items-center gap-2 px-2 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md w-fit opacity-60", children: [
                        _jsx("div", { className: "h-2 w-2 rounded-full bg-slate-400" }),
                        _jsx("span", { className: "text-xs font-medium text-slate-500 dark:text-slate-400", children: "Fuera de turno" })] }
                      ) }

                    ),
                    _jsx(TableCell, { className: "text-right pr-6", children:
                      _jsxs(DropdownMenu, { children: [
                        _jsx(DropdownMenuTrigger, { asChild: true, children:
                          _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity", children:
                            _jsx(MoreHorizontal, { className: "w-4 h-4" }) }
                          ) }
                        ),
                        _jsx(DropdownMenuContent, { align: "end", className: "bg-white dark:bg-[#18181B] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 shadow-xl", children:

                          _jsx(DropdownMenuItem, { disabled: true, className: "text-slate-400 text-xs", children: "Sin acciones disponibles" }

                          ) }
                        )] }
                      ) }
                    )] }, user.id
                  )
                  ) }

                )] }
              ) }
            ) }
          ) }
        )] }
      )] }
    ));

}