import { db } from "@/lib/db";
import { CourseWithProgressWithCategory } from "../types";

/**
 * Obtiene el curso con sus capítulos publicados, datos de facultad, categoría
 * y calcula el porcentaje de progreso del usuario autenticado.
 *
 * @param courseId - ID del curso a consultar
 * @param userId - ID opcional del usuario para calcular su progreso
 * @returns Curso completo con progreso o null si no existe
 */
export async function getCourseWithProgress(
  courseId: string,
  userId?: string | null
): Promise<CourseWithProgressWithCategory | null> {
  try {
    const course = await db.course.findUnique({
      where: {
        id: courseId,
      },
      include: {
        faculty: true,
        category: true,
        chapters: {
          where: {
            isPublished: true,
          },
          include: {
            muxData: true,
            userProgress: userId
              ? {
                  where: {
                    userId,
                  },
                }
              : false,
          },
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!course) {
      return null;
    }

    // Si no hay userId, el progreso es null
    if (!userId) {
      return {
        ...course,
        progress: null,
      };
    }

    const publishedChapters = course.chapters;
    const totalChapters = publishedChapters.length;

    if (totalChapters === 0) {
      return {
        ...course,
        progress: 0,
      };
    }

    // Contar capítulos completados por el usuario
    const completedChapters = publishedChapters.filter(
      (chapter) => chapter.userProgress && chapter.userProgress.some((up) => up.isCompleted)
    ).length;

    const progressPercentage = Math.round((completedChapters / totalChapters) * 100);

    return {
      ...course,
      progress: progressPercentage,
    };
  } catch (error) {
    console.error("[GET_COURSE_WITH_PROGRESS_ERROR]", error);
    return null;
  }
}
