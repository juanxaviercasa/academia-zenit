import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { DashboardSidebar } from "@/features/user-panel/components/DashboardSidebar";
import { DashboardNavbar } from "@/features/user-panel/components/DashboardNavbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  let userLevel = 1;

  if (userId) {
    const user = await db.user.findUnique({
      where: { userId },
      select: { level: true },
    });
    if (user?.level) {
      userLevel = user.level;
    }
  }

  return (
    <div className="h-full relative min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar fijo en desktop */}
      <div className="hidden h-full md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-50">
        <DashboardSidebar />
      </div>

      {/* Barra de navegación superior */}
      <DashboardNavbar level={userLevel} streakDays={3} />

      {/* Contenido principal con padding para sidebar y navbar */}
      <main className="md:pl-64 pt-16 min-h-screen flex flex-col">
        <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
