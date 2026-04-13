import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useExamNotifications(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    const check = async () => {
      const { data: exams } = await supabase
        .from('exams')
        .select('name, date, status')
        .eq('user_id', userId)
        .neq('status', 'Passed');

      if (!exams) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      exams.forEach(exam => {
        if (!exam.date) return;
        const examDate = new Date(exam.date);
        examDate.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft === 0) {
          toast.warning(`📅 Esame oggi: ${exam.name}`, { duration: 8000 });
        } else if (daysLeft === 1) {
          toast.warning(`⚠️ Esame domani: ${exam.name}`, { duration: 8000 });
        } else if (daysLeft === 3) {
          toast.info(`📚 Esame tra 3 giorni: ${exam.name}`, { duration: 6000 });
        } else if (daysLeft === 7) {
          toast.info(`🗓️ Esame tra una settimana: ${exam.name}`, { duration: 5000 });
        }
      });
    };

    // Controlla subito al login, poi ogni ora
    check();
    const interval = setInterval(check, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId]);
}
