import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Lesson } from '@/types';

interface UpNextProps {
  lessons: Lesson[];
}

export function UpNext({ lessons }: UpNextProps) {
  const nextLesson = lessons[0]; // Prende la prima lezione disponibile

  const navigateToTimetable = () => {
    window.dispatchEvent(new CustomEvent('change-view', { detail: 'timetable' }));
  };

  const navigateToNotes = () => {
    window.dispatchEvent(new CustomEvent('change-view', { detail: 'notes' }));
  };

  if (!nextLesson) {
    return (
      <Card
        role="button"
        tabIndex={0}
        aria-label="Configura orario lezioni"
        onClick={navigateToTimetable}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigateToTimetable(); } }}
        className="bg-zinc-900 border-zinc-800 overflow-hidden group cursor-pointer hover:border-emerald-500/50 transition-all duration-300 h-full flex items-center justify-center"
      >
        <CardContent className="p-6 text-center">
          <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 mx-auto mb-4 group-hover:scale-110 transition-transform">
            <Clock size={24} />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Nessuna lezione oggi</h3>
          <p className="text-zinc-500 text-sm">Clicca per configurare il tuo orario.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`Vai ai materiali di ${nextLesson.name}`}
      onClick={navigateToNotes}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigateToNotes(); } }}
      className="bg-zinc-900 border-zinc-800 overflow-hidden group cursor-pointer hover:border-emerald-500/50 transition-all duration-300"
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 mb-2">Prossima Lezione</Badge>
            <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{nextLesson.name}</h3>
            <p className="text-zinc-400 text-sm">Aula: {nextLesson.room}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <Clock size={24} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 text-zinc-300">
            <div className="h-8 w-8 rounded-lg bg-zinc-800/50 flex items-center justify-center">
              <Clock size={14} className="text-zinc-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Orario</span>
              <span className="text-sm font-medium">{nextLesson.start_hour ?? 0}:00 - {(nextLesson.start_hour ?? 0) + (nextLesson.duration ?? 0)}:00</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-zinc-300">
            <div className="h-8 w-8 rounded-lg bg-zinc-800/50 flex items-center justify-center">
              <MapPin size={14} className="text-zinc-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Luogo</span>
              <span className="text-sm font-medium">{nextLesson.room}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-800 flex items-center justify-between text-sm font-medium text-emerald-400">
          <span>Vai ai materiali della lezione</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  );
}
