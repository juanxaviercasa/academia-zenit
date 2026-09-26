"use client";

import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

interface CourseSidebarItemProps {
  label: string;
  id: string;
  isCompleted: boolean;
  courseId: string;
  isLocked: boolean;
  position: number;
}

export const CourseSidebarItem = ({
  label,
  id,
  isCompleted,
  courseId,
  isLocked,
  position,
}: CourseSidebarItemProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const Icon = isLocked ? Lock : isCompleted ? CheckCircle2 : PlayCircle;
  const isActive = pathname?.includes(id);

  const onClick = () => {
    router.push(`/courses/${courseId}/chapters/${id}`);
  };

  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "group flex w-full items-center gap-x-3 text-left px-4 py-3.5 text-sm font-medium transition-all duration-150 border-r-2 border-transparent",
        "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50",
        isActive &&
          "text-indigo-300 bg-indigo-950/40 border-indigo-500 hover:bg-indigo-950/50 hover:text-indigo-200",
        isCompleted &&
          "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30",
        isCompleted &&
          isActive &&
          "text-emerald-300 bg-emerald-950/40 border-emerald-500",
        isLocked &&
          "text-slate-500 hover:text-slate-400 hover:bg-slate-900/40 opacity-75"
      )}
    >
      <div className="flex items-center gap-x-3 truncate">
        <Icon
          size={18}
          className={cn(
            "shrink-0 text-slate-500 group-hover:text-slate-300 transition-colors",
            isActive && "text-indigo-400 group-hover:text-indigo-300",
            isCompleted && "text-emerald-400 group-hover:text-emerald-300",
            isLocked && "text-slate-500"
          )}
        />
        <div className="truncate flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500 shrink-0">
            {String(position).padStart(2, "0")}
          </span>
          <span className="truncate">{label}</span>
        </div>
      </div>
    </button>
  );
};
