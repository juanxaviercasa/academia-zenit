import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { Calculator, Atom, BookOpen, Layers } from "lucide-react";
import Link from "next/link";

import { db } from "@/lib/db";
import { CourseCard } from "@/features/courses/components/CourseCard";
import { Badge } from "@/components/ui/badge";

const facultyIcons: Record<string, typeof Calculator> = {
  matematicas: Calculator,
  ciencias: Atom,
  humanidades: BookOpen,
};

const DEMO_FACULTY_DATA: Record<
  string,
  {
    name: string;
    description: string;
    categories: { id: string; name: string; slug: string }[];
    courses: {
      id: string;
      title: string;
      imageUrl: string;
      chapters: { id: string }[];
      price: number;
      progress: number | null;
      category: { name: string; slug: string };
      level: "PRE_UNIVERSITY";
    }[];
  }
> = {
  matematicas: {
    name: "Facultad de Matemáticas",
    description: "Dominio de razonamiento abstracto, cálculo y resolución de problemas para preparación preuniversitaria y superior.",
    categories: [
      { id: "c1", name: "Álgebra", slug: "algebra" },
      { id: "c2", name: "Aritmética", slug: "aritmetica" },
      { id: "c3", name: "Geometría", slug: "geometria" },
      { id: "c4", name: "Trigonometría", slug: "trigonometria" },
      { id: "c5", name: "Razonamiento Matemático (RM)", slug: "razonamiento-matematico" },
    ],
    courses: [
      {
        id: "demo-algebra",
        title: "Álgebra Preuniversitaria: Ecuaciones, Polinomios y Funciones",
        imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800",
        chapters: [{ id: "c1" }, { id: "c2" }, { id: "c3" }, { id: "c4" }, { id: "c5" }],
        price: 49.0,
        progress: 60,
        category: { name: "Álgebra", slug: "algebra" },
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
        level: "PRE_UNIVERSITY",
      },
    ],
  },
  ciencias: {
    name: "Facultad de Ciencias",
    description: "Estudio riguroso de las leyes que rigen la materia, la energía y los seres vivos con enfoque experimental y analítico.",
    categories: [
      { id: "c6", name: "Física", slug: "fisica" },
      { id: "c7", name: "Química", slug: "quimica" },
      { id: "c8", name: "Biología", slug: "biologia" },
    ],
    courses: [
      {
        id: "demo-fisica",
        title: "Física Fundamental: Cinemática, Dinámica y Electromagnetismo",
        imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=800",
        chapters: [{ id: "c1" }, { id: "c2" }, { id: "c3" }, { id: "c4" }, { id: "c5" }, { id: "c6" }],
        price: 59.0,
        progress: null,
        category: { name: "Física", slug: "fisica" },
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
        level: "PRE_UNIVERSITY",
      },
    ],
  },
  humanidades: {
    name: "Facultad de Humanidades",
    description: "Comprensión del lenguaje, el entorno geográfico y los procesos históricos para una formación crítica.",
    categories: [
      { id: "c9", name: "Razonamiento Verbal (RV)", slug: "razonamiento-verbal" },
      { id: "c10", name: "Geografía", slug: "geografia" },
      { id: "c11", name: "Historia del Perú", slug: "historia-del-peru" },
    ],
    courses: [
      {
        id: "demo-historia",
        title: "Historia del Perú: Del Tahuantinsuyo a la República",
        imageUrl: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=800",
        chapters: [{ id: "c1" }, { id: "c2" }, { id: "c3" }],
        price: 35.0,
        progress: null,
        category: { name: "Historia del Perú", slug: "historia-del-peru" },
        level: "PRE_UNIVERSITY",
      },
    ],
  },
};

export default async function FacultyPage({
  params,
  searchParams,
}: {
  params: Promise<{ facultySlug: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { userId } = await auth();
  const { facultySlug } = await params;
  const { category: categoryFilter } = await searchParams;

  const validSlugs = ["matematicas", "ciencias", "humanidades"];
  if (!validSlugs.includes(facultySlug)) {
    return notFound();
  }

  const demoData = DEMO_FACULTY_DATA[facultySlug];
  let facultyName = demoData.name;
  let facultyDescription = demoData.description;
  let categories = demoData.categories;
  let coursesList = demoData.courses;

  try {
    const facultyDb = await db.faculty.findUnique({
      where: { slug: facultySlug },
      include: { categories: true },
    });

    if (facultyDb) {
      facultyName = facultyDb.name;
      facultyDescription = facultyDb.description || demoData.description;
      categories = facultyDb.categories;

      const coursesDb = await db.course.findMany({
        where: {
          isPublished: true,
          facultyId: facultyDb.id,
          ...(categoryFilter && { category: { slug: categoryFilter } }),
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
            imageUrl: c.imageUrl || demoData.courses[0]?.imageUrl || "",
            chapters: c.chapters,
            price: c.price || 0,
            progress,
            category: c.category,
            level: c.level as "PRE_UNIVERSITY",
          };
        });
      }
    }
  } catch (error) {
    console.warn("[FACULTY] DB offline, usando datos demo:", error instanceof Error ? error.message : "");
  }

  const filteredCourses = coursesList.filter((course) => {
    if (categoryFilter && course.category.slug !== categoryFilter) return false;
    return true;
  });

  const Icon = facultyIcons[facultySlug] || Layers;

  return (
    <div className="space-y-6 pb-16">
      {/* Cabecera de la Facultad */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 p-6 md:p-8 space-y-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <Badge
              variant={
                facultySlug === "matematicas"
                  ? "math"
                  : facultySlug === "ciencias"
                  ? "science"
                  : "humanities"
              }
              size="sm"
            >
              Área Académica
            </Badge>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              {facultyName}
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
          {facultyDescription}
        </p>
      </div>

      {/* Filtro por Materia / Categoría */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
        <Link href={`/faculties/${facultySlug}`}>
          <Badge
            variant={!categoryFilter ? "default" : "outline"}
            className="cursor-pointer text-xs py-1 px-3"
          >
            Todas las materias
          </Badge>
        </Link>
        {categories.map((cat) => {
          const isSelected = categoryFilter === cat.slug;
          return (
            <Link
              key={cat.id}
              href={`/faculties/${facultySlug}?category=${cat.slug}`}
            >
              <Badge
                variant={isSelected ? "secondary" : "outline"}
                className="cursor-pointer text-xs py-1 px-3"
              >
                {cat.name}
              </Badge>
            </Link>
          );
        })}
      </div>

      {/* Grid de Cursos de la Facultad */}
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
            faculty={facultyName}
            facultySlug={facultySlug}
            level={course.level}
          />
        ))}

        {filteredCourses.length === 0 && (
          <div className="col-span-full rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400">
            No hay cursos publicados para esta materia en este momento.
          </div>
        )}
      </div>
    </div>
  );
}
