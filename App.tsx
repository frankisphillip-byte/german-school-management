
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { UserRole, UserProfile, Course, CEFRLevel, Grade, Expense, AttendanceRecord, AttendanceStatus, Homework, Employee, StudentAccount, SecurityProfile, Invoice, Enrollment, StudentAssignment, EmployeeAttendance, Payslip, PermissionSet, LeaveRequest, LeaveStatus } from './types';
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';
import TeacherGradebook from './components/TeacherGradebook';
import StudentView from './components/StudentView';

const MOCK_COURSES: Course[] = [
  { id: 'c1', name: 'Deutsch für Fortgeschrittene', description: 'Vertiefung der grammatikalischen Strukturen und komplexen Textanalyse.', cefr_level: CEFRLevel.C1, teacher_id: 'demo-user-id', created_at: new Date().toISOString() },
  { id: 'c2', name: 'Elementary Social Studies', description: 'Introduction to geography and history taught in bi-lingual German.', cefr_level: CEFRLevel.A2, teacher_id: 'demo-user-id', created_at: new Date().toISOString() },
];

const INITIAL_SECURITY_PROFILES: SecurityProfile[] = [
  { 
    id: 'sp1', 
    name: 'Vollzugriff', 
    description: 'Standard student access with all portal features.', 
    permissions: { 
      view_grades: true, 
      submit_homework: true, 
      enroll_courses: true, 
      view_attendance: true, 
      edit_profile: true,
      manage_finance: false,
      manage_hr: false,
      manage_employee_data: false,
      generate_payroll: false,
      manage_attendance_hr: false
    } 
  },
  { 
    id: 'sp2', 
    name: 'Administrative Staff', 
    description: 'Finance and HR access.', 
    permissions: { 
      view_grades: true, 
      submit_homework: false, 
      enroll_courses: false, 
      view_attendance: true, 
      edit_profile: true,
      manage_finance: true,
      manage_hr: true,
      manage_employee_data: true,
      generate_payroll: true,
      manage_attendance_hr: true
    } 
  }
];

const MOCK_STUDENTS: StudentAccount[] = [
  { id: 'maximilian-weber', full_name: 'Maximilian Weber', email: 'max@weber.de', security_profile_id: 'sp1', joined_at: '2023-01-10' }
];

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [schoolName, setSchoolName] = useState('DSB Brooklyn');
  
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [students, setStudents] = useState<StudentAccount[]>(MOCK_STUDENTS);
  const [securityProfiles, setSecurityProfiles] = useState<SecurityProfile[]>(INITIAL_SECURITY_PROFILES);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [submissions, setSubmissions] = useState<StudentAssignment[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.getUser();
      if (data?.user) { 
        setUser({ ...data.user, id: data.user.role === UserRole.STUDENT ? 'maximilian-weber' : data.user.id }); 
      }
      setIsLoading(false);
    };
    checkUser();
    
    // Seed database for demonstration
    setEmployees([
      { id: 'demo-user-id', full_name: 'Hans Müller', role: 'Teacher', salary: 4500, email: 'hans@dsb.de', joined_at: '2022-08-01' },
      { id: 'admin-id', full_name: 'Schulleitung Admin', role: 'Admin', salary: 6500, email: 'leitung@dsb.de', joined_at: '2020-01-01' },
      { id: 'hr-id', full_name: 'Klara Personal', role: 'HR', salary: 5000, email: 'hr@dsb.de', joined_at: '2021-03-01' }
    ]);
    setEnrollments([{ id: 'e1', course_id: 'c1', student_id: 'maximilian-weber', status: 'Active', joined_at: '2023-09-01' }]);
    setInvoices([
      { id: 'inv1', student_id: 'maximilian-weber', student_name: 'Maximilian Weber', items: [{ description: 'Tution Fee Jan', amount: 1200, quantity: 1 }], total: 1200, status: 'paid', created_at: '2024-01-01' },
      { id: 'inv2', student_id: 'maximilian-weber', student_name: 'Maximilian Weber', items: [{ description: 'Tution Fee Feb', amount: 1200, quantity: 1 }], total: 1200, status: 'pending', created_at: '2024-02-01' }
    ]);
    setExpenses([
      { id: 'exp1', category: 'Rent', amount: 5000, date: '2024-02-01', description: 'Monatsmiete Brooklyn Campus', status: 'paid' },
      { id: 'exp2', category: 'Supplies', amount: 350, date: '2024-02-15', description: 'Unterrichtsmaterialien Chemie', status: 'paid' }
    ]);
    setLeaveRequests([
      { id: 'lr1', employee_id: 'demo-user-id', employee_name: 'Hans Müller', start_date: '2024-03-10', end_date: '2024-03-15', reason: 'Spring break family trip', status: LeaveStatus.PENDING, requested_at: new Date().toISOString() }
    ]);
  }, []);

  const handleUpdateInvoiceStatus = (invoiceId: string, status: 'paid' | 'pending') => {
    setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status } : inv));
  };

  const handleSaveGrade = (grade: Omit<Grade, 'id' | 'graded_at'>) => {
    setGrades(prev => [{ ...grade, id: `g-${Date.now()}`, graded_at: new Date().toISOString() }, ...prev]);
  };

  const handleSaveAttendance = (records: Record<string, AttendanceStatus>, courseId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const newRecs: AttendanceRecord[] = Object.entries(records).map(([studentId, status]) => ({
      id: `att-${studentId}-${today}`, student_id: studentId, course_id: courseId, date: today, status
    }));
    setAttendanceRecords(prev => [...prev.filter(r => !(r.date === today && r.course_id === courseId)), ...newRecs]);
  };

  const handleCreateExpense = (exp: Omit<Expense, 'id' | 'status'>) => {
    setExpenses(prev => [{ ...exp, id: `exp-${Date.now()}`, status: 'paid' }, ...prev]);
  };

  const handleLogin = async () => {
    setIsLoading(true);
    const { user: newUser } = await supabase.signInWithGoogle();
    if (newUser) { setUser({ ...newUser, id: newUser.role === UserRole.STUDENT ? 'maximilian-weber' : newUser.id }); }
    setIsLoading(false);
  };

  const handleSwitchRole = (role: UserRole) => {
    if (user) {
      supabase.setRole(role);
      supabase.getUser().then(({ data }) => {
        if (data?.user) {
          const mappedId = role === UserRole.STUDENT ? 'maximilian-weber' : role === UserRole.HR ? 'hr-id' : 'demo-user-id';
          setUser({ ...data.user, id: mappedId });
        }
      });
    }
  };

  const handleUpsertStudent = (stud: Omit<StudentAccount, 'id'>) => {
    setStudents(prev => [...prev, { ...stud, id: `std-${Date.now()}` }]);
  };

  const handleCreateSecurityProfile = (p: Omit<SecurityProfile, 'id'>) => {
    setSecurityProfiles(prev => [...prev, { ...p, id: `sp-${Date.now()}` }]);
  };

  const handleUpdateSecurityProfile = (id: string, updates: Partial<SecurityProfile>) => {
    setSecurityProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleSubmitLeaveRequest = (req: Omit<LeaveRequest, 'id' | 'status' | 'requested_at'>) => {
    const newReq: LeaveRequest = {
      ...req,
      id: `lr-${Date.now()}`,
      status: LeaveStatus.PENDING,
      requested_at: new Date().toISOString()
    };
    setLeaveRequests(prev => [newReq, ...prev]);
  };

  const handleUpdateLeaveRequestStatus = (id: string, status: LeaveStatus) => {
    setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  if (isLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center"><button onClick={handleLogin} className="bg-white text-[#1e3a8a] py-4 px-10 rounded-2xl font-black">Login with SSO</button></div>;

  return (
    <Layout schoolName={schoolName} user={user} onLogout={() => setUser(null)} onSwitchRole={handleSwitchRole} onUpdateProfile={async () => {}}>
      {(user.role === UserRole.ADMIN || user.role === UserRole.HR) && (
        <AdminDashboard 
          allCourses={courses} 
          allEnrollments={enrollments.map(e => ({ studentName: students.find(s => s.id === e.student_id)?.full_name || 'Student', studentId: e.student_id, courseId: e.course_id, joinedAt: e.joined_at }))} 
          onDropStudent={(name, cid) => setEnrollments(prev => prev.filter(e => !(e.course_id === cid && e.student_id === students.find(s => s.full_name === name)?.id)))}
          onCreateCourse={(c) => setCourses(prev => [...prev, { ...c, id: `c-${Date.now()}`, created_at: new Date().toISOString() }])}
          onUpdateCourse={(id, up) => setCourses(prev => prev.map(c => c.id === id ? { ...c, ...up } : c))}
          allGrades={grades} 
          allExpenses={expenses} 
          onCreateExpense={handleCreateExpense}
          employees={employees} 
          students={students} 
          securityProfiles={securityProfiles} 
          invoices={invoices} 
          onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
          schoolName={schoolName} 
          onUpdateSchoolName={setSchoolName}
          onUpsertEmployee={(e, id) => id ? setEmployees(p => p.map(x => x.id === id ? {...x, ...e} : x)) : setEmployees(p => [...p, {...e, id: `emp-${Date.now()}`}])}
          onUpsertStudent={handleUpsertStudent}
          onUpdateSecurityProfile={handleUpdateSecurityProfile}
          onCreateSecurityProfile={handleCreateSecurityProfile}
          leaveRequests={leaveRequests}
          onUpdateLeaveRequestStatus={handleUpdateLeaveRequestStatus}
          onSubmitLeaveRequest={handleSubmitLeaveRequest}
        />
      )}
      {user.role === UserRole.TEACHER && (
        <TeacherGradebook 
          user={user}
          courses={courses.filter(c => c.teacher_id === user.id)} 
          enrollments={enrollments.map(e => ({ studentName: students.find(s => s.id === e.student_id)?.full_name || 'Student', studentId: e.student_id, courseId: e.course_id, lastGrade: 1.5 }))} 
          allGrades={grades} 
          onSaveAttendance={handleSaveAttendance} 
          attendanceRecords={attendanceRecords} 
          onPostHomework={(h) => setHomework(p => [{ ...h, id: `hw-${Date.now()}`, created_at: new Date().toISOString() }, ...p])}
          submissions={submissions}
          onSaveGrade={handleSaveGrade}
          leaveRequests={leaveRequests.filter(r => r.employee_id === user.id)}
          onSubmitLeaveRequest={handleSubmitLeaveRequest}
        />
      )}
      {user.role === UserRole.STUDENT && (
        <StudentView 
          availableCourses={courses} enrolledCourseIds={enrollments.filter(e => e.student_id === user.id).map(e => e.course_id)} enrollmentHistory={enrollments.filter(e => e.student_id === user.id)}
          onEnroll={(cid) => setEnrollments(p => [...p, { id: `e-${Date.now()}`, course_id: cid, student_id: user.id, status: 'Active', joined_at: new Date().toISOString() }])}
          studentGrades={grades.filter(g => g.student_id === user.id)} userProfile={user}
          myAttendance={attendanceRecords.filter(a => a.student_id === user.id)} 
          homework={homework} 
          mySubmissions={submissions}
          myInvoices={invoices.filter(i => i.student_id === user.id)}
          onSumitAssignment={(s) => setSubmissions(p => [...p, { ...s, id: `sub-${Date.now()}`, submitted_at: new Date().toISOString() }])}
        />
      )}
    </Layout>
  );
};

export default App;
