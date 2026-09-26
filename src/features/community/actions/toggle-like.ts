"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

/**
 * Server Action para dar o quitar 'Me Gusta' a una publicación de la comunidad.
 * Maneja la concurrencia evitando duplicados en PostLike y actualiza en tiempo real
 * los puntos de reputación del creador del post (+1 al dar like, -1 al quitarlo).
 *
 * @param postId - ID de la publicación
 */
export async function togglePostLike(postId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("No autenticado");
    }

    if (!postId) {
      throw new Error("ID de publicación requerido");
    }

    // Asegurar usuario actual en DB
    await db.user.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    // Obtener la publicación y el autor para ajustar reputación
    const post = await db.communityPost.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!post) {
      throw new Error("Publicación no encontrada");
    }

    // Verificar si el usuario ya le dio like previamente
    const existingLike = await db.postLike.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    let isLiked = false;

    if (existingLike) {
      // 1. Quitar like
      await db.postLike.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      // Restar 1 punto de reputación al autor del post (sin bajar de 0)
      const author = await db.user.findUnique({
        where: { userId: post.authorId },
        select: { points: true },
      });

      if (author && author.points > 0) {
        const updatedPoints = Math.max(0, author.points - 1);
        const updatedLevel = Math.max(1, Math.floor(updatedPoints / 50) + 1);

        await db.user.update({
          where: { userId: post.authorId },
          data: {
            points: updatedPoints,
            level: updatedLevel,
          },
        });
      }

      isLiked = false;
    } else {
      // 2. Agregar like
      await db.postLike.create({
        data: {
          userId,
          postId,
        },
      });

      // Sumar 1 punto de reputación al autor del post
      const author = await db.user.findUnique({
        where: { userId: post.authorId },
        select: { points: true },
      });

      if (author) {
        const updatedPoints = author.points + 1;
        const updatedLevel = Math.max(1, Math.floor(updatedPoints / 50) + 1);

        await db.user.update({
          where: { userId: post.authorId },
          data: {
            points: updatedPoints,
            level: updatedLevel,
          },
        });
      }

      isLiked = true;
    }

    // Obtener el nuevo conteo total de likes
    const likesCount = await db.postLike.count({
      where: { postId },
    });

    revalidatePath("/community");
    revalidatePath(`/community/posts/${postId}`);

    return {
      success: true,
      isLiked,
      likesCount,
    };
  } catch (error) {
    console.error("[TOGGLE_POST_LIKE_ERROR]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al procesar el like",
      isLiked: false,
      likesCount: 0,
    };
  }
}
