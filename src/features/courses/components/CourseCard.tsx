import Image from "next/image";
import Link from "next/link";
import { BookOpen, Sparkles, GraduationCap } from "lucide-react";
import { CourseLevel } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { CourseProgress } from "@/features/courses/components/CourseProgress";
import { formatPrice } from "@/lib/utils";

interface CourseCardProps {
  id: string;
  title: string;
  imageUrl?: string | null;
  chaptersLength: number;
  price?: number | null;
  progress: number | null;
  category: string;
  faculty: string;
  facultySlug?: string;
  level?: CourseLevel | string;
}

const levelMap: Record<string, string> = {
  BASIC: "Básico",
  INTERMEDIATE: "Intermedio",
  ADVANCED: "Avanzado",
  PRE_UNIVERSITY: "Preuniversitario",
};

export const CourseCard = ({
  id,
  title,
  imageUrl,
  chaptersLength,
  price,
  progress,
  category,
  faculty,
  facultySlug,
  level = "PRE_UNIVERSITY",
}: CourseCardProps) => {
  const getFacultyVariant = (slug?: string) => {
    if (slug === "matematicas") return "math";
    if (slug === "ciencias") return "science";
    if (slug === "humanidades") return "humanities";
    return "default";
  };

  return (
    <Link href={`/courses/${id}`} className="group block h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-500/10">
        {/* Banner o Imagen del curso */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-800">
          {imageUrl ? (
            <Image
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              alt={title}
              src={imageUrl}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
              <div className="flex flex-col items-center gap-2 text-indigo-400/80">
                <GraduationCap className="h-10 w-10 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Academia Zenit
                </span>
              </div>
            </div>
          )}

          {/* Badges superiores sobre imagen */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
            <Badge variant={getFacultyVariant(facultySlug)} size="sm">
              {faculty}
            </Badge>
          </div>

          <div className="absolute top-2.5 right-2.5">
            <Badge variant="secondary" size="sm" className="bg-slate-950/80 backdrop-blur-md">
              {levelMap[level] || level}
            </Badge>
          </div>
        </div>

        {/* Contenido de la tarjeta */}
        <div className="flex flex-1 flex-col p-4 space-y-3 justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-indigo-400">
              {category}
            </p>
            <h3 className="line-clamp-2 text-base font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
              {title}
            </h3>
          </div>

          <div className="space-y-3 pt-2">
            {/* Meta info: Capítulos */}
            <div className="flex items-center gap-x-2 text-xs text-slate-400">
              <div className="flex items-center gap-x-1">
                <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  {chaptersLength} {chaptersLength === 1 ? "lección" : "lecciones"}
                </span>
              </div>
            </div>

            {/* Progreso del estudiante o Precio de compra */}
            {progress !== null ? (
              <CourseProgress
                size="sm"
                value={progress}
                variant={progress === 100 ? "success" : "default"}
              />
            ) : (
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-sm">
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Acceso Completo</span>
                </div>
                <span className="font-semibold text-slate-100">
                  {price ? formatPrice(price) : "Gratis / Zenit Pass"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
