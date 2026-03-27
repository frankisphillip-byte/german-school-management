import { useState, useCallback, useEffect } from 'react';

interface GradeRecord {
  score: number | null;
  feedback: string;
  isDirty: boolean;
}

export const useGradeEntry = (courseId: string) => {
  const STORAGE_KEY = `grade-entry-${courseId}`;
  
  const [gradeMap, setGradeMapState] = useState<Map<string, GradeRecord>>(new Map());
  const [lastSavedCount, setLastSavedCount] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setGradeMapState(new Map(Object.entries(data)));
      }
    } catch (error) {
      console.error('Failed to load grades from localStorage:', error);
    }
  }, [STORAGE_KEY]);

  useEffect(() => {
    const data = Object.fromEntries(gradeMap);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [gradeMap, STORAGE_KEY]);

  const setGrade = useCallback((studentId: string, updates: Partial<GradeRecord>) => {
    setGradeMapState((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(studentId) || { score: null, feedback: '', isDirty: false };
      newMap.set(studentId, { ...existing, ...updates });
      return newMap;
    });
  }, []);

  const clearGrades = useCallback(() => {
    setGradeMapState(new Map());
    localStorage.removeItem(STORAGE_KEY);
  }, [STORAGE_KEY]);

  const unsavedCount = Array.from(gradeMap.values()).filter((g) => g.isDirty).length;

  return {
    gradeMap,
    setGrade,
    clearGrades,
    unsavedCount,
    lastSavedCount,
    setLastSavedCount,
  };
};

export default useGradeEntry;