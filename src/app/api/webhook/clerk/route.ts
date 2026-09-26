import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function POST(req: Request) {
  const payload = await req.json();
  const headersList = await headers();
  const svixId = headersList.get("svix-id");
  const svixTimestamp = headersList.get("svix-timestamp");
  const svixSignature = headersList.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new NextResponse("Error: Missing svix headers", { status: 400 });
  }

  const eventType = payload.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, first_name, last_name, image_url, email_addresses } = payload.data;
    const email = email_addresses?.[0]?.email_address;
    const name = `${first_name || ""} ${last_name || ""}`.trim();

    await db.user.upsert({
      where: { userId: id },
      update: {
        email,
        name: name || null,
        imageUrl: image_url,
      },
      create: {
        userId: id,
        email,
        name: name || null,
        imageUrl: image_url,
      },
    });
  }

  if (eventType === "user.deleted") {
    const { id } = payload.data;
    if (id) {
      await db.user.deleteMany({
        where: { userId: id },
      });
    }
  }

  return new NextResponse("Webhook processed successfully", { status: 200 });
}
