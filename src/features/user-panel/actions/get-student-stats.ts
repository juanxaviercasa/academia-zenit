import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { StudentAnalytics } from "../types";

/**
 * Calcula las analíticas y métricas de desempeño del estudiante:
 * - Cursos completados al 100%
 * - Cursos en progreso (iniciados pero no concluidos)
 * - Total de horas acumuladas de estudio a través de UserProgress
 * - Racha actual de días continuos de estudio
 * - Puntos y nivel de gamificación estilo Skool
 *
 * @param userId - ID opcional del estudiante (si se omite, se usa el usuario en sesión)
 */
export async function getStudentDashboardStats(
  userId?: string | null
): Promise<StudentAnalytics> {
  try {
    let targetUserId = userId;

    if (!targetUserId) {
      const session = await auth();
      targetUserId = session.userId;
    }

    const defaultStats: StudentAnalytics = {
      completedCoursesCount: 0,
      inProgressCoursesCount: 0,
      totalWatchedHours: 0,
      communityPoints: 0,
      communityLevel: 1,
      studyStreakDays: 0,
    };

    if (!targetUserId) {
      return defaultStats;
    }

    // 1. Obtener perfil de gamificación del usuario
    const user = await db.user.findUnique({
      where: { userId: targetUserId },
      select: {
        points: true,
        level: true,
      },
    });

    // 2. Obtener todos los cursos publicados con sus capítulos publicados
    const publishedCourses = await db.course.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        chapters: {
          where: { isPublished: true },
          select: { id: true },
        },
      },
    });

    // 3. Obtener todo el progreso del estudiante
    const userProgressList = await db.userProgress.findMany({
      where: { userId: targetUserId },
      select: {
        chapterId: true,
        isCompleted: true,
        watchedSeconds: true,
        lastWatchedAt: true,
      },
    });

    const progressByChapter = new Map(
      userProgressList.map((progress) => [progress.chapterId, progress])
    );

    // 4. Calcular cursos finalizados y en progreso
    let completedCoursesCount = 0;
    let inProgressCoursesCount = 0;

    for (const course of publishedCourses) {
      const chapters = course.chapters;
      const totalChapters = chapters.length;

      if (totalChapters === 0) continue;

      let completedChaptersInCourse = 0;
      let hasInteraction = false;

      for (const chapter of chapters) {
        const progress = progressByChapter.get(chapter.id);
        if (progress) {
          if (progress.isCompleted) {
            completedChaptersInCourse++;
          }
          if (progress.isCompleted || progress.watchedSeconds > 0) {
            hasInteraction = true;
          }
        }
      }

      if (completedChaptersInCourse === totalChapters) {
        completedCoursesCount++;
      } else if (hasInteraction) {
        inProgressCoursesCount++;
      }
    }

    // 5. Calcular total de tiempo visto en horas (1 decimal)
    const totalWatchedSeconds = userProgressList.reduce(
      (sum, p) => sum + (p.watchedSeconds || 0),
      0
    );
    const totalWatchedHours = Math.round((totalWatchedSeconds / 3600) * 10) / 10;

    // 6. Calcular racha de estudio (días consecutivos activos)
    let studyStreakDays = 0;
    if (userProgressList.length > 0) {
      // Extraer fechas únicas (formato YYYY-MM-DD en UTC)
      const dateSet = new Set<string>();
      for (const p of userProgressList) {
        if (p.lastWatchedAt) {
          const dateStr = p.lastWatchedAt.toISOString().slice(0, 10);
          dateSet.add(dateStr);
        }
      }

      const sortedDates = Array.from(dateSet).sort().reverse();

      if (sortedDates.length > 0) {
        const now = new Date();
        const formatDate = (d: Date) => d.toISOString().slice(0, 10);

        const todayStr = formatDate(now);
        const yesterday = new Date(now);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const yesterdayStr = formatDate(yesterday);

        // La racha se mantiene si la última sesión fue hoy o ayer
        let cursorDate: Date | null = null;
        if (sortedDates.includes(todayStr)) {
          cursorDate = new Date(now);
        } else if (sortedDates.includes(yesterdayStr)) {
          cursorDate = new Date(yesterday);
        }

        if (cursorDate) {
          while (true) {
            const checkStr = formatDate(cursorDate);
            if (dateSet.has(checkStr)) {
              studyStreakDays++;
              cursorDate.setUTCDate(cursorDate.getUTCDate() - 1);
            } else {
              break;
            }
          }
        }
      }
    }

    return {
      completedCoursesCount,
      inProgressCoursesCount,
      totalWatchedHours,
      communityPoints: user?.points ?? 0,
      communityLevel: user?.level ?? 1,
      studyStreakDays,
    };
  } catch (error) {
    console.error("[GET_STUDENT_DASHBOARD_STATS_ERROR]", error);
    return {
      completedCoursesCount: 0,
      inProgressCoursesCount: 0,
      totalWatchedHours: 0,
      communityPoints: 0,
      communityLevel: 1,
      studyStreakDays: 0,
    };
  }
}
