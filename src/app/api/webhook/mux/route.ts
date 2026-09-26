import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { mux } from "@/lib/mux";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const muxSignature = headersList.get("mux-signature");

  if (!muxSignature) {
    return new NextResponse("Missing mux signature", { status: 400 });
  }

  let event: { type: string; data: Record<string, unknown> };

  try {
    event = (await mux.webhooks.unwrap(body, headersList, process.env.MUX_WEBHOOK_SECRET!)) as unknown as {
      type: string;
      data: Record<string, unknown>;
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error verifying Mux webhook";
    return new NextResponse(`Mux Webhook Verification Error: ${msg}`, { status: 400 });
  }

  // Cuando el video ha terminado de procesarse y está listo para reproducir
  if (event.type === "video.asset.ready") {
    const asset = event.data as {
      id: string;
      playback_ids?: { id: string; policy: string }[];
      duration?: number;
      passthrough?: string; // Usualmente chapterId
    };

    const chapterId = asset.passthrough;
    const playbackId = asset.playback_ids?.[0]?.id;

    if (chapterId && playbackId) {
      await db.muxData.upsert({
        where: { chapterId },
        update: {
          assetId: asset.id,
          playbackId,
          duration: asset.duration || null,
        },
        create: {
          chapterId,
          assetId: asset.id,
          playbackId,
          duration: asset.duration || null,
        },
      });
    }
  }

  return new NextResponse(null, { status: 200 });
}
