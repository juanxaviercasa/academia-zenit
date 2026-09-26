"use client";

import { useState } from "react";
import { MessageSquare, ThumbsUp, Pin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { togglePostLike } from "../actions/toggle-like";
import { createComment } from "../actions/create-comment";

interface Author {
  id: string;
  name: string | null;
  imageUrl: string | null;
  points: number;
  level: number;
  role: string;
}

interface PostProps {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: Date | string;
  author: Author;
  faculty: { name: string; slug: string };
  category: { name: string; slug: string } | null;
  initialLikesCount: number;
  initialHasLiked: boolean;
  commentsCount: number;
  comments?: {
    id: string;
    content: string;
    createdAt: Date | string;
    author: Author;
  }[];
}

export const PostCard = ({
  id,
  title,
  content,
  isPinned,
  createdAt,
  author,
  faculty,
  category,
  initialLikesCount,
  initialHasLiked,
  commentsCount,
  comments = [],
}: PostProps) => {
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [localComments, setLocalComments] = useState(comments);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    // Optimistic update
    setHasLiked((prev) => !prev);
    setLikesCount((prev) => (hasLiked ? prev - 1 : prev + 1));

    try {
      const res = await togglePostLike(id);
      if (res.error) {
        // Revert on error
        setHasLiked(initialHasLiked);
        setLikesCount(initialLikesCount);
      }
    } catch {
      setHasLiked(initialHasLiked);
      setLikesCount(initialLikesCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await createComment({
        postId: id,
        content: commentText.trim(),
      });

      if (res.success && res.comment) {
        setLocalComments((prev) => [
          ...prev,
          {
            id: res.comment.id,
            content: res.comment.content,
            createdAt: new Date(),
            author: {
              id: "me",
              name: "Tú",
              imageUrl: null,
              points: 0,
              level: 1,
              role: "STUDENT",
            },
          },
        ]);
        setCommentText("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const facultyBadgeVariant =
    faculty.slug === "matematicas"
      ? "math"
      : faculty.slug === "ciencias"
      ? "science"
      : "humanities";

  return (
    <Card className="border-slate-800 bg-slate-900/80 shadow-md backdrop-blur-sm transition-all hover:border-slate-700">
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-slate-700">
              <AvatarImage src={author.imageUrl || undefined} />
              <AvatarFallback className="bg-indigo-950 font-bold text-indigo-300">
                {author.name ? author.name.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-100">
                  {author.name || "Estudiante Zenit"}
                </span>
                <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300">
                  Nv. {author.level}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                {new Date(createdAt).toLocaleDateString("es-PE", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isPinned && (
              <Badge variant="outline" className="border-amber-500/40 text-amber-300 gap-1 bg-amber-500/10">
                <Pin className="h-3 w-3" /> Fijado
              </Badge>
            )}
            <Badge variant={facultyBadgeVariant}>{faculty.name}</Badge>
            {category && (
              <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                {category.name}
              </Badge>
            )}
          </div>
        </div>

        <h3 className="mt-3 text-base font-bold text-slate-100 hover:text-indigo-400 cursor-pointer">
          {title}
        </h3>
      </CardHeader>

      <CardContent className="pb-3 text-sm text-slate-300 whitespace-pre-line leading-relaxed">
        {content}
      </CardContent>

      <CardFooter className="flex flex-col border-t border-slate-800/80 pt-3 pb-3">
        <div className="flex w-full items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className={`h-8 gap-1.5 px-2.5 rounded-lg transition-colors ${
                hasLiked
                  ? "text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <ThumbsUp className={`h-4 w-4 ${hasLiked ? "fill-indigo-400" : ""}`} />
              <span>{likesCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="h-8 gap-1.5 px-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{localComments.length || commentsCount} respuestas</span>
            </Button>
          </div>
        </div>

        {/* Sección de respuestas estilo Skool */}
        {showComments && (
          <div className="mt-4 w-full space-y-3 pt-3 border-t border-slate-800/60">
            {localComments.length > 0 && (
              <div className="space-y-2">
                {localComments.map((c) => (
                  <div
                    key={c.id}
                    className="flex gap-2.5 rounded-lg bg-slate-950/60 p-2.5 text-xs text-slate-300 border border-slate-800/40"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={c.author.imageUrl || undefined} />
                      <AvatarFallback className="text-[10px] bg-slate-800 text-slate-300">
                        {c.author.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">
                          {c.author.name}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-300">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Escribe una respuesta para resolver dudas..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingComment || !commentText.trim()}
                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
              >
                Responder
              </Button>
            </form>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
