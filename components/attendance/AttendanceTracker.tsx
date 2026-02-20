import { useCallback, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';
import { useAttendance } from '../../hooks/useAttendance';
import { bulkMarkAttendance } from '../../utils/attendanceBulkOperations';
import { useAuth } from '../../hooks/useAuth';
import './AttendanceTracker.css';

interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface AttendanceRecord {
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string;
  isDirty: boolean;
}

interface AttendanceTrackerProps {
  courseId: string;
  sessionDate?: string;
  onSuccess?: () => void;
}

export const AttendanceTracker = ({ courseId, sessionDate, onSuccess }: AttendanceTrackerProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { attendanceMap, setAttendance, clearAttendance, unsavedCount } = useAttendance(courseId);

  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isQuickMarkMode, setIsQuickMarkMode] = useState(false);

  const today = sessionDate || new Date().toISOString().split('T')[0];

  const { data: enrolledStudents, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['course-students-attendance', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('student_id, students(id, full_name, email)')
        .eq('course_id', courseId);

      if (error) throw error;
      return (data || []).map((e: any) => e.students).filter(Boolean) as Student[];
    },
    staleTime: 60000,
  });

  useEffect(() => {
    if (enrolledStudents) {
      setStudents(enrolledStudents);
    }
  }, [enrolledStudents]);

  useEffect(() => {
    const filtered = students.filter((s) =>
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [students, searchTerm]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const attendanceToSave = Array.from(attendanceMap.entries())
        .filter(([_, record]) => record.isDirty)
        .map(([studentId, record]) => ({
          student_id: studentId,
          course_id: courseId,
          session_date: today,
          status: record.status,
          notes: record.notes,
          recorded_by: user?.id,
          recorded_at: new Date().toISOString(),
        }));

      if (attendanceToSave.length === 0) {
        return { saved: 0 };
      }

      return await bulkMarkAttendance(attendanceToSave);
    },
    onSuccess: () => {
      clearAttendance();
      queryClient.invalidateQueries({ queryKey: ['attendance', courseId, today] });
      onSuccess?.();
    },
  });

  const markStudent = useCallback(
    (studentId: string, status: AttendanceRecord['status']) => {
      setAttendance(studentId, { status, isDirty: true });
    },
    [setAttendance]
  );

  const markAllPresent = useCallback(() => {
    filteredStudents.forEach((student) => {
      setAttendance(student.id, { status: 'present', isDirty: true });
    });
  }, [filteredStudents, setAttendance]);

  const markAllAbsent = useCallback(() => {
    filteredStudents.forEach((student) => {
      setAttendance(student.id, { status: 'absent', isDirty: true });
    });
  }, [filteredStudents, setAttendance]);

  const clearAllMarks = useCallback(() => {
    filteredStudents.forEach((student) => {
      setAttendance(student.id, { status: 'present', isDirty: false });
    });
  }, [filteredStudents, setAttendance]);

  if (isLoadingStudents) {
    return <div className="attendance-loading">Loading student list...</div>;
  }

  const presentCount = Array.from(attendanceMap.values()).filter(
    (a) => a.status === 'present'
  ).length;
  const absentCount = Array.from(attendanceMap.values()).filter(
    (a) => a.status === 'absent'
  ).length;
  const lateCount = Array.from(attendanceMap.values()).filter(
    (a) => a.status === 'late'
  ).length;

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <div className="header-title">
          <h2>Attendance — {courseId}</h2>
          <p className="session-date">{new Date(today).toLocaleDateString()}</p>
        </div>

        <div className="attendance-stats">
          <div className="stat present">
            <span className="label">Present</span>
            <span className="count">{presentCount}</span>
          </div>
          <div className="stat late">
            <span className="label">Late</span>
            <span className="count">{lateCount}</span>
          </div>
          <div className="stat absent">
            <span className="label">Absent</span>
            <span className="count">{absentCount}</span>
          </div>
          <div className="stat unsaved">
            <span className="label">Unsaved</span>
            <span className="count">{unsavedCount}</span>
          </div>
        </div>
      </div>

      <div className="attendance-controls">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <div className="bulk-actions">
          <button className="btn-bulk present" onClick={markAllPresent}>
            Mark All Present
          </button>
          <button className="btn-bulk absent" onClick={markAllAbsent}>
            Mark All Absent
          </button>
          <button className="btn-bulk reset" onClick={clearAllMarks}>
            Clear
          </button>
          <button
            className="btn-mode"
            onClick={() => setIsQuickMarkMode(!isQuickMarkMode)}
          >
            {isQuickMarkMode ? 'Grid Mode' : 'Quick Mark'}
          </button>
        </div>
      </div>

      <div className={`attendance-list ${isQuickMarkMode ? 'quick-mode' : 'grid-mode'}`}>
        {filteredStudents.length === 0 ? (
          <p className="no-students">No students match your search</p>
        ) : (
          filteredStudents.map((student) => {
            const record = attendanceMap.get(student.id) || {
              status: 'present',
              notes: '',
              isDirty: false,
            };
            return (
              <div
                key={student.id}
                className={`attendance-row ${record.status} ${record.isDirty ? 'dirty' : ''}`}
              >
                <div className="student-info">
                  <p className="student-name">{student.full_name}</p>
                  <p className="student-email">{student.email}</p>
                </div>

                <div className="attendance-actions">
                  <button
                    className={`btn-status present ${record.status === 'present' ? 'active' : ''}`}
                    onClick={() => markStudent(student.id, 'present')}
                    title="Mark present"
                  >
                    ✓
                  </button>
                  <button
                    className={`btn-status late ${record.status === 'late' ? 'active' : ''}`}
                    onClick={() => markStudent(student.id, 'late')}
                    title="Mark late"
                  >
                    ⏱
                  </button>
                  <button
                    className={`btn-status absent ${record.status === 'absent' ? 'active' : ''}`}
                    onClick={() => markStudent(student.id, 'absent')}
                    title="Mark absent"
                  >
                    ✕
                  </button>
                  <button
                    className={`btn-status excused ${record.status === 'excused' ? 'active' : ''}`}
                    onClick={() => markStudent(student.id, 'excused')}
                    title="Mark excused"
                  >
                    ℹ
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="attendance-footer">
        <button
          className="btn-save"
          onClick={() => saveMutation.mutate()}
          disabled={unsavedCount === 0 || saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Saving...' : `Save All (${unsavedCount})`}
        </button>
        <p className="help-text">💡 Tip: Click any status button to toggle. Use bulk actions for entire class.</p>
      </div>
    </div>
  );
};

export default AttendanceTracker;