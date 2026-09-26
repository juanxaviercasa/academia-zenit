import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { FacultyProgressSummary } from "../types";

/**
 * Retorna el desglose del progreso académico del estudiante agrupado
 * por las tres facultades troncales (Matemáticas, Ciencias, Humanidades).
 *
 * @param userId - ID opcional del estudiante (si se omite, se usa el de la sesión activa)
 */
export async function getFacultyBreakdown(
  userId?: string | null
): Promise<FacultyProgressSummary[]> {
  try {
    let targetUserId = userId;

    if (!targetUserId) {
      const session = await auth();
      targetUserId = session.userId;
    }

    // 1. Obtener todas las facultades con sus cursos publicados y capítulos correspondientes
    const faculties = await db.faculty.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        courses: {
          where: {
            isPublished: true,
          },
          include: {
            chapters: {
              where: {
                isPublished: true,
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    // 2. Obtener el progreso del usuario si está autenticado
    const userProgressList = targetUserId
      ? await db.userProgress.findMany({
          where: { userId: targetUserId },
          select: {
            chapterId: true,
            isCompleted: true,
          },
        })
      : [];

    const progressByChapter = new Map(
      userProgressList.map((progress) => [progress.chapterId, progress.isCompleted])
    );

    // 3. Procesar métricas por facultad
    const result: FacultyProgressSummary[] = faculties.map((faculty) => {
      const courses = faculty.courses;
      const totalCourses = courses.length;

      if (totalCourses === 0) {
        return {
          facultyName: faculty.name,
          facultySlug: faculty.slug,
          totalCourses: 0,
          completedCourses: 0,
          averageProgressPercentage: 0,
        };
      }

      let completedCoursesCount = 0;
      let totalProgressSum = 0;

      for (const course of courses) {
        const chapters = course.chapters;
        const totalChapters = chapters.length;

        if (totalChapters === 0) {
          continue;
        }

        const completedChapters = chapters.filter(
          (chapter) => progressByChapter.get(chapter.id) === true
        ).length;

        const courseProgressPercentage = Math.round(
          (completedChapters / totalChapters) * 100
        );

        totalProgressSum += courseProgressPercentage;

        if (courseProgressPercentage === 100) {
          completedCoursesCount++;
        }
      }

      const averageProgressPercentage = Math.round(totalProgressSum / totalCourses);

      return {
        facultyName: faculty.name,
        facultySlug: faculty.slug,
        totalCourses,
        completedCourses: completedCoursesCount,
        averageProgressPercentage,
      };
    });

    return result;
  } catch (error) {
    console.error("[GET_FACULTY_BREAKDOWN_ERROR]", error);
    return [];
  }
}
