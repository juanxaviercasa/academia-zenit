import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { CourseNavbar } from "@/features/courses/components/CourseNavbar";
import { CourseSidebar } from "@/features/courses/components/CourseSidebar";

const DEMO_COURSE_MAP: Record<string, {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  faculty: { name: string; slug: string };
  category: { name: string; slug: string };
  chapters: {
    id: string;
    title: string;
    position: number;
    isFree: boolean;
    isPublished: boolean;
    courseId: string;
    description: string | null;
    videoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    userProgress?: { id: string; userId: string; chapterId: string; isCompleted: boolean; watchedSeconds: number; lastWatchedAt: Date; createdAt: Date; updatedAt: Date }[];
  }[];
}> = {
  "demo-algebra": {
    id: "demo-algebra",
    title: "Álgebra Preuniversitaria: Ecuaciones, Polinomios y Funciones",
    description: "Dominio integral del álgebra preuniversitaria con resolución de exámenes San Marcos y UNI.",
    imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800",
    price: 49.0,
    faculty: { name: "Facultad de Matemáticas", slug: "matematicas" },
    category: { name: "Álgebra", slug: "algebra" },
    chapters: [
      { id: "c1", title: "1. Introducción al Álgebra y Teoría de Exponentes", position: 1, isFree: true, isPublished: true, courseId: "demo-algebra", description: null, videoUrl: null, createdAt: new Date(), updatedAt: new Date(), userProgress: [{ id: "up1", userId: "u1", chapterId: "c1", isCompleted: true, watchedSeconds: 1200, lastWatchedAt: new Date(), createdAt: new Date(), updatedAt: new Date() }] },
      { id: "c2", title: "2. Polinomios Especiales y Grados", position: 2, isFree: true, isPublished: true, courseId: "demo-algebra", description: null, videoUrl: null, createdAt: new Date(), updatedAt: new Date(), userProgress: [{ id: "up2", userId: "u1", chapterId: "c2", isCompleted: false, watchedSeconds: 450, lastWatchedAt: new Date(), createdAt: new Date(), updatedAt: new Date() }] },
      { id: "c3", title: "3. Productos Notables y Factorización Avanzada", position: 3, isFree: false, isPublished: true, courseId: "demo-algebra", description: null, videoUrl: null, createdAt: new Date(), updatedAt: new Date(), userProgress: [] },
      { id: "c4", title: "4. Ecuaciones Lineales y Cuadráticas (Discriminante)", position: 4, isFree: false, isPublished: true, courseId: "demo-algebra", description: null, videoUrl: null, createdAt: new Date(), updatedAt: new Date(), userProgress: [] },
      { id: "c5", title: "5. Sistema de Ecuaciones y Matrices para Admisión", position: 5, isFree: false, isPublished: true, courseId: "demo-algebra", description: null, videoUrl: null, createdAt: new Date(), updatedAt: new Date(), userProgress: [] },
    ],
  },
  "demo-rm": {
    id: "demo-rm",
    title: "Razonamiento Matemático: Planteo de Ecuaciones y Certezas",
    description: "Técnicas rápidas de habilidad lógico-matemática para asegurar puntaje máximo.",
    imageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=800",
    price: 39.0,
    faculty: { name: "Facultad de Matemáticas", slug: "matematicas" },
    category: { name: "Razonamiento Matemático (RM)", slug: "razonamiento-matematico" },
    chapters: [
      { id: "c1", title: "1. Métodos Operativos: Rombo, Cangrejo y Rectángulo", position: 1, isFree: true, isPublished: true, courseId: "demo-rm", description: null, videoUrl: null, createdAt: new Date(), updatedAt: new Date(), userProgress: [{ id: "up3", userId: "u1", chapterId: "c1", isCompleted: true, watchedSeconds: 900, lastWatchedAt: new Date(), createdAt: new Date(), updatedAt: new Date() }] },
      { id: "c2", title: "2. Problemas sobre Certezas y Máximos/Mínimos", position: 2, isFree: false, isPublished: true, courseId: "demo-rm", description: null, videoUrl: null, createdAt: new Date(), updatedAt: new Date(), userProgress: [] },
    ],
  },
  "demo-fisica": {
    id: "demo-fisica",
    title: "Física Fundamental: Cinemática, Dinámica y Electromagnetismo",
    description: "Comprensión conceptual y operativa de los principios de la física moderna y clásica.",
    imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=800",
    price: 59.0,
    faculty: { name: "Facultad de Ciencias", slug: "ciencias" },
    category: { name: "Física", slug: "fisica" },
    chapters: [
      { id: "c1", title: "1. Movimiento Rectilíneo Uniforme y Variado (MRU/MRUV)", position: 1, isFree: true, isPublished: true, courseId: "demo-fisica", description: null, videoUrl: null, createdAt: new Date(), updatedAt: new Date(), userProgress: [] },
      { id: "c2", title: "2. Leyes de Newton y Dinámica Lineal", position: 2, isFree: false, isPublished: true, courseId: "demo-fisica", description: null, videoUrl: null, createdAt: new Date(), updatedAt: new Date(), userProgress: [] },
    ],
  },
};

import { CourseSidebarData } from "@/features/courses/types";

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { userId } = await auth();
  const { courseId } = await params;

  let course: CourseSidebarData | null = null;

  try {
    const courseDb = await db.course.findUnique({
      where: { id: courseId },
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
      },
    });

    if (courseDb) {
      course = courseDb;
    }
  } catch (e) {
    console.warn("[COURSE_LAYOUT] DB offline:", e instanceof Error ? e.message : "");
  }

  // Fallback si no está en DB o es curso demo
  if (!course) {
    const demo = DEMO_COURSE_MAP[courseId] || DEMO_COURSE_MAP["demo-algebra"];
    course = demo;
  }

  if (!course) {
    return redirect("/dashboard");
  }

  let hasAccess = false;
  if (userId) {
    try {
      const purchase = await db.purchase.findUnique({
        where: {
          userId_courseId: { userId, courseId },
        },
      });

      const subscription = await db.subscription.findUnique({
        where: { userId },
      });

      const isSubscribed = subscription?.status === "ACTIVE";
      hasAccess = !!purchase || isSubscribed || course.price === 0;
    } catch {
      hasAccess = true; // Modo preview tolerante
    }
  } else {
    hasAccess = true; // Permitir visualización en preview
  }

  const totalChapters = course.chapters.length;
  const completedChapters = course.chapters.filter(
    (chapter) => chapter.userProgress?.[0]?.isCompleted
  ).length;

  const progressCount =
    totalChapters > 0
      ? Math.round((completedChapters / totalChapters) * 100)
      : 0;

  return (
    <div className="h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Barra superior de navegación del curso */}
      <div className="fixed top-0 inset-x-0 h-16 md:pl-80 z-40">
        <CourseNavbar course={course} progressCount={progressCount} />
      </div>

      {/* Sidebar fijo en escritorio con capítulos */}
      <div className="hidden md:flex h-full w-80 flex-col fixed inset-y-0 z-50">
        <CourseSidebar
          course={course}
          progressCount={progressCount}
          hasAccess={hasAccess}
        />
      </div>

      {/* Visor de lecciones y contenido */}
      <main className="md:pl-80 pt-16 flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
