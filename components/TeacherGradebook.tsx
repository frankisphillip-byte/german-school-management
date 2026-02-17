
import React, { useState } from 'react';
import { Course, Grade, AttendanceStatus, AttendanceRecord, Homework, StudentAssignment, Attachment, AssessmentType } from '../types';

interface TeacherGradebookProps {
  courses: Course[];
  enrollments: { studentName: string, studentId: string, courseId: string, lastGrade: number }[];
  allGrades: Grade[];
  onSaveAttendance: (records: Record<string, AttendanceStatus>, courseId: string) => void;
  attendanceRecords: AttendanceRecord[];
  onPostHomework: (hw: Omit<Homework, 'id' | 'created_at'>) => void;
  submissions: StudentAssignment[];
  onSaveGrade: (grade: Omit<Grade, 'id' | 'graded_at'>) => void;
}

const TeacherGradebook: React.FC<TeacherGradebookProps> = (props) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(props.courses[0]?.id || '');
  const [mode, setMode] = useState<'grading' | 'attendance' | 'homework' | 'submissions' | 'roster'>('grading');
  
  // Grading State
  const [gradingStudent, setGradingStudent] = useState<string>('');
  const [gradeValue, setGradeValue] = useState<number>(1.0);
  const [gradeType, setGradeType] = useState<AssessmentType>('Written');
  const [feedback, setFeedback] = useState<string>('');

  // Homework State
  const [hwForm, setHwForm] = useState<Omit<Homework, 'id' | 'created_at'>>({
    course_id: selectedCourseId, teacher_id: '', title: '', description: '', due_date: ''
  });

  // Attendance Temp State
  const [dailyAttendance, setDailyAttendance] = useState<Record<string, AttendanceStatus>>({});

  const activeRoster = props.enrollments.filter(e => e.courseId === selectedCourseId);
  const currentCourse = props.courses.find(c => c.id === selectedCourseId);

  const handleAttendanceToggle = (studentId: string, status: AttendanceStatus) => {
    setDailyAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = () => {
    props.onSaveAttendance(dailyAttendance, selectedCourseId);
    alert('Anwesenheit für heute wurde gespeichert!');
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingStudent) return;
    props.onSaveGrade({
      student_id: gradingStudent,
      course_id: selectedCourseId,
      grade_value: gradeValue,
      type: gradeType,
      feedback: feedback
    });
    alert('Note wurde erfolgreich eingetragen!');
    setFeedback('');
    setGradingStudent('');
  };

  const handleHwSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    props.onPostHomework({ ...hwForm, course_id: selectedCourseId });
    setHwForm({ ...hwForm, title: '', description: '', due_date: '' });
    alert('Hausaufgabe wurde veröffentlicht!');
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} className="bg-white border-2 border-slate-100 text-[#1e3a8a] text-lg font-black rounded-2xl p-3 px-5 shadow-lg outline-none cursor-pointer">
             {props.courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
           </select>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 ml-1">Kursverwaltung Dashboard • {currentCourse?.cefr_level}</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-md w-full lg:w-fit overflow-x-auto no-scrollbar">
           {['grading', 'attendance', 'homework', 'submissions', 'roster'].map(m => (
             <button key={m} onClick={() => setMode(m as any)} className={`flex-1 lg:flex-none px-6 py-2.5 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${mode === m ? 'bg-[#1e3a8a] text-white shadow-md' : 'text-slate-400 hover:text-[#1e3a8a]'}`}>
               {m}
             </button>
           ))}
        </div>
      </header>

      {mode === 'grading' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white p-10 rounded-[48px] shadow-2xl border border-indigo-50 space-y-8">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Leistungsbewertung</h3>
            <form onSubmit={handleSaveGrade} className="space-y-6">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Schüler auswählen</label>
                  <select value={gradingStudent} onChange={e => setGradingStudent(e.target.value)} required className="w-full p-4 bg-slate-50 rounded-2xl font-black text-sm outline-none border border-slate-100">
                    <option value="">Wähle Schüler...</option>
                    {activeRoster.map(s => <option key={s.studentId} value={s.studentId}>{s.studentName}</option>)}
                  </select>
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Note (1.0 - 5.0)</label>
                    <input type="number" step="0.1" min="1.0" max="5.0" value={gradeValue} onChange={e => setGradeValue(Number(e.target.value))} className="w-full p-4 bg-slate-50 rounded-2xl font-black text-sm outline-none border border-slate-100" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Bewertungstyp</label>
                    <select value={gradeType} onChange={e => setGradeType(e.target.value as any)} className="w-full p-4 bg-slate-50 rounded-2xl font-black text-sm outline-none border border-slate-100">
                       <option value="Written">Written Exam</option>
                       <option value="Speaking">Oral Exam</option>
                       <option value="Listening">Listening Test</option>
                       <option value="Reading">Reading Comp</option>
                    </select>
                  </div>
               </div>
               <textarea placeholder="Pädagogisches Feedback..." value={feedback} onChange={e => setFeedback(e.target.value)} rows={4} className="w-full p-4 bg-slate-50 rounded-2xl font-black text-sm outline-none border border-slate-100 resize-none" />
               <button type="submit" className="w-full py-5 bg-[#1e3a8a] text-white rounded-[28px] font-black uppercase tracking-widest shadow-xl">Note Speichern</button>
            </form>
          </div>
          <div className="bg-white rounded-[40px] p-10 border border-slate-100 h-fit">
            <h4 className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-6">Letzte Noten in diesem Kurs</h4>
            <div className="space-y-3">
               {props.allGrades.filter(g => g.course_id === selectedCourseId).slice(0, 5).map(g => (
                 <div key={g.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs font-black uppercase text-slate-700">{activeRoster.find(s => s.studentId === g.student_id)?.studentName || 'Pupil'}</span>
                    <span className="px-3 py-1 bg-white rounded-lg font-black text-blue-600 border border-blue-100">{g.grade_value.toFixed(1)}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {mode === 'attendance' && (
        <div className="space-y-6">
           <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Klassenregister</h3>
              <button onClick={handleSaveAttendance} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg">Register Speichern</button>
           </div>
           <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">
                  <tr><th className="px-8 py-4">Student</th><th className="px-8 py-4 text-center">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold">
                  {activeRoster.map(s => (
                    <tr key={s.studentId}>
                      <td className="px-8 py-5 uppercase">{s.studentName}</td>
                      <td className="px-8 py-5">
                         <div className="flex justify-center gap-2">
                            {['present', 'absent', 'sick'].map(st => (
                              <button 
                                key={st} 
                                onClick={() => handleAttendanceToggle(s.studentId, st as any)}
                                className={`px-4 py-1.5 rounded-lg text-[8px] uppercase tracking-widest transition-all ${dailyAttendance[s.studentId] === st ? 'bg-[#1e3a8a] text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
                              >
                                {st}
                              </button>
                            ))}
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {mode === 'homework' && (
        <div className="bg-white p-12 rounded-[48px] shadow-sm border border-slate-100 max-w-2xl mx-auto space-y-10">
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight text-center">Hausaufgabe Erstellen</h3>
          <form onSubmit={handleHwSubmit} className="space-y-6">
            <input required type="text" placeholder="Aufgabenstellung / Titel" value={hwForm.title} onChange={e => setHwForm({...hwForm, title: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-sm outline-none" />
            <textarea required rows={5} placeholder="Detaillierte Anweisungen..." value={hwForm.description} onChange={e => setHwForm({...hwForm, description: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-sm outline-none resize-none" />
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Abgabetermin</label>
              <input required type="date" value={hwForm.due_date} onChange={e => setHwForm({...hwForm, due_date: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-sm outline-none" />
            </div>
            <button type="submit" className="w-full py-5 bg-[#1e3a8a] text-white rounded-[32px] font-black uppercase text-[10px] tracking-widest shadow-2xl">Aufgabe Veröffentlichen</button>
          </form>
        </div>
      )}

      {mode === 'submissions' && (
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Eingegangene Lösungen</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {props.submissions.filter(s => props.enrollments.find(e => e.studentId === s.student_id && e.courseId === selectedCourseId)).map(sub => (
              <div key={sub.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:border-indigo-200 transition-all">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {props.enrollments.find(e => e.studentId === sub.student_id)?.studentName}
                  </span>
                  <span className="text-[8px] font-bold text-emerald-500 uppercase">{new Date(sub.submitted_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs font-medium text-slate-700 leading-relaxed italic mb-6 line-clamp-3">"{sub.submission_text}"</p>
                <button onClick={() => alert('Grading interface for this submission.')} className="w-full py-3 bg-slate-50 text-[#1e3a8a] rounded-xl text-[10px] font-black uppercase border border-slate-100 hover:bg-white transition-all">Bewerten</button>
              </div>
            ))}
            {props.submissions.length === 0 && (
               <div className="col-span-full py-20 text-center opacity-30">
                 <p className="text-[10px] font-black uppercase tracking-widest">Keine Abgaben vorhanden</p>
               </div>
            )}
          </div>
        </div>
      )}

      {mode === 'roster' && (
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Klassenliste</h3>
          <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <tr><th className="px-8 py-4">Student</th><th className="px-8 py-4">Enrollment ID</th><th className="px-8 py-4 text-right">Avg Grade</th></tr>
              </thead>
              <tbody className="text-xs font-bold divide-y divide-slate-100">
                {activeRoster.map(s => (
                  <tr key={s.studentId} className="hover:bg-slate-50">
                    <td className="px-8 py-5 text-slate-900">{s.studentName}</td>
                    <td className="px-8 py-5 text-slate-400 font-medium">#{s.studentId.slice(0,8)}</td>
                    <td className="px-8 py-5 text-right font-black text-[#1e3a8a]">{s.lastGrade.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherGradebook;
