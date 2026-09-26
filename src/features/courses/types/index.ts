import { Category, Chapter, Course, Faculty, MuxData, UserProgress } from "@prisma/client";

export type CourseWithProgressWithCategory = Course & {
  category: Category;
  faculty: Faculty;
  chapters: (Chapter & {
    muxData?: MuxData | null;
    userProgress?: UserProgress[];
  })[];
  progress: number | null;
};

export type ChapterWithMux = Chapter & {
  muxData: MuxData | null;
  userProgress?: UserProgress[];
};

export type SafeCourse = Omit<Course, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export interface CourseSidebarData {
  id: string;
  title: string;
  price?: number | null;
  faculty?: { name: string; slug: string } | null;
  category?: { name: string; slug: string } | null;
  chapters: {
    id: string;
    title: string;
    position: number;
    isFree: boolean;
    isPublished: boolean;
    courseId: string;
    userProgress?: { isCompleted: boolean }[] | null;
  }[];
}
