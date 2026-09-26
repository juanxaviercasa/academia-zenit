import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const facultyId = searchParams.get("facultyId");
    const categoryId = searchParams.get("categoryId");

    const posts = await db.communityPost.findMany({
      where: {
        ...(facultyId && { facultyId }),
        ...(categoryId && { categoryId }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            points: true,
            level: true,
            role: true,
          },
        },
        faculty: true,
        category: true,
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("[COMMUNITY_POSTS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const { title, content, facultyId, categoryId } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!title || !content || !facultyId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Asegurar perfil
    await db.user.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const post = await db.communityPost.create({
      data: {
        authorId: userId,
        title,
        content,
        facultyId,
        categoryId: categoryId || null,
      },
    });

    // Otorgar 5 puntos por crear un post (gamificación estilo Skool)
    await db.user.update({
      where: { userId },
      data: {
        points: { increment: 5 },
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("[COMMUNITY_POSTS_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
