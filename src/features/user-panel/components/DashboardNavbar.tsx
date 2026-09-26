"use client";

import { useState } from "react";
import { Menu, X, Flame, Sparkles } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "@/features/user-panel/components/DashboardSidebar";

interface DashboardNavbarProps {
  streakDays?: number;
  level?: number;
}

export const DashboardNavbar = ({
  streakDays = 1,
  level = 1,
}: DashboardNavbarProps) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 md:px-6 shadow-sm backdrop-blur-md md:pl-68">
        {/* Toggle para móviles */}
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="text-slate-300 hover:text-white"
          >
            {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <span className="font-bold text-sm tracking-tight text-white">
            Zenit <span className="text-emerald-400">Academy</span>
          </span>
        </div>

        {/* Título o estado en desktop */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
          <span>Plataforma de Preparación Preuniversitaria</span>
        </div>

        {/* Acciones de la barra superior: Racha, Nivel Skool y Perfil Clerk */}
        <div className="flex items-center gap-x-3 sm:gap-x-4">
          {/* Racha */}
          <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 shadow-sm">
            <Flame className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{streakDays} {streakDays === 1 ? "día" : "días"}</span>
          </div>

          {/* Nivel Skool */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Nivel {level}</span>
          </div>

          {/* Clerk User Button */}
          <div className="flex items-center">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9 border border-slate-700",
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Drawer Móvil */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full z-10 animate-in slide-in-from-left duration-200">
            <DashboardSidebar onNavigate={() => setIsMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};
