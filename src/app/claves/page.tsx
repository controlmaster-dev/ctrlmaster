"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  Shield,
  KeyRound,
  FolderOpen,
  CheckCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  CredentialCard,
  type Credential,
} from "@/components/claves/CredentialCard";
import { CredentialFormDialog } from "@/components/claves/CredentialFormDialog";
import { ClavesSkeleton } from "@/components/skeletons/ClavesSkeleton";
import { useClavesBundle } from "@/hooks/useClavesBundle";

type CredentialFormData = Pick<
  Credential,
  "service" | "category" | "username" | "password" | "notes"
>;

const EMPTY_FORM: CredentialFormData = {
  service: "",
  category: "",
  username: "",
  password: "",
  notes: "",
};

export default function CredentialsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { credentials, isReady, refresh } = useClavesBundle(!!user);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [newCredential, setNewCredential] = useState<CredentialFormData>(EMPTY_FORM);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  const categories = useMemo(
    () => ["Todas", ...Array.from(new Set(credentials.map((c) => c.category)))],
    [credentials]
  );

  const filteredCredentials = useMemo(
    () =>
      credentials.filter((c) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          c.service.toLowerCase().includes(q) || c.username.toLowerCase().includes(q);
        const matchesCategory =
          selectedCategory === "Todas" || c.category === selectedCategory;
        return matchesSearch && matchesCategory;
      }),
    [credentials, searchQuery, selectedCategory]
  );

  const categoryCount = useMemo(
    () => new Set(credentials.map((c) => c.category)).size,
    [credentials]
  );

  const handleCreate = async () => {
    if (!newCredential.service || !newCredential.username || !newCredential.password) {
      toast.error("Completa servicio, usuario y contraseña");
      return;
    }
    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCredential),
      });
      if (!res.ok) throw new Error();
      toast.success("Credencial guardada");
      setIsCreateOpen(false);
      setNewCredential(EMPTY_FORM);
      await refresh();
    } catch {
      toast.error("Error al crear");
    }
  };

  const handleUpdate = async () => {
    if (
      !editingCredential?.service ||
      !editingCredential.username ||
      !editingCredential.password
    ) {
      toast.error("Completa los campos requeridos");
      return;
    }
    try {
      const res = await fetch(`/api/credentials?id=${editingCredential.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCredential),
      });
      if (!res.ok) throw new Error();
      toast.success("Credencial actualizada");
      setIsEditOpen(false);
      setEditingCredential(null);
      await refresh();
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/credentials?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Credencial eliminada");
      await refresh();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.message("Copiado", {
      icon: <CheckCircle className="h-4 w-4 text-emerald-500" />,
    });
  };

  if (isLoading || !user) return null;
  if (!isReady) return <ClavesSkeleton />;

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col bg-background text-foreground selection:bg-brand selection:text-white md:flex-row">

      <aside className="flex w-full shrink-0 flex-col border-b border-border/60 bg-card/40 md:h-[calc(100dvh-3.5rem)] md:w-72 md:border-b-0 md:border-r lg:w-80">
        <div className="border-b border-border/50 p-5">
          <h1 className="text-xl font-semibold tracking-tight">
            Bóveda de <span className="text-brand">claves</span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Credenciales del equipo
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 border-b border-border/50 p-4 md:grid-cols-1 md:gap-3">
          <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
            <div className="flex items-center gap-2 text-brand">
              <KeyRound className="h-3.5 w-3.5" />
              <span className="text-[10px] text-muted-foreground">Total</span>
            </div>
            <p className="mt-0.5 text-lg font-semibold tabular-nums">{credentials.length}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
            <div className="flex items-center gap-2 text-violet-400">
              <FolderOpen className="h-3.5 w-3.5" />
              <span className="text-[10px] text-muted-foreground">Categorías</span>
            </div>
            <p className="mt-0.5 text-lg font-semibold tabular-nums">{categoryCount}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
            <div className="flex items-center gap-2 text-emerald-500">
              <Shield className="h-3.5 w-3.5" />
              <span className="text-[10px] text-muted-foreground">Visibles</span>
            </div>
            <p className="mt-0.5 text-lg font-semibold tabular-nums">
              {filteredCredentials.length}
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 rounded-lg border-border/60 bg-background pl-9"
              placeholder="Buscar…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {categories.length > 1 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Categoría</p>
              <div className="flex max-h-48 flex-col gap-1 overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      selectedCategory === cat
                        ? "bg-brand text-white"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            className="mt-auto hidden h-10 w-full gap-2 rounded-lg bg-brand text-white hover:bg-brand-hover md:flex"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nueva clave
          </Button>
        </div>
      </aside>


      <main className="relative flex min-h-0 flex-1 flex-col md:h-[calc(100dvh-3.5rem)] md:overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-brand/5 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {filteredCredentials.length === 1
              ? "1 credencial"
              : `${filteredCredentials.length} credenciales`}
          </p>
          <Button
            size="sm"
            className="h-9 gap-2 rounded-lg bg-brand text-white hover:bg-brand-hover md:hidden"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nueva
          </Button>
        </div>

        <div className="relative z-10 flex-1 overflow-y-auto p-4">
          {filteredCredentials.length === 0 ? (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 text-center">
              <Shield className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium">
                {credentials.length === 0
                  ? "No hay credenciales guardadas"
                  : "Sin resultados"}
              </p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                {credentials.length === 0
                  ? "Usa «Nueva clave» para añadir la primera."
                  : "Prueba otra búsqueda o categoría."}
              </p>
              {credentials.length > 0 && (
                <Button
                  variant="link"
                  className="mt-2 text-brand"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("Todas");
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredCredentials.map((cred) => (
                <CredentialCard
                  key={cred.id}
                  cred={cred}
                  showPassword={!!showPassword[cred.id]}
                  onTogglePassword={() =>
                    setShowPassword((p) => ({ ...p, [cred.id]: !p[cred.id] }))
                  }
                  onCopy={copyToClipboard}
                  onDelete={handleDelete}
                  onEdit={(c) => {
                    setEditingCredential(c);
                    setIsEditOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <CredentialFormDialog
          title="Nueva credencial"
          confirmText="Guardar"
          initialData={newCredential}
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
          onChange={(data) => setNewCredential(data)}
        />
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <CredentialFormDialog
          title="Editar credencial"
          confirmText="Actualizar"
          initialData={editingCredential}
          onSubmit={handleUpdate}
          onCancel={() => {
            setIsEditOpen(false);
            setEditingCredential(null);
          }}
          onChange={(data) =>
            setEditingCredential((prev) => (prev ? { ...prev, ...data } : null))
          }
        />
      </Dialog>
    </div>
  );
}
