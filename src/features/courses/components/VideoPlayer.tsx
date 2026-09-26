"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MuxPlayer from "@mux/mux-player-react";
import { Lock, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  playbackId?: string | null;
  courseId: string;
  chapterId: string;
  nextChapterId?: string | null;
  isLocked: boolean;
  completeOnEnd?: boolean;
  title: string;
  videoUrl?: string | null;
  autoPlay?: boolean;
}

export const VideoPlayer = ({
  playbackId,
  courseId,
  chapterId,
  nextChapterId,
  isLocked,
  completeOnEnd = true,
  title,
  videoUrl,
  autoPlay = false,
}: VideoPlayerProps) => {
  const [isReady, setIsReady] = useState(false);
  const [isCompletedState, setIsCompletedState] = useState(false);
  const router = useRouter();

  const handleEnded = async () => {
    try {
      if (completeOnEnd) {
        setIsCompletedState(true);
        await fetch(`/api/courses/${courseId}/chapters/${chapterId}/progress`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isCompleted: true,
          }),
        });

        router.refresh();

        if (nextChapterId) {
          setTimeout(() => {
            router.push(`/courses/${courseId}/chapters/${nextChapterId}`);
          }, 1200);
        }
      }
    } catch (error) {
      console.error("Error al actualizar progreso:", error);
    }
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-2xl">
      {/* Estado: Bloqueado */}
      {isLocked && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-y-3 bg-slate-950/95 p-6 text-center text-slate-200 backdrop-blur-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-inner">
            <Lock className="h-8 w-8 text-indigo-400" />
          </div>
          <div className="space-y-1 max-w-md">
            <p className="text-lg font-semibold text-white">Este capítulo está bloqueado</p>
            <p className="text-sm text-slate-400">
              Necesitas matricularte en este curso o tener una suscripción activa a Academia Zenit para acceder a esta lección.
            </p>
          </div>
          <div className="pt-2">
            <Button asChild variant="zenit" size="default">
              <Link href={`/courses/${courseId}`}>
                <Sparkles className="h-4 w-4 mr-1 text-emerald-300" />
                Desbloquear Curso Completo
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Estado: Cargando video */}
      {!isLocked && !isReady && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-y-2 bg-slate-950 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-xs font-medium tracking-wide">Cargando reproductor HD...</p>
        </div>
      )}

      {/* Feedback al completar */}
      {isCompletedState && (
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2 rounded-lg bg-emerald-950/90 border border-emerald-500/50 px-3 py-2 text-xs font-medium text-emerald-300 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>¡Clase completada! {nextChapterId ? "Avanzando a la siguiente..." : ""}</span>
        </div>
      )}

      {/* Reproductor Mux o Fallback seguro */}
      {!isLocked && (
        <>
          {playbackId ? (
            <MuxPlayer
              title={title}
              playbackId={playbackId}
              accentColor="#6366f1"
              onCanPlay={() => setIsReady(true)}
              onEnded={handleEnded}
              autoPlay={autoPlay}
              className={cn(
                "h-full w-full object-contain transition-opacity duration-300",
                !isReady && "opacity-0"
              )}
            />
          ) : videoUrl ? (
            <video
              src={videoUrl}
              controls
              onLoadedData={() => setIsReady(true)}
              onEnded={handleEnded}
              autoPlay={autoPlay}
              className={cn(
                "h-full w-full object-contain transition-opacity duration-300",
                !isReady && "opacity-0"
              )}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-500">
              <p className="text-sm">Video no disponible en este momento.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
