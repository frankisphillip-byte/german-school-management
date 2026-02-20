import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

export const useParentPortal = (parentId: string | undefined) => {
  const linkedStudents = useQuery({
    queryKey: ['parent-linked-students', parentId],
    queryFn: async () => {
      if (!parentId) return [];
      const { data, error } = await supabase
        .from('parent_student_links')
        .select(`student_id, profiles!inner(id, first_name, last_name)`)
        .eq('parent_id', parentId);
      if (error) throw error;
      return (data || []).map((link: any) => ({
        studentId: link.student_id,
        firstName: link.profiles?.first_name,
        lastName: link.profiles?.last_name,
      }));
    },
    enabled: !!parentId,
  });

  return {
    linkedStudents: linkedStudents.data || [],
    isLoading: linkedStudents.isLoading,
    isError: linkedStudents.isError,
  };
};