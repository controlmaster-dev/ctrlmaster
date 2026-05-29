import { ReactNode } from "react";
import { Settings, Search, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { Shift } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ConfiguracionUserCard = {
  id: string;
  name: string;
  email?: string;
  image?: string;
  role?: string;
  lastLogin?: string;
  lastLoginIP?: string;
  lastLoginCountry?: string;
  shifts?: Shift[];
  defaultShifts?: Shift[];
  isTempSchedule?: boolean;
};

type UserRoleGridSectionProps = {
  title: string;
  users: ConfiguracionUserCard[];
  roleFilter: (role: string) => boolean;
  icon: ReactNode;
  onEditUser: (user: ConfiguracionUserCard) => void;
  onDeleteUser: (id: string) => void;
};

function getInitials(name?: string) {
  return (
    name
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "OP"
  );
}

function getRoleBadge(role?: string) {
  if (role === "BOSS") {
    return {
      text: "Coordinador",
      bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    };
  }
  if (role === "ENGINEER") {
    return {
      text: "Ingeniero",
      bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    };
  }
  return {
    text: "Operador",
    bg: "bg-brand/10 text-brand border-brand/20",
  };
}

export function UserRoleGridSection({
  title,
  users,
  roleFilter,
  icon,
  onEditUser,
  onDeleteUser,
}: UserRoleGridSectionProps) {
  const filteredUsers = users.filter((user) => roleFilter(user.role || ""));
  if (filteredUsers.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-muted/40 border border-border flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">
          {title} ({filteredUsers.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredUsers.map((user) => {
          const initials = getInitials(user.name);
          const roleBadge = getRoleBadge(user.role);

          return (
            <div
              key={user.id}
              className="group relative bg-card border border-border hover:border-foreground/15 rounded-lg overflow-hidden transition-all duration-200 shadow-none flex flex-col justify-between"
            >
              <div className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <Avatar className="w-10 h-10 border border-border/80 rounded-lg">
                        <AvatarImage src={user.image} className="rounded-lg object-cover" />
                        <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-xs rounded-lg">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-background shadow-sm"
                        style={{ backgroundColor: user.lastLogin ? "#10b981" : "#6b7280" }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-foreground leading-snug truncate group-hover:text-brand transition-colors">
                        {user.name}
                      </h4>
                      <span className="text-[9px] text-muted-foreground font-mono font-medium opacity-50 block mt-0.5">
                        #{user.id.slice(0, 8)}
                      </span>
                    </div>
                  </div>

                  <span className={cn("shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-[2px] border text-[8px] font-semibold tracking-wider uppercase", roleBadge.bg)}>
                    {roleBadge.text}
                  </span>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="bg-muted/10 rounded-lg p-2 border border-border/40">
                    <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 opacity-60">
                      Correo Electrónico
                    </p>
                    <p className="text-foreground font-medium truncate leading-tight">
                      {user.email}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="bg-muted/10 rounded-lg p-2 border border-border/40 min-w-0">
                      <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 opacity-60">
                        Último Acceso
                      </p>
                      <p className="text-foreground font-medium truncate leading-tight">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString("es-CR", {
                              month: "short",
                              day: "numeric",
                            })
                          : "Nunca"}
                      </p>
                    </div>
                    <div className="bg-muted/10 rounded-lg p-2 border border-border/40 min-w-0">
                      <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 opacity-60">
                        Ubicación
                      </p>
                      <p className="text-foreground font-medium truncate leading-tight">
                        {user.lastLoginCountry || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-2 bg-muted/10 border-t border-border/40 flex justify-between items-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground p-0 px-2"
                    >
                      <Search className="w-3.5 h-3.5 mr-1" /> Detalles
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border text-foreground max-w-md p-0 overflow-hidden shadow-2xl rounded-lg ring-1 ring-border">
                    <div className="bg-muted/30 border-b border-border p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16 border border-border rounded-lg shadow-sm">
                          <AvatarImage src={user.image} className="rounded-lg object-cover" />
                          <AvatarFallback className="bg-background text-muted-foreground text-lg font-semibold rounded-lg">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-primary font-semibold text-[9px] uppercase tracking-wider mb-1">
                            {roleBadge.text}
                          </div>
                          <h3 className="text-2xl font-semibold tracking-tight text-foreground leading-none">
                            {user.name}
                          </h3>
                          <p className="text-muted-foreground text-xs font-medium mt-1.5 tracking-tight">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-[9px] font-semibold uppercase tracking-widest opacity-60">
                            Último acceso
                          </p>
                          <p className="text-foreground font-medium text-xs">
                            {user.lastLogin
                              ? new Date(user.lastLogin).toLocaleString("es-CR")
                              : "Nunca"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-[9px] font-semibold uppercase tracking-widest opacity-60">
                            IP de conexión
                          </p>
                          <p className="text-foreground font-mono font-medium text-xs tracking-tighter">
                            {user.lastLoginIP || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditUser(user)}
                    className="h-7 w-7 rounded-md text-muted-foreground hover:text-brand hover:bg-brand/10 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </Button>
                  {user.role !== "BOSS" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteUser(user.id)}
                      className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
