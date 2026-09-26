"use client";

import { useState } from "react";
import { MessageSquarePlus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createCommunityPost } from "../actions/create-post";

interface CreatePostFormProps {
  faculties: { id: string; name: string; categories: { id: string; name: string }[] }[];
  onPostCreated?: () => void;
}

export const CreatePostForm = ({ faculties, onPostCreated }: CreatePostFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [facultyId, setFacultyId] = useState(faculties[0]?.id || "");
  const [categoryId, setCategoryId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedFaculty = faculties.find((f) => f.id === facultyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !facultyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await createCommunityPost({
        title: title.trim(),
        content: content.trim(),
        facultyId,
        categoryId: categoryId || undefined,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setTitle("");
        setContent("");
        setIsOpen(false);
        if (onPostCreated) onPostCreated();
      }
    } catch {
      setError("Error al publicar el post");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Card
        onClick={() => setIsOpen(true)}
        className="cursor-pointer border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-indigo-500/50 hover:bg-slate-900/90"
      >
        <div className="flex items-center gap-3 text-slate-400">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
            <MessageSquarePlus className="h-5 w-5" />
          </div>
          <span className="text-sm">
            ¿Tienes una duda o quieres debatir un ejercicio? Publica aquí...
          </span>
          <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" /> +5 XP
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-500/40 bg-slate-900 shadow-xl">
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4 text-indigo-400" />
            Crear nuevo tema de debate
          </h3>
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Gana +5 puntos Skool
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="rounded-lg bg-red-500/10 p-2 text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300">Facultad</label>
              <select
                value={facultyId}
                onChange={(e) => {
                  setFacultyId(e.target.value);
                  setCategoryId("");
                }}
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">Materia (opcional)</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Todas las materias</option>
                {selectedFaculty?.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Título del tema</label>
            <input
              type="text"
              placeholder="Ej: Duda con el ejercicio de Geometría del espacio (Semana 2)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Explicación o desarrollo</label>
            <textarea
              placeholder="Describe tu pregunta, comparte tu razonamiento o propone un reto..."
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !title.trim() || !content.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold"
            >
              {isLoading ? "Publicando..." : "Publicar en Comunidad"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
