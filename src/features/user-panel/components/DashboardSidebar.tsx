"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  Calculator,
  Atom,
  BookOpen,
  Users,
  GraduationCap,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-indigo-400",
  },
  {
    label: "Explorar Cursos",
    icon: Compass,
    href: "/courses",
    color: "text-slate-300",
  },
  {
    label: "F. Matemáticas",
    icon: Calculator,
    href: "/faculties/matematicas",
    color: "text-blue-400",
  },
  {
    label: "F. Ciencias",
    icon: Atom,
    href: "/faculties/ciencias",
    color: "text-emerald-400",
  },
  {
    label: "F. Humanidades",
    icon: BookOpen,
    href: "/faculties/humanidades",
    color: "text-purple-400",
  },
  {
    label: "Comunidad Zenit",
    icon: Users,
    href: "/community",
    color: "text-amber-400",
  },
];

interface DashboardSidebarProps {
  onNavigate?: () => void;
}

export const DashboardSidebar = ({ onNavigate }: DashboardSidebarProps) => {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col overflow-y-auto border-r border-slate-800 bg-slate-900/95 py-4 shadow-xl backdrop-blur-md">
      {/* Logotipo Academia Zenit */}
      <div className="px-6 py-2 mb-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-x-2.5 transition-transform hover:scale-[1.02]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 text-white shadow-md shadow-indigo-500/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1">
              Zenit <span className="text-emerald-400">Academy</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
              Alto Rendimiento
            </span>
          </div>
        </Link>
      </div>

      {/* Menú de navegación */}
      <div className="flex flex-1 flex-col px-3 space-y-1">
        <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Navegación
        </div>
        {routes.map((route) => {
          const isActive =
            pathname === route.href ||
            (route.href !== "/dashboard" && pathname?.startsWith(route.href));
          const Icon = route.icon;

          return (
            <Link
              key={route.href}
              href={route.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60",
                isActive &&
                  "bg-indigo-600/15 text-indigo-300 font-semibold border-l-2 border-indigo-500 hover:bg-indigo-600/20 hover:text-indigo-200"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  route.color,
                  isActive && "text-indigo-400"
                )}
              />
              <span>{route.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Banner inferior: Membresía Zenit Pass */}
      <div className="px-4 pt-4">
        <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 to-slate-950 p-3.5 space-y-2 text-center">
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-slate-200">Zenit Pass Pro</p>
            <p className="text-[11px] text-slate-400 leading-tight">
              Acceso ilimitado a todas las clases y simulacros
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
