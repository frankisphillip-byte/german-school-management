import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import './ParentPortal.css';

interface StudentProgress {
  studentId: string;
  name: string;
  gradeAverage: number;
  attendanceRate: number;
  recentGrades: { subject: string; grade: number; date: string }[];
  absences: number;
  absenceTrend: 'improving' | 'stable' | 'declining';
}

export const ParentPortal: React.FC = () => {
  const { user, role } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'grades' | 'attendance' | 'messages'>('overview');

  const { data: children, isLoading: childrenLoading } = useQuery({
    queryKey: ['parent-children', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parent_student_links')
        .select(`student_id, profiles!inner(id, first_name, last_name)`)
        .eq('parent_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: role === 'parent' && !!user,
  });

  const { data: studentProgress, isLoading: progressLoading } = useQuery({
    queryKey: ['student-progress', selectedStudent],
    queryFn: async () => {
      const { data: gradesData } = await supabase
        .from('grades')
        .select('course_id, grade, created_at, courses(name)')
        .eq('student_id', selectedStudent)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('status, marked_at')
        .eq('student_id', selectedStudent)
        .gte('marked_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const gradeAverage = gradesData && gradesData.length > 0
        ? gradesData.reduce((sum, g) => sum + g.grade, 0) / gradesData.length
        : 0;

      const totalDays = attendanceData?.length || 0;
      const presentDays = attendanceData?.filter((a) => a.status === 'present').length || 0;
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
      const absences = attendanceData?.filter((a) => a.status === 'absent').length || 0;

      return {
        gradeAverage: Math.round(gradeAverage * 10) / 10,
        attendanceRate: Math.round(attendanceRate),
        recentGrades: (gradesData || []).map((g) => ({
          subject: g.courses?.name || 'Unknown',
          grade: g.grade,
          date: new Date(g.created_at).toLocaleDateString(),
        })),
        absences,
        absenceTrend: absences > 5 ? 'declining' : 'stable',
      };
    },
    enabled: !!selectedStudent,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['parent-messages', selectedStudent],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parent_messages')
        .select('id, teacher_id, subject, message, created_at, priority, profiles(first_name, last_name)')
        .eq('student_id', selectedStudent)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []).map((msg) => ({
        id: msg.id,
        fromTeacher: `${msg.profiles?.first_name} ${msg.profiles?.last_name}`,
        subject: msg.subject,
        message: msg.message,
        date: new Date(msg.created_at).toLocaleDateString(),
        priority: msg.priority,
      }));
    },
    enabled: !!selectedStudent,
  });

  const student = children?.find((c) => c.student_id === selectedStudent);

  return (
    <div className="parent-portal">
      <header className="parent-header">
        <h1>Elternportal (Parent Portal)</h1>
        <p>Welcome, {user?.email}</p>
      </header>

      <div className="parent-layout">
        <aside className="student-selector">
          <h3>Ihre Kinder</h3>
          {childrenLoading ? <p className="loading">Loading...</p> : children && children.length > 0 ? (
            <ul>
              {children.map((child) => (
                <li
                  key={child.student_id}
                  className={`student-item ${selectedStudent === child.student_id ? 'active' : ''}`}
                  onClick={() => setSelectedStudent(child.student_id)}
                >
                  {child.profiles?.first_name} {child.profiles?.last_name}
                </li>
              ))}
            </ul>
          ) : <p className="empty">No students linked</p>}
        </aside>

        <main className="parent-main">
          {!selectedStudent ? (
            <div className="welcome-message">
              <h2>Please select a student to view progress</h2>
            </div>
          ) : (
            <>
              <div className="student-header">
                <h2>{student?.profiles?.first_name} {student?.profiles?.last_name}</h2>
              </div>

              <nav className="parent-tabs">
                {['overview', 'grades', 'attendance', 'messages'].map((mode) => (
                  <button
                    key={mode}
                    className={`tab ${viewMode === mode ? 'active' : ''}`}
                    onClick={() => setViewMode(mode as any)}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </nav>

              {progressLoading ? <div className="loading">Loading progress...</div> : (
                <>
                  {viewMode === 'overview' && (
                    <div className="overview-section">
                      <div className="stat-card">
                        <h4>Grade Average</h4>
                        <p className="stat-value">{studentProgress?.gradeAverage || 0}/100</p>
                        <p className="stat-label">Overall Performance</p>
                      </div>
                      <div className="stat-card">
                        <h4>Attendance Rate</h4>
                        <p className="stat-value">{studentProgress?.attendanceRate || 0}%</p>
                        <p className="stat-label">Days Present</p>
                      </div>
                      <div className="stat-card">
                        <h4>Absences (30 Days)</h4>
                        <p className="stat-value">{studentProgress?.absences || 0}</p>
                        <p className={`stat-label ${studentProgress?.absenceTrend === 'declining' ? 'warning' : ''}`}>
                          Trend: {studentProgress?.absenceTrend}
                        </p>
                      </div>
                    </div>
                  )}

                  {viewMode === 'grades' && (
                    <div className="grades-section">
                      <h3>Recent Grades</h3>
                      {studentProgress?.recentGrades && studentProgress.recentGrades.length > 0 ? (
                        <table className="grades-table">
                          <thead><tr><th>Subject</th><th>Grade</th><th>Date</th></tr></thead>
                          <tbody>
                            {studentProgress.recentGrades.map((grade, idx) => (
                              <tr key={idx}>
                                <td>{grade.subject}</td>
                                <td className={`grade-cell ${grade.grade >= 75 ? 'good' : grade.grade >= 50 ? 'fair' : 'poor'}`}>{grade.grade}</td>
                                <td>{grade.date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : <p className="empty">No grades yet</p>}
                    </div>
                  )}

                  {viewMode === 'attendance' && (
                    <div className="attendance-section">
                      <h3>Attendance Summary (Last 30 Days)</h3>
                      <div className="attendance-stats">
                        <div className="stat"><span className="label">Attendance Rate:</span><span className="value">{studentProgress?.attendanceRate}%</span></div>
                        <div className="stat"><span className="label">Absences:</span><span className={`value ${studentProgress?.absences! > 5 ? 'warning' : ''}`}>{studentProgress?.absences}</span></div>
                        <div className="stat"><span className="label">Trend:</span><span className="value">{studentProgress?.absenceTrend}</span></div>
                      </div>
                      {studentProgress?.absences! > 5 && <div className="alert-box">⚠️ High absence count detected. Please contact school.</div>}
                    </div>
                  )}

                  {viewMode === 'messages' && (
                    <div className="messages-section">
                      <h3>Communications from Teachers</h3>
                      {messagesLoading ? <p className="loading">Loading messages...</p> : messages && messages.length > 0 ? (
                        <div className="messages-list">
                          {messages.map((msg) => (
                            <div key={msg.id} className={`message-card ${msg.priority}`}>
                              <div className="message-header"><h4>{msg.subject}</h4><span className="priority-badge">{msg.priority.toUpperCase()}</span></div>
                              <p className="message-from">From: {msg.fromTeacher}</p>
                              <p className="message-text">{msg.message}</p>
                              <p className="message-date">{msg.date}</p>
                            </div>
                          ))}
                        </div>
                      ) : <p className="empty">No messages</p>}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};