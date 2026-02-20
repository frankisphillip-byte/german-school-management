import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

export const useReporting = () => {
  const queryClient = useQueryClient();

  const systemMetrics = useQuery({
    queryKey: ['system-metrics'],
    queryFn: async () => {
      const [studentCount, teacherCount, courseCount, grades, attendance] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'student'),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'teacher'),
        supabase.from('courses').select('id', { count: 'exact' }),
        supabase.from('grades').select('grade'),
        supabase.from('attendance').select('status'),
      ]);

      const gradesList = grades.data || [];
      const avgGPA = gradesList.length > 0 ? Math.round((gradesList.reduce((sum, g) => sum + g.grade, 0) / gradesList.length) * 10) / 10 : 0;
      const attendanceList = attendance.data || [];
      const presentDays = attendanceList.filter((a) => a.status === 'present').length;
      const avgAttendanceRate = attendanceList.length > 0 ? Math.round((presentDays / attendanceList.length) * 100) : 0;

      return {
        totalStudents: studentCount.count || 0,
        totalTeachers: teacherCount.count || 0,
        totalCourses: courseCount.count || 0,
        avgGPA,
        avgAttendanceRate,
        activeUsers24h: 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const courseMetrics = useQuery({
    queryKey: ['course-metrics'],
    queryFn: async () => {
      const { data: courses } = await supabase
        .from('courses')
        .select(`id, name, teacher_id, profiles(first_name, last_name)`);
      return courses || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  return {
    systemMetrics: systemMetrics.data,
    isFetchingSystemMetrics: systemMetrics.isLoading,
    courseMetrics: courseMetrics.data || [],
    isFetchingCourseMetrics: courseMetrics.isLoading,
    studentsAtRisk: [],
    isFetchingAtRiskStudents: false,
    refreshMetrics: () => {},
  };
};