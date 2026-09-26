import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  try {
    const { userId } = await auth();
    const { isCompleted, watchedSeconds } = await req.json();
    const { chapterId } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userProgress = await db.userProgress.upsert({
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
      },
    });

    return NextResponse.json(userProgress);
  } catch (error) {
    console.error("[CHAPTER_ID_PROGRESS]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
