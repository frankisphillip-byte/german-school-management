import { useCallback, useRef, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';
import { useGradeEntry } from '../../hooks/useGradeEntry';
import { bulkUpdateGrades } from '../../utils/gradeBulkOperations';
import { useAuth } from '../../hooks/useAuth';
import './GradeEntryForm.css';

interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface GradeRow {
  student_id: string;
  score: number | null;
  feedback: string;
  isDirty: boolean;
}

interface GradeEntryFormProps {
  courseId: string;
  onSuccess?: () => void;
}

/**
 * POS-Speed Grade Entry Form
 * Features:
 * - Keyboard navigation (Tab to next student, Shift+Tab to prev)
 * - Auto-advance on valid score entry
 * - Bulk save (Ctrl+S)
 * - Real-time validation
 */
export const GradeEntryForm = ({ courseId, onSuccess }: GradeEntryFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { gradeMap, setGrade, clearGrades } = useGradeEntry(courseId);

  const [students, setStudents] = useState<Student[]>([]);
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [unsavedCount, setUnsavedCount] = useState(0);
  const inputRefs = useRef<HTMLInputElement[]>([]);

  const { data: enrolledStudents, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['course-students', courseId],
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
    const unsaved = Array.from(gradeMap.values()).filter((g) => g.isDirty).length;
    setUnsavedCount(unsaved);
  }, [gradeMap]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const gradesToSave = Array.from(gradeMap.entries())
        .filter(([_, grade]) => grade.isDirty && grade.score !== null)
        .map(([studentId, grade]) => ({
          student_id: studentId,
          course_id: courseId,
          score: grade.score,
          feedback: grade.feedback,
          graded_by: user?.id,
          graded_at: new Date().toISOString(),
        }));

      if (gradesToSave.length === 0) {
        return { saved: 0 };
      }

      return await bulkUpdateGrades(gradesToSave);
    },
    onSuccess: () => {
      clearGrades();
      queryClient.invalidateQueries({ queryKey: ['grades', courseId] });
      onSuccess?.();
    },
  });

  useEffect(() => {
    if (autoSaveEnabled && unsavedCount > 0 && unsavedCount % 5 === 0) {
      const timer = setTimeout(() => {
        saveMutation.mutate();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [unsavedCount, autoSaveEnabled, saveMutation]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, studentId: string, fieldType: 'score' | 'feedback') => {
      const currentIndex = students.findIndex((s) => s.id === studentId);

      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          if (currentIndex > 0) {
            setCurrentRowIndex(currentIndex - 1);
            setTimeout(() => inputRefs.current[currentIndex - 1]?.focus(), 0);
          }
        } else {
          if (fieldType === 'score') {
            inputRefs.current[currentIndex + students.length]?.focus();
          } else {
            if (currentIndex < students.length - 1) {
              setCurrentRowIndex(currentIndex + 1);
              setTimeout(() => inputRefs.current[currentIndex + 1]?.focus(), 0);
            }
          }
        }
      } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        saveMutation.mutate();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentIndex < students.length - 1) {
          setCurrentRowIndex(currentIndex + 1);
          setTimeout(() => inputRefs.current[currentIndex + 1]?.focus(), 0);
        }
      }
    },
    [students, saveMutation]
  );

  const handleScoreChange = useCallback(
    (studentId: string, value: string) => {
      const score = value === '' ? null : parseFloat(value);
      if (score !== null && (score < 0 || score > 100 || isNaN(score))) {
        return;
      }
      setGrade(studentId, { score, isDirty: true });
    },
    [setGrade]
  );

  const handleFeedbackChange = useCallback(
    (studentId: string, value: string) => {
      setGrade(studentId, { feedback: value, isDirty: true });
    },
    [setGrade]
  );

  if (isLoadingStudents) {
    return <div className="grade-entry-loading">Loading student list...</div>;
  }

  return (
    <div className="grade-entry-container">
      <div className="grade-entry-header">
        <h2>Grade Entry — {courseId}</h2>
        <div className="grade-entry-stats">
          <span className="stat unsaved">{unsavedCount} unsaved</span>
          <span className="stat total">{students.length} students</span>
        </div>
        <div className="grade-entry-controls">
          <label className="auto-save-toggle">
            <input
              type="checkbox"
              checked={autoSaveEnabled}
              onChange={(e) => setAutoSaveEnabled(e.target.checked)}
            />
            Auto-save every 5 grades
          </label>
          <button
            className="btn-save"
            onClick={() => saveMutation.mutate()}
            disabled={unsavedCount === 0 || saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving...' : `Save All (${unsavedCount})`}
          </button>
        </div>
      </div>

      <div className="grade-entry-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Student Name</th>
              <th>Score (0-100)</th>
              <th>Feedback</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => {
              const grade = gradeMap.get(student.id) || { score: null, feedback: '', isDirty: false };
              return (
                <tr
                  key={student.id}
                  className={`grade-row ${currentRowIndex === idx ? 'active' : ''} ${grade.isDirty ? 'dirty' : ''}`}
                >
                  <td className="row-number">{idx + 1}</td>
                  <td className="student-name">{student.full_name}</td>
                  <td className="score-cell">
                    <input
                      ref={(el) => {
                        if (el) inputRefs.current[idx] = el;
                      }}
                      type="number"
                      min="0"
                      max="100"
                      placeholder="—"
                      value={grade.score ?? ''}
                      onChange={(e) => handleScoreChange(student.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, student.id, 'score')}
                      onFocus={() => setCurrentRowIndex(idx)}
                      className={`score-input ${grade.score !== null ? 'filled' : ''}`}
                    />
                  </td>
                  <td className="feedback-cell">
                    <input
                      ref={(el) => {
                        if (el) inputRefs.current[students.length + idx] = el;
                      }}
                      type="text"
                      placeholder="Comments..."
                      value={grade.feedback}
                      onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, student.id, 'feedback')}
                      className="feedback-input"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grade-entry-footer">
        <p>
          <strong>Keyboard Shortcuts:</strong><br />
          <code>Tab</code> → Next field | <code>Shift+Tab</code> → Previous field | <code>Enter</code> → Next student | <code>Ctrl+S</code> → Save all
        </p>
      </div>
    </div>
  );
};

export default GradeEntryForm;