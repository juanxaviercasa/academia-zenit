import { Users, Award, Flame } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostCard } from "@/features/community/components/PostCard";
import { CreatePostForm } from "@/features/community/components/CreatePostForm";

const DEMO_FACULTIES = [
  {
    id: "fac-math",
    name: "Facultad de Matemáticas",
    slug: "matematicas",
    categories: [
      { id: "c-alg", name: "Álgebra", slug: "algebra" },
      { id: "c-ari", name: "Aritmética", slug: "aritmetica" },
      { id: "c-geo", name: "Geometría", slug: "geometria" },
      { id: "c-trig", name: "Trigonometría", slug: "trigonometria" },
      { id: "c-rm", name: "Razonamiento Matemático (RM)", slug: "razonamiento-matematico" },
    ],
  },
  {
    id: "fac-sci",
    name: "Facultad de Ciencias",
    slug: "ciencias",
    categories: [
      { id: "c-fis", name: "Física", slug: "fisica" },
      { id: "c-qui", name: "Química", slug: "quimica" },
      { id: "c-bio", name: "Biología", slug: "biologia" },
    ],
  },
  {
    id: "fac-hum",
    name: "Facultad de Humanidades",
    slug: "humanidades",
    categories: [
      { id: "c-rv", name: "Razonamiento Verbal (RV)", slug: "razonamiento-verbal" },
      { id: "c-geo2", name: "Geografía", slug: "geografia" },
      { id: "c-hp", name: "Historia del Perú", slug: "historia-del-peru" },
    ],
  },
];

interface CommunityAuthor {
  id: string;
  name: string | null;
  imageUrl: string | null;
  points: number;
  level: number;
  role: string;
}

interface CommunityPostItem {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: Date;
  author: CommunityAuthor;
  faculty: { name: string; slug: string };
  category: { name: string; slug: string } | null;
  likes: { userId: string }[];
  comments: {
    id: string;
    content: string;
    createdAt: Date;
    author: CommunityAuthor;
  }[];
  _count: { comments: number; likes: number };
}

interface LeaderboardStudent {
  id: string;
  name: string | null;
  imageUrl: string | null;
  points: number;
  level: number;
}

const DEMO_POSTS: CommunityPostItem[] = [
  {
    id: "p1",
    title: "🔥 Reto Semanal de Geometría del Espacio: Teorema de las 3 Perpendiculares",
    content: "Colegas postulantes a Ingeniería UNI y San Marcos: ¿Cuál es el método más rápido para hallar la mínima distancia entre dos rectas alabeadas sin recurrir a geometría analítica? Adjunto mi planteamiento con proyecciones.",
    isPinned: true,
    createdAt: new Date(Date.now() - 3600000 * 4),
    author: {
      id: "u-prof",
      name: "Prof. Carlos Mendoza",
      imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      points: 850,
      level: 17,
      role: "TEACHER",
    },
    faculty: { name: "Facultad de Matemáticas", slug: "matematicas" },
    category: { name: "Geometría", slug: "geometria" },
    likes: [],
    comments: [
      {
        id: "c1",
        content: "Excelente ejercicio profesor. Recomiendo trazar el plano paralelo a una de las rectas que contenga a la otra y luego proyectar la distancia.",
        createdAt: new Date(Date.now() - 3600000 * 2),
        author: {
          id: "u2",
          name: "Alejandro Ruiz",
          imageUrl: null,
          points: 320,
          level: 6,
          role: "STUDENT",
        },
      },
    ],
    _count: { comments: 4, likes: 18 },
  },
  {
    id: "p2",
    title: "¿Cómo recordar fácilmente las etapas de la Glucólisis en Biología Celular?",
    content: "Para el área de Ciencias de la Salud: preparé una mnemotecnia para las 10 reacciones de la fase preparatoria y de rendimiento energético. ¡Déjenme en los comentarios si quieren que suba el diagrama completo!",
    isPinned: false,
    createdAt: new Date(Date.now() - 3600000 * 12),
    author: {
      id: "u3",
      name: "Lucía Fernández",
      imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
      points: 290,
      level: 5,
      role: "STUDENT",
    },
    faculty: { name: "Facultad de Ciencias", slug: "ciencias" },
    category: { name: "Biología", slug: "biologia" },
    likes: [],
    comments: [],
    _count: { comments: 7, likes: 24 },
  },
];

const DEMO_LEADERBOARD: LeaderboardStudent[] = [
  { id: "l1", name: "Prof. Carlos Mendoza", imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200", points: 850, level: 17 },
  { id: "l2", name: "Mateo Valdivia", imageUrl: null, points: 520, level: 10 },
  { id: "l3", name: "Alejandro Ruiz", imageUrl: null, points: 320, level: 6 },
  { id: "l4", name: "Lucía Fernández", imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200", points: 290, level: 5 },
  { id: "l5", name: "Gabriel Sotomayor", imageUrl: null, points: 215, level: 4 },
];

export default async function CommunityPage() {
  const { userId } = await auth();

  let faculties = DEMO_FACULTIES;
  let posts: CommunityPostItem[] = DEMO_POSTS;
  let topStudents: LeaderboardStudent[] = DEMO_LEADERBOARD;

  try {
    const facultiesDb = await db.faculty.findMany({
      include: {
        categories: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { name: "asc" },
    });

    if (facultiesDb.length > 0) {
      faculties = facultiesDb;
    }

    const postsDb = await db.communityPost.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            points: true,
            level: true,
            role: true,
          },
        },
        faculty: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
        likes: { select: { userId: true } },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                points: true,
                level: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { comments: true, likes: true } },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 30,
    });

    if (postsDb.length > 0) {
      posts = postsDb;
    }

    const topDb = await db.user.findMany({
      orderBy: { points: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        imageUrl: true,
        points: true,
        level: true,
      },
    });

    if (topDb.length > 0) {
      topStudents = topDb;
    }
  } catch (error) {
    console.warn("[COMMUNITY] DB offline, usando datos de demostración Skool:", error instanceof Error ? error.message : "");
  }

  return (
    <div className="space-y-6">
      {/* Cabecera de Comunidad */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-950 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Users className="h-7 w-7 text-indigo-400" />
              Comunidad de Alto Rendimiento
            </h1>
            <p className="text-sm text-slate-300">
              Espacio colaborativo de debate, resolución de ejercicios tipo examen de admisión y aprendizaje continuo.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-amber-300 text-xs font-bold">
              <Flame className="h-4 w-4" />
              Gana XP respondiendo dudas
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal: Feed de Posts */}
        <div className="lg:col-span-2 space-y-4">
          {/* Formulario para publicar */}
          <CreatePostForm faculties={faculties} />

          {/* Lista de Posts */}
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                content={post.content}
                isPinned={post.isPinned}
                createdAt={post.createdAt}
                author={post.author}
                faculty={post.faculty}
                category={post.category}
                initialLikesCount={post._count.likes}
                initialHasLiked={
                  userId ? post.likes.some((l) => l.userId === userId) : false
                }
                commentsCount={post._count.comments}
                comments={post.comments}
              />
            ))}
          </div>
        </div>

        {/* Columna Lateral: Leaderboard y Canales */}
        <div className="space-y-6">
          {/* Leaderboard estilo Skool */}
          <Card className="border-slate-800 bg-slate-900/80 shadow-md">
            <CardHeader className="pb-3 border-b border-slate-800/80">
              <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-400" />
                Top Estudiantes (Leaderboard)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              {topStudents.map((student, idx) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-950/50 p-2 text-xs border border-slate-800/40"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        idx === 0
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : idx === 1
                          ? "bg-slate-400/20 text-slate-300"
                          : idx === 2
                          ? "bg-amber-700/20 text-amber-500"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={student.imageUrl || undefined} />
                      <AvatarFallback className="bg-indigo-950 text-[10px] font-bold text-indigo-300">
                        {student.name?.charAt(0) || "E"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-200 truncate max-w-[110px]">
                        {student.name || "Estudiante"}
                      </span>
                      <span className="text-[10px] text-indigo-400">
                        Nivel {student.level}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-amber-400">
                      {student.points}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-0.5">XP</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Facultades y Canales */}
          <Card className="border-slate-800 bg-slate-900/80 shadow-md">
            <CardHeader className="pb-3 border-b border-slate-800/80">
              <CardTitle className="text-sm font-bold text-slate-100">
                Canales por Facultad
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2">
              {faculties.map((f) => (
                <div
                  key={f.id}
                  className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/40 hover:border-slate-700 transition-colors"
                >
                  <p className="text-xs font-bold text-slate-200">{f.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {f.categories.map((cat) => (
                      <span
                        key={cat.id}
                        className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400"
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
