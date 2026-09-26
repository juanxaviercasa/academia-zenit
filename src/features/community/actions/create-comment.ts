"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";

export const createCommentSchema = z.object({
  postId: z.string().min(1, "ID de publicación requerido"),
  content: z
    .string()
    .min(1, "El comentario no puede estar vacío")
    .max(2000, "El comentario no puede exceder 2000 caracteres"),
  parentId: z.string().optional().nullable(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

/**
 * Server Action para añadir un comentario o respuesta anidada en un post de la comunidad.
 * Otorga +2 puntos de gamificación al autor de la respuesta.
 *
 * @param data - Objeto con postId, contenido y parentId opcional para hilos de discusión
 */
export async function createComment(data: CreateCommentInput) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("No autenticado");
    }

    const validatedData = createCommentSchema.parse(data);

    // Asegurar usuario
    const user = await db.user.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    // Validar que la publicación exista
    const post = await db.communityPost.findUnique({
      where: { id: validatedData.postId },
      select: { id: true },
    });

    if (!post) {
      throw new Error("La publicación no existe");
    }

    // Si es respuesta anidada, validar que el comentario padre pertenezca al mismo post
    if (validatedData.parentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: validatedData.parentId },
        select: { postId: true },
      });

      if (!parentComment || parentComment.postId !== validatedData.postId) {
        throw new Error("El comentario padre no pertenece a esta publicación");
      }
    }

    // Crear el comentario en la base de datos
    const comment = await db.comment.create({
      data: {
        postId: validatedData.postId,
        content: validatedData.content,
        parentId: validatedData.parentId || null,
        authorId: userId,
      },
      include: {
        author: true,
        likes: true,
      },
    });

    // Bonificar +2 puntos por participación activa en la comunidad
    const newPoints = user.points + 2;
    const newLevel = Math.max(1, Math.floor(newPoints / 50) + 1);

    await db.user.update({
      where: { userId },
      data: {
        points: newPoints,
        level: newLevel,
      },
    });

    revalidatePath("/community");
    revalidatePath(`/community/posts/${validatedData.postId}`);

    return { success: true, comment };
  } catch (error) {
    console.error("[CREATE_COMMENT_ERROR]", error);
    return {
      success: false,
      error: error instanceof z.ZodError
        ? error.issues[0]?.message
        : error instanceof Error
        ? error.message
        : "Error al publicar comentario",
    };
  }
}
