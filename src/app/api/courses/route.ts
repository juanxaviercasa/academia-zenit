import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const { title, facultyId, categoryId } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!title || !facultyId || !categoryId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Asegurar que el usuario existe en nuestra DB
    await db.user.upsert({
      where: { userId },
      update: {},
      create: { userId, role: "TEACHER" },
    });

    const course = await db.course.create({
      data: {
        userId,
        title,
        facultyId,
        categoryId,
      },
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error("[COURSES_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const facultySlug = searchParams.get("faculty");
    const categorySlug = searchParams.get("category");

    const courses = await db.course.findMany({
      where: {
        isPublished: true,
        ...(facultySlug && {
          faculty: { slug: facultySlug },
        }),
        ...(categorySlug && {
          category: { slug: categorySlug },
        }),
      },
      include: {
        faculty: true,
        category: true,
        chapters: {
          where: { isPublished: true },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error("[COURSES_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
