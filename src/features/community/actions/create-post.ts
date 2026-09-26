"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";

export const createPostSchema = z.object({
  title: z
    .string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(150, "El título no puede exceder 150 caracteres"),
  content: z
    .string()
    .min(5, "El contenido debe tener al menos 5 caracteres"),
  facultyId: z
    .string()
    .min(1, "La facultad es obligatoria"),
  categoryId: z
    .string()
    .optional()
    .nullable(),
});

export type CreateCommunityPostInput = z.infer<typeof createPostSchema>;

/**
 * Server Action para publicar una nueva duda, aporte o debate en la comunidad.
 * Valida la entrada con Zod, registra el post y premia al alumno con +5 puntos de reputación.
 *
 * @param data - Datos de la publicación (título, contenido, facultad, categoría opcional)
 */
export async function createCommunityPost(data: CreateCommunityPostInput) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("No autenticado");
    }

    const validatedData = createPostSchema.parse(data);

    // Asegurar que el usuario existe en nuestra DB
    const user = await db.user.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    // Crear la publicación en la base de datos
    const post = await db.communityPost.create({
      data: {
        authorId: userId,
        title: validatedData.title,
        content: validatedData.content,
        facultyId: validatedData.facultyId,
        categoryId: validatedData.categoryId || null,
      },
      include: {
        author: true,
        faculty: true,
        category: true,
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    // Bonificación de +5 puntos estilo Skool y actualización de nivel (1 nivel cada 50 pts)
    const newPoints = user.points + 5;
    const newLevel = Math.max(1, Math.floor(newPoints / 50) + 1);

    await db.user.update({
      where: { userId },
      data: {
        points: newPoints,
        level: newLevel,
      },
    });

    revalidatePath("/community");
    revalidatePath(`/community/faculties/${validatedData.facultyId}`);

    return { success: true, post };
  } catch (error) {
    console.error("[CREATE_COMMUNITY_POST_ERROR]", error);
    return {
      success: false,
      error: error instanceof z.ZodError
        ? error.issues[0]?.message
        : error instanceof Error
        ? error.message
        : "Error al crear la publicación",
    };
  }
}
