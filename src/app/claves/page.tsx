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

const CredentialCard = ({ cred, showPassword, togglePassword, copyToClipboard, onDelete, onEdit }: any) => {
  const Icon = CategoryIcons[cred.category as keyof typeof CategoryIcons] || Lock;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      className="group relative bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 hover:border-[#FF0C60]/30 hover:shadow-[0_20px_40px_-15px_rgba(255,12,96,0.1)] transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-muted/50 to-muted border border-border/50 flex items-center justify-center shadow-inner group-hover:from-[#FF0C60]/10 group-hover:to-[#FF0C60]/5 transition-colors">
             <Icon className="w-6 h-6 text-foreground/70 group-hover:text-[#FF0C60] transition-colors" strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-foreground tracking-tight leading-none mb-1.5">{cred.service}</h3>
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60">{cred.category}</span>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-md border-border w-40">
            <DropdownMenuItem onClick={() => onEdit(cred)} className="cursor-pointer font-medium">
              <Plus className="w-4 h-4 mr-2 rotate-45" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(cred.id)} className="text-destructive focus:text-destructive cursor-pointer font-medium">
              <Trash2 className="w-4 h-4 mr-2" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 ml-1">Usuario</span>
          <div className="relative group/field">
            <div className="h-10 px-3 bg-muted/30 border border-border/40 rounded-lg flex items-center justify-between group-hover/field:border-border/80 transition-colors">
              <span className="text-sm font-medium text-foreground/80 truncate mr-2">{cred.username}</span>
              <button 
                onClick={() => copyToClipboard(cred.username)}
                className="p-1.5 hover:bg-muted rounded-md text-muted-foreground opacity-0 group-hover/field:opacity-100 transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 ml-1">Contraseña</span>
          <div className="relative group/field">
            <div className="h-10 px-3 bg-muted/30 border border-border/40 rounded-lg flex items-center justify-between group-hover/field:border-border/80 transition-colors">
              <span className={`text-sm font-mono tracking-wider ${showPassword ? 'text-foreground' : 'text-muted-foreground/30'}`}>
                {showPassword ? cred.password : "••••••••••••"}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover/field:opacity-100 transition-all">
                <button 
                  onClick={togglePassword}
                  className="p-1.5 hover:bg-muted rounded-md text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button 
                  onClick={() => copyToClipboard(cred.password)}
                  className="p-1.5 hover:bg-muted rounded-md text-muted-foreground"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {cred.notes && (
        <div className="mt-4 pt-4 border-t border-border/30">
          <p className="text-[12px] text-muted-foreground leading-relaxed italic line-clamp-2">"{cred.notes}"</p>
        </div>
      )}
    </motion.div>
  );
};

export default function CredentialsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [credentials, setCredentials] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [loadingData, setLoadingData] = useState(true);
  const [showPassword, setShowPassword] = useState({});

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<any>(null);
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

  const categories = ["Todas", ...Array.from(new Set(credentials.map((c: any) => c.category)))];

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

  const handleUpdate = async () => {
    if (!editingCredential.service || !editingCredential.username || !editingCredential.password) {
      toast.error("Faltan campos requeridos");
      return;
    }

    try {
      const res = await fetch(`/api/credentials?id=${editingCredential.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCredential)
      });

      if (!res.ok) throw new Error('Failed to update');

      toast.success("Credencial actualizada");
      setIsEditOpen(false);
      setEditingCredential(null);
      fetchCredentials();
    } catch (error) {
      toast.error("Error al actualizar");
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

  const filteredCredentials = credentials.filter((c: any) => {
    const matchesSearch = c.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Todas" || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-[#030303] text-foreground font-sans selection:bg-[#FF0C60] selection:text-white pb-32">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FF0C60]/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-violet-600/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-[1500px] mx-auto pt-20 pb-12 px-6 md:px-12">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FF0C60] flex items-center justify-center shadow-[0_8px_30px_rgb(255,12,96,0.3)]">
                <Shield className="w-8 h-8 text-white stroke-[2.5px]" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-none">Bóveda</h1>
                <p className="text-muted-foreground font-bold text-sm tracking-[0.2em] uppercase mt-2">Vaulted Security</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-[400px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/70" />
              <Input
                className="pl-12 h-14 bg-card/40 backdrop-blur-md border border-border/50 hover:border-[#FF0C60]/30 focus:border-[#FF0C60] rounded-2xl text-[15px] text-foreground shadow-xl transition-all focus-visible:ring-0 placeholder:text-muted-foreground/40 font-medium"
                placeholder="Buscar credencial o servicio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              className="w-full md:w-auto bg-[#FF0C60] hover:bg-[#E00A54] text-white rounded-2xl h-14 px-8 font-bold tracking-wide text-base shadow-[0_10px_20px_-5px_rgba(255,12,96,0.4)] transition-all hover:scale-105 active:scale-95"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="w-5 h-5 mr-2 stroke-[3px]" /> NUEVA CLAVE
            </Button>
          </div>
        </div>

        <div className="mt-12 flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${
                selectedCategory === cat 
                  ? "bg-[#FF0C60] border-[#FF0C60] text-white shadow-[0_5px_15px_-5px_rgba(255,12,96,0.5)]" 
                  : "bg-card/30 border-border/50 text-muted-foreground hover:border-muted-foreground/30"
              }`}
            >
              {cat}
            </button>
          ))}
          <div className="ml-auto text-[11px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] pr-4">
            {filteredCredentials.length} Items encontrados
          </div>
        </div>
      </div>

      <main className="relative z-10 w-full max-w-[1500px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {loadingData ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card/40 border border-border/50 rounded-2xl p-6 h-64 animate-pulse">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-muted/50" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted/50 rounded" />
                    <div className="h-3 w-16 bg-muted/30 rounded" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredCredentials.length === 0 ? (
            <div className="col-span-full h-[400px] flex flex-col items-center justify-center bg-card/20 backdrop-blur-sm border border-dashed border-border/50 rounded-3xl">
               <Shield className="w-10 h-10 text-muted-foreground/30 mb-6" />
               <p className="text-xl font-bold text-muted-foreground/50">No se encontraron credenciales</p>
               <Button variant="link" className="text-[#FF0C60] mt-2" onClick={() => {setSearchQuery(""); setSelectedCategory("Todas");}}>Limpiar filtros</Button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredCredentials.map((cred: any) => (
                <CredentialCard
                  key={cred.id}
                  cred={cred}
                  showPassword={showPassword[cred.id]}
                  togglePassword={() => setShowPassword((p) => ({ ...p, [cred.id]: !p[cred.id] }))}
                  copyToClipboard={copyToClipboard}
                  onDelete={handleDelete}
                  onEdit={(c: any) => { setEditingCredential(c); setIsEditOpen(true); }}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </main>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <CredentialFormDialog 
          title="Nueva Credencial" 
          confirmText="Guardar Credencial"
          initialData={newCredential}
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
          onChange={(data: any) => setNewCredential(data)}
        />
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <CredentialFormDialog 
          title="Editar Credencial" 
          confirmText="Actualizar"
          initialData={editingCredential}
          onSubmit={handleUpdate}
          onCancel={() => { setIsEditOpen(false); setEditingCredential(null); }}
          onChange={(data: any) => setEditingCredential(data)}
        />
      </Dialog>
    </div>
  );
}

function CredentialFormDialog({ title, confirmText, initialData, onSubmit, onCancel, onChange }: any) {
  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let pass = "";
    for (let i = 0; i < 16; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    onChange({ ...initialData, password: pass });
    toast.info("Contraseña segura generada");
  };

  return (
    <DialogContent className="max-w-[500px] bg-[#0A0A0A]/95 backdrop-blur-2xl border-border/50 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.5)] rounded-[32px] p-8 border">
      <DialogHeader className="mb-6">
        <DialogTitle className="text-2xl font-black flex items-center gap-4 text-white tracking-tight">
          <div className="w-12 h-12 rounded-2xl bg-[#FF0C60]/10 flex items-center justify-center border border-[#FF0C60]/20">
             <Shield className="w-6 h-6 text-[#FF0C60]" />
          </div>
          {title}
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2.5">
            <label className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-[0.2em] ml-1">Servicio</label>
            <Input
              placeholder="Ej. Adobe Creative"
              className="h-14 px-5 text-sm bg-muted/20 border-border/40 focus:border-[#FF0C60] rounded-2xl transition-all"
              value={initialData?.service || ''}
              onChange={(e) => onChange({ ...initialData, service: e.target.value })}
            />
          </div>
          <div className="space-y-2.5">
            <label className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-[0.2em] ml-1">Categoría</label>
            <Input
              placeholder="Ej. Diseño"
              className="h-14 px-5 text-sm bg-muted/20 border-border/40 focus:border-[#FF0C60] rounded-2xl transition-all"
              value={initialData?.category || ''}
              onChange={(e) => onChange({ ...initialData, category: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <label className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-[0.2em] ml-1">Usuario / Email</label>
          <Input
            placeholder="usuario@correo.com"
            className="h-14 px-5 text-sm bg-muted/20 border-border/40 focus:border-[#FF0C60] rounded-2xl transition-all"
            value={initialData?.username || ''}
            onChange={(e) => onChange({ ...initialData, username: e.target.value })}
          />
        </div>

        <div className="space-y-2.5">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-[0.2em] ml-1">Contraseña</label>
            <button 
              onClick={generatePassword}
              className="text-[10px] font-bold text-[#FF0C60] hover:text-[#FF0C60]/80 flex items-center gap-1.5 transition-colors uppercase tracking-widest"
            >
              Generar Segura
            </button>
          </div>
          <div className="relative group">
            <Input
              type="text"
              className="h-14 pl-5 pr-12 font-mono text-base tracking-widest bg-muted/20 border-border/40 focus:border-[#FF0C60] rounded-2xl transition-all"
              placeholder="••••••••••••"
              value={initialData?.password || ''}
              onChange={(e) => onChange({ ...initialData, password: e.target.value })}
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/40">
              <Lock className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <label className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-[0.2em] ml-1">Notas adicionales</label>
          <Input
            placeholder="Opcional..."
            className="h-14 px-5 text-sm bg-muted/20 border-border/40 focus:border-[#FF0C60] rounded-2xl transition-all"
            value={initialData?.notes || ''}
            onChange={(e) => onChange({ ...initialData, notes: e.target.value })}
          />
        </div>

        <div className="flex gap-4 mt-10">
          <Button 
            variant="ghost" 
            type="button"
            className="flex-1 h-14 rounded-2xl font-bold text-muted-foreground hover:bg-muted/30" 
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button 
            type="button"
            onClick={onSubmit} 
            className="flex-[1.5] h-14 bg-[#FF0C60] hover:bg-[#D40050] text-white font-black tracking-tight text-lg rounded-2xl shadow-[0_15px_30px_-5px_rgba(255,12,96,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}