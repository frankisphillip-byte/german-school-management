import { supabase } from '../../services/supabase';

interface AttendanceToBeSaved {
  student_id: string;
  course_id: string;
  session_date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string;
  recorded_by: string;
  recorded_at: string;
}

export const bulkMarkAttendance = async (records: AttendanceToBeSaved[]) => {
  if (records.length === 0) {
    return { saved: 0, ids: [] };
  }

  const validRecords = records.filter(
    (r) => r.student_id && r.course_id && r.session_date && r.status
  );

  if (validRecords.length === 0) {
    throw new Error('No valid attendance records to save');
  }

  const { data, error } = await supabase
    .from('attendance')
    .upsert(validRecords, {
      onConflict: 'student_id,course_id,session_date',
    })
    .select('id');

  if (error) {
    throw new Error(`Failed to save attendance: ${error.message}`);
  }

  return {
    saved: data?.length || 0,
    ids: data?.map((a: any) => a.id) || [],
  };
};

export const getAttendanceByDate = async (courseId: string, sessionDate: string) => {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('course_id', courseId)
    .eq('session_date', sessionDate);

  if (error) {
    throw new Error(`Failed to fetch attendance: ${error.message}`);
  }

  return data || [];
};

export const getAttendanceStats = async (courseId: string) => {
  const { data, error } = await supabase
    .from('attendance')
    .select('status, session_date')
    .eq('course_id', courseId);

  if (error) {
    throw new Error(`Failed to fetch attendance stats: ${error.message}`);
  }

  const stats = {
    totalRecords: data?.length || 0,
    present: data?.filter((a) => a.status === 'present').length || 0,
    absent: data?.filter((a) => a.status === 'absent').length || 0,
    late: data?.filter((a) => a.status === 'late').length || 0,
    excused: data?.filter((a) => a.status === 'excused').length || 0,
  };

  return stats;
};

export const getStudentAttendanceHistory = async (studentId: string, courseId: string) => {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .order('session_date', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch student attendance: ${error.message}`);
  }

  return data || [];
};

export const exportAttendanceAsCSV = async (
  courseId: string,
  startDate: string,
  endDate: string
) => {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('course_id', courseId)
    .gte('session_date', startDate)
    .lte('session_date', endDate)
    .order('session_date', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch attendance for export: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return 'No attendance records to export';
  }

  const headers = ['Student ID', 'Session Date', 'Status', 'Notes'];
  const rows = data.map((a) => [
    a.student_id,
    a.session_date,
    a.status,
    `"${a.notes?.replace(/"/g, '""') || ''}"`,
  ]);

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
  return csv;
};

export const generateAttendanceReport = async (
  courseId: string,
  startDate: string,
  endDate: string
) => {
  const { data, error } = await supabase
    .from('attendance')
    .select('session_date, status')
    .eq('course_id', courseId)
    .gte('session_date', startDate)
    .lte('session_date', endDate);

  if (error) {
    throw new Error(`Failed to generate report: ${error.message}`);
  }

  const dailyReport = (data || []).reduce(
    (acc, record) => {
      const date = record.session_date;
      if (!acc[date]) {
        acc[date] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
      }
      acc[date][record.status]++;
      acc[date].total++;
      return acc;
    },
    {} as Record<string, { present: number; absent: number; late: number; excused: number; total: number }>
  );

  return dailyReport;
};