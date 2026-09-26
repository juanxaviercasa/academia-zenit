import { db } from "@/lib/db";
import { PostWithDetails } from "../types";

/**
 * Obtiene las publicaciones de la comunidad filtradas opcionalmente por facultad y/o materia.
 * Los resultados vienen ordenados con las publicaciones fijadas (isPinned) primero,
 * seguidas por las más recientes en orden cronológico descendente.
 * Incluye autor, likes, comentarios y conteos para la vista estilo Skool.
 *
 * @param facultyId - ID opcional de la facultad académica
 * @param categoryId - ID opcional de la categoría o materia
 */
export async function getCommunityPosts(
  facultyId?: string,
  categoryId?: string
): Promise<PostWithDetails[]> {
  try {
    const posts = await db.communityPost.findMany({
      where: {
        ...(facultyId && { facultyId }),
        ...(categoryId && { categoryId }),
      },
      include: {
        author: true,
        faculty: true,
        category: true,
        likes: true,
        comments: {
          include: {
            author: true,
            likes: true,
            replies: {
              include: {
                author: true,
                likes: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" },
      ],
    });

    return posts as unknown as PostWithDetails[];
  } catch (error) {
    console.error("[GET_COMMUNITY_POSTS_ERROR]", error);
    return [];
  }
}
