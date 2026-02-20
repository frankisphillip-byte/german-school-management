import { useState, useCallback, useEffect } from 'react';

interface AttendanceRecord {
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string;
  isDirty: boolean;
}

export const useAttendance = (courseId: string, sessionDate?: string) => {
  const today = sessionDate || new Date().toISOString().split('T')[0];
  const STORAGE_KEY = `attendance-${courseId}-${today}`;
  
  const [attendanceMap, setAttendanceMapState] = useState<Map<string, AttendanceRecord>>(new Map());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setAttendanceMapState(new Map(Object.entries(data)));
      }
    } catch (error) {
      console.error('Failed to load attendance from localStorage:', error);
    }
  }, [STORAGE_KEY]);

  useEffect(() => {
    const data = Object.fromEntries(attendanceMap);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [attendanceMap, STORAGE_KEY]);

  const setAttendance = useCallback((studentId: string, updates: Partial<AttendanceRecord>) => {
    setAttendanceMapState((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(studentId) || { status: 'present', notes: '', isDirty: false };
      newMap.set(studentId, { ...existing, ...updates });
      return newMap;
    });
  }, []);

  const clearAttendance = useCallback(() => {
    setAttendanceMapState(new Map());
    localStorage.removeItem(STORAGE_KEY);
  }, [STORAGE_KEY]);

  const unsavedCount = Array.from(attendanceMap.values()).filter((a) => a.isDirty).length;

  return {
    attendanceMap,
    setAttendance,
    clearAttendance,
    unsavedCount,
  };
};

export default useAttendance;