import { useState } from 'react';
import { Clock, Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

interface Lesson {
  id: string;
  name: string;
  room: string;
  day: number;
  start: number;
  duration: number;
  color: string;
}

const DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);

const COLORS = [
  'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
  'bg-purple-500/20 border-purple-500/30 text-purple-400',
  'bg-blue-500/20 border-blue-500/30 text-blue-400',
  'bg-amber-500/20 border-amber-500/30 text-amber-400',
  'bg-rose-500/20 border-rose-500/30 text-rose-400',
];

export default function Timetable() {
  const [lessons, setLessons] = useLocalStorage<Lesson[]>('illuminahub_lessons', []);
  const [workspaces] = useLocalStorage<string[]>('illuminahub_workspaces', []);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newLesson, setNewLesson] = useState<Partial<Lesson>>({
    day: 1,
    start: 9,
    duration: 2
  });

  const handleAddLesson = () => {
    if (!newLesson.name) return;
    const lesson: Lesson = {
      id: Math.random().toString(36).substr(2, 9),
      name: newLesson.name!,
      room: newLesson.room || 'Aula TBD',
      day: Number(newLesson.day),
      start: Number(newLesson.start),
      duration: Number(newLesson.duration),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
    setLessons([...lessons, lesson]);
    setIsAddOpen(false);
    toast.success("Lezione aggiunta all'orario");
  };

  const deleteLesson = (id: string) => {
    setLessons(lessons.filter(l => l.id !== id));
    toast.success("Lezione rimossa");
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-white">Orario Lezioni</h1>
          <p className="text-zinc-500">Organizza la tua settimana accademica.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400 font-bold">
              <Plus size={18} className="mr-2" /> Nuova Lezione
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle>Aggiungi Lezione</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Materia</Label>
                <Select onValueChange={v => setNewLesson({...newLesson, name: v})}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800">
                    <SelectValue placeholder="Seleziona materia..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                    {workspaces.map(ws => <SelectItem key={ws} value={ws}>{ws}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Giorno</Label>
                  <Select onValueChange={v => setNewLesson({...newLesson, day: Number(v)})}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                      <SelectValue placeholder="Giorno" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      {DAYS.map((d, i) => <SelectItem key={d} value={(i+1).toString()}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Ora Inizio</Label>
                  <Input type="number" min="8" max="20" className="bg-zinc-900 border-zinc-800"
                    onChange={e => setNewLesson({...newLesson, start: Number(e.target.value)})} />
                </div>
              </div>
              <Button onClick={handleAddLesson} className="bg-emerald-500 text-emerald-950 mt-4">Salva Lezione</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {lessons.length === 0 ? (
        <EmptyState 
          icon={CalendarIcon}
          title="Orario vuoto"
          description="Pianifica le tue lezioni settimanali per non perdere mai un'aula."
          actionLabel="Aggiungi Lezione"
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-6 mb-4">
              <div className="flex items-center justify-center text-zinc-600"><Clock size={16} /></div>
              {DAYS.map((day) => (
                <div key={day} className="text-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">{day}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-6 relative border-t border-l border-zinc-800/50">
              <div className="flex flex-col">
                {HOURS.map((hour) => (
                  <div key={hour} className="h-20 border-b border-r border-zinc-800/50 flex items-start justify-center pt-2">
                    <span className="text-[10px] font-mono text-zinc-600">{hour}:00</span>
                  </div>
                ))}
              </div>

              {DAYS.map((_, dayIndex) => (
                <div key={dayIndex} className="relative border-r border-zinc-800/50">
                  {HOURS.map((hour) => <div key={hour} className="h-20 border-b border-zinc-800/20" />)}
                  {lessons.filter(l => l.day === dayIndex + 1).map((lesson) => (
                    <div
                      key={lesson.id}
                      className={cn("absolute left-1 right-1 rounded-lg border p-3 flex flex-col justify-between transition-all hover:scale-[1.02] hover:z-10 group shadow-lg", lesson.color)}
                      style={{ top: `${(lesson.start - 8) * 80 + 4}px`, height: `${lesson.duration * 80 - 8}px` }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold leading-tight">{lesson.name}</h4>
                          <p className="text-[10px] opacity-70 mt-1 font-medium">{lesson.room}</p>
                        </div>
                        <button 
                          onClick={() => deleteLesson(lesson.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/20 rounded transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
