"use server";

import { auth, currentUser } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

/**
 * Genera una sesión de Stripe Checkout para:
 * 1. Suscripción recurrente mensual a Academia Zenit (si no se proporciona courseId).
 * 2. Compra individual de curso (pago único, si se proporciona courseId).
 *
 * @param courseId - ID opcional del curso para compra individual
 * @returns URL de redirección a la pasarela segura de Stripe
 */
export async function createStripeCheckoutSession(courseId?: string) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      throw new Error("No autorizado");
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // 1. Obtener o crear el cliente de Stripe correspondiente
    const stripeCustomer = await db.stripeCustomer.findUnique({
      where: { userId },
      select: { stripeCustomerId: true },
    });

    let customerId = stripeCustomer?.stripeCustomerId;

    if (!customerId) {
      const email = user.emailAddresses[0]?.emailAddress;
      const customer = await stripe.customers.create({
        email: email || undefined,
        name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || undefined,
        metadata: { userId },
      });

      await db.stripeCustomer.create({
        data: {
          userId,
          stripeCustomerId: customer.id,
        },
      });

      customerId = customer.id;
    }

    // 2. Si es compra individual de un curso específico
    if (courseId) {
      const course = await db.course.findUnique({
        where: { id: courseId, isPublished: true },
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          price: true,
        },
      });

      if (!course) {
        throw new Error("Curso no encontrado o no disponible para la venta");
      }

      // Verificar si ya fue comprado por este usuario
      const existingPurchase = await db.purchase.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
      });

      if (existingPurchase) {
        return {
          url: `${appUrl}/courses/${courseId}?alreadyEnrolled=1`,
        };
      }

      // Convertir precio a centavos (por defecto 49.00 PEN si no está establecido)
      const amountInCents = Math.round((course.price ?? 49) * 100);

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "pen",
              product_data: {
                name: course.title,
                description: course.description || `Acceso completo al curso: ${course.title}`,
                images: course.imageUrl ? [course.imageUrl] : [],
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${appUrl}/courses/${courseId}?payment=success`,
        cancel_url: `${appUrl}/courses/${courseId}?canceled=1`,
        metadata: {
          userId,
          courseId,
        },
      });

      return { url: session.url };
    }

    // 3. Suscripción global a la Academia Zenit
    const priceId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PLAN_PRICE_ID;
    if (!priceId) {
      throw new Error("Falta la configuración de Stripe Price ID para la suscripción");
    }

    // Verificar si ya tiene suscripción activa
    const existingSubscription = await db.subscription.findUnique({
      where: { userId },
      select: { status: true, stripeCurrentPeriodEnd: true },
    });

    if (
      existingSubscription &&
      existingSubscription.status === "ACTIVE" &&
      existingSubscription.stripeCurrentPeriodEnd.getTime() > Date.now()
    ) {
      return {
        url: `${appUrl}/dashboard?alreadySubscribed=1`,
      };
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${appUrl}/dashboard?payment=success`,
      cancel_url: `${appUrl}/pricing?canceled=true`,
      metadata: {
        userId,
      },
    });

    return { url: session.url };
  } catch (error) {
    console.error("[STRIPE_CHECKOUT_ACTION_ERROR]", error);
    return {
      error: error instanceof Error ? error.message : "Error al inicializar sesión de pago",
      url: null,
    };
  }
}

/**
 * Genera el enlace seguro al Customer Portal de Stripe para que el alumno
 * gestione sus métodos de pago, facturas o cancelación de su suscripción.
 *
 * @returns URL al portal de facturación de Stripe
 */
export async function createBillingPortalSession() {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("No autenticado");
    }

    const stripeCustomer = await db.stripeCustomer.findUnique({
      where: { userId },
      select: { stripeCustomerId: true },
    });

    if (!stripeCustomer?.stripeCustomerId) {
      throw new Error("No se encontró registro de cliente en Stripe para este usuario");
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomer.stripeCustomerId,
      return_url: `${appUrl}/dashboard`,
    });

    return { url: portalSession.url };
  } catch (error) {
    console.error("[BILLING_PORTAL_ACTION_ERROR]", error);
    return {
      error: error instanceof Error ? error.message : "Error al abrir el portal de facturación",
      url: null,
    };
  }
}
