import { Calendar, ArrowRight, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ExamCountdownProps {
  exams: any[];
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

  return (
    <Card className="bg-zinc-900 border-zinc-800 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">Prossimo Esame</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-white">{nextExam.name}</h3>
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <Calendar size={14} />
              <span>Data da definire</span>
            </div>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center">
            <span className="text-emerald-400 text-xl font-bold leading-none">?</span>
            <span className="text-emerald-500/60 text-[8px] font-bold uppercase tracking-tighter">Giorni</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-zinc-400">Preparazione</span>
            <span className="text-emerald-400">{nextExam.progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-1000" 
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
