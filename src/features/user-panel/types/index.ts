export interface StudentAnalytics {
  completedCoursesCount: number;
  inProgressCoursesCount: number;
  totalWatchedHours: number;
  communityPoints: number;
  communityLevel: number;
  studyStreakDays: number;
}

export interface FacultyProgressSummary {
  facultyName: string;
  facultySlug: string;
  totalCourses: number;
  completedCourses: number;
  averageProgressPercentage: number;
}
