import {
  ClipboardList,
  Headset,
  Home,
  Key,
  Layout,
  MonitorPlay,
  type LucideIcon,
} from "lucide-react";

export type NavLinkConfig = {
  href: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
  show?: boolean;
};

export const LOGO_URL =
  "https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png";

export const mainNav: NavLinkConfig[] = [
  { href: "/", icon: Home, label: "Inicio", exact: true },
  { href: "/reportes", icon: Layout, label: "Reportes" },
  { href: "/diarios", icon: ClipboardList, label: "Diarios" },
  { href: "/claves", icon: Key, label: "Contraseñas" },
];

export const secondaryLinks: NavLinkConfig[] = [
  { href: "/operadores", icon: Headset, label: "Operadores", show: true },
  { href: "/operadores/monitoreo", icon: MonitorPlay, label: "Monitoreo", show: true },
];

export const mobileLeftLinks: NavLinkConfig[] = [
  { href: "/", icon: Home, label: "Inicio", exact: true },
  { href: "/reportes", icon: Layout, label: "Reportes" },
  { href: "/diarios", icon: ClipboardList, label: "Diarios" },
];

export const mobileRightLinks: NavLinkConfig[] = [
  { href: "/operadores/monitoreo", icon: MonitorPlay, label: "Monitoreo" },
  { href: "/claves", icon: Key, label: "Claves" },
];

export function isRouteActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href) && href !== "/";
}

export function getLinkDescription(label: string) {
  if (label === "Diarios") return "Funciones obligatorias por operador";
  if (label === "Operadores") return "Disponibilidad y turnos";
  if (label === "Monitoreo") return "Señales en tiempo real";
  return "Ajustes y preferencias";
}

export function getInitials(name?: string | null) {
  return (
    name
      ?.split(" ")
      .filter(Boolean)
      .map((item) => item[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "CM"
  );
}

export function getRoleLabel(role?: string | null) {
  if (role === "ENGINEER") return "Ingeniero";
  if (role === "ADMIN") return "Administrador";
  if (role === "BOSS") return "Con permisos de admin";
  if (role === "OPERATOR") return "Operador";
  return role;
}
