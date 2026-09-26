import { Chapter, Course, Faculty, Category, UserProgress } from "@prisma/client";
import { BookOpen } from "lucide-react";

import { CourseProgress } from "@/features/courses/components/CourseProgress";
import { CourseSidebarItem } from "@/features/courses/components/CourseSidebarItem";
import { Badge } from "@/components/ui/badge";

import { CourseSidebarData } from "@/features/courses/types";

interface CourseSidebarProps {
  course: CourseSidebarData;
  progressCount: number;
  hasAccess?: boolean;
}

export const CourseSidebar = ({
  course,
  progressCount,
  hasAccess = false,
}: CourseSidebarProps) => {
  // Ordenar capítulos por posición ascendente
  const sortedChapters = [...course.chapters].sort(
    (a, b) => a.position - b.position
  );

  return (
    <aside className="flex h-full w-80 flex-col border-r border-slate-800 bg-slate-900/95 shadow-xl backdrop-blur-md">
      {/* Cabecera del sidebar */}
      <div className="flex flex-col border-b border-slate-800 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400">
            <BookOpen className="h-4 w-4" />
          </div>
          {course.faculty && (
            <Badge
              variant={
                course.faculty.slug === "matematicas"
                  ? "math"
                  : course.faculty.slug === "ciencias"
                  ? "science"
                  : "humanities"
              }
              size="sm"
            >
              {course.faculty.name}
            </Badge>
          )}
        </div>

        <h2 className="font-semibold text-slate-100 text-sm line-clamp-2 leading-snug">
          {course.title}
        </h2>

        {course.category && (
          <p className="text-xs text-slate-400">
            Materia: <span className="text-slate-300 font-medium">{course.category.name}</span>
          </p>
        )}

        <div className="pt-2">
          <CourseProgress variant="success" value={progressCount} size="sm" />
        </div>
      </div>

      {/* Lista ordenada de lecciones/capítulos */}
      <div className="flex flex-1 flex-col overflow-y-auto py-2 divide-y divide-slate-800/40">
        <div className="px-4 py-2">
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Contenido del curso ({sortedChapters.length} lecciones)
          </span>
        </div>

        <div className="flex flex-col">
          {sortedChapters.map((chapter) => {
            const isCompleted = !!chapter.userProgress?.[0]?.isCompleted;
            const isLocked = !chapter.isFree && !hasAccess;

            return (
              <CourseSidebarItem
                key={chapter.id}
                id={chapter.id}
                label={chapter.title}
                isCompleted={isCompleted}
                courseId={course.id}
                isLocked={isLocked}
                position={chapter.position}
              />
            );
          })}
        </div>
      </div>
    </aside>
  );
};
