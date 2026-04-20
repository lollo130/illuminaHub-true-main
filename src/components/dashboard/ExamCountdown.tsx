import { Calendar, ArrowRight, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ExamCountdownProps {
  exams: Record<string, unknown>[];
}

export function ExamCountdown({ exams }: ExamCountdownProps) {
  const nextExam = exams.find(e => e.status !== 'Passed');

  const navigateToRoadmap = () => {
    window.dispatchEvent(new CustomEvent('change-view', { detail: 'roadmap' }));
  };

  if (!nextExam) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Prossimo Esame</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 mb-4">
            <Trophy size={24} />
          </div>
          <p className="text-zinc-400 text-sm mb-4">Nessun esame imminente pianificato.</p>
          <Button 
            onClick={navigateToRoadmap}
            variant="outline" 
            className="border-zinc-800 hover:bg-zinc-800 text-zinc-300"
          >
            Pianifica ora
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getDaysLeft = () => {
    if (!nextExam.date) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const examDate = new Date(nextExam.date); examDate.setHours(0,0,0,0);
    return Math.ceil((examDate.getTime() - today.getTime()) / (1000*60*60*24));
  };
  const daysLeft = getDaysLeft();
  const urgency = daysLeft === null ? 'none' : daysLeft <= 7 ? 'critical' : daysLeft <= 14 ? 'warning' : 'ok';
  const urgencyColors = {
    critical: { box: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-400', sub: 'text-rose-500/60', bar: 'bg-rose-500', progress: 'text-rose-400', card: 'border-rose-500/20' },
    warning:  { box: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', sub: 'text-amber-500/60', bar: 'bg-amber-500', progress: 'text-amber-400', card: 'border-amber-500/20' },
    ok:       { box: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', sub: 'text-emerald-500/60', bar: 'bg-emerald-500', progress: 'text-emerald-400', card: 'border-zinc-800' },
    none:     { box: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', sub: 'text-emerald-500/60', bar: 'bg-emerald-500', progress: 'text-emerald-400', card: 'border-zinc-800' },
  };
  const uc = urgencyColors[urgency];

  return (
    <Card className={`bg-zinc-900 ${uc.card} h-full transition-colors duration-500`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">Prossimo Esame</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-white">{nextExam.name}</h3>
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <Calendar size={14} />
              <span>{nextExam.date ? new Date(nextExam.date).toLocaleDateString('it-IT') : 'Data da definire'}</span>
            </div>
          </div>
          <div className={`h-14 w-14 rounded-2xl ${uc.box} flex flex-col items-center justify-center transition-colors duration-500`}>
            {daysLeft === null
              ? <span className={`${uc.text} text-xl font-bold leading-none`}>?</span>
              : <span className={`${uc.text} text-xl font-bold leading-none`}>{daysLeft >= 0 ? daysLeft : 0}</span>
            }
            <span className={`${uc.sub} text-[8px] font-bold uppercase tracking-tighter`}>Giorni</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-zinc-400">Preparazione</span>
            <span className={uc.progress}>{nextExam.progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${uc.bar} transition-all duration-1000`}
              style={{ width: `${nextExam.progress}%` }}
            />
          </div>
        </div>

        <Button 
          onClick={navigateToRoadmap}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border-none group"
        >
          Apri Roadmap
          <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}
