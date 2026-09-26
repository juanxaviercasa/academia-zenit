"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

export interface UpdateChapterProgressParams {
  chapterId: string;
  isCompleted?: boolean;
  watchedSeconds?: number;
}

/**
 * Server Action para actualizar el progreso de visualización de un capítulo.
 * Puede marcar el capítulo como completado o registrar los segundos vistos.
 * Revalida la ruta del capítulo y del curso para refrescar el UI en tiempo real.
 *
 * @param chapterId - ID del capítulo
 * @param isCompleted - Booleano opcional para marcar finalizado
 * @param watchedSeconds - Segundos reproducidos hasta el momento
 */
export async function updateChapterProgress(
  chapterId: string,
  isCompleted?: boolean,
  watchedSeconds?: number
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("No autenticado");
    }

    if (!chapterId) {
      throw new Error("ID de capítulo requerido");
    }

    // Asegurar que el usuario existe en nuestra base de datos
    await db.user.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    // Obtener el curso del capítulo para revalidar la ruta correspondiente
    const chapter = await db.chapter.findUnique({
      where: { id: chapterId },
      select: {
        id: true,
        courseId: true,
      },
    });

    if (!chapter) {
      throw new Error("Capítulo no encontrado");
    }

    // Verificar si ya estaba completado para evitar duplicar puntos de gamificación
    const existingProgress = await db.userProgress.findUnique({
      where: {
        userId_chapterId: {
          userId,
          chapterId,
        },
      },
      select: {
        isCompleted: true,
      },
    });

    const isFirstTimeCompletion =
      !existingProgress?.isCompleted && isCompleted === true;

    // Actualizar o crear registro de progreso
    const progress = await db.userProgress.upsert({
      where: {
        userId_chapterId: {
          userId,
          chapterId,
        },
      },
      update: {
        ...(isCompleted !== undefined && { isCompleted }),
        ...(watchedSeconds !== undefined && { watchedSeconds }),
        lastWatchedAt: new Date(),
      },
      create: {
        userId,
        chapterId,
        isCompleted: isCompleted ?? false,
        watchedSeconds: watchedSeconds ?? 0,
        lastWatchedAt: new Date(),
      },
    });

    // Gamificación: Bonificar 10 puntos de experiencia si completa el capítulo por primera vez
    if (isFirstTimeCompletion) {
      await db.user.update({
        where: { userId },
        data: {
          points: { increment: 10 },
        },
      });
    }

    // Revalidación selectiva de caché en Next.js
    revalidatePath(`/courses/${chapter.courseId}/chapters/${chapterId}`);
    revalidatePath(`/courses/${chapter.courseId}`);
    revalidatePath("/dashboard");
    revalidatePath("/user-panel");

    return { success: true, progress };
  } catch (error) {
    console.error("[UPDATE_CHAPTER_PROGRESS_ERROR]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar progreso",
    };
  }
}
