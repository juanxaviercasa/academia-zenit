import { Attachment, Chapter, MuxData, UserProgress } from "@prisma/client";

import { db } from "@/lib/db";
import { checkUserCourseAccess } from "./check-access";

export interface GetChapterResult {
  chapter: Chapter | null;
  course: {
    id: string;
    title: string;
    description: string | null;
    price: number | null;
  } | null;
  muxData: MuxData | null;
  attachments: Attachment[];
  nextChapter: Chapter | null;
  userProgress: UserProgress | null;
  hasAccess: boolean;
  isFree: boolean;
}

/**
 * Obtiene los detalles de un capítulo específico, datos de streaming de Mux,
 * recursos adjuntos (si tiene acceso), progreso del usuario y siguiente capítulo.
 *
 * @param userId - ID del usuario autenticado (opcional)
 * @param courseId - ID del curso
 * @param chapterId - ID del capítulo a reproducir
 */
export async function getChapter(
  userId: string | null | undefined,
  courseId: string,
  chapterId: string
): Promise<GetChapterResult> {
  try {
    // 1. Verificar si el usuario tiene acceso comprado o membresía activa
    const hasAccess = await checkUserCourseAccess(userId, courseId);

    // 2. Obtener información del curso
    const course = await db.course.findUnique({
      where: {
        id: courseId,
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
      },
    });

    if (!course) {
      throw new Error("Curso no encontrado o no publicado");
    }

    // 3. Obtener el capítulo solicitado
    const chapter = await db.chapter.findUnique({
      where: {
        id: chapterId,
        courseId,
        isPublished: true,
      },
      include: {
        muxData: true,
      },
    });

    if (!chapter) {
      throw new Error("Capítulo no encontrado");
    }

    // 4. Si el usuario tiene acceso, obtener los archivos adjuntos del curso
    let attachments: Attachment[] = [];
    if (hasAccess) {
      attachments = await db.attachment.findMany({
        where: {
          courseId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    // 5. Determinar el siguiente capítulo para navegación fluida
    const nextChapter = await db.chapter.findFirst({
      where: {
        courseId,
        isPublished: true,
        position: {
          gt: chapter.position,
        },
      },
      orderBy: {
        position: "asc",
      },
    });

    // 6. Obtener progreso previo del usuario
    let userProgress: UserProgress | null = null;
    if (userId) {
      userProgress = await db.userProgress.findUnique({
        where: {
          userId_chapterId: {
            userId,
            chapterId,
          },
        },
      });
    }

    // 7. Seguridad de streaming: si no es gratis y no tiene acceso, ocultar Mux y videoUrl
    const canWatch = chapter.isFree || hasAccess;
    const muxData = canWatch ? chapter.muxData : null;
    const safeChapter: Chapter = {
      ...chapter,
      videoUrl: canWatch ? chapter.videoUrl : null,
    };

    return {
      chapter: safeChapter,
      course,
      muxData,
      attachments,
      nextChapter,
      userProgress,
      hasAccess,
      isFree: chapter.isFree,
    };
  } catch (error) {
    console.error("[GET_CHAPTER_ACTION_ERROR]", error);
    return {
      chapter: null,
      course: null,
      muxData: null,
      attachments: [],
      nextChapter: null,
      userProgress: null,
      hasAccess: false,
      isFree: false,
    };
  }
}
