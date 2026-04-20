import { useState, useEffect } from 'react';
import { UpNext } from './dashboard/UpNext';
import { FocusMode } from './dashboard/FocusMode';
import { AIInjest } from './dashboard/AIInjest';
import { ExamCountdown } from './dashboard/ExamCountdown';
import { ActivityFeed } from './dashboard/ActivityFeed';
import { EmptyState } from './shared/EmptyState';
import { LayoutDashboard, FileText, CalendarDays, BookOpen, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Exam, Lesson, Note } from '@/types';

export function Dashboard() {
  const { profile, user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [{ data: examsData }, { data: lessonsData }, { data: notesData }] = await Promise.all([
        supabase.from('exams').select('*').eq('user_id', user.id).neq('status', 'Passed'),
        supabase.from('lessons').select('*').eq('user_id', user.id),
        supabase.from('notes').select('id, title, subject, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      ]);
      setExams(examsData || []);
      setLessons(lessonsData || []);
      setNotes(notesData || []);
      setLoaded(true);
    };
    fetchData();
  }, [user]);

  const isAppEmpty = loaded && exams.length === 0 && lessons.length === 0 && notes.length === 0;

  if (!loaded) {
    return (
      <div className="px-6 py-8 md:px-8 space-y-8">
        <div className="flex flex-col gap-1.5">
          <div className="h-8 w-64 bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-zinc-800/60 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          <div className="md:col-span-8 h-48 bg-zinc-900 rounded-xl border border-zinc-800 animate-pulse" />
          <div className="md:col-span-4 h-48 bg-zinc-900 rounded-xl border border-zinc-800 animate-pulse" />
          <div className="md:col-span-12 h-28 bg-zinc-900 rounded-xl border border-zinc-800 animate-pulse" />
          <div className="md:col-span-7 h-52 bg-zinc-900 rounded-xl border border-zinc-800 animate-pulse" />
          <div className="md:col-span-5 h-52 bg-zinc-900 rounded-xl border border-zinc-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (isAppEmpty) {
    return (
      <div className="px-6 py-8 md:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Benvenuto su IlluminaHub</h1>
          <p className="text-zinc-500 text-sm">Il tuo centro di comando accademico è pronto. Iniziamo a configurare il tuo spazio.</p>
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

  const jsDay = new Date().getDay();
  const todayLessons = lessons.filter(l => l.day === jsDay).length;
  const maxCredits = profile?.plan === 'max' ? 50 : profile?.plan === 'pro' ? 15 : 3;

  const statCards = [
    { label: 'APPUNTI', value: notes.length, icon: FileText },
    { label: 'LEZIONI OGGI', value: todayLessons, icon: CalendarDays },
    { label: 'ESAMI ATTIVI', value: exams.length, icon: BookOpen },
    { label: 'CREDITI RIMASTI', value: profile ? `${profile.credits_remaining}/${maxCredits}` : '—', icon: Zap },
  ];

  return (
    <div className="px-6 py-8 md:px-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-screen-xl">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Bentornato, {profile?.nickname || 'Studente'} 👋</h1>
        <p className="text-zinc-500 text-sm">Il tuo spazio di lavoro è sincronizzato e pronto per oggi.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(stat => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{stat.label}</span>
              <stat.icon size={15} className="text-zinc-600" />
            </div>
            <span className="text-2xl font-bold text-white">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        <div className="md:col-span-8 lg:col-span-8">
          <UpNext lessons={lessons} />
        </div>
        <div className="md:col-span-4 lg:col-span-4">
          <FocusMode />
        </div>
        <div className="md:col-span-12">
          <AIInjest />
        </div>
        <div className="md:col-span-7 lg:col-span-7">
          <ExamCountdown exams={exams} />
        </div>
        <div className="md:col-span-5 lg:col-span-5">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
