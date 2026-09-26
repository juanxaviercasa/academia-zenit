import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function CourseIdPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  if (courseId.startsWith("demo-")) {
    return redirect(`/courses/${courseId}/chapters/c1`);
  }

  try {
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          where: { isPublished: true },
          orderBy: { position: "asc" },
        },
      },
    });

    if (course && course.chapters.length > 0) {
      return redirect(`/courses/${course.id}/chapters/${course.chapters[0].id}`);
    }
  } catch (e) {
    console.warn("[COURSE_REDIRECT] Error al cargar curso:", e instanceof Error ? e.message : "");
  }

  return redirect("/dashboard");
}
