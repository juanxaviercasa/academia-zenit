import { CheckCircle2, Clock, Flame, Award, Timer } from "lucide-react";
import { StudentAnalytics } from "@/features/user-panel/types";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface DashboardStatsProps {
  stats?: Partial<StudentAnalytics>;
}

export const DashboardStats = ({ stats }: DashboardStatsProps) => {
  const data: StudentAnalytics = {
    completedCoursesCount: stats?.completedCoursesCount ?? 0,
    inProgressCoursesCount: stats?.inProgressCoursesCount ?? 0,
    totalWatchedHours: stats?.totalWatchedHours ?? 0,
    communityPoints: stats?.communityPoints ?? 120,
    communityLevel: stats?.communityLevel ?? 1,
    studyStreakDays: stats?.studyStreakDays ?? 1,
  };

  // Nivel Skool: calculamos progreso hacia el siguiente nivel (cada 100 XP = 1 nivel)
  const currentLevelMinXp = (data.communityLevel - 1) * 100;
  const nextLevelXp = data.communityLevel * 100;
  const xpInCurrentLevel = Math.max(0, data.communityPoints - currentLevelMinXp);
  const xpProgressPercent = Math.min(100, Math.round((xpInCurrentLevel / 100) * 100));

  const items = [
    {
      title: "Cursos Completados",
      value: data.completedCoursesCount,
      subtitle: "Objetivos conquistados",
      icon: CheckCircle2,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      title: "Cursos en Progreso",
      value: data.inProgressCoursesCount,
      subtitle: "Lecciones activas hoy",
      icon: Clock,
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/20",
    },
    {
      title: "Horas de Estudio",
      value: `${data.totalWatchedHours.toFixed(1)}h`,
      subtitle: "Tiempo invertido en clases",
      icon: Timer,
      color: "text-sky-400",
      bgColor: "bg-sky-500/10",
      borderColor: "border-sky-500/20",
    },
    {
      title: "Racha de Estudio",
      value: `${data.studyStreakDays} ${data.studyStreakDays === 1 ? "día" : "días"}`,
      subtitle: "Constancia académica",
      icon: Flame,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Grid de 4 estadísticas principales + Tarjeta de Nivel Skool */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card
              key={index}
              className="border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-all hover:shadow-lg"
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-400">{item.title}</p>
                  <p className="text-2xl font-bold tracking-tight text-slate-100">
                    {item.value}
                  </p>
                  <p className="text-[11px] text-slate-500">{item.subtitle}</p>
                </div>
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.bgColor} ${item.borderColor} border`}
                >
                  <Icon className={`h-6 w-6 ${item.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gamificación estilo Skool: Nivel y Puntos de Comunidad */}
      <Card className="border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white shadow-lg shadow-indigo-500/20">
              <Award className="h-7 w-7 text-white" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Rango de la Comunidad
                </span>
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                  Nivel {data.communityLevel}
                </span>
              </div>
              <h4 className="text-lg font-bold text-slate-100">
                {data.communityPoints} Puntos Zenit (XP)
              </h4>
              <p className="text-xs text-slate-400">
                Gana puntos completando lecciones, respondiendo dudas y aportando en los foros.
              </p>
            </div>
          </div>

          <div className="w-full md:w-64 space-y-1.5 shrink-0">
            <div className="flex justify-between text-xs font-medium text-slate-400">
              <span>Nivel {data.communityLevel}</span>
              <span className="text-emerald-400">{nextLevelXp - data.communityPoints} XP para Nivel {data.communityLevel + 1}</span>
            </div>
            <Progress
              value={xpProgressPercent}
              variant="gradient"
              className="h-2 bg-slate-800"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
