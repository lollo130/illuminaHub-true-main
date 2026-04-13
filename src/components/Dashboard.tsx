import { useLocalStorage } from '@/hooks/useLocalStorage';
import { UpNext } from './dashboard/UpNext';
import { FocusMode } from './dashboard/FocusMode';
import { AIInjest } from './dashboard/AIInjest';
import { ExamCountdown } from './dashboard/ExamCountdown';
import { ActivityFeed } from './dashboard/ActivityFeed';
import { EmptyState } from './shared/EmptyState';
import { LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Dashboard() {
  const { profile } = useAuth();
  const [exams] = useLocalStorage<any[]>('illuminahub_exams', []);
  const [lessons] = useLocalStorage<any[]>('illuminahub_lessons', []);
  const [notes] = useLocalStorage<any[]>('illuminahub_notes', []);

  const isAppEmpty = exams.length === 0 && lessons.length === 0 && notes.length === 0;

  if (isAppEmpty) {
    return (
      <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-white">Benvenuto su IlluminaHub</h1>
          <p className="text-zinc-500">Il tuo centro di comando accademico è pronto. Iniziamo a configurare il tuo spazio.</p>
        </div>
        <div className="mt-12">
          <EmptyState 
            icon={LayoutDashboard}
            title="La tua dashboard è in attesa di dati"
            description="Una volta aggiunti esami, lezioni e materiali di studio, questo spazio si trasformerà nel tuo hub di intelligenza personalizzato."
            actionLabel="Vai all'Orario"
            onAction={() => window.dispatchEvent(new CustomEvent('change-view', { detail: 'timetable' }))}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-white">Bentornato, {profile?.nickname || 'Studente'}</h1>
        <p className="text-zinc-500">Il tuo spazio di lavoro è sincronizzato e pronto per le sessioni di oggi.</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <UpNext lessons={lessons} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <FocusMode />
        </div>
        <div className="col-span-12">
          <AIInjest />
        </div>
        <div className="col-span-12 lg:col-span-7">
          <ExamCountdown exams={exams} />
        </div>
        <div className="col-span-12 lg:col-span-5">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
