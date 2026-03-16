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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

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

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/credentials?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success("Credencial eliminada");
      fetchCredentials();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.message("Copiado al portapapeles", {
      icon: <CheckCircle className="w-4 h-4 text-emerald-500" />
    });
  };

  const filteredCredentials = credentials.filter((c: any) =>
    c.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading || !user) return null;

  return (
    <div className="min-h-[1400px] h-full bg-background w-full font-sans selection:bg-[#FF0C60] selection:text-white pb-32">

      {/* HEADER SECTION */}
      <div className="w-full max-w-[1500px] mx-auto pt-16 pb-12 px-6 md:px-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center">
              <Shield className="w-9 h-9 text-[#FF0C60] stroke-[2.5px]" />
            </div>
            <h1 className="text-[36px] font-bold tracking-tighter text-foreground leading-none mt-1">Bóveda de Claves</h1>
          </div>
          <p className="text-muted-foreground font-semibold text-[15px] tracking-wide mt-2 ml-[52px]">
            {credentials.length} credenciales seguras
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
          <div className="relative w-full md:w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/70" />
            <Input
              className="pl-11 h-[50px] bg-card border border-border/80 hover:border-border focus:border-[#FF0C60] rounded-xl text-[14px] text-foreground shadow-sm transition-all focus-visible:ring-0 placeholder:text-muted-foreground/60 font-medium"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            className="bg-[#FF0C60] hover:bg-[#E00A54] text-white rounded-xl h-[50px] px-8 font-semibold tracking-wide text-[14px] shadow-[0_4px_14px_0_rgba(255,12,96,0.39)] transition-all"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="w-[20px] h-[20px] mr-2 stroke-[3px]" /> NUEVA
          </Button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <main className="w-full max-w-[1500px] mx-auto px-6 md:px-12">
        <div className="border border-border/80 rounded-[16px] bg-card shadow-sm overflow-hidden mb-32">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/10 border-b border-border/60">
                <th className="py-6 pl-10 text-[12px] font-bold text-muted-foreground/70 uppercase tracking-widest w-[35%]">Servicio</th>
                <th className="py-6 text-[12px] font-bold text-muted-foreground/70 uppercase tracking-widest w-[25%]">Usuario</th>
                <th className="py-6 text-[12px] font-bold text-muted-foreground/70 uppercase tracking-widest w-[30%]">Contraseña</th>
                <th className="py-6 text-[12px] font-bold text-muted-foreground/70 uppercase tracking-widest w-[10%]">Notas</th>
              </tr>
            </thead>
            <tbody>
              {loadingData ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    <td className="pl-10 py-6">
                      <div className="flex items-center gap-5">
                        <Skeleton className="w-[48px] h-[48px] rounded-xl" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </td>
                    <td><Skeleton className="h-4 w-24" /></td>
                    <td><Skeleton className="h-4 w-32" /></td>
                    <td><Skeleton className="h-4 w-10" /></td>
                  </tr>
                ))
              ) : filteredCredentials.length === 0 ? (
                <tr>
                  <td colSpan={4} className="h-32 text-center text-muted-foreground font-medium">No se encontraron resultados.</td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredCredentials.map((cred: any) => (
                    <CredentialRow
                      key={cred.id}
                      cred={cred}
                      showPassword={showPassword[cred.id as keyof typeof showPassword]}
                      togglePassword={() => setShowPassword((p) => ({ ...p, [cred.id]: !p[cred.id as keyof typeof showPassword] }))}
                      copyToClipboard={copyToClipboard}
                      onDelete={() => handleDelete(cred.id)}
                    />
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </main>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-[480px] bg-card border border-border shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-[24px] p-8">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-[22px] font-bold flex items-center gap-3 text-foreground tracking-tight">
              <div className="w-10 h-10 rounded-[12px] bg-rose-50/50 dark:bg-rose-500/10 flex items-center justify-center border border-rose-100 dark:border-rose-500/20">
                 <Shield className="w-[22px] h-[22px] text-[#FF0C60] stroke-[2.5px]" />
              </div>
              Nueva Credencial
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
             <div className="grid gap-5">
                <div className="space-y-2.5">
                  <label className="text-[11px] font-semibold uppercase text-muted-foreground/80 tracking-[0.2em] ml-1">Servicio</label>
                  <Input
                    placeholder="Ej. Adobe Creative Cloud"
                    className="h-[52px] px-4 text-[14px] focus-visible:ring-1 focus-visible:ring-[#FF0C60] focus-visible:border-[#FF0C60] rounded-[14px] border-border/60 bg-muted/20 shadow-sm transition-all"
                    value={newCredential.service}
                    onChange={(e) => setNewCredential({ ...newCredential, service: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-5">
                   <div className="space-y-2.5">
                     <label className="text-[11px] font-semibold uppercase text-muted-foreground/80 tracking-[0.2em] ml-1">Categoría</label>
                     <Input
                       placeholder="Ej. Diseño"
                       className="h-[52px] px-4 text-[14px] focus-visible:ring-1 focus-visible:ring-[#FF0C60] focus-visible:border-[#FF0C60] rounded-[14px] border-border/60 bg-muted/20 shadow-sm transition-all"
                       value={newCredential.category}
                       onChange={(e) => setNewCredential({ ...newCredential, category: e.target.value })}
                     />
                   </div>
                   <div className="space-y-2.5">
                     <label className="text-[11px] font-semibold uppercase text-muted-foreground/80 tracking-[0.2em] ml-1">Usuario</label>
                     <Input
                       placeholder="user@example.com"
                       className="h-[52px] px-4 text-[14px] focus-visible:ring-1 focus-visible:ring-[#FF0C60] focus-visible:border-[#FF0C60] rounded-[14px] border-border/60 bg-muted/20 shadow-sm transition-all"
                       value={newCredential.username}
                       onChange={(e) => setNewCredential({ ...newCredential, username: e.target.value })}
                     />
                   </div>
                </div>
                <div className="space-y-2.5">
                   <label className="text-[11px] font-semibold uppercase text-muted-foreground/80 tracking-[0.2em] ml-1">Contraseña</label>
                   <div className="relative">
                     <Input
                       type="text"
                       className="h-[52px] pl-4 pr-10 font-mono text-[16px] tracking-widest placeholder:tracking-widest focus-visible:ring-1 focus-visible:ring-[#FF0C60] focus-visible:border-[#FF0C60] rounded-[14px] border-border/60 bg-muted/20 shadow-sm transition-all"
                       placeholder="••••••••••••"
                       value={newCredential.password}
                       onChange={(e) => setNewCredential({ ...newCredential, password: e.target.value })}
                     />
                     <div className="absolute right-4 top-1/2 -translate-y-1/2">
                       <Lock className="w-[18px] h-[18px] text-muted-foreground/50" strokeWidth={2.5}/>
                     </div>
                   </div>
                </div>
                <div className="space-y-2.5">
                   <label className="text-[11px] font-semibold uppercase text-muted-foreground/80 tracking-[0.2em] ml-1">Notas (Opcional)</label>
                   <Input
                     placeholder="Detalles adicionales..."
                     className="h-[52px] px-4 text-[14px] focus-visible:ring-1 focus-visible:ring-[#FF0C60] focus-visible:border-[#FF0C60] rounded-[14px] border-border/60 bg-muted/20 shadow-sm transition-all text-muted-foreground"
                     value={newCredential.notes}
                     onChange={(e) => setNewCredential({ ...newCredential, notes: e.target.value })}
                   />
                </div>
             </div>
             <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border/40">
               <Button variant="ghost" className="h-[46px] px-6 text-muted-foreground hover:text-foreground font-bold rounded-xl transition-colors" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
               <Button onClick={handleCreate} className="h-[46px] px-8 bg-[#FF0C60] hover:bg-[#D40050] text-white font-semibold tracking-wide rounded-xl shadow-[0_4px_14px_0_rgba(255,12,96,0.39)] transition-all">Guardar</Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CredentialRow({ cred, showPassword, togglePassword, copyToClipboard, onDelete }: any) {
  const Icon = CategoryIcons[cred.category as keyof typeof CategoryIcons];
  const firstLetter = cred.service.charAt(0).toUpperCase();

  return (
    <motion.tr
      variants={itemVariants}
      layout
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, x: -20 }}
      className="group border-b border-border/40 hover:bg-muted/30 transition-colors bg-transparent relative"
    >
      <td className="py-6 pl-10" style={{ width: '35%' }}>
        <div className="flex items-center gap-6">
          <div className="w-[46px] h-[46px] rounded-[14px] bg-muted/40 border border-border/60 flex items-center justify-center flex-shrink-0 shadow-sm">
            {Icon ? (
              <Icon className="w-[22px] h-[22px] text-foreground/80" strokeWidth={2.5} />
            ) : (
              <span className="text-xl font-bold text-[#FF0C60]">{firstLetter}</span>
            )}
          </div>
          <div className="flex flex-col items-start pt-1">
            <span className="text-[15px] font-bold text-foreground tracking-tight leading-none mb-[7px]">{cred.service}</span>
            <Badge variant="outline" className="h-[20px] px-2 bg-muted/30 border-transparent text-muted-foreground text-[9.5px] font-semibold uppercase tracking-widest leading-none rounded-md shadow-none hover:bg-muted/50">
              {cred.category}
            </Badge>
          </div>
        </div>
      </td>

      <td className="py-6" style={{ width: '25%' }}>
        <span className="font-mono text-[14px] text-muted-foreground/80 font-medium tracking-tight">
          {cred.username}
        </span>
      </td>

      <td className="py-6" style={{ width: '30%' }}>
        <div className="flex items-center gap-4">
          <span className={`font-mono text-[18px] tracking-[0.25em] font-medium leading-none mt-1 ${showPassword ? 'text-foreground' : 'text-muted-foreground/40'}`}>
            {showPassword ? cred.password : "••••••••••••"}
          </span>
          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
            <button onClick={togglePassword} className="p-2 text-muted-foreground/70 hover:text-foreground transition-colors rounded-xl hover:bg-muted">
              {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
            </button>
            <button onClick={() => copyToClipboard(cred.password)} className="p-2 text-muted-foreground/70 hover:text-foreground transition-colors rounded-xl hover:bg-muted">
              <Copy className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </td>

      <td className="py-6 pr-6 relative" style={{ width: '10%' }}>
        <div className="flex items-center justify-between w-full h-full">
          <span className="font-mono text-[15px] text-muted-foreground/50 font-medium">{cred.notes || "—"}</span>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-10 top-1/2 -translate-y-1/2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 text-muted-foreground/70 hover:text-foreground transition-colors rounded-xl hover:bg-muted">
                  <MoreHorizontal className="w-6 h-6" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border shadow-xl rounded-xl">
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer text-[14px] font-bold py-2 px-3">
                  <Trash2 className="w-[18px] h-[18px] mr-2" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}