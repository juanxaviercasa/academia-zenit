import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { FileText, Download, ChevronLeft, ChevronRight, MessageSquare, BookOpen } from "lucide-react";
import Link from "next/link";

import { db } from "@/lib/db";
import { VideoPlayer } from "@/features/courses/components/VideoPlayer";
import { CourseProgressButton } from "@/features/courses/components/CourseProgressButton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const DEMO_CHAPTERS: Record<string, {
  id: string;
  title: string;
  description: string;
  position: number;
  isFree: boolean;
  isPublished: boolean;
  playbackId: string;
  nextChapterId: string | null;
  courseTitle: string;
  courseId: string;
  categoryName: string;
  facultyName: string;
}> = {
  c1: {
    id: "c1",
    title: "1. Introducción al Álgebra y Teoría de Exponentes",
    description: `En esta lección fundamental abordamos:
- Leyes de exponentes: Producto y cociente de bases iguales, potencia de potencia.
- Exponente fraccionario y radicación sucesiva.
- Trucos y propiedades de simplificación para preguntas tipo examen de admisión UNMSM y UNI.
- Resolución detallada de 5 ejercicios modelo paso a paso.`,
    position: 1,
    isFree: true,
    isPublished: true,
    playbackId: "EcHgOK9coz5K4rjSwOkoE7Y7O012012Km6m02C01A01F01Ec", // Big Buck Bunny demo stream en Mux
    nextChapterId: "c2",
    courseTitle: "Álgebra Preuniversitaria: Ecuaciones, Polinomios y Funciones",
    courseId: "demo-algebra",
    categoryName: "Álgebra",
    facultyName: "Facultad de Matemáticas",
  },
  c2: {
    id: "c2",
    title: "2. Polinomios Especiales y Grados",
    description: `Dominio de polinomios homogéneos, ordenados, completos e idénticos. Cálculo de valor numérico y suma de coeficientes.`,
    position: 2,
    isFree: true,
    isPublished: true,
    playbackId: "EcHgOK9coz5K4rjSwOkoE7Y7O012012Km6m02C01A01F01Ec",
    nextChapterId: "c3",
    courseTitle: "Álgebra Preuniversitaria: Ecuaciones, Polinomios y Funciones",
    courseId: "demo-algebra",
    categoryName: "Álgebra",
    facultyName: "Facultad de Matemáticas",
  },
  c3: {
    id: "c3",
    title: "3. Productos Notables y Factorización Avanzada",
    description: `Identidades de Legendre, Cauchy y Lagrange. Criterio del aspa doble especial y divisores binómicos.`,
    position: 3,
    isFree: false,
    isPublished: true,
    playbackId: "EcHgOK9coz5K4rjSwOkoE7Y7O012012Km6m02C01A01F01Ec",
    nextChapterId: "c4",
    courseTitle: "Álgebra Preuniversitaria: Ecuaciones, Polinomios y Funciones",
    courseId: "demo-algebra",
    categoryName: "Álgebra",
    facultyName: "Facultad de Matemáticas",
  },
};

export default async function ChapterIdPage({
  params,
}: {
  params: Promise<{ courseId: string; chapterId: string }>;
}) {
  const { userId } = await auth();
  const { courseId, chapterId } = await params;

  let chapter = null;
  let course = null;
  let nextChapter = null;

  try {
    const chapterDb = await db.chapter.findUnique({
      where: { id: chapterId, courseId },
      include: { muxData: true },
    });

    const courseDb = await db.course.findUnique({
      where: { id: courseId },
      include: {
        attachments: true,
        faculty: true,
        category: true,
      },
    });

    if (chapterDb && courseDb) {
      chapter = chapterDb;
      course = courseDb;

      nextChapter = await db.chapter.findFirst({
        where: {
          courseId,
          isPublished: true,
          position: { gt: chapterDb.position },
        },
        orderBy: { position: "asc" },
      });
    }
  } catch (e) {
    console.warn("[CHAPTER_PAGE] DB offline:", e instanceof Error ? e.message : "");
  }

  // Fallback demo data
  const demoChapter = DEMO_CHAPTERS[chapterId] || DEMO_CHAPTERS["c1"];

  const title = chapter?.title || demoChapter.title;
  const description = chapter?.description || demoChapter.description;
  const isFree = chapter ? chapter.isFree : demoChapter.isFree;
  const playbackId = chapter?.muxData?.playbackId || demoChapter.playbackId;
  const nextChapterId = nextChapter?.id || demoChapter.nextChapterId;

  // Acceso: libre en prueba
  const hasAccess = true;
  const isLocked = !isFree && !hasAccess;
  const isCompleted = chapterId === "c1"; // Simulación

  return (
    <div className="flex flex-col max-w-5xl mx-auto pb-20 w-full px-4 sm:px-6 pt-4 space-y-6">
      {/* Reproductor de Video con Mux */}
      <div className="w-full">
        <VideoPlayer
          chapterId={chapterId}
          courseId={courseId}
          title={title}
          playbackId={playbackId}
          isLocked={isLocked}
          completeOnEnd={true}
          nextChapterId={nextChapterId || undefined}
        />
      </div>

      {/* Controles de Acción y Progreso */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="math">Facultad de Matemáticas</Badge>
            <Badge variant="outline" className="text-slate-400">
              {isFree ? "Clase de Prueba Gratuita" : "Clase Pro"}
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <CourseProgressButton
            chapterId={chapterId}
            courseId={courseId}
            nextChapterId={nextChapterId || undefined}
            isCompleted={isCompleted}
          />
        </div>
      </div>

      <Separator className="bg-slate-800" />

      {/* Pestañas de Contenido / Recursos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Descripción de la clase y notas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-400" />
              Temario y Resumen de la Lección
            </h2>
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line font-mono sm:font-sans">
              {description}
            </div>
          </div>
        </div>

        {/* Recursos y dudas de la comunidad */}
        <div className="space-y-4">
          {/* Material Descargable */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              Guías de Ejercicios (PDF)
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/60 text-xs">
                <span className="text-slate-300 font-medium truncate max-w-[170px]">
                  Guia_Teoria_Exponentes_Semana1.pdf
                </span>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-indigo-400 hover:text-indigo-300">
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/60 text-xs">
                <span className="text-slate-300 font-medium truncate max-w-[170px]">
                  Solucionario_Examenes_UNI_UNMSM.pdf
                </span>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-indigo-400 hover:text-indigo-300">
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Enlace al Foro de la Clase */}
          <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/30 to-slate-950 p-5 space-y-2 text-center">
            <MessageSquare className="h-6 w-6 text-indigo-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">¿Dudas con esta clase?</h4>
            <p className="text-xs text-slate-400">
              Consulta en el canal de Álgebra y debate con otros estudiantes en la comunidad.
            </p>
            <Button asChild variant="outline" size="sm" className="w-full text-xs mt-2 border-indigo-500/30">
              <Link href="/community">Preguntar en la Comunidad</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
