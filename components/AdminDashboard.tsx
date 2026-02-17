
import React, { useState } from 'react';
import { Course, Grade, Expense, Employee, SecurityProfile, StudentAccount, Invoice, Enrollment, UserRole, CEFRLevel, PermissionSet, Payslip, LeaveRequest, LeaveStatus } from '../types';

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
  onUpdateInvoiceStatus: (invoiceId: string, status: 'paid' | 'pending') => void;
  schoolName: string;
  onUpdateSchoolName: (name: string) => void;
  onUpsertEmployee: (emp: Omit<Employee, 'id'>, id?: string) => void;
  onUpsertStudent: (stud: Omit<StudentAccount, 'id'>, id?: string) => void;
  onUpdateSecurityProfile: (profileId: string, updates: Partial<SecurityProfile>) => void;
  onCreateSecurityProfile: (p: Omit<SecurityProfile, 'id'>) => void;
  leaveRequests: LeaveRequest[];
  onUpdateLeaveRequestStatus: (id: string, status: LeaveStatus) => void;
  onSubmitLeaveRequest: (req: Omit<LeaveRequest, 'id' | 'status' | 'requested_at'>) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'finance' | 'hr' | 'courses' | 'enrollments' | 'settings'>('stats');
  const [financeSubTab, setFinanceSubTab] = useState<'income' | 'expenses'>('income');
  const [hrSubTab, setHrSubTab] = useState<'roster' | 'payroll' | 'leave'>('roster');
  const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'users'>('general');
  
  // Finance Filters
  const [expenseFilterCategory, setExpenseFilterCategory] = useState<string>('All');
  const [expenseStartDate, setExpenseStartDate] = useState<string>('');
  const [expenseEndDate, setExpenseEndDate] = useState<string>('');

  // Modals
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState<SecurityProfile | null>(null);
  const [payslipEmployee, setPayslipEmployee] = useState<Employee | null>(null);
  const [payslipStep, setPayslipStep] = useState<'form' | 'preview'>('form');
  
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

  const [payslipData, setPayslipData] = useState({
    period: new Date().toLocaleString('de-DE', { month: 'long', year: 'numeric' }),
    overtime: 0,
    allowance: 0,
    tax_deduction: 0,
    other_deductions: 0
  });

  const totalRevenue = props.invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
  const totalExpenses = props.allExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Expense Filtering Logic
  const filteredExpenses = props.allExpenses.filter(exp => {
    const matchesCategory = expenseFilterCategory === 'All' || exp.category === expenseFilterCategory;
    const matchesStartDate = !expenseStartDate || exp.date >= expenseStartDate;
    const matchesEndDate = !expenseEndDate || exp.date <= expenseEndDate;
    return matchesCategory && matchesStartDate && matchesEndDate;
  });

  const downloadExpenseReport = () => {
    const headers = ['Date', 'Category', 'Description', 'Amount', 'Status'];
    const rows = filteredExpenses.map(e => [e.date, e.category, e.description, e.amount, e.status]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(r => r.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DSB_Expense_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const handleCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCourseId) props.onUpdateCourse(editingCourseId, courseData);
    else props.onCreateCourse(courseData);
    setShowCourseForm(false);
    setEditingCourseId(null);
  };

  const toggleInvoiceStatus = (inv: Invoice) => {
    props.onUpdateInvoiceStatus(inv.id, inv.status === 'paid' ? 'pending' : 'paid');
  };

  const calculateNetPay = () => {
    if (!payslipEmployee) return 0;
    return payslipEmployee.salary + payslipData.overtime + payslipData.allowance - payslipData.tax_deduction - payslipData.other_deductions;
  };

  const getTeacherName = (id: string) => props.employees.find(e => e.id === id)?.full_name || 'Unassigned';

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.APPROVED: return 'bg-emerald-100 text-emerald-700';
      case LeaveStatus.REJECTED: return 'bg-rose-100 text-rose-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 print:hidden">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500 print:hidden">
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

      {activeTab === 'finance' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 print:hidden">
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button onClick={() => setFinanceSubTab('income')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${financeSubTab === 'income' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-slate-400'}`}>Income</button>
            <button onClick={() => setFinanceSubTab('expenses')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${financeSubTab === 'expenses' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-slate-400'}`}>Expenses</button>
          </div>

          {financeSubTab === 'income' ? (
            <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-8 py-4">Invoice</th>
                    <th className="px-8 py-4">Student</th>
                    <th className="px-8 py-4">Total</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4 text-right">Toggle Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-bold divide-y divide-slate-100">
                  {props.invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="px-8 py-5">#{inv.id.slice(-6)}</td>
                      <td className="px-8 py-5 text-slate-900 uppercase">{inv.student_name}</td>
                      <td className="px-8 py-5 font-black text-indigo-600">€{inv.total.toLocaleString()}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[8px] uppercase tracking-widest ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button onClick={() => toggleInvoiceStatus(inv)} className="px-4 py-2 bg-slate-50 text-[9px] font-black uppercase tracking-widest rounded-xl border border-slate-100 hover:border-indigo-600 transition-all">
                          Set to {inv.status === 'paid' ? 'Pending' : 'Paid'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-wrap items-end gap-6">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Category</label>
                  <select value={expenseFilterCategory} onChange={e => setExpenseFilterCategory(e.target.value)} className="w-full p-3.5 bg-slate-50 rounded-2xl font-black text-xs outline-none border border-slate-100">
                    <option value="All">All Categories</option>
                    {['Salaries', 'Rent', 'Supplies', 'Maintenance', 'Marketing'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">From</label>
                  <input type="date" value={expenseStartDate} onChange={e => setExpenseStartDate(e.target.value)} className="w-full p-3 bg-slate-50 rounded-2xl font-black text-xs border border-slate-100 outline-none" />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">To</label>
                  <input type="date" value={expenseEndDate} onChange={e => setExpenseEndDate(e.target.value)} className="w-full p-3 bg-slate-50 rounded-2xl font-black text-xs border border-slate-100 outline-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={downloadExpenseReport} className="px-6 py-3.5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-50">Download Report</button>
                  <button onClick={() => setShowExpenseForm(true)} className="px-6 py-3.5 bg-[#1e3a8a] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-50">+ Add Expense</button>
                </div>
              </div>

              <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <tr><th className="px-8 py-4">Category</th><th className="px-8 py-4">Description</th><th className="px-8 py-4">Amount</th><th className="px-8 py-4 text-right">Date</th></tr>
                  </thead>
                  <tbody className="text-xs font-bold divide-y divide-slate-100">
                    {filteredExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="px-8 py-5"><span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[9px] uppercase">{exp.category}</span></td>
                        <td className="px-8 py-5 text-slate-800">{exp.description}</td>
                        <td className="px-8 py-5 text-rose-600 font-black">-€{exp.amount.toLocaleString()}</td>
                        <td className="px-8 py-5 text-right text-slate-400">{exp.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'hr' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 print:hidden">
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button onClick={() => setHrSubTab('roster')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${hrSubTab === 'roster' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-slate-400'}`}>Staff Roster</button>
            <button onClick={() => setHrSubTab('payroll')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${hrSubTab === 'payroll' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-slate-400'}`}>Payroll Logs</button>
            <button onClick={() => setHrSubTab('leave')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${hrSubTab === 'leave' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-slate-400'}`}>Leave Requests</button>
          </div>

          {hrSubTab === 'roster' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {props.employees.map(emp => (
                <div key={emp.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:border-blue-200 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-blue-50 text-[#1e3a8a] rounded-2xl flex items-center justify-center text-xl font-black">{emp.full_name.charAt(0)}</div>
                      <span className="px-3 py-1 bg-slate-100 text-slate-400 text-[8px] font-black uppercase rounded-lg">{emp.role}</span>
                    </div>
                    <h4 className="text-lg font-black text-slate-800 uppercase leading-none mb-2">{emp.full_name}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{emp.email}</p>
                  </div>
                  <div className="pt-6 border-t border-slate-50 mt-8 space-y-4">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                      <span>Base Salary</span>
                      <span className="text-slate-900">€{emp.salary.toLocaleString()}</span>
                    </div>
                    <button onClick={() => { setPayslipEmployee(emp); setPayslipStep('form'); }} className="w-full py-4 bg-[#1e3a8a] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all">Generate Payslip</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hrSubTab === 'leave' && (
            <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                   <tr>
                     <th className="px-8 py-4">Employee</th>
                     <th className="px-8 py-4">Duration</th>
                     <th className="px-8 py-4">Reason</th>
                     <th className="px-8 py-4">Status</th>
                     <th className="px-8 py-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="text-xs font-bold divide-y divide-slate-100">
                    {props.leaveRequests.length > 0 ? props.leaveRequests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50">
                        <td className="px-8 py-5">
                           <p className="text-slate-900 uppercase">{req.employee_name}</p>
                           <p className="text-[8px] text-slate-400">REQ: {new Date(req.requested_at).toLocaleDateString()}</p>
                        </td>
                        <td className="px-8 py-5 text-slate-700">
                          {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-5 text-slate-500 italic max-w-xs truncate">{req.reason}</td>
                        <td className="px-8 py-5">
                           <span className={`px-3 py-1 rounded-full text-[8px] uppercase tracking-widest font-black ${getStatusColor(req.status)}`}>
                             {req.status}
                           </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                           {req.status === LeaveStatus.PENDING && (
                             <div className="flex justify-end gap-2">
                               <button onClick={() => props.onUpdateLeaveRequestStatus(req.id, LeaveStatus.APPROVED)} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase">Approve</button>
                               <button onClick={() => props.onUpdateLeaveRequestStatus(req.id, LeaveStatus.REJECTED)} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase">Reject</button>
                             </div>
                           )}
                           {req.status !== LeaveStatus.PENDING && (
                             <span className="text-[9px] text-slate-300 font-black uppercase tracking-widest">Processed</span>
                           )}
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-black uppercase opacity-40">No leave requests found</td></tr>
                    )}
                 </tbody>
               </table>
            </div>
          )}
        </div>
      )}

      {/* Payslip Modal */}
      {payslipEmployee && (
        <div className="fixed inset-0 z-[500] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300 print:static print:bg-white print:p-0 print:block">
          {payslipStep === 'form' ? (
            <div className="bg-white w-full max-w-xl rounded-[48px] p-12 space-y-8 shadow-2xl relative print:hidden">
              <button onClick={() => setPayslipEmployee(null)} className="absolute top-8 right-8 w-10 h-10 bg-slate-100 rounded-full font-black">✕</button>
              <h3 className="text-2xl font-black text-slate-900 uppercase">Gehaltstool</h3>
              <div className="space-y-4">
                <input type="text" placeholder="Period (e.g. Feb 2024)" value={payslipData.period} onChange={e => setPayslipData({...payslipData, period: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-black text-sm outline-none border border-slate-100" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Overtime (€)" onChange={e => setPayslipData({...payslipData, overtime: Number(e.target.value)})} className="p-4 bg-slate-50 rounded-2xl font-black text-sm border border-slate-100" />
                  <input type="number" placeholder="Allowance (€)" onChange={e => setPayslipData({...payslipData, allowance: Number(e.target.value)})} className="p-4 bg-slate-50 rounded-2xl font-black text-sm border border-slate-100" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Tax Deduction (€)" onChange={e => setPayslipData({...payslipData, tax_deduction: Number(e.target.value)})} className="p-4 bg-slate-50 rounded-2xl font-black text-sm border border-slate-100 text-rose-600" />
                  <input type="number" placeholder="Other Ded. (€)" onChange={e => setPayslipData({...payslipData, other_deductions: Number(e.target.value)})} className="p-4 bg-slate-50 rounded-2xl font-black text-sm border border-slate-100 text-rose-600" />
                </div>
              </div>
              <div className="p-6 bg-slate-900 rounded-3xl text-white flex justify-between items-center">
                <span className="text-[10px] font-black uppercase">Net Pay Estimate</span>
                <span className="text-2xl font-black">€{calculateNetPay().toLocaleString()}</span>
              </div>
              <button onClick={() => setPayslipStep('preview')} className="w-full py-5 bg-[#1e3a8a] text-white rounded-[32px] font-black uppercase tracking-widest shadow-xl">Generate Preview</button>
            </div>
          ) : (
            <div className="bg-white w-full max-w-2xl rounded-[48px] p-16 shadow-2xl relative print:shadow-none print:rounded-none">
              <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-12">
                <div>
                  <h2 className="text-3xl font-black uppercase text-slate-900">{props.schoolName}</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Abrechnung {payslipData.period}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-[#1e3a8a] uppercase">{payslipEmployee.full_name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{payslipEmployee.role}</p>
                </div>
              </div>
              <div className="space-y-4 text-sm font-bold border-b border-slate-100 pb-8 mb-8">
                <div className="flex justify-between"><span>Base Salary</span><span>€{payslipEmployee.salary.toLocaleString()}</span></div>
                <div className="flex justify-between text-emerald-600"><span>Overtime</span><span>+ €{payslipData.overtime.toLocaleString()}</span></div>
                <div className="flex justify-between text-emerald-600"><span>Allowances</span><span>+ €{payslipData.allowance.toLocaleString()}</span></div>
                <div className="flex justify-between text-rose-600"><span>Tax Deductions</span><span>- €{payslipData.tax_deduction.toLocaleString()}</span></div>
                <div className="flex justify-between text-rose-600"><span>Other Deductions</span><span>- €{payslipData.other_deductions.toLocaleString()}</span></div>
              </div>
              <div className="bg-slate-900 p-8 rounded-[40px] text-white flex justify-between items-center">
                <span className="text-sm font-black uppercase tracking-[0.2em]">Net Payout</span>
                <span className="text-4xl font-black">€{calculateNetPay().toLocaleString()}</span>
              </div>
              <div className="mt-12 flex gap-4 print:hidden">
                <button onClick={() => setPayslipStep('form')} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black uppercase text-[10px]">Back</button>
                <button onClick={() => window.print()} className="flex-[2] py-4 bg-[#1e3a8a] text-white rounded-2xl font-black uppercase text-[10px]">Print / Save as PDF</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Kurskatalog</h3>
            <button onClick={() => { setEditingCourseId(null); setCourseData({ name: '', description: '', cefr_level: CEFRLevel.A1, teacher_id: '' }); setShowCourseForm(true); }} className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all">+ Kurs Hinzufügen</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {props.allCourses.map(course => (
              <div key={course.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-all">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="px-3 py-1 bg-slate-100 text-[#1e3a8a] text-[8px] font-black uppercase rounded-lg">{course.cefr_level}</span>
                  </div>
                  <h4 className="text-xl font-black text-slate-800 uppercase leading-none tracking-tight">{course.name}</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-3">{course.description}</p>
                </div>
                <div className="flex gap-2 pt-6">
                   <button onClick={() => { setEditingCourseId(course.id); setCourseData({ ...course }); setShowCourseForm(true); }} className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl text-[9px] font-black uppercase border border-slate-100 hover:bg-white transition-all">Bearbeiten</button>
                   <div className="flex-1 py-3 bg-slate-50 text-slate-400 rounded-xl text-[9px] font-black uppercase border border-slate-100 flex items-center justify-center">
                     {getTeacherName(course.teacher_id)}
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Form Modal */}
      {showCourseForm && (
        <div className="fixed inset-0 z-[150] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[48px] p-10 space-y-8 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{editingCourseId ? 'Kurs Bearbeiten' : 'Neuer Kurs'}</h3>
            <form onSubmit={handleCourseSubmit} className="space-y-6">
              <input required type="text" placeholder="Kursname" value={courseData.name} onChange={e => setCourseData({...courseData, name: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl font-black text-sm outline-none border border-slate-100" />
              <textarea required placeholder="Beschreibung" value={courseData.description} onChange={e => setCourseData({...courseData, description: e.target.value})} rows={4} className="w-full p-5 bg-slate-50 rounded-2xl font-black text-sm outline-none border border-slate-100 resize-none" />
              <div className="grid grid-cols-2 gap-4">
                <select value={courseData.cefr_level} onChange={e => setCourseData({...courseData, cefr_level: e.target.value as CEFRLevel})} className="w-full p-5 bg-slate-50 rounded-2xl font-black text-sm outline-none border border-slate-100">
                  {Object.values(CEFRLevel).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                </select>
                <select value={courseData.teacher_id} onChange={e => setCourseData({...courseData, teacher_id: e.target.value})} required className="w-full p-5 bg-slate-50 rounded-2xl font-black text-sm outline-none border border-slate-100">
                  <option value="">Lehrer wählen</option>
                  {props.employees.filter(emp => emp.role === 'Teacher').map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowCourseForm(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Abbrechen</button>
                <button type="submit" className="flex-[2] py-4 bg-[#1e3a8a] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Speichern</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enrollments tab */}
      {activeTab === 'enrollments' && (
        <div className="space-y-6">
           <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Einschreibungen</h3>
           <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
             <table className="w-full text-left">
               <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                 <tr><th className="px-8 py-4">Schüler</th><th className="px-8 py-4">Kurs ID</th><th className="px-8 py-4 text-right">Aktion</th></tr>
               </thead>
               <tbody className="text-xs font-bold divide-y divide-slate-100">
                 {props.allEnrollments.map((en, i) => (
                   <tr key={i} className="hover:bg-slate-50">
                     <td className="px-8 py-5 text-slate-900 uppercase">{en.studentName}</td>
                     <td className="px-8 py-5 text-slate-400">{en.courseId}</td>
                     <td className="px-8 py-5 text-right"><button onClick={() => props.onDropStudent(en.studentName, en.courseId)} className="text-rose-500 uppercase text-[9px] font-black">Drop</button></td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-8">
           <div className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm max-w-xl">
             <h3 className="text-2xl font-black text-slate-900 uppercase mb-8">School Settings</h3>
             <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Portal Name</label>
               <input type="text" value={props.schoolName} onChange={(e) => props.onUpdateSchoolName(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-sm outline-none" />
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
