import { auth } from "@clerk/nextjs/server";
import { Compass, Sparkles } from "lucide-react";
import Link from "next/link";

import { db } from "@/lib/db";
import { CourseCard } from "@/features/courses/components/CourseCard";
import { Badge } from "@/components/ui/badge";

const DEMO_FACULTIES = [
  { id: "fac-math", name: "Facultad de Matemáticas", slug: "matematicas" },
  { id: "fac-sci", name: "Facultad de Ciencias", slug: "ciencias" },
  { id: "fac-hum", name: "Facultad de Humanidades", slug: "humanidades" },
];

interface CourseItem {
  id: string;
  title: string;
  imageUrl: string | null;
  chapters: { id: string }[];
  price: number | null;
  progress: number | null;
  category: { name: string; slug?: string } | null;
  faculty: { name: string; slug?: string } | null;
  level?: "BASIC" | "INTERMEDIATE" | "ADVANCED" | "PRE_UNIVERSITY";
}

const DEMO_COURSES: CourseItem[] = [
  {
    id: "demo-algebra",
    title: "Álgebra Preuniversitaria: Ecuaciones, Polinomios y Funciones",
    imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800",
    chapters: [{ id: "c1" }, { id: "c2" }, { id: "c3" }, { id: "c4" }, { id: "c5" }],
    price: 49.0,
    progress: 60,
    category: { name: "Álgebra", slug: "algebra" },
    faculty: { name: "Facultad de Matemáticas", slug: "matematicas" },
    level: "PRE_UNIVERSITY",
  },
  {
    id: "demo-rm",
    title: "Razonamiento Matemático: Planteo de Ecuaciones y Certezas",
    imageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=800",
    chapters: [{ id: "c1" }, { id: "c2" }, { id: "c3" }, { id: "c4" }],
    price: 39.0,
    progress: 25,
    category: { name: "Razonamiento Matemático (RM)", slug: "razonamiento-matematico" },
    faculty: { name: "Facultad de Matemáticas", slug: "matematicas" },
    level: "PRE_UNIVERSITY",
  },
  {
    id: "demo-geometria",
    title: "Geometría Plana y del Espacio: Áreas, Volúmenes y Teoremas",
    imageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=800",
    chapters: [{ id: "c1" }, { id: "c2" }, { id: "c3" }],
    price: 45.0,
    progress: null,
    category: { name: "Geometría", slug: "geometria" },
    faculty: { name: "Facultad de Matemáticas", slug: "matematicas" },
    level: "PRE_UNIVERSITY",
  },
  {
    id: "demo-fisica",
    title: "Física Fundamental: Cinemática, Dinámica y Electromagnetismo",
    imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=800",
    chapters: [{ id: "c1" }, { id: "c2" }, { id: "c3" }, { id: "c4" }, { id: "c5" }, { id: "c6" }],
    price: 59.0,
    progress: null,
    category: { name: "Física", slug: "fisica" },
    faculty: { name: "Facultad de Ciencias", slug: "ciencias" },
    level: "PRE_UNIVERSITY",
  },
  {
    id: "demo-quimica",
    title: "Química General: Estructura Atómica, Enlaces y Estequiometría",
    imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=800",
    chapters: [{ id: "c1" }, { id: "c2" }, { id: "c3" }, { id: "c4" }],
    price: 49.0,
    progress: null,
    category: { name: "Química", slug: "quimica" },
    faculty: { name: "Facultad de Ciencias", slug: "ciencias" },
    level: "PRE_UNIVERSITY",
  },
  {
    id: "demo-historia",
    title: "Historia del Perú: Del Tahuantinsuyo a la República",
    imageUrl: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=800",
    chapters: [{ id: "c1" }, { id: "c2" }, { id: "c3" }],
    price: 35.0,
    progress: null,
    category: { name: "Historia del Perú", slug: "historia-del-peru" },
    faculty: { name: "Facultad de Humanidades", slug: "humanidades" },
    level: "PRE_UNIVERSITY",
  },
];

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ faculty?: string; category?: string }>;
}) {
  const { userId } = await auth();
  const { faculty: facultyFilter, category: categoryFilter } = await searchParams;

  let faculties = DEMO_FACULTIES;
  let coursesList: CourseItem[] = DEMO_COURSES;

  try {
    const facultiesDb = await db.faculty.findMany({
      include: { categories: true },
      orderBy: { name: "asc" },
    });

    if (facultiesDb.length > 0) {
      faculties = facultiesDb;
    }

    const coursesDb = await db.course.findMany({
      where: {
        isPublished: true,
        ...(facultyFilter && {
          faculty: { slug: facultyFilter },
        }),
        ...(categoryFilter && {
          category: { slug: categoryFilter },
        }),
      },
      include: {
        faculty: true,
        category: true,
        chapters: {
          where: { isPublished: true },
          include: {
            userProgress: userId ? { where: { userId } } : false,
          },
        },
        purchases: userId ? { where: { userId } } : false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (coursesDb.length > 0) {
      coursesList = coursesDb.map((c) => {
        const totalChapters = c.chapters.length;
        const completedChapters = c.chapters.filter(
          (chap) => chap.userProgress && chap.userProgress[0]?.isCompleted
        ).length;

        const hasStarted =
          c.chapters.some(
            (chap) => chap.userProgress && chap.userProgress.length > 0
          ) || (c.purchases && c.purchases.length > 0);

        const progress = hasStarted && totalChapters > 0
          ? Math.round((completedChapters / totalChapters) * 100)
          : null;

        return {
          id: c.id,
          title: c.title,
          imageUrl: c.imageUrl,
          chapters: c.chapters,
          price: c.price,
          progress,
          category: c.category,
          faculty: c.faculty,
          level: c.level,
        };
      });
    }
  } catch (error) {
    console.warn("[COURSES] DB offline, usando datos demo:", error instanceof Error ? error.message : "");
  }

  // Filtrado de cursos demo si DB no está conectada
  const filteredCourses = coursesList.filter((course) => {
    if (facultyFilter && course.faculty?.slug !== facultyFilter) return false;
    if (categoryFilter && course.category?.slug !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Encabezado */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
            <Compass className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Catálogo Preuniversitario
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          Explora los Cursos de Alto Rendimiento
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Especializados para los exámenes de admisión de la Universidad Nacional Mayor de San Marcos (UNMSM) y Universidad Nacional de Ingeniería (UNI).
        </p>
      </div>

      {/* Filtros por Facultad */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-b border-slate-800 pb-4">
        <Link href="/courses">
          <Badge
            variant={!facultyFilter ? "default" : "outline"}
            className="cursor-pointer text-xs py-1 px-3"
          >
            Todas las Facultades
          </Badge>
        </Link>
        {faculties.map((f) => {
          const isSelected = facultyFilter === f.slug;
          return (
            <Link key={f.id} href={`/courses?faculty=${f.slug}`}>
              <Badge
                variant={
                  isSelected
                    ? f.slug === "matematicas"
                      ? "math"
                      : f.slug === "ciencias"
                      ? "science"
                      : "humanities"
                    : "outline"
                }
                className="cursor-pointer text-xs py-1 px-3"
              >
                {f.name}
              </Badge>
            </Link>
          );
        })}
      </div>

      {/* Grid de Cursos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
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

        {filteredCourses.length === 0 && (
          <div className="col-span-full rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center space-y-3">
            <Sparkles className="h-8 w-8 text-indigo-400 mx-auto" />
            <p className="text-base font-semibold text-slate-200">
              No se encontraron cursos con este filtro
            </p>
            <p className="text-xs text-slate-400">
              Prueba seleccionando otra facultad o limpiando los filtros de búsqueda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
