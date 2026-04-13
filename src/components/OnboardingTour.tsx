import { useState, useEffect } from 'react';
import { X, BookOpen, Calendar, Map, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    icon: Sparkles,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    title: 'Benvenuto su IlluminaHub! 🎉',
    description: 'La piattaforma AI che trasforma i tuoi documenti universitari in materiale di studio completo. Lasciaci guidarti in 3 passi.',
  },
  {
    icon: BookOpen,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    title: 'AI Notes Engine',
    description: 'Carica un PDF o DOCX e Gemini AI genera automaticamente riassunto, domande di studio, concetti chiave, flashcard e molto altro.',
  },
  {
    icon: Calendar,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    title: 'Timetable & Exam Roadmap',
    description: 'Organizza il tuo orario settimanale e traccia i progressi di ogni esame con il sistema Kanban. I dati sono sincronizzati su tutti i tuoi dispositivi.',
  },
  {
    icon: Map,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    title: 'Inizia subito!',
    description: 'Aggiungi le tue materie dal menu in alto a sinistra, poi carica il tuo primo documento nell\'AI Notes Engine. Hai 3 crediti gratuiti al giorno.',
  },
];

export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem('illuminahub_tour_done');
    if (!done) {
      setTimeout(() => setVisible(true), 1000);
    }
  }, []);

  const close = () => {
    localStorage.setItem('illuminahub_tour_done', '1');
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else close();
  };

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-emerald-500' : i < step ? 'w-3 bg-emerald-500/50' : 'w-3 bg-zinc-800'}`} />
            ))}
          </div>
          <button onClick={close} className="text-zinc-600 hover:text-zinc-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl border ${current.bg} mb-5`}>
          <Icon size={26} className={current.color} />
        </div>

        <h3 className="text-xl font-bold text-white mb-3">{current.title}</h3>
        <p className="text-zinc-400 text-sm leading-relaxed mb-8">{current.description}</p>

        <div className="flex items-center gap-3">
          <Button
            onClick={next}
            className="flex-1 bg-emerald-500 text-emerald-950 hover:bg-emerald-400 font-bold h-11 gap-2"
          >
            {step < STEPS.length - 1 ? (
              <><ChevronRight size={16} /> Avanti</>
            ) : (
              <><Sparkles size={16} /> Inizia a studiare!</>
            )}
          </Button>
          {step < STEPS.length - 1 && (
            <Button onClick={close} variant="ghost" className="text-zinc-500 hover:text-zinc-300 text-sm">
              Salta
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
