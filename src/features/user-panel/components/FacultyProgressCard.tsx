import Link from "next/link";
import { Calculator, Atom, BookOpen, ChevronRight } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FacultyProgressSummary } from "@/features/user-panel/types";

interface FacultyProgressCardProps {
  summaries?: FacultyProgressSummary[];
}

const defaultSummaries: FacultyProgressSummary[] = [
  {
    facultyName: "Facultad de Matemáticas",
    facultySlug: "matematicas",
    totalCourses: 5,
    completedCourses: 2,
    averageProgressPercentage: 40,
  },
  {
    facultyName: "Facultad de Ciencias",
    facultySlug: "ciencias",
    totalCourses: 3,
    completedCourses: 1,
    averageProgressPercentage: 33,
  },
  {
    facultyName: "Facultad de Humanidades",
    facultySlug: "humanidades",
    totalCourses: 3,
    completedCourses: 1,
    averageProgressPercentage: 33,
  },
];

const facultyMeta: Record<
  string,
  {
    icon: typeof Calculator;
    color: string;
    variant: "math" | "science" | "humanities";
    disciplines: string;
  }
> = {
  matematicas: {
    icon: Calculator,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    variant: "math",
    disciplines: "Álgebra, Aritmética, Geometría, Trigonometría, RM",
  },
  ciencias: {
    icon: Atom,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    variant: "science",
    disciplines: "Física, Química, Biología",
  },
  humanidades: {
    icon: BookOpen,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    variant: "humanities",
    disciplines: "Razonamiento Verbal, Geografía, Historia del Perú",
  },
};

export const FacultyProgressCard = ({ summaries }: FacultyProgressCardProps) => {
  const items = summaries && summaries.length > 0 ? summaries : defaultSummaries;

  return (
    <Card className="border-slate-800 bg-slate-900/90 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-100 flex items-center justify-between">
          <span>Avance por Facultad Académica</span>
          <span className="text-xs font-normal text-slate-400">3 Facultades</span>
        </CardTitle>
        <CardDescription>
          Monitorea tu balance de aprendizaje en todas las áreas del prospecto preuniversitario.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => {
          const meta =
            facultyMeta[item.facultySlug] || {
              icon: BookOpen,
              color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
              variant: "math" as const,
              disciplines: "Cursos especializados",
            };
          const Icon = meta.icon;

          return (
            <div
              key={item.facultySlug}
              className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3.5 space-y-2.5 transition-all hover:border-slate-700/80 hover:bg-slate-950/60"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${meta.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200">
                      {item.facultyName}
                    </h5>
                    <p className="text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-xs">
                      {meta.disciplines}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/faculties/${item.facultySlug}`}
                  className="flex items-center text-xs font-medium text-slate-400 hover:text-indigo-300 transition-colors"
                >
                  <span className="hidden sm:inline">Explorar</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>
                    {item.completedCourses} de {item.totalCourses} cursos finalizados
                  </span>
                  <span className="font-semibold text-slate-200">
                    {Math.round(item.averageProgressPercentage)}%
                  </span>
                </div>
                <Progress
                  value={item.averageProgressPercentage}
                  variant={meta.variant}
                  className="h-2 bg-slate-800"
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
