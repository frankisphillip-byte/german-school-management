import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useReporting } from '../hooks/useReporting';
import './ReportingDashboard.css';

export const ReportingDashboard: React.FC = () => {
  const { role } = useAuth();
  const [reportMode, setReportMode] = useState<'overview' | 'courses' | 'students' | 'alerts'>('overview');
  const { systemMetrics, isFetchingSystemMetrics, courseMetrics, isFetchingCourseMetrics } = useReporting();

  return (
    <div className="reporting-dashboard">
      <header className="dashboard-header">
        <h1>📊 School Analytics & Reporting</h1>
        <div className="header-controls">
          <select className="date-selector">
            <option>This Week</option>
            <option>This Month</option>
            <option>This Semester</option>
          </select>
        </div>
      </header>

      <nav className="report-tabs">
        {['overview', 'courses', 'students', 'alerts'].map((mode) => (
          <button key={mode} className={`tab ${reportMode === mode ? 'active' : ''}`} onClick={() => setReportMode(mode as any)}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</button>
        ))}
      </nav>

      <main className="report-content">
        {reportMode === 'overview' && (
          <div className="overview-section">
            {isFetchingSystemMetrics ? <p className="loading">Loading metrics...</p> : (
              <>
                <div className="metrics-grid">
                  <div className="metric-card"><p className="metric-label">Total Students</p><p className="metric-value">{systemMetrics?.totalStudents || 0}</p></div>
                  <div className="metric-card"><p className="metric-label">Total Teachers</p><p className="metric-value">{systemMetrics?.totalTeachers || 0}</p></div>
                  <div className="metric-card"><p className="metric-label">Total Courses</p><p className="metric-value">{systemMetrics?.totalCourses || 0}</p></div>
                  <div className="metric-card"><p className="metric-label">Average GPA</p><p className={`metric-value ${systemMetrics?.avgGPA! >= 75 ? 'good' : 'warning'}`}>{systemMetrics?.avgGPA || 0}</p></div>
                  <div className="metric-card"><p className="metric-label">Attendance Rate</p><p className={`metric-value ${systemMetrics?.avgAttendanceRate! >= 90 ? 'good' : 'warning'}`}>{systemMetrics?.avgAttendanceRate || 0}%</p></div>
                  <div className="metric-card"><p className="metric-label">Parents Registered</p><p className="metric-value">0</p></div>
                </div>
              </>
            )}
          </div>
        )}

        {reportMode === 'courses' && (
          <div className="courses-section"><h3>Course Performance Rankings</h3>{isFetchingCourseMetrics ? <p className="loading">Loading...</p> : <p className="empty">No course data</p>}</div>
        )}
      </main>

      <footer className="dashboard-footer">
        <button className="export-btn">📥 Export PDF Report</button>
        <button className="export-btn">📊 Export CSV Data</button>
      </footer>
    </div>
  );
};