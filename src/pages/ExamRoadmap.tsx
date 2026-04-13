import { useState, useEffect } from 'react';
import { GraduationCap, Target, Plus, LayoutGrid, Trash2, ArrowRight, Clock, MapPin, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { EmptyState } from '@/components/shared/EmptyState';
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
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface Exam {
  id: string;
  name: string;
  professor: string;
  cfu: number;
  target_grade: number;
  progress: number;
  status: 'Planning' | 'Active Studying' | 'Ready' | 'Passed';
  date: string;
  time?: string;
  location?: string;
  room?: string;
}

export default function ExamRoadmap() {
  const { user } = useAuth();
  const [workspaces] = useLocalStorage<string[]>('illuminahub_workspaces', []);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newExam, setNewExam] = useState<Partial<Exam>>({ status: 'Planning', progress: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchExams = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (!error) setExams(data || []);
      setLoading(false);
    };
    fetchExams();
  }, [user]);

  const handleAddExam = async () => {
    if (!newExam.name || !newExam.cfu) {
      toast.error("Inserisci almeno il nome della materia e i CFU");
      return;
    }
    const row = {
      user_id: user!.id,
      name: newExam.name,
      professor: newExam.professor || 'Da definire',
      cfu: Number(newExam.cfu),
      target_grade: Number(newExam.targetGrade) || 30,
      progress: 0,
      status: newExam.status || 'Planning',
      date: newExam.date || new Date().toISOString().split('T')[0],
      time: newExam.time || '',
      location: newExam.location || '',
      room: newExam.room || '',
    };
    const { data, error } = await supabase.from('exams').insert(row).select().single();
    if (error) { toast.error('Errore nel salvataggio'); return; }
    setExams(prev => [...prev, data]);
    setIsAddOpen(false);
    setNewExam({ status: 'Planning', progress: 0 });
    toast.success("Esame aggiunto alla roadmap");
  };

  const deleteExam = async (id: string) => {
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (error) { toast.error('Errore nella rimozione'); return; }
    setExams(prev => prev.filter(e => e.id !== id));
    toast.success("Esame rimosso");
  };

  const moveExam = async (id: string) => {
    const columns: Exam['status'][] = ['Planning', 'Active Studying', 'Ready', 'Passed'];
    const exam = exams.find(e => e.id === id);
    if (!exam) return;
    const currentIndex = columns.indexOf(exam.status);
    const nextStatus = columns[Math.min(currentIndex + 1, columns.length - 1)];
    const newProgress = nextStatus === 'Passed' ? 100 : Math.max(exam.progress, (currentIndex + 1) * 25);
    const { error } = await supabase
      .from('exams')
      .update({ status: nextStatus, progress: newProgress })
      .eq('id', id);
    if (error) { toast.error('Errore aggiornamento'); return; }
    setExams(prev => prev.map(e => e.id === id ? { ...e, status: nextStatus, progress: newProgress } : e));
  };

  const columns: Exam['status'][] = ['Planning', 'Active Studying', 'Ready', 'Passed'];

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-white">Exam Roadmap</h1>
          <p className="text-zinc-500">Gestisci i tuoi traguardi accademici con precisione.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400 font-bold shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Plus size={18} className="mr-2" /> Nuovo Esame
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-lg">
            <DialogHeader><DialogTitle>Pianifica Esame</DialogTitle></DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label className="text-zinc-400">Materia</Label>
                <Select onValueChange={v => setNewExam({...newExam, name: v})}>
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
                  <Label className="text-zinc-400">Professore</Label>
                  <Input placeholder="Nome docente" className="bg-zinc-900 border-zinc-800"
                    onChange={e => setNewExam({...newExam, professor: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label className="text-zinc-400">Data Esame</Label>
                  <Input type="date" className="bg-zinc-900 border-zinc-800"
                    onChange={e => setNewExam({...newExam, date: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label className="text-zinc-400">Orario</Label>
                  <Input type="time" className="bg-zinc-900 border-zinc-800"
                    onChange={e => setNewExam({...newExam, time: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label className="text-zinc-400">Sede</Label>
                  <Input placeholder="Es. Sede Centrale" className="bg-zinc-900 border-zinc-800"
                    onChange={e => setNewExam({...newExam, location: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label className="text-zinc-400">Aula</Label>
                  <Input placeholder="Es. Aula 4" className="bg-zinc-900 border-zinc-800"
                    onChange={e => setNewExam({...newExam, room: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-zinc-400">CFU</Label>
                  <Input type="number" className="bg-zinc-900 border-zinc-800"
                    onChange={e => setNewExam({...newExam, cfu: Number(e.target.value)})} />
                </div>
                <div className="grid gap-2">
                  <Label className="text-zinc-400">Voto Target</Label>
                  <Input type="number" placeholder="30" className="bg-zinc-900 border-zinc-800"
                    onChange={e => setNewExam({...newExam, targetGrade: Number(e.target.value)} as any)} />
                </div>
              </div>
              <Button onClick={handleAddExam} className="bg-emerald-500 text-emerald-950 font-bold h-12">
                Salva nella Roadmap
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="text-emerald-400 animate-spin" size={32} />
        </div>
      ) : exams.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="Nessun esame pianificato"
          description="Inizia aggiungendo il tuo primo esame per tracciare i progressi."
          actionLabel="Aggiungi Esame"
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[calc(100vh-250px)]">
          {columns.map((column) => (
            <div key={column} className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">{column}</h3>
                <span className="h-5 w-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                  {exams.filter(e => e.status === column).length}
                </span>
              </div>
              <div className="flex-1 bg-zinc-950/50 border border-zinc-900 rounded-2xl p-3 space-y-3 overflow-y-auto scrollbar-hide">
                {exams.filter(e => e.status === column).map((exam) => (
                  <ExamCard
                    key={exam.id}
                    exam={exam}
                    onDelete={() => deleteExam(exam.id)}
                    onMove={() => moveExam(exam.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExamCard({ exam, onDelete, onMove }: { exam: Exam; onDelete: () => void; onMove: () => void }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (exam.progress / 100) * circumference;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4 hover:border-zinc-700 transition-all group relative">
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0 flex-1">
          <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate">{exam.name}</h4>
          <p className="text-[10px] text-zinc-500 font-medium truncate">Prof. {exam.professor}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
          {exam.status !== 'Passed' && (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-500 hover:bg-emerald-500/10" onClick={onMove}>
              <ArrowRight size={14} />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-red-500/10" onClick={onDelete}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {(exam.time || exam.location || exam.room) && (
        <div className="grid grid-cols-1 gap-1.5 py-2 border-y border-zinc-800/50">
          {exam.time && (
            <div className="flex items-center gap-2 text-[10px] text-zinc-400">
              <Clock size={12} className="text-emerald-500/70" /><span>{exam.time}</span>
            </div>
          )}
          {exam.location && (
            <div className="flex items-center gap-2 text-[10px] text-zinc-400">
              <MapPin size={12} className="text-emerald-500/70" /><span className="truncate">{exam.location}</span>
            </div>
          )}
          {exam.room && (
            <div className="flex items-center gap-2 text-[10px] text-zinc-400">
              <Building2 size={12} className="text-emerald-500/70" /><span>Aula: {exam.room}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div className="bg-black/40 rounded-lg p-2 border border-zinc-800/50">
            <p className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold mb-1">CFU</p>
            <span className="text-xs font-bold text-zinc-300">{exam.cfu}</span>
          </div>
          <div className="bg-black/40 rounded-lg p-2 border border-zinc-800/50">
            <p className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold mb-1">Target</p>
            <span className="text-xs font-bold text-zinc-300">{exam.target_grade}</span>
          </div>
        </div>
        <div className="relative h-12 w-12 flex items-center justify-center shrink-0">
          <svg className="h-full w-full -rotate-90">
            <circle cx="24" cy="24" r={radius} fill="transparent" stroke="currentColor" strokeWidth="3" className="text-zinc-800" />
            <circle cx="24" cy="24" r={radius} fill="transparent" stroke="currentColor" strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="text-emerald-500 transition-all duration-1000" />
          </svg>
          <span className="absolute text-[10px] font-bold text-white">{exam.progress}%</span>
        </div>
      </div>
    </div>
  );
}
