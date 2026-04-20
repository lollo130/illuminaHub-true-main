import { useState, useEffect } from 'react';
import { Trophy, Clock, BookOpen, Star, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { EmptyState } from '@/components/shared/EmptyState';

interface PassedExam {
  id: string;
  name: string;
  cfu: number;
  grade: number;
  date: string;
}

export default function GradeAnalytics() {
  const { user } = useAuth();
  const [exams, setExams] = useState<PassedExam[]>([]);
  const [totalExams, setTotalExams] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const [{ data: passed }, { count }] = await Promise.all([
        supabase
          .from('exams')
          .select('id, name, cfu, target_grade, date')
          .eq('user_id', user.id)
          .eq('status', 'Passed')
          .order('date', { ascending: false }),
        supabase
          .from('exams')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);
      const mapped: PassedExam[] = (passed || []).map(e => ({
        id: e.id,
        name: e.name,
        cfu: e.cfu,
        grade: e.target_grade,
        date: e.date,
      }));
      setExams(mapped);
      setTotalExams(count ?? 0);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const cfuAcquired = exams.reduce((s, e) => s + e.cfu, 0);
  const totalCfu = 180;
  const cfuPercent = Math.round((cfuAcquired / totalCfu) * 100);

  const weightedAvg = exams.length
    ? (exams.reduce((s, e) => s + e.grade * e.cfu, 0) / cfuAcquired).toFixed(2)
    : '—';

  const lodi = exams.filter(e => e.grade >= 30).length;

  const maxGrade = exams.length ? Math.max(...exams.map(e => e.grade)) : 30;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="text-emerald-400 animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-white">Grade Analytics</h1>
        <p className="text-zinc-500">Tieni traccia della tua carriera accademica.</p>
      </div>

      {exams.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Nessun esame superato"
          description="Completa il tuo primo esame nella Roadmap per vedere le statistiche qui."
          actionLabel="Vai alla Roadmap"
          onAction={() => window.dispatchEvent(new CustomEvent('change-view', { detail: 'roadmap' }))}
        />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'MEDIA PESATA', value: weightedAvg, sub: 'su 30', icon: Trophy },
              { label: 'ESAMI SUPERATI', value: exams.length, sub: `su ${totalExams}`, icon: Clock },
              { label: 'CFU ACQUISITI', value: cfuAcquired, sub: `su ${totalCfu}`, icon: BookOpen },
              { label: 'LODI', value: lodi, sub: '30 e lode', icon: Star },
            ].map(stat => (
              <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{stat.label}</span>
                  <stat.icon size={15} className="text-zinc-600" />
                </div>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-zinc-500 mt-1">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* CFU progress */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Progresso CFU</span>
              <span className="text-xs font-bold text-emerald-400">{cfuAcquired} / {totalCfu} CFU ({cfuPercent}%)</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${cfuPercent}%` }}
              />
            </div>
          </div>

          {/* Bottom two-panel layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Voti per materia */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Voti per Materia</p>
              <div className="space-y-3">
                {exams.map(e => (
                  <div key={e.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-zinc-200 font-medium">{e.name}</span>
                      <span className="text-sm font-bold text-emerald-400">{e.grade}/30</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${e.grade === maxGrade ? 'bg-emerald-500' : e.grade >= 27 ? 'bg-blue-500' : 'bg-amber-500'}`}
                        style={{ width: `${(e.grade / 30) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Registro esami */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-4">Registro Esami</p>
              <div className="space-y-0">
                <div className="grid grid-cols-4 gap-2 pb-2 border-b border-zinc-800">
                  {['MATERIA', 'CFU', 'VOTO', 'DATA'].map(h => (
                    <span key={h} className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{h}</span>
                  ))}
                </div>
                {exams.map(e => (
                  <div key={e.id} className="grid grid-cols-4 gap-2 py-3 border-b border-zinc-800/50 last:border-0">
                    <span className="text-sm text-zinc-300 truncate">{e.name}</span>
                    <span className="text-sm text-zinc-400">{e.cfu}</span>
                    <span className="text-sm font-bold text-emerald-400">{e.grade}</span>
                    <span className="text-xs text-zinc-500">{e.date ? new Date(e.date).toLocaleDateString('it-IT') : '—'}</span>
                  </div>
                ))}
                {exams.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-3">
                    <span className="text-sm text-zinc-400">Media pesata</span>
                    <span className="text-sm font-bold text-emerald-400">{cfuAcquired}</span>
                    <span className="text-sm font-bold text-emerald-400">{weightedAvg}</span>
                    <span />
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
