'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Eye, EyeOff, Copy, CheckCircle, Shield, Trash2, Plus, Pencil, Server, Globe, Lock, MoreHorizontal, Monitor, Laptop } from "lucide-react";
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

interface Credential {
  id: string;
  service: string;
  category: string;
  username: string;
  password: string;
  notes?: string | null;
}

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

const CredentialCard = ({ cred, showPassword, togglePassword, copyToClipboard, onDelete, onEdit }: {
  cred: Credential;
  showPassword: boolean;
  togglePassword: () => void;
  copyToClipboard: (text: string) => void;
  onDelete: (id: string) => void;
  onEdit: (cred: Credential) => void;
}) => {
  const Icon = CategoryIcons[cred.category as keyof typeof CategoryIcons] || Lock;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      className="group/card relative bg-card border border-border rounded-2xl p-6 shadow-sm hover:border-primary/25 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3 mb-6 min-w-0">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-muted/50 to-muted border border-border flex items-center justify-center shadow-inner group-hover/card:from-primary/10 group-hover/card:to-primary/5 transition-colors">
             <Icon className="w-6 h-6 text-foreground/70 group-hover/card:text-primary transition-colors" strokeWidth={2} />
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="text-lg font-semibold text-foreground tracking-tight leading-tight mb-1.5 truncate" title={cred.service}>{cred.service}</h3>
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60 truncate">{cred.category}</span>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Acciones de credencial"
              className="h-8 w-8 shrink-0 rounded-lg opacity-100 md:opacity-0 md:group-hover/card:opacity-100 md:focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-opacity"
            >
              <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-md border-border w-40">
            <DropdownMenuItem onClick={() => onEdit(cred)} className="cursor-pointer font-medium">
              <Pencil className="w-4 h-4 mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(cred.id)} className="text-destructive focus:text-destructive cursor-pointer font-medium">
              <Trash2 className="w-4 h-4 mr-2" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 ml-1">Usuario</span>
          <div className="relative group/field">
            <div className="h-10 px-3 bg-muted/30 border border-border/40 rounded-lg flex items-center justify-between group-hover/field:border-border/80 transition-colors focus-within:border-border/80">
              <span className="text-sm font-medium text-foreground/80 truncate mr-2 min-w-0">{cred.username}</span>
              <button 
                type="button"
                onClick={() => copyToClipboard(cred.username)}
                aria-label="Copiar usuario"
                className="p-1.5 shrink-0 hover:bg-muted rounded-md text-muted-foreground opacity-100 md:opacity-0 md:group-hover/field:opacity-100 md:focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 ml-1">Contraseña</span>
          <div className="relative group/field">
            <div className="h-10 px-3 bg-muted/30 border border-border/40 rounded-lg flex items-center justify-between gap-2 min-w-0 group-hover/field:border-border/80 transition-colors focus-within:border-border/80">
              <span className={`text-sm font-mono tracking-wider truncate min-w-0 ${showPassword ? 'text-foreground' : 'text-muted-foreground/30 select-none'}`}>
                {showPassword ? cred.password : "••••••••••••"}
              </span>
              <div className="flex shrink-0 items-center gap-1 opacity-100 md:opacity-0 md:group-hover/field:opacity-100 md:focus-within:opacity-100 transition-all">
                <button 
                  type="button"
                  onClick={togglePassword}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="p-1.5 hover:bg-muted rounded-md text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button 
                  type="button"
                  onClick={() => copyToClipboard(cred.password)}
                  aria-label="Copiar contraseña"
                  className="p-1.5 hover:bg-muted rounded-md text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [loadingData, setLoadingData] = useState(true);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
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

  const categories = ["Todas", ...Array.from(new Set(credentials.map((c) => c.category)))];

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
    if (!editingCredential || !editingCredential.service || !editingCredential.username || !editingCredential.password) {
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

  const filteredCredentials = credentials.filter((c) => {
    const matchesSearch = c.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Todas" || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/25 selection:text-foreground pb-32">
      <div className="relative z-10 w-full max-w-[1500px] mx-auto pt-20 pb-12 px-6 md:px-12">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                <Shield className="w-8 h-8 stroke-[2px]" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-none">Bóveda</h1>
                <p className="text-muted-foreground font-medium text-sm tracking-[0.12em] uppercase mt-2">Seguridad de credenciales</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-[400px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/70" />
              <Input
                className="pl-12 h-14 bg-card border border-border hover:border-border focus-visible:border-ring rounded-2xl text-[15px] text-foreground shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background placeholder:text-muted-foreground/40 font-medium"
                placeholder="Buscar credencial o servicio..."
                aria-label="Buscar por servicio o usuario"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              className="w-full md:w-auto rounded-2xl h-14 px-8 font-semibold tracking-wide text-base shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="w-5 h-5 mr-2 stroke-[2px]" /> Nueva clave
            </Button>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div
            role="group"
            aria-label="Filtrar por categoría"
            className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 -mx-1 px-1 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:flex-1 sm:min-w-0"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                aria-pressed={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
                className={`snap-start shrink-0 px-5 py-2.5 sm:px-6 rounded-full text-xs font-semibold uppercase tracking-wide transition-all whitespace-nowrap border ${
                  selectedCategory === cat 
                    ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                    : "bg-card border-border text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <p className="shrink-0 text-[11px] font-medium text-muted-foreground/50 uppercase tracking-[0.12em] sm:text-right">
            {filteredCredentials.length === 1
              ? "1 credencial"
              : `${filteredCredentials.length} credenciales`}
          </p>
        </div>
      </div>

      <main className="relative z-10 w-full max-w-[1500px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {loadingData ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 h-64 animate-pulse">
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
            <div className="col-span-full h-[400px] flex flex-col items-center justify-center bg-muted/30 border border-dashed border-border rounded-3xl px-6 text-center">
               <Shield className="w-10 h-10 text-muted-foreground/30 mb-6" />
               <p className="text-xl font-semibold text-muted-foreground/50">
                 {credentials.length === 0
                   ? "La bóveda está vacía"
                   : "Nada coincide con tu búsqueda o filtro"}
               </p>
               <p className="text-sm text-muted-foreground/40 mt-2 max-w-md">
                 {credentials.length === 0
                   ? "Añade tu primera credencial con el botón «Nueva clave»."
                   : "Prueba otras palabras o cambia de categoría."}
               </p>
               {credentials.length > 0 && (
                 <Button variant="link" className="text-primary mt-4" onClick={() => { setSearchQuery(""); setSelectedCategory("Todas"); }}>
                   Limpiar filtros
                 </Button>
               )}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredCredentials.map((cred) => (
                <CredentialCard
                  key={cred.id}
                  cred={cred}
                  showPassword={!!showPassword[cred.id]}
                  togglePassword={() => setShowPassword((p) => ({ ...p, [cred.id]: !p[cred.id] }))}
                  copyToClipboard={copyToClipboard}
                  onDelete={handleDelete}
                  onEdit={(c) => { setEditingCredential(c); setIsEditOpen(true); }}
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
    <DialogContent className="max-w-[500px] bg-card text-card-foreground border-border shadow-lg rounded-[32px] p-8">
      <DialogHeader className="mb-6">
        <DialogTitle className="text-2xl font-semibold flex items-center gap-4 text-foreground tracking-tight">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
             <Shield className="w-6 h-6 text-primary" />
          </div>
          {title}
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2.5">
            <label className="text-[10px] font-medium uppercase text-muted-foreground/60 tracking-[0.12em] ml-1">Servicio</label>
            <Input
              placeholder="Ej. Adobe Creative"
              className="h-14 px-5 text-sm bg-background border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl transition-all"
              value={initialData?.service || ''}
              onChange={(e) => onChange({ ...initialData, service: e.target.value })}
            />
          </div>
          <div className="space-y-2.5">
            <label className="text-[10px] font-medium uppercase text-muted-foreground/60 tracking-[0.12em] ml-1">Categoría</label>
            <Input
              placeholder="Ej. Diseño"
              className="h-14 px-5 text-sm bg-background border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl transition-all"
              value={initialData?.category || ''}
              onChange={(e) => onChange({ ...initialData, category: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <label className="text-[10px] font-medium uppercase text-muted-foreground/60 tracking-[0.12em] ml-1">Usuario / Email</label>
          <Input
            placeholder="usuario@correo.com"
            className="h-14 px-5 text-sm bg-background border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl transition-all"
            value={initialData?.username || ''}
            onChange={(e) => onChange({ ...initialData, username: e.target.value })}
          />
        </div>

        <div className="space-y-2.5">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-medium uppercase text-muted-foreground/60 tracking-[0.12em] ml-1">Contraseña</label>
            <button 
              type="button"
              onClick={generatePassword}
              className="text-[10px] font-medium text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors uppercase tracking-wide"
            >
              Generar Segura
            </button>
          </div>
          <div className="relative group">
            <Input
              type="text"
              className="h-14 pl-5 pr-12 font-mono text-base tracking-widest bg-background border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl transition-all"
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
          <label htmlFor="credential-notes" className="text-[10px] font-medium uppercase text-muted-foreground/60 tracking-[0.12em] ml-1">Notas adicionales</label>
          <textarea
            id="credential-notes"
            rows={3}
            placeholder="Opcional…"
            className="w-full min-h-[88px] resize-y rounded-2xl border border-border bg-background px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            value={initialData?.notes || ''}
            onChange={(e) => onChange({ ...initialData, notes: e.target.value })}
          />
        </div>

        <div className="flex gap-4 mt-10">
          <Button 
            variant="ghost" 
            type="button"
            className="flex-1 h-14 rounded-2xl font-medium text-muted-foreground hover:bg-muted/30" 
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button 
            type="button"
            onClick={onSubmit} 
            className="flex-[1.5] h-14 font-semibold tracking-tight text-lg rounded-2xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}