
import React, { useState } from 'react';
import { CEFRLevel, Course, Grade, UserProfile, Payment, AttendanceRecord, Homework, Enrollment, StudentAssignment, AttendanceStatus, Invoice } from '../types';
import CourseCatalog from './CourseCatalog';

interface StudentViewProps {
  availableCourses: Course[];
  enrolledCourseIds: string[];
  enrollmentHistory: Enrollment[];
  onEnroll: (courseId: string) => void;
  studentGrades: Grade[];
  userProfile?: UserProfile;
  myPayments?: Payment[];
  myAttendance?: AttendanceRecord[];
  homework: Homework[];
  onSumitAssignment: (submission: Omit<StudentAssignment, 'id' | 'submitted_at'>) => void;
  mySubmissions: StudentAssignment[];
  myInvoices?: Invoice[];
}

const StudentView: React.FC<StudentViewProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'homework' | 'browse'>('dashboard');
  const [submittingHw, setSubmittingHw] = useState<Homework | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const myAttendance = props.myAttendance || [];

  // Calendar Helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Adjust for Monday start (German style: Mo=0, Su=6)
    const adjustedStart = firstDay === 0 ? 6 : firstDay - 1;
    return { adjustedStart, daysInMonth };
  };

  const { adjustedStart, daysInMonth } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleString('de-DE', { month: 'long' });
  const year = currentMonth.getFullYear();

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const getAttendanceForDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return myAttendance.find(a => a.date === dateStr);
  };

  const getStatusStyles = (status?: AttendanceStatus) => {
    switch (status) {
      case 'present': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'absent': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'sick': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'transferred': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default: return 'bg-white text-slate-400 border-slate-100';
    }
  };

  const sortedHistory = [...props.enrollmentHistory].sort((a, b) => 
    new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime()
  );

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingHw || !props.userProfile) return;
    
    props.onSumitAssignment({
      assignment_id: submittingHw.id,
      student_id: props.userProfile.id,
      submission_text: submissionText,
      submission_url: submissionUrl
    });
    
    setSubmittingHw(null);
    setSubmissionText('');
    setSubmissionUrl('');
    alert('Deine Abgabe wurde erfolgreich gesendet!');
  };

  const getSubmissionForHw = (hwId: string) => props.mySubmissions.find(s => s.assignment_id === hwId);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 md:w-24 md:h-24 rounded-[28px] md:rounded-[36px] bg-[#1e3a8a] flex items-center justify-center text-xl md:text-3xl text-white font-black shadow-2xl relative">
            {props.userProfile?.full_name.charAt(0)}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-8 md:h-8 bg-emerald-500 rounded-full border-4 border-white shadow-lg" />
          </div>
          <div>
            <h2 className="text-xl md:text-3xl font-black tracking-tight text-[#1e3a8a]">Guten Tag, {props.userProfile?.full_name.split(' ')[0]}!</h2>
            <p className="text-slate-400 font-black text-[9px] md:text-[10px] uppercase tracking-[0.3em]">DSB Brooklyn Portal • Schüler</p>
          </div>
        </div>
        
        <div className="flex bg-white shadow-2xl border-2 border-slate-50 p-1.5 rounded-[24px]">
          {['dashboard', 'homework', 'browse'].map(t => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 md:px-8 py-2 md:py-3 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-[18px] transition-all ${activeTab === t ? 'bg-[#1e3a8a] text-white shadow-xl' : 'text-slate-400 hover:text-[#1e3a8a]'}`}>
              {t === 'dashboard' ? 'Mein Portal' : t === 'homework' ? 'Hausaufgaben' : 'Curriculum'}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           <div className="lg:col-span-2 space-y-10">
              <div className="bg-[#1e3a8a] p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10 flex flex-wrap gap-12">
                   <div>
                     <p className="text-[9px] font-black text-blue-200 uppercase mb-1 tracking-widest">Gesamtdurchschnitt</p>
                     <p className="text-5xl font-black">1.5</p>
                   </div>
                   <div>
                     <p className="text-[9px] font-black text-blue-200 uppercase mb-1 tracking-widest">Aktive Kurse</p>
                     <p className="text-5xl font-black">{props.enrolledCourseIds.length}</p>
                   </div>
                   <div>
                     <p className="text-[9px] font-black text-blue-200 uppercase mb-1 tracking-widest">Anwesenheit</p>
                     <p className="text-5xl font-black">
                       {myAttendance.length > 0 
                        ? `${Math.round((myAttendance.filter(a => a.status === 'present').length / myAttendance.length) * 100)}%`
                        : '--'}
                     </p>
                   </div>
                </div>
              </div>

              {/* Attendance Calendar Card */}
              <div className="bg-white p-8 md:p-10 rounded-[48px] shadow-sm border border-slate-100 space-y-8">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                       <h4 className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-[0.3em] mb-1">Anwesenheitskalender</h4>
                       <p className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{monthName} {year}</p>
                    </div>
                    <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                       <button onClick={() => changeMonth(-1)} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all font-black text-slate-400 hover:text-[#1e3a8a]">←</button>
                       <button onClick={() => setCurrentMonth(new Date())} className="px-4 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all font-black text-[9px] uppercase tracking-widest text-slate-400 hover:text-[#1e3a8a]">Heute</button>
                       <button onClick={() => changeMonth(1)} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all font-black text-slate-400 hover:text-[#1e3a8a]">→</button>
                    </div>
                 </div>

                 <div className="grid grid-cols-7 gap-2 md:gap-4">
                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
                      <div key={d} className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest pb-2">{d}</div>
                    ))}
                    {Array.from({ length: adjustedStart }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square rounded-2xl bg-slate-50/50" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const attendance = getAttendanceForDay(day);
                      return (
                        <div 
                          key={`day-${day}`} 
                          className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all group relative cursor-default ${getStatusStyles(attendance?.status)}`}
                        >
                           <span className="text-xs md:text-sm font-black">{day}</span>
                           {attendance && (
                             <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white border border-current" />
                           )}
                           {attendance && (
                             <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity" />
                           )}
                        </div>
                      );
                    })}
                 </div>
              </div>

              {/* Payments & Invoices Card */}
              <div className="bg-white p-8 md:p-10 rounded-[48px] shadow-sm border border-slate-100 space-y-8">
                 <h4 className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-[0.3em]">Rechnungen & Zahlungen</h4>
                 <div className="space-y-4">
                    {props.myInvoices && props.myInvoices.length > 0 ? props.myInvoices.map(inv => (
                      <div key={inv.id} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center justify-between hover:border-blue-100 transition-all">
                        <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                              {inv.status === 'paid' ? '✅' : '⏳'}
                           </div>
                           <div>
                              <p className="font-black text-slate-800 text-sm">#{inv.id.slice(-6)} - {inv.items[0]?.description || 'Schulgebühr'}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(inv.created_at).toLocaleDateString()}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="font-black text-slate-800 text-base">€{inv.total.toLocaleString()}</p>
                           <span className={`text-[8px] font-black uppercase tracking-widest ${inv.status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                             {inv.status === 'paid' ? 'Bezahlt' : 'Ausstehend'}
                           </span>
                        </div>
                      </div>
                    )) : (
                      <div className="py-10 text-center opacity-30">
                        <p className="text-[10px] font-black uppercase">Keine Rechnungen vorhanden</p>
                      </div>
                    )}
                 </div>
              </div>

              {/* Enrollment History */}
              <div className="bg-white p-8 md:p-10 rounded-[48px] shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-[0.3em]">Einschreibungsverlauf</h4>
                  <span className="text-[9px] font-black text-slate-300 uppercase">{props.enrollmentHistory.length} Kurse Gesamt</span>
                </div>
                
                <div className="space-y-6">
                  {sortedHistory.map((entry) => {
                    const course = props.availableCourses.find(c => c.id === entry.course_id);
                    return (
                      <div key={entry.id} className="group flex items-center justify-between p-6 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 rounded-[32px] transition-all duration-300">
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${entry.status === 'Active' ? 'bg-emerald-100' : 'bg-slate-200 opacity-60'}`}>
                            {entry.status === 'Active' ? '📖' : '✅'}
                          </div>
                          <div>
                            <h5 className="font-black text-slate-800 text-sm md:text-base leading-none mb-2">{course?.name || 'Unbekannter Kurs'}</h5>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eingeschrieben am: {new Date(entry.joined_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                             entry.status === 'Active' 
                               ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' 
                               : 'bg-slate-200 text-slate-500'
                           }`}>
                             {entry.status}
                           </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 h-fit space-y-10">
              <div>
                 <h4 className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-8">Letzte Bewertungen</h4>
                 <div className="space-y-4">
                    {props.studentGrades.length > 0 ? props.studentGrades.map(g => (
                      <div key={g.id} className="p-5 bg-slate-50 rounded-[28px] flex justify-between items-center border border-slate-100 hover:border-blue-100 transition-all">
                         <div>
                           <span className="text-[10px] font-black uppercase tracking-tight text-slate-800">{g.type} Test</span>
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{new Date(g.graded_at).toLocaleDateString()}</p>
                         </div>
                         <span className="px-4 py-2 bg-[#1e3a8a] text-white rounded-xl font-black text-sm shadow-lg">{g.grade_value.toFixed(1)}</span>
                      </div>
                    )) : (
                      <div className="py-10 text-center opacity-20">
                        <p className="text-[10px] font-black uppercase">Noch keine Noten</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'homework' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
          {props.homework.length > 0 ? props.homework.map(hw => {
            const course = props.availableCourses.find(c => c.id === hw.course_id);
            const isDueSoon = new Date(hw.due_date).getTime() < (new Date().getTime() + 86400000);
            const submission = getSubmissionForHw(hw.id);
            
            return (
              <div key={hw.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col justify-between hover:border-blue-200 transition-colors relative overflow-hidden">
                {isDueSoon && !submission && <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500 rotate-45 translate-x-12 -translate-y-12 flex items-end justify-center pb-2 text-white text-[8px] font-black uppercase tracking-widest">Urgent</div>}
                {submission && <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500 rotate-45 translate-x-12 -translate-y-12 flex items-end justify-center pb-2 text-white text-[8px] font-black uppercase tracking-widest">Done</div>}
                
                <div className="space-y-5">
                  <div className="flex justify-between items-start">
                    <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[8px] font-black uppercase tracking-widest max-w-[150px] truncate">{course?.name}</span>
                    <span className={`text-[10px] font-black uppercase ${submission ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {submission ? 'Abgegeben' : `Fällig: ${hw.due_date}`}
                    </span>
                  </div>
                  <h4 className="text-xl font-black text-slate-800 tracking-tight leading-tight">{hw.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-3">{hw.description}</p>
                </div>

                {!submission ? (
                  <button 
                    onClick={() => setSubmittingHw(hw)}
                    className="mt-8 w-full py-4 bg-[#1e3a8a] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-800 transition-all shadow-xl shadow-blue-100"
                  >
                    Abgabe einreichen
                  </button>
                ) : (
                  <button 
                    disabled
                    className="mt-8 w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-default"
                  >
                    Bereits abgegeben
                  </button>
                )}
              </div>
            );
          }) : (
            <div className="col-span-full py-32 text-center opacity-30">
              <p className="text-6xl mb-6">📓</p>
              <p className="font-black uppercase tracking-[0.3em] text-xs text-slate-500">Keine aktuellen Hausaufgaben</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'browse' && (
        <CourseCatalog courses={props.availableCourses} enrolledCourseIds={props.enrolledCourseIds} onEnroll={props.onEnroll} />
      )}

      {/* Submission Modal */}
      {submittingHw && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-[48px] overflow-hidden shadow-2xl">
              <div className="p-10 space-y-8">
                 <div className="flex justify-between items-start">
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 tracking-tight">Abgabe einreichen</h3>
                       <p className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mt-1">{submittingHw.title}</p>
                    </div>
                    <button onClick={() => setSubmittingHw(null)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors font-black">✕</button>
                 </div>

                 <form onSubmit={handleFinalSubmit} className="space-y-6">
                    <div>
                       <label className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2 block">Lösungstext</label>
                       <textarea 
                        required
                        value={submissionText}
                        onChange={e => setSubmissionText(e.target.value)}
                        rows={6}
                        placeholder="Schreibe hier deine Antwort oder Lösung..."
                        className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[28px] text-sm font-bold outline-none focus:border-[#1e3a8a] transition-all resize-none"
                       />
                    </div>
                    <div className="flex gap-4 pt-4">
                       <button 
                        type="button"
                        onClick={() => setSubmittingHw(null)}
                        className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-[24px] font-black uppercase text-[10px] tracking-widest"
                       >
                         Abbrechen
                       </button>
                       <button 
                        type="submit"
                        className="flex-[2] py-4 bg-[#1e3a8a] text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-100"
                       >
                         Abgabe senden
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default StudentView;
