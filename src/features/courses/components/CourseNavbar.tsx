"use client";

import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Course, Faculty } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { CourseProgress } from "@/features/courses/components/CourseProgress";
import { Badge } from "@/components/ui/badge";

interface CourseNavbarProps {
  course: {
    title: string;
    faculty?: { name: string; slug: string } | null;
  };
  progressCount: number;
}

export const CourseNavbar = ({ course, progressCount }: CourseNavbarProps) => {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 md:px-6 shadow-sm backdrop-blur-md z-40">
      {/* Botón de salida y título del curso */}
      <div className="flex items-center gap-x-4 min-w-0">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
        >
          <Link href="/dashboard" className="flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Panel del Estudiante</span>
          </Link>
        </Button>

        <div className="hidden sm:block h-5 w-[1px] bg-slate-800" />

        <div className="flex items-center gap-2 truncate">
          <div className="hidden md:flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-400">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="font-semibold text-slate-100 text-sm md:text-base truncate">
            {course.title}
          </span>
          {course.faculty && (
            <Badge
              variant={
                course.faculty.slug === "matematicas"
                  ? "math"
                  : course.faculty.slug === "ciencias"
                  ? "science"
                  : "humanities"
              }
              size="sm"
              className="hidden lg:inline-flex"
            >
              {course.faculty.name}
            </Badge>
          )}
        </div>
      </div>

      {/* Avance y Avatar de Usuario */}
      <div className="flex items-center gap-x-6 shrink-0">
        <div className="hidden md:flex items-center w-48">
          <CourseProgress
            value={progressCount}
            variant={progressCount >= 100 ? "success" : "default"}
            size="sm"
            showText={false}
          />
          <span className="ml-2 text-xs font-semibold text-slate-300">
            {Math.round(progressCount)}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-9 w-9 border border-slate-700",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
};
