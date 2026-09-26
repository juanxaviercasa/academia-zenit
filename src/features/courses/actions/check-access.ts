import { db } from "@/lib/db";

/**
 * Verifica si un usuario tiene acceso a un curso específico.
 * Comprueba:
 * 1. Suscripción activa a la academia (Subscription con status 'ACTIVE').
 * 2. Compra individual del curso (Purchase).
 * 3. Si el usuario es el autor del curso o Administrador.
 *
 * @param userId - ID del usuario en Clerk / DB
 * @param courseId - ID del curso
 * @returns boolean indicando si tiene acceso total
 */
export async function checkUserCourseAccess(
  userId: string | null | undefined,
  courseId: string
): Promise<boolean> {
  if (!userId || !courseId) {
    return false;
  }

  try {
    // 1. Verificar suscripción activa global a la academia
    const subscription = await db.subscription.findUnique({
      where: { userId },
      select: {
        status: true,
        stripeCurrentPeriodEnd: true,
      },
    });

    if (subscription && subscription.status === "ACTIVE") {
      // Verificar si el periodo actual no ha expirado (con margen de 24h de gracia)
      const isPeriodValid =
        subscription.stripeCurrentPeriodEnd.getTime() + 86_400_000 > Date.now();
      if (isPeriodValid) {
        return true;
      }
    }

    // 2. Verificar compra directa individual del curso
    const purchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      select: { id: true },
    });

    if (purchase) {
      return true;
    }

    // 3. Verificar si el usuario es el profesor creador o ADMIN
    const [course, user] = await Promise.all([
      db.course.findUnique({
        where: { id: courseId },
        select: { userId: true },
      }),
      db.user.findUnique({
        where: { userId },
        select: { role: true },
      }),
    ]);

    if (course?.userId === userId || user?.role === "ADMIN") {
      return true;
    }

    return false;
  } catch (error) {
    console.error("[CHECK_USER_COURSE_ACCESS_ERROR]", error);
    return false;
  }
}
