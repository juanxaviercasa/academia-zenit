import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Webhook error";
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session?.metadata?.userId;
  const courseId = session?.metadata?.courseId;

  // 1. Manejo de compra única o inicio de suscripción
  if (event.type === "checkout.session.completed") {
    if (!userId) {
      return new NextResponse("Webhook Error: Missing userId", { status: 400 });
    }

    // Si es compra de un curso individual
    if (courseId) {
      await db.purchase.create({
        data: {
          courseId,
          userId,
        },
      });
    }

    // Si es suscripción mensual a la academia
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      await db.subscription.upsert({
        where: { userId },
        update: {
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(
            (subscription as unknown as { current_period_end: number }).current_period_end * 1000
          ),
          status: "ACTIVE",
        },
        create: {
          userId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(
            (subscription as unknown as { current_period_end: number }).current_period_end * 1000
          ),
          status: "ACTIVE",
        },
      });
    }
  }

  // 2. Renovación mensual de suscripción
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as unknown as { subscription: string };
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);

    await db.subscription.update({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          (subscription as unknown as { current_period_end: number }).current_period_end * 1000
        ),
      },
    });
  }

  return new NextResponse(null, { status: 200 });
}
