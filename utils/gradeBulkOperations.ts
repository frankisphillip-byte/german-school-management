import { supabase } from '../../services/supabase';

interface GradeToBeSaved {
  student_id: string;
  course_id: string;
  score: number;
  feedback: string;
  graded_by: string;
  graded_at: string;
}

export const bulkUpdateGrades = async (grades: GradeToBeSaved[]) => {
  if (grades.length === 0) {
    return { saved: 0, ids: [] };
  }

  const validGrades = grades.filter((g) => g.score >= 0 && g.score <= 100);

  if (validGrades.length === 0) {
    throw new Error('No valid grades to save');
  }

  const { data, error } = await supabase
    .from('grades')
    .upsert(validGrades, {
      onConflict: 'student_id,course_id',
    })
    .select('id');

  if (error) {
    throw new Error(`Failed to save grades: ${error.message}`);
  }

  return {
    saved: data?.length || 0,
    ids: data?.map((g: any) => g.id) || [],
  };
};

export const bulkDeleteGrades = async (gradeIds: string[]) => {
  if (gradeIds.length === 0) {
    return { deleted: 0 };
  }

  const { error, count } = await supabase
    .from('grades')
    .delete()
    .in('id', gradeIds);

  if (error) {
    throw new Error(`Failed to delete grades: ${error.message}`);
  }

  return { deleted: count || 0 };
};

export const getGradesByCourse = async (courseId: string, studentId?: string) => {
  let query = supabase.from('grades').select('*').eq('course_id', courseId);

  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch grades: ${error.message}`);
  }

  return data || [];
};

export const exportGradesAsCSV = async (courseId: string) => {
  const grades = await getGradesByCourse(courseId);

  if (grades.length === 0) {
    return 'No grades to export';
  }

  const headers = ['Student ID', 'Score', 'Feedback', 'Graded At'];
  const rows = grades.map((g) => [
    g.student_id,
    g.score,
    `"${g.feedback.replace(/"/g, '""')}"`,
    g.graded_at,
  ]);

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
  return csv;
};