
import React, { useState } from 'react';
import { Course, CEFRLevel } from '../types';

interface CourseCatalogProps {
  courses: Course[];
  enrolledCourseIds: string[];
  onEnroll: (courseId: string) => void;
}

const CourseCatalog: React.FC<CourseCatalogProps> = ({ courses, enrolledCourseIds, onEnroll }) => {
  const [filter, setFilter] = useState<CEFRLevel | 'All'>('All');

  const filteredCourses = filter === 'All' 
    ? courses 
    : courses.filter(c => c.cefr_level === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Available Courses</h3>
          <p className="text-slate-500 text-sm">Find the right level for your German proficiency.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['All', ...Object.values(CEFRLevel)].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl as any)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                filter === lvl 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => {
          const isEnrolled = enrolledCourseIds.includes(course.id);
          return (
            <div key={course.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className={`h-2 ${
                course.cefr_level.startsWith('A') ? 'bg-emerald-400' :
                course.cefr_level.startsWith('B') ? 'bg-indigo-400' : 'bg-rose-400'
              }`}></div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">
                    {course.cefr_level} Level
                  </span>
                  {isEnrolled && (
                    <span className="text-emerald-500 flex items-center text-xs font-bold">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      Enrolled
                    </span>
                  )}
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">{course.name}</h4>
                <p className="text-slate-500 text-sm mb-6 flex-1">{course.description}</p>
                <button
                  disabled={isEnrolled}
                  onClick={() => onEnroll(course.id)}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                    isEnrolled 
                      ? 'bg-slate-50 text-slate-400 cursor-not-allowed' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                  }`}
                >
                  {isEnrolled ? 'Already Enrolled' : 'Enroll Now'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CourseCatalog;
