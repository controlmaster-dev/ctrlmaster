"use client";

import { Crown, MapPin, Search, Shield, Users, Wrench } from "lucide-react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ActiveUsersWidget } from "@/components/ActiveUsersWidget";
import { UserRoleGridSection, type ConfiguracionUserCard } from "@/components/configuracion/UserRoleGridSection";
import { cn } from "@/lib/utils";

const LoginMap = dynamic(
  () => import("@/components/LoginMap").then((m) => m.LoginMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full animate-pulse rounded-lg bg-muted/40" />
    ),
  }
);

type ConfiguracionUsersTabProps = {
  users: ConfiguracionUserCard[];
  onEditUser: (user: ConfiguracionUserCard) => void;
  onDeleteUser: (id: string) => void;
};

export function ConfiguracionUsersTab({
  users,
  onEditUser,
  onDeleteUser,
}: ConfiguracionUsersTabProps) {
  const stats = [
    {
      label: "Equipo Total",
      value: users.length,
      icon: Users,
      color: "text-brand",
      bg: "bg-brand/5 border-brand/10",
    },
    {
      label: "Coordinadores",
      value: users.filter((u) => u.role === "BOSS").length,
      icon: Crown,
      color: "text-amber-500",
      bg: "bg-amber-500/5 border-amber-500/10",
    },
    {
      label: "Ingenieros",
      value: users.filter((u) => u.role === "ENGINEER").length,
      icon: Wrench,
      color: "text-purple-500",
      bg: "bg-purple-500/5 border-purple-500/10",
    },
    {
      label: "Operadores",
      value: users.filter((u) => !["BOSS", "ENGINEER"].includes(u.role || "")).length,
      icon: Shield,
      color: "text-blue-500",
      bg: "bg-blue-500/5 border-blue-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-5 shadow-none transition-all duration-200 group hover:border-foreground/15"
          >
            <div className="space-y-1">
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
                {stat.value}
              </p>
            </div>
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg border transition-all duration-200 group-hover:scale-105",
                stat.bg,
                stat.color
              )}
            >
              <stat.icon className="h-5 w-5 shrink-0" />
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden rounded-lg border border-border bg-card shadow-none">
        <CardHeader className="border-b border-border bg-muted/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
              <Search className="h-4 w-4 opacity-75" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Explorador de Personal</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Listado de colaboradores registrados según su cargo y perfil de usuario.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-12">
            <UserRoleGridSection
              title="Coordinadores"
              users={users}
              roleFilter={(role) => role === "BOSS"}
              icon={<Crown className="h-4 w-4 text-amber-500" />}
              onEditUser={onEditUser}
              onDeleteUser={onDeleteUser}
            />
            <UserRoleGridSection
              title="Ingenieros"
              users={users}
              roleFilter={(role) => role === "ENGINEER"}
              icon={<Wrench className="h-4 w-4 text-purple-500" />}
              onEditUser={onEditUser}
              onDeleteUser={onDeleteUser}
            />
            <UserRoleGridSection
              title="Operadores"
              users={users}
              roleFilter={(role) => !["BOSS", "ENGINEER"].includes(role || "")}
              icon={<Shield className="h-4 w-4 text-blue-500" />}
              onEditUser={onEditUser}
              onDeleteUser={onDeleteUser}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-lg border border-border bg-card shadow-none">
        <CardHeader className="border-b border-border bg-muted/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
              <MapPin className="h-4 w-4 opacity-75" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Actividad y Conexión de la Plataforma
              </h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Ubicación geográfica de los accesos y estado en tiempo real del personal.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 p-6">
          <LoginMap users={users} />
          <ActiveUsersWidget users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
