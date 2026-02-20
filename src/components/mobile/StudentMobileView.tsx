import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import './StudentMobile.css';

export const StudentMobileView: React.FC = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'grades' | 'schedule' | 'profile'>('dashboard');

  const { data: gradeSummary, isLoading: gradesLoading } = useQuery({
    queryKey: ['student-grade-summary', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grades')
        .select('course_id, grade, courses(name)')
        .eq('student_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const courseMap = new Map<string, { grades: number[]; courseName: string }>();
      (data || []).forEach((entry) => {
        const courseId = entry.course_id;
        const courseName = entry.courses?.name || 'Unknown';
        if (!courseMap.has(courseId)) courseMap.set(courseId, { grades: [], courseName });
        courseMap.get(courseId)!.grades.push(entry.grade);
      });

      return Array.from(courseMap.values()).map((course) => ({
        courseName: course.courseName,
        average: Math.round((course.grades.reduce((a, b) => a + b, 0) / course.grades.length) * 10) / 10,
        latestGrade: course.grades[0] || 0,
        gradeCount: course.grades.length,
      }));
    },
    enabled: role === 'student' && !!user,
  });

  const overallGPA = gradeSummary && gradeSummary.length > 0
    ? Math.round((gradeSummary.reduce((sum, g) => sum + g.average, 0) / gradeSummary.length) * 10) / 10
    : 0;

  return (
    <div className="student-mobile-view">
      <header className="mobile-header"><h1>My Dashboard</h1><p className="user-greeting">Hello, {user?.user_metadata?.first_name || 'Student'}</p></header>
      <div className="quick-stats">
        <div className="stat-box"><span className="stat-number">{overallGPA}</span><span className="stat-label">Overall GPA</span></div>
        <div className="stat-box"><span className="stat-number">5</span><span className="stat-label">Due Soon</span></div>
        <div className="stat-box"><span className="stat-number">3</span><span className="stat-label">Classes Today</span></div>
      </div>
      <nav className="mobile-tabs">
        {['dashboard', 'grades', 'schedule', 'profile'].map((tab) => (
          <button key={tab} className={`tab-button ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab as any)}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
        ))}
      </nav>
      <div className="tab-content">
        {activeTab === 'dashboard' && <div className="dashboard-tab"><div className="section"><h3>📌 Upcoming Assignments</h3><p className="empty">No upcoming assignments</p></div></div>}
        {activeTab === 'grades' && (
          <div className="grades-tab"><h3>Your Grades by Subject</h3>{gradesLoading ? <p className="loading">Loading...</p> : gradeSummary && gradeSummary.length > 0 ? (
            <div className="grade-cards">{gradeSummary.map((course, idx) => (
              <div key={idx} className="grade-card"><div className="grade-header"><p className="course-name">{course.courseName}</p><span className={`grade-badge ${course.average >= 75 ? 'good' : 'fair'}`}>{course.average}</span></div></div>
            ))}</div>
          ) : <p className="empty">No grades</p>}
        </div>
        )}
      </div>
      <div className="mobile-footer-safe"></div>
    </div>
  );
};