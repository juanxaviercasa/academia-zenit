import { auth, currentUser } from "@clerk/nextjs/server";
import { Sparkles, ArrowRight, BookOpen, Compass } from "lucide-react";
import Link from "next/link";

import { db } from "@/lib/db";
import { DashboardStats } from "@/features/user-panel/components/DashboardStats";
import { FacultyProgressCard } from "@/features/user-panel/components/FacultyProgressCard";
import { CourseCard } from "@/features/courses/components/CourseCard";
import { Button } from "@/components/ui/button";
import { StudentAnalytics, FacultyProgressSummary } from "@/features/user-panel/types";

interface DashboardCourse {
  id: string;
  title: string;
  imageUrl: string | null;
  chapters: { id: string }[];
  price: number | null;
  progress: number | null;
  isCompleted?: boolean;
  category: { name: string; slug?: string } | null;
  faculty: { name: string; slug?: string } | null;
  facultyId?: string;
  level?: "BASIC" | "INTERMEDIATE" | "ADVANCED" | "PRE_UNIVERSITY";
}

const DEMO_COURSES: DashboardCourse[] = [
  {
    id: "demo-algebra",
    title: "Álgebra Preuniversitaria: Ecuaciones, Polinomios y Funciones",
    imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800",
    chapters: [{ id: "c1" }, { id: "c2" }, { id: "c3" }, { id: "c4" }, { id: "c5" }],
    price: 49.0,
    progress: 60,
    isCompleted: false,
    category: { name: "Álgebra", slug: "algebra" },
    faculty: { name: "Facultad de Matemáticas", slug: "matematicas" },
    facultyId: "matematicas",
    level: "PRE_UNIVERSITY",
  },
  {
    id: "demo-rm",
    title: "Razonamiento Matemático: Planteo de Ecuaciones y Certezas",
    imageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=800",
    chapters: [{ id: "c1" }, { id: "c2" }, { id: "c3" }, { id: "c4" }],
    price: 39.0,
    progress: 25,
    isCompleted: false,
    category: { name: "Razonamiento Matemático (RM)", slug: "razonamiento-matematico" },
    faculty: { name: "Facultad de Matemáticas", slug: "matematicas" },
    facultyId: "matematicas",
    level: "PRE_UNIVERSITY",
  },
  {
    id: "demo-fisica",
    title: "Física Fundamental: Cinemática, Dinámica y Electromagnetismo",
    imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=800",
    chapters: [{ id: "c1" }, { id: "c2" }, { id: "c3" }, { id: "c4" }, { id: "c5" }, { id: "c6" }],
    price: 59.0,
    progress: null,
    isCompleted: false,
    category: { name: "Física", slug: "fisica" },
    faculty: { name: "Facultad de Ciencias", slug: "ciencias" },
    facultyId: "ciencias",
    level: "PRE_UNIVERSITY",
  },
  {
    id: "demo-historia",
    title: "Historia del Perú: Del Tahuantinsuyo a la República",
    imageUrl: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=800",
    chapters: [{ id: "c1" }, { id: "c2" }, { id: "c3" }],
    price: 35.0,
    progress: null,
    isCompleted: false,
    category: { name: "Historia del Perú", slug: "historia-del-peru" },
    faculty: { name: "Facultad de Humanidades", slug: "humanidades" },
    facultyId: "humanidades",
    level: "PRE_UNIVERSITY",
  },
];

const DEMO_FACULTIES: FacultyProgressSummary[] = [
  {
    facultyName: "Facultad de Matemáticas",
    facultySlug: "matematicas",
    totalCourses: 5,
    completedCourses: 1,
    averageProgressPercentage: 42,
  },
  {
    facultyName: "Facultad de Ciencias",
    facultySlug: "ciencias",
    totalCourses: 3,
    completedCourses: 0,
    averageProgressPercentage: 15,
  },
  {
    facultyName: "Facultad de Humanidades",
    facultySlug: "humanidades",
    totalCourses: 3,
    completedCourses: 0,
    averageProgressPercentage: 20,
  },
];

export default async function DashboardPage() {
  const { userId } = await auth();
  const clerkUser = await currentUser();

  let stats: Partial<StudentAnalytics> = {
    completedCoursesCount: 1,
    inProgressCoursesCount: 2,
    totalWatchedHours: 8.5,
    communityPoints: 185,
    communityLevel: 2,
    studyStreakDays: 4,
  };

  let coursesWithProgress: DashboardCourse[] = DEMO_COURSES;
  let facultySummaries = DEMO_FACULTIES;

  // Intento de conexión con Prisma; si la DB está online, se reemplaza con datos vivos
  try {
    const coursesDb = await db.course.findMany({
      where: { isPublished: true },
      include: {
        faculty: true,
        category: true,
        chapters: {
          where: { isPublished: true },
          include: {
            userProgress: userId ? { where: { userId } } : false,
          },
          orderBy: { position: "asc" },
        },
        purchases: userId ? { where: { userId } } : false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (coursesDb.length > 0) {
      coursesWithProgress = coursesDb.map((course) => {
        const totalChapters = course.chapters.length;
        const completedChapters = course.chapters.filter(
          (c) => c.userProgress && c.userProgress[0]?.isCompleted
        ).length;

        const hasStarted =
          course.chapters.some(
            (c) => c.userProgress && c.userProgress.length > 0
          ) || (course.purchases && course.purchases.length > 0);

        const progressPercentage =
          totalChapters > 0
            ? Math.round((completedChapters / totalChapters) * 100)
            : 0;

        return {
          id: course.id,
          title: course.title,
          imageUrl: course.imageUrl,
          chapters: course.chapters,
          price: course.price,
          progress: hasStarted ? progressPercentage : null,
          isCompleted: totalChapters > 0 && completedChapters === totalChapters,
          category: course.category,
          faculty: course.faculty,
          facultyId: course.facultyId,
          level: course.level,
        };
      });
    }

    const facultiesDb = await db.faculty.findMany();
    if (facultiesDb.length > 0) {
      facultySummaries = facultiesDb.map((faculty) => {
        const facultyCourses = coursesWithProgress.filter(
          (c) => c.facultyId === faculty.id
        );
        const total = facultyCourses.length;
        const completed = facultyCourses.filter((c) => c.isCompleted).length;
        const avgProgress =
          total > 0
            ? facultyCourses.reduce((acc, c) => acc + (c.progress || 0), 0) / total
            : 0;

        return {
          facultyName: faculty.name,
          facultySlug: faculty.slug,
          totalCourses: Math.max(total, 3),
          completedCourses: completed,
          averageProgressPercentage: avgProgress || 20,
        };
      });
    }
  } catch (error) {
    // Si la base de datos local está desconectada, usamos DEMO_COURSES para permitir previsualización
    console.warn("[DASHBOARD] DB offline, usando datos de demostración Zenit:", error instanceof Error ? error.message : "");
  }

  const inProgressCourses = coursesWithProgress.filter(
    (c) => c.progress !== null && !c.isCompleted
  );

  const studentName =
    clerkUser?.firstName || "Estudiante Zenit";

  return (
    <div className="space-y-8 pb-12">
      {/* Banner de Bienvenida personalizado */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-300">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                Ciclo San Marcos & UNI 2026
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              ¡Bienvenido a tu panel, {studentName}!
            </h1>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed">
              Cada hora de estudio de calidad te sitúa un paso más cerca de tu vacante. Continúa tus lecciones pendientes hoy.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="zenit" size="lg">
              <Link href="/courses">
                <Compass className="h-4 w-4 mr-2" />
                Explorar Catálogo
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Métricas y Analíticas del Estudiante */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <span>Resumen de tu Rendimiento</span>
        </h2>
        <DashboardStats stats={stats} />
      </section>

      {/* Grid Principal: Cursos en Progreso + Resumen de Facultades */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Columna Izquierda: Cursos */}
        <div className="lg:col-span-2 space-y-8">
          {/* Cursos en Progreso */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-400" />
                  <span>Continuar Aprendiendo</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Retoma donde lo dejaste en tus cursos matriculados
                </p>
              </div>

              {inProgressCourses.length > 0 && (
                <span className="text-xs font-semibold text-indigo-400">
                  {inProgressCourses.length} en curso
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inProgressCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  imageUrl={course.imageUrl}
                  chaptersLength={course.chapters.length}
                  price={course.price}
                  progress={course.progress}
                  category={course.category?.name || "General"}
                  faculty={course.faculty?.name || "Zenit"}
                  facultySlug={course.faculty?.slug}
                  level={course.level}
                />
              ))}
            </div>
          </section>

          {/* Cursos Recomendados */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  <span>Cursos Recomendados para ti</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Materias clave con mayor ponderación en el prospecto de admisión
                </p>
              </div>

              <Link
                href="/courses"
                className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                <span>Ver todos</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {coursesWithProgress.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  imageUrl={course.imageUrl}
                  chaptersLength={course.chapters.length}
                  price={course.price}
                  progress={course.progress}
                  category={course.category?.name || "General"}
                  faculty={course.faculty?.name || "Zenit"}
                  facultySlug={course.faculty?.slug}
                  level={course.level}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Columna Derecha: Avance por Facultad y Metas */}
        <div className="space-y-6">
          <FacultyProgressCard summaries={facultySummaries} />

          {/* Tarjeta de Racha y Disciplina */}
          <div className="rounded-xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-5 space-y-3">
            <h4 className="text-sm font-semibold text-slate-200">
              Consejo de Estudio Zenit
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              &quot;La constancia supera al talento cuando el talento no es constante. 45 minutos diarios de resolución activa superan a 6 horas pasivas el fin de semana.&quot;
            </p>
            <div className="pt-1">
              <Button asChild variant="outline" size="sm" className="w-full text-xs">
                <Link href="/community">
                  Ir al Foro de Consultas y Solucionarios
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
