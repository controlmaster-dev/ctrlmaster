'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Eye, EyeOff, Copy, CheckCircle, Shield, Trash2, Plus, Server, Globe, Lock, MoreHorizontal, Monitor, Laptop } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from
  "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from
  "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from
  "@/components/ui/dialog"; import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

const CategoryIcons = {
  'Producción': Monitor,
  'Streaming': Globe,
  'Infraestructura': Server,
  'General': Lock,
  'PC': Laptop,
  'Mac': Laptop,
  'Windows': Monitor,
  'Web': Globe
};


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export default function CredentialsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [credentials, setCredentials] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [showPassword, setShowPassword] = useState({});


  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCredential, setNewCredential] = useState({ service: '', category: '', username: '', password: '', notes: '' });


  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);


  const fetchCredentials = async () => {
    try {


      const res = await fetch('/api/credentials');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setCredentials(data);
    } catch (error) {
      toast.error("Error cargando claves");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) fetchCredentials();
  }, [user]);


  const handleCreate = async () => {
    if (!newCredential.service || !newCredential.username || !newCredential.password) {
      toast.error("Faltan campos requeridos");
      return;
    }

    try {
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCredential)
      });

      if (!res.ok) throw new Error('Failed to create');

      toast.success("Credencial guardada");
      setIsCreateOpen(false);
      setNewCredential({ service: '', category: '', username: '', password: '', notes: '' });
      fetchCredentials();
    } catch (error) {
      toast.error("Error al crear");
    }
  };

  const handleDelete = async (id) => {

    try {
      const res = await fetch(`/api/credentials?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success("Credencial eliminada");
      fetchCredentials();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.message("Copiado al portapapeles", {
      icon: _jsx(CheckCircle, { className: "w-4 h-4 text-emerald-500" })
    });
  };


  const filteredCredentials = credentials.filter((c) =>
    c.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading || !user) return null;

  return (
    _jsxs("div", {
      className: "min-h-screen bg-background w-full", children: [

        _jsx("div", {
          className: "sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40 pb-4 pt-24 md:pt-32 px-6 md:px-12", children:
            _jsxs("div", {
              className: "w-full max-w-[95%] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6", children: [
                _jsxs(motion.div, {
                  initial: { opacity: 0, x: -20 },
                  animate: { opacity: 1, x: 0 },
                  transition: { duration: 0.5 }, children: [

                    _jsxs("h1", {
                      className: "text-3xl font-bold tracking-tight flex items-center gap-3", children: [
                        _jsx(Shield, { className: "w-8 h-8 text-[#FF0C60]" }), "B\xF3veda de Claves"]
                    }

                    ),
                    _jsxs("p", {
                      className: "text-muted-foreground mt-1 font-medium", children: [
                        credentials.length, " credenciales seguras"]
                    }
                    )]
                }
                ),

                _jsxs(motion.div, {
                  initial: { opacity: 0, x: 20 },
                  animate: { opacity: 1, x: 0 },
                  transition: { duration: 0.5, delay: 0.1 },
                  className: "flex items-center gap-3 w-full md:w-auto", children: [

                    _jsxs("div", {
                      className: "relative w-full md:w-80 group", children: [
                        _jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[#FF0C60] transition-colors" }),
                        _jsx(Input, {
                          className: "pl-10 bg-muted/30 border-border/50 focus:border-[#FF0C60]/50 focus:ring-1 focus:ring-[#FF0C60]/20 transition-all",
                          placeholder: "Buscar...",
                          value: searchQuery,
                          onChange: (e) => setSearchQuery(e.target.value)
                        }
                        )]
                    }
                    ),
                    _jsxs(Button, {
                      onClick: () => setIsCreateOpen(true),
                      className: "bg-[#FF0C60] hover:bg-[#D40050] text-white shadow-lg shadow-[#FF0C60]/20 font-bold tracking-wide", children: [

                        _jsx(Plus, { className: "w-4 h-4 mr-2" }), "NUEVA"]
                    }

                    )]
                }
                )]
            }
            )
        }
        ),


        _jsx("main", {
          className: "w-full max-w-[95%] mx-auto px-0 py-8 pb-32", children:
            _jsx("div", {
              className: "rounded-xl border border-border/40 bg-card/30 overflow-hidden backdrop-blur-sm shadow-sm", children:
                _jsxs(Table, {
                  children: [
                    _jsx(TableHeader, {
                      className: "bg-muted/30", children:
                        _jsxs(TableRow, {
                          className: "hover:bg-transparent border-border/40", children: [
                            _jsx(TableHead, { className: "w-[300px] text-xs font-bold uppercase tracking-wider text-muted-foreground pl-6", children: "Servicio" }),
                            _jsx(TableHead, { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: "Usuario" }),
                            _jsx(TableHead, { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: "Contrase\xF1a" }),
                            _jsx(TableHead, { className: "hidden md:table-cell text-xs font-bold uppercase tracking-wider text-muted-foreground", children: "Notas" }),
                            _jsx(TableHead, { className: "w-[50px]" })]
                        }
                        )
                    }
                    ),


                    _jsx(motion.tbody, {
                      variants: containerVariants,
                      initial: "hidden",
                      animate: "visible",
                      className: "[&_tr:last-child]:border-0", children:

                        loadingData ?

                          Array.from({ length: 5 }).map((_, i) =>
                            _jsxs(motion.tr, {
                              variants: itemVariants, className: "border-b border-border/40", children: [
                                _jsx(TableCell, {
                                  className: "pl-6 py-4", children:
                                    _jsxs("div", {
                                      className: "flex items-center gap-4", children: [
                                        _jsx(Skeleton, { className: "w-10 h-10 rounded-lg" }),
                                        _jsxs("div", {
                                          className: "space-y-2", children: [
                                            _jsx(Skeleton, { className: "h-4 w-32" }),
                                            _jsx(Skeleton, { className: "h-3 w-16" })]
                                        }
                                        )]
                                    }
                                    )
                                }
                                ),
                                _jsx(TableCell, { children: _jsx(Skeleton, { className: "h-4 w-24" }) }),
                                _jsx(TableCell, { children: _jsx(Skeleton, { className: "h-4 w-32" }) }),
                                _jsx(TableCell, { className: "hidden md:table-cell", children: _jsx(Skeleton, { className: "h-4 w-40" }) }),
                                _jsx(TableCell, { children: _jsx(Skeleton, { className: "h-8 w-8 rounded-full" }) })]
                            }, i
                            )
                          ) :
                          filteredCredentials.length === 0 ?
                            _jsx(TableRow, {
                              children:
                                _jsx(TableCell, { colSpan: 5, className: "h-32 text-center text-muted-foreground", children: "No se encontraron resultados." }

                                )
                            }
                            ) :

                            _jsx(AnimatePresence, {
                              mode: "popLayout", children:
                                filteredCredentials.map((cred) =>
                                  _jsx(CredentialRow, {

                                    cred: cred,
                                    showPassword: showPassword[cred.id],
                                    togglePassword: () => setShowPassword((p) => ({ ...p, [cred.id]: !p[cred.id] })),
                                    copyToClipboard: copyToClipboard,
                                    onDelete: () => handleDelete(cred.id)
                                  }, cred.id
                                  )
                                )
                            }
                            )
                    }

                    )]
                }
                )
            }
            )
        }
        ),


        _jsx(Dialog, {
          open: isCreateOpen, onOpenChange: setIsCreateOpen, children:
            _jsxs(DialogContent, {
              className: "max-w-md bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl", children: [
                _jsx(DialogHeader, {
                  children:
                    _jsxs(DialogTitle, {
                      className: "text-xl font-bold flex items-center gap-2", children: [
                        _jsx(Shield, { className: "w-5 h-5 text-[#FF0C60]" }), "Nueva Credencial"]
                    }

                    )
                }
                ),
                _jsxs("div", {
                  className: "space-y-4 pt-4", children: [
                    _jsxs("div", {
                      className: "grid gap-4", children: [
                        _jsxs("div", {
                          className: "space-y-2", children: [
                            _jsx("label", { className: "text-xs font-bold uppercase text-muted-foreground", children: "Servicio" }),
                            _jsx(Input, {
                              placeholder: "Ej. Adobe Creative Cloud",
                              value: newCredential.service,
                              onChange: (e) => setNewCredential({ ...newCredential, service: e.target.value })
                            }
                            )]
                        }
                        ),
                        _jsxs("div", {
                          className: "grid grid-cols-2 gap-4", children: [
                            _jsxs("div", {
                              className: "space-y-2", children: [
                                _jsx("label", { className: "text-xs font-bold uppercase text-muted-foreground", children: "Categor\xEDa" }),
                                _jsx(Input, {
                                  placeholder: "Ej. Dise\xF1o",
                                  value: newCredential.category,
                                  onChange: (e) => setNewCredential({ ...newCredential, category: e.target.value })
                                }
                                )]
                            }
                            ),
                            _jsxs("div", {
                              className: "space-y-2", children: [
                                _jsx("label", { className: "text-xs font-bold uppercase text-muted-foreground", children: "Usuario" }),
                                _jsx(Input, {
                                  placeholder: "user@example.com",
                                  value: newCredential.username,
                                  onChange: (e) => setNewCredential({ ...newCredential, username: e.target.value })
                                }
                                )]
                            }
                            )]
                        }
                        ),
                        _jsxs("div", {
                          className: "space-y-2", children: [
                            _jsx("label", { className: "text-xs font-bold uppercase text-muted-foreground", children: "Contrase\xF1a" }),
                            _jsxs("div", {
                              className: "relative", children: [
                                _jsx(Input, {
                                  type: "text",
                                  className: "font-mono",
                                  placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
                                  value: newCredential.password,
                                  onChange: (e) => setNewCredential({ ...newCredential, password: e.target.value })
                                }
                                ),
                                _jsx("div", {
                                  className: "absolute right-3 top-1/2 -translate-y-1/2", children:
                                    _jsx(Lock, { className: "w-4 h-4 text-muted-foreground" })
                                }
                                )]
                            }
                            )]
                        }
                        ),
                        _jsxs("div", {
                          className: "space-y-2", children: [
                            _jsx("label", { className: "text-xs font-bold uppercase text-muted-foreground", children: "Notas (Opcional)" }),
                            _jsx(Input, {
                              placeholder: "Detalles adicionales...",
                              value: newCredential.notes,
                              onChange: (e) => setNewCredential({ ...newCredential, notes: e.target.value })
                            }
                            )]
                        }
                        )]
                    }
                    ),
                    _jsxs("div", {
                      className: "flex justify-end gap-2 mt-4", children: [
                        _jsx(Button, { variant: "ghost", onClick: () => setIsCreateOpen(false), children: "Cancelar" }),
                        _jsx(Button, { onClick: handleCreate, className: "bg-[#FF0C60] hover:bg-[#D40050] text-white font-bold", children: "Guardar Credencial" }

                        )]
                    }
                    )]
                }
                )]
            }
            )
        }
        )]
    }
    ));

}

function CredentialRow({ cred, showPassword, togglePassword, copyToClipboard, onDelete }) {
  const Icon = CategoryIcons[cred.category];
  const firstLetter = cred.service.charAt(0).toUpperCase();


  return (
    _jsxs(motion.tr, {
      variants: itemVariants,
      layout: true,
      initial: "hidden",
      animate: "visible",
      exit: { opacity: 0, x: -20 },
      className: "group border-b border-border/40 hover:bg-muted/20 transition-colors data-[state=selected]:bg-muted", children: [


        _jsx(TableCell, {
          className: "pl-6 py-4", children:
            _jsxs("div", {
              className: "flex items-center gap-4", children: [
                _jsx("div", {
                  className: "w-10 h-10 rounded-lg bg-muted/40 flex items-center justify-center border border-border/50 group-hover:border-[#FF0C60]/30 transition-colors", children:
                    Icon ?
                      _jsx(Icon, { className: "w-5 h-5 text-foreground/80 group-hover:text-[#FF0C60]" }) :

                      _jsx("span", { className: "text-lg font-bold text-[#FF0C60]", children: firstLetter })
                }

                ),
                _jsxs("div", {
                  children: [
                    _jsx("div", { className: "font-bold text-sm text-foreground", children: cred.service }),
                    _jsx(Badge, {
                      variant: "outline", className: "mt-1 text-[10px] font-bold text-muted-foreground border-border/50 bg-transparent", children:
                        cred.category
                    }
                    )]
                }
                )]
            }
            )
        }
        ),


        _jsx(TableCell, {
          children:
            _jsxs("div", {
              className: "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors group/user",
              onClick: () => copyToClipboard(cred.username), children: [

                _jsx("code", {
                  className: "bg-muted/30 px-2 py-1 rounded text-xs font-mono text-muted-foreground group-hover/user:text-[#FF0C60] transition-colors", children:
                    cred.username
                }
                ),
                _jsx(Copy, { className: "w-3 h-3 opacity-100 md:opacity-0 md:group-hover/user:opacity-100 transition-opacity text-muted-foreground" })]
            }
            )
        }
        ),


        _jsx(TableCell, {
          children:
            _jsxs("div", {
              className: "flex items-center gap-2", children: [
                _jsx("code", {
                  className: `font-mono text-xs transition-all ${showPassword ? 'text-[#FF0C60] bg-[#FF0C60]/10' : 'text-muted-foreground tracking-widest'}`, children:
                    showPassword ? cred.password : "••••••••••••"
                }
                ),
                _jsxs("div", {
                  className: "flex opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity ml-2", children: [
                    _jsx(Button, {
                      variant: "ghost", size: "icon", className: "h-6 w-6", onClick: togglePassword, children:
                        showPassword ? _jsx(EyeOff, { className: "w-3 h-3" }) : _jsx(Eye, { className: "w-3 h-3" })
                    }
                    ),
                    _jsx(Button, {
                      variant: "ghost", size: "icon", className: "h-6 w-6", onClick: () => copyToClipboard(cred.password), children:
                        _jsx(Copy, { className: "w-3 h-3" })
                    }
                    )]
                }
                )]
            }
            )
        }
        ),


        _jsx(TableCell, {
          className: "hidden md:table-cell max-w-[200px]", children:
            _jsx("p", {
              className: "text-xs text-muted-foreground truncate", title: cred.notes, children:
                cred.notes || "-"
            }
            )
        }
        ),


        _jsx(TableCell, {
          children:
            _jsxs(DropdownMenu, {
              children: [
                _jsx(DropdownMenuTrigger, {
                  asChild: true, children:
                    _jsx(Button, {
                      variant: "ghost", size: "icon", className: "h-8 w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity", children:
                        _jsx(MoreHorizontal, { className: "w-4 h-4" })
                    }
                    )
                }
                ),
                _jsx(DropdownMenuContent, {
                  align: "end", className: "bg-card backdrop-blur-xl border-border/50", children:
                    _jsxs(DropdownMenuItem, {
                      onClick: onDelete, className: "text-rose-500 focus:text-rose-500 cursor-pointer", children: [
                        _jsx(Trash2, { className: "w-4 h-4 mr-2" }), "Eliminar"]
                    }

                    )
                }
                )]
            }
            )
        }
        )]
    }
    ));

}