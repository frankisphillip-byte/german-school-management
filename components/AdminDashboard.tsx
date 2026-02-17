
import React, { useState } from 'react';
import { Course, Grade, Expense, Employee, SecurityProfile, StudentAccount, Invoice, Enrollment, UserRole, CEFRLevel, PermissionSet } from '../types';

interface AdminDashboardProps {
  allCourses: Course[];
  allEnrollments: { studentName: string, studentId: string, courseId: string, joinedAt: string }[];
  onDropStudent: (studentName: string, courseId: string) => void;
  onCreateCourse: (course: Omit<Course, 'id' | 'created_at'>) => void;
  onUpdateCourse: (courseId: string, updates: Partial<Course>) => void;
  allGrades: Grade[];
  allExpenses: Expense[];
  onCreateExpense: (expense: Omit<Expense, 'id' | 'status'>, id?: string) => void;
  employees: Employee[];
  students: StudentAccount[];
  securityProfiles: SecurityProfile[];
  invoices: Invoice[];
  schoolName: string;
  onUpdateSchoolName: (name: string) => void;
  onUpsertEmployee: (emp: Omit<Employee, 'id'>, id?: string) => void;
  onUpsertStudent: (stud: Omit<StudentAccount, 'id'>, id?: string) => void;
  onUpdateSecurityProfile: (profileId: string, updates: Partial<SecurityProfile>) => void;
  onCreateSecurityProfile: (p: Omit<SecurityProfile, 'id'>) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'finance' | 'hr' | 'courses' | 'enrollments' | 'settings'>('stats');
  const [financeSubTab, setFinanceSubTab] = useState<'income' | 'expenses'>('income');
  const [hrSubTab, setHrSubTab] = useState<'roster' | 'payroll'>('roster');
  const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'users'>('general');
  
  // Modals
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState<SecurityProfile | null>(null);
  
  // Form States
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseData, setCourseData] = useState<Omit<Course, 'id' | 'created_at'>>({
    name: '', description: '', cefr_level: CEFRLevel.A1, teacher_id: ''
  });

  const [newExpense, setNewExpense] = useState<Omit<Expense, 'id' | 'status'>>({
    category: 'Supplies', amount: 0, date: new Date().toISOString().split('T')[0], description: ''
  });

  const [studentForm, setStudentForm] = useState<Omit<StudentAccount, 'id'>>({
    full_name: '', email: '', password: '', security_profile_id: props.securityProfiles[0]?.id || '', joined_at: new Date().toISOString().split('T')[0]
  });

  const totalRevenue = props.invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
  const totalExpenses = props.allExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCourseId) props.onUpdateCourse(editingCourseId, courseData);
    else props.onCreateCourse(courseData);
    setShowCourseForm(false);
    setEditingCourseId(null);
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    props.onUpsertStudent(studentForm);
    setShowUserForm(false);
  };

  const togglePermission = (profileId: string, permission: keyof PermissionSet) => {
    const profile = props.securityProfiles.find(p => p.id === profileId);
    if (!profile) return;
    const updatedPermissions = { ...profile.permissions, [permission]: !profile.permissions[permission] };
    props.onUpdateSecurityProfile(profileId, { permissions: updatedPermissions });
  };

  const getTeacherName = (id: string) => props.employees.find(e => e.id === id)?.full_name || 'Unassigned';

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#1e3a8a] uppercase">Schulverwaltung</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{props.schoolName} • Management Console</p>
        </div>
        <div className="flex bg-white border-2 border-slate-100 p-1 rounded-2xl w-full lg:w-fit shadow-xl overflow-x-auto no-scrollbar">
          {['stats', 'finance', 'hr', 'courses', 'enrollments', 'settings'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 md:px-5 py-2.5 text-[10px] font-black rounded-xl transition-all capitalize tracking-widest ${activeTab === tab ? 'bg-[#1e3a8a] text-white shadow-lg' : 'text-slate-400'}`}>
              {tab}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
          {[
            { label: 'Students', value: props.students.length, icon: '🎓', color: 'bg-emerald-50' },
            { label: 'Teachers', value: props.employees.filter(e => e.role === 'Teacher').length, icon: '👩‍🏫', color: 'bg-blue-50' },
            { label: 'Courses', value: props.allCourses.length, icon: '📚', color: 'bg-indigo-50' },
            { label: 'Net Revenue', value: `€${(totalRevenue - totalExpenses).toLocaleString()}`, icon: '📈', color: 'bg-purple-50' }
          ].map((stat, i) => (
            <div key={i} className={`${stat.color} p-8 rounded-[40px] border border-black/5 shadow-sm`}>
              <div className="text-3xl mb-4">{stat.icon}</div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-slate-800">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Kurskatalog</h3>
            <button onClick={() => { setEditingCourseId(null); setShowCourseForm(true); }} className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all">+ Kurs Hinzufügen</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {props.allCourses.map(course => (
              <div key={course.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-all">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="px-3 py-1 bg-slate-100 text-[#1e3a8a] text-[8px] font-black uppercase rounded-lg">{course.cefr_level}</span>
                    <span className="text-[9px] font-bold text-slate-400">ID: {course.id.slice(0,8)}</span>
                  </div>
                  <h4 className="text-xl font-black text-slate-800 uppercase leading-none tracking-tight">{course.name}</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-3">{course.description}</p>
                  <div className="pt-4 border-t border-slate-50">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Lehrkraft</p>
                    <p className="text-[10px] font-black text-slate-700">{getTeacherName(course.teacher_id)}</p>
                  </div>
                </div>
                <button onClick={() => { setEditingCourseId(course.id); setCourseData({...course}); setShowCourseForm(true); }} className="mt-8 w-full py-4 bg-slate-50 text-[#1e3a8a] border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:border-[#1e3a8a] transition-all">Details Bearbeiten</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="space-y-8">
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button onClick={() => setFinanceSubTab('income')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${financeSubTab === 'income' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-slate-400'}`}>Revenue</button>
            <button onClick={() => setFinanceSubTab('expenses')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${financeSubTab === 'expenses' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-slate-400'}`}>Expenses</button>
          </div>
          {financeSubTab === 'income' ? (
             <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <tr><th className="px-8 py-4">Invoice</th><th className="px-8 py-4">Student</th><th className="px-8 py-4">Total</th><th className="px-8 py-4 text-right">Status</th></tr>
                  </thead>
                  <tbody className="text-xs font-bold divide-y divide-slate-100">
                    {props.invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50"><td className="px-8 py-5">#{inv.id.slice(-6)}</td><td className="px-8 py-5">{inv.student_name}</td><td className="px-8 py-5 font-black">€{inv.total}</td><td className="px-8 py-5 text-right"><span className={`px-3 py-1 rounded-full text-[8px] uppercase ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{inv.status}</span></td></tr>
                    ))}
                  </tbody>
                </table>
             </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Ausgabenregister</h3>
                 <button onClick={() => setShowExpenseForm(true)} className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl text-[10px] font-black uppercase shadow-lg">+ Ausgabe Protokollieren</button>
              </div>
              <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                     <tr><th className="px-8 py-4">Kategorie</th><th className="px-8 py-4">Beschreibung</th><th className="px-8 py-4">Betrag</th><th className="px-8 py-4 text-right">Datum</th></tr>
                   </thead>
                   <tbody className="text-xs font-bold divide-y divide-slate-100">
                     {props.allExpenses.map(exp => (
                       <tr key={exp.id} className="hover:bg-slate-50"><td className="px-8 py-5"><span className="px-3 py-1 bg-slate-100 rounded-lg">{exp.category}</span></td><td className="px-8 py-5 text-slate-500">{exp.description}</td><td className="px-8 py-5 text-rose-600 font-black">-€{exp.amount}</td><td className="px-8 py-5 text-right text-slate-400">{exp.date}</td></tr>
                     ))}
                   </tbody>
                 </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'hr' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button onClick={() => setHrSubTab('roster')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${hrSubTab === 'roster' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-slate-400'}`}>Staff Roster</button>
            <button onClick={() => setHrSubTab('payroll')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${hrSubTab === 'payroll' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-slate-400'}`}>Payroll Management</button>
          </div>
          {hrSubTab === 'roster' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {props.employees.map(emp => (
                <div key={emp.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm group hover:border-blue-300 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-blue-50 text-[#1e3a8a] rounded-2xl flex items-center justify-center text-2xl font-black">
                      {emp.full_name.charAt(0)}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[8px] font-black uppercase rounded-lg">{emp.role}</span>
                       <button onClick={() => alert('Password Reset for ' + emp.full_name)} className="text-[8px] font-black text-rose-500 uppercase">Reset PW</button>
                    </div>
                  </div>
                  <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">{emp.full_name}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{emp.email}</p>
                  <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Base Salary</span>
                    <span className="text-sm font-black text-emerald-600">€{emp.salary.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm p-10 text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">💶</div>
              <h4 className="text-xl font-black text-slate-800 uppercase">Payroll Central</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">Automatic payroll generation for current month. All payslips are generated based on base salaries and overtime logs.</p>
              <button onClick={() => alert('Payroll processing initiated for all staff.')} className="mt-6 px-10 py-4 bg-emerald-600 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 transition-all">Generate All Payslips</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'enrollments' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <tr><th className="px-8 py-4">Student</th><th className="px-8 py-4">Course</th><th className="px-8 py-4">Joined At</th><th className="px-8 py-4 text-right">Actions</th></tr>
              </thead>
              <tbody className="text-xs font-bold divide-y divide-slate-100 text-slate-700">
                {props.allEnrollments.map((e, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5 text-slate-900 font-black">{e.studentName}</td>
                    <td className="px-8 py-5">{props.allCourses.find(c => c.id === e.courseId)?.name || 'Unknown'}</td>
                    <td className="px-8 py-5 text-slate-400 font-medium">{new Date(e.joinedAt).toLocaleDateString()}</td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => props.onDropStudent(e.studentName, e.courseId)} className="text-rose-500 uppercase tracking-widest text-[9px] font-black hover:text-rose-700">Drop Enrollment</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button onClick={() => setSettingsSubTab('general')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${settingsSubTab === 'general' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-slate-400'}`}>General Settings</button>
            <button onClick={() => setSettingsSubTab('users')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${settingsSubTab === 'users' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-slate-400'}`}>Security & Users</button>
          </div>
          
          {settingsSubTab === 'general' ? (
            <div className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm max-w-xl space-y-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase">School Identity</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure your portal's global branding</p>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Portal Name</label>
                <input type="text" value={props.schoolName} onChange={(e) => props.onUpdateSchoolName(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-sm outline-none focus:border-[#1e3a8a] transition-all" />
              </div>
              <button className="px-8 py-4 bg-[#1e3a8a] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Save Global Config</button>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-900 uppercase">User Accounts</h3>
                <button onClick={() => setShowUserForm(true)} className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl text-[10px] font-black uppercase shadow-lg">+ Create Student Account</button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Portal Access</h4>
                  <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <tr><th className="px-8 py-4">Name</th><th className="px-8 py-4">Security Level</th><th className="px-8 py-4 text-right">PW</th></tr>
                      </thead>
                      <tbody className="text-xs font-bold divide-y divide-slate-100">
                        {props.students.map(s => (
                          <tr key={s.id}>
                            <td className="px-8 py-5 text-slate-800">{s.full_name}</td>
                            <td className="px-8 py-5">
                              <span className="px-2 py-1 bg-blue-50 text-[#1e3a8a] text-[8px] rounded uppercase">
                                {props.securityProfiles.find(p => p.id === s.security_profile_id)?.name || 'Standard'}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                               <button onClick={() => alert('Set new password for ' + s.full_name)} className="text-rose-500 font-black uppercase text-[8px]">Reset</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Permission Profiles (Editable)</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {props.securityProfiles.map(p => (
                      <div key={p.id} className="bg-white p-6 rounded-[32px] border border-slate-100 flex flex-col gap-4 shadow-sm">
                        <div className="flex justify-between items-start">
                           <div>
                              <p className="font-black text-slate-800 uppercase tracking-tight">{p.name}</p>
                              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{p.description}</p>
                           </div>
                           <button onClick={() => setShowProfileEditor(p)} className="text-[#1e3a8a] text-[9px] font-black uppercase">Edit Permissions</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                           {Object.entries(p.permissions).map(([key, value]) => (
                             <span key={key} className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${value ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>
                               {key.replace(/_/g, ' ')}
                             </span>
                           ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Permission Editor Modal */}
      {showProfileEditor && (
        <div className="fixed inset-0 z-[400] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[48px] overflow-hidden shadow-2xl p-12">
              <div className="flex justify-between items-center mb-10">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase">Permission Editor</h3>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{showProfileEditor.name}</p>
                 </div>
                 <button onClick={() => setShowProfileEditor(null)} className="w-10 h-10 bg-slate-50 rounded-full font-black">✕</button>
              </div>
              <div className="space-y-4 h-[400px] overflow-y-auto pr-2 no-scrollbar">
                 {(Object.keys(showProfileEditor.permissions) as (keyof PermissionSet)[]).map(perm => (
                   <div key={perm} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-xs font-black uppercase text-slate-700 tracking-tight">{perm.replace(/_/g, ' ')}</span>
                      <button 
                        onClick={() => togglePermission(showProfileEditor.id, perm)}
                        className={`w-12 h-6 rounded-full transition-all relative ${showProfileEditor.permissions[perm] ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                         <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showProfileEditor.permissions[perm] ? 'left-7' : 'left-1'}`} />
                      </button>
                   </div>
                 ))}
              </div>
              <button onClick={() => setShowProfileEditor(null)} className="mt-10 w-full py-4 bg-[#1e3a8a] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Confirm Policy Updates</button>
           </div>
        </div>
      )}

      {/* Course Modal */}
      {showCourseForm && (
        <div className="fixed inset-0 z-[400] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[48px] overflow-hidden shadow-2xl relative">
            <button onClick={() => setShowCourseForm(false)} className="absolute top-8 right-8 w-10 h-10 bg-slate-100 rounded-full font-black hover:bg-slate-200 transition-colors">✕</button>
            <form onSubmit={handleCourseSubmit} className="p-12 space-y-10">
              <div>
                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{editingCourseId ? 'Kurs Bearbeiten' : 'Neuer Kurs'}</h3>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2 ml-1">Akademisches Curriculum Management</p>
              </div>
              <div className="space-y-6">
                <input required type="text" value={courseData.name} onChange={e => setCourseData({...courseData, name: e.target.value})} placeholder="Kurs Titel" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-sm outline-none focus:border-[#1e3a8a] transition-all" />
                <textarea required rows={4} value={courseData.description} onChange={e => setCourseData({...courseData, description: e.target.value})} placeholder="Kurzbeschreibung..." className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-sm outline-none focus:border-[#1e3a8a] transition-all resize-none" />
                <div className="grid grid-cols-2 gap-6">
                  <select value={courseData.cefr_level} onChange={e => setCourseData({...courseData, cefr_level: e.target.value as CEFRLevel})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-xs outline-none">
                    {Object.values(CEFRLevel).map(lvl => <option key={lvl} value={lvl}>{lvl} Level</option>)}
                  </select>
                  <select value={courseData.teacher_id} onChange={e => setCourseData({...courseData, teacher_id: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-xs outline-none">
                    <option value="">Lehrkraft wählen</option>
                    {props.employees.filter(e => e.role === 'Teacher').map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-[#1e3a8a] text-white rounded-[32px] font-black uppercase text-[10px] tracking-widest shadow-2xl hover:scale-[1.02] transition-all">Kurs Speichern</button>
            </form>
          </div>
        </div>
      )}

      {showExpenseForm && (
        <div className="fixed inset-0 z-[400] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[48px] p-12 space-y-8 shadow-2xl relative">
            <button onClick={() => setShowExpenseForm(false)} className="absolute top-8 right-8 w-10 h-10 bg-slate-100 rounded-full font-black">✕</button>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Ausgabe Erfassen</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Zweck / Beschreibung" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-black text-sm outline-none border border-slate-100 focus:border-rose-500" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Betrag (€)" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} className="p-4 bg-slate-50 rounded-2xl font-black text-sm outline-none border border-slate-100" />
                <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value as any})} className="p-4 bg-slate-50 rounded-2xl font-black text-sm outline-none border border-slate-100">
                  {['Salaries', 'Rent', 'Supplies', 'Maintenance', 'Marketing'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
            <button onClick={() => { props.onCreateExpense(newExpense); setShowExpenseForm(false); }} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-rose-700 transition-all">Zahlung Bestätigen</button>
          </div>
        </div>
      )}

      {showUserForm && (
        <div className="fixed inset-0 z-[400] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[48px] p-12 space-y-8 shadow-2xl relative">
            <button onClick={() => setShowUserForm(false)} className="absolute top-8 right-8 w-10 h-10 bg-slate-100 rounded-full font-black">✕</button>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Create Student Account</h3>
            <form onSubmit={handleStudentSubmit} className="space-y-6">
              <input required type="text" placeholder="Full Name" value={studentForm.full_name} onChange={e => setStudentForm({...studentForm, full_name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-black text-sm outline-none border border-slate-100" />
              <input required type="email" placeholder="Email Address" value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-black text-sm outline-none border border-slate-100" />
              <input required type="password" placeholder="Password" value={studentForm.password} onChange={e => setStudentForm({...studentForm, password: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-black text-sm outline-none border border-slate-100" />
              <select value={studentForm.security_profile_id} onChange={e => setStudentForm({...studentForm, security_profile_id: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-black text-sm outline-none border border-slate-100">
                {props.securityProfiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button type="submit" className="w-full py-4 bg-[#1e3a8a] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Activate Student Portal</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
