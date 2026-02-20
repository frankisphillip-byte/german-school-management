import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import './TeacherMobile.css';

export const TeacherMobileView: React.FC = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'classes' | 'analytics' | 'quick-actions'>('dashboard');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['teacher-courses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`id, name, course_grades!inner(count), course_students(count)`)
        .eq('teacher_id', user?.id)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data || []).map((course) => ({
        id: course.id,
        name: course.name,
        studentCount: course.course_students?.length || 0,
      }));
    },
    enabled: role === 'teacher' && !!user,
  });

  return (
    <div className="teacher-mobile-view">
      <header className="mobile-header"><h1>Teacher Dashboard</h1><p className="user-greeting">Welcome, {user?.user_metadata?.first_name || 'Teacher'}</p></header>
      <div className="quick-actions-bar">
        <button className="action-btn">📝 Grade Entry</button>
        <button className="action-btn">✓ Attendance</button>
        <button className="action-btn">💬 Message</button>
      </div>
      <nav className="mobile-tabs">
        {['dashboard', 'classes', 'analytics', 'quick-actions'].map((tab) => (
          <button key={tab} className={`tab-button ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab as any)}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
        ))}
      </nav>
      <div className="tab-content">
        {activeTab === 'classes' && (
          <div className="classes-tab"><h3>Your Classes</h3>{coursesLoading ? <p className="loading">Loading...</p> : courses && courses.length > 0 ? (
            <div className="course-list">{courses.map((course) => (
              <div key={course.id} className={`course-card ${selectedCourse === course.id ? 'selected' : ''}`} onClick={() => setSelectedCourse(course.id)}><p className="course-name">{course.name}</p><p className="student-count">👥 {course.studentCount} students</p></div>
            ))}</div>
          ) : <p className="empty">No courses</p>}
        </div>
        )}
      </div>
      <div className="mobile-footer-safe"></div>
    </div>
  );
};