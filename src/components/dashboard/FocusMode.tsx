import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function FocusMode() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const isComplete = timeLeft === 0;
  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const progress = 1 - timeLeft / (25 * 60);
  const circumference = 2 * Math.PI * 36;

  return (
    <Card className={`h-full flex flex-col transition-colors duration-700 ${isActive ? 'bg-amber-950/20 border-amber-500/20' : 'bg-zinc-900 border-zinc-800'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-400">Focus Mode</CardTitle>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors duration-500 ${isActive ? 'text-amber-300 bg-amber-500/20' : 'text-orange-500 bg-orange-500/10'}`}>
            <Flame size={12} />
            Pomodoro
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center py-4 gap-6">
        <div className="relative flex items-center justify-center">
          {/* Ambient glow ring when active */}
          {isActive && !isComplete && (
            <div className="absolute inset-0 rounded-full animate-ring-pulse"
              style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)' }}
            />
          )}
          <svg width="96" height="96" className={`-rotate-90 ${isComplete ? 'animate-ring-pulse' : ''}`}>
            <circle cx="48" cy="48" r="36" fill="none" stroke="#27272a" strokeWidth="4" />
            <circle
              cx="48" cy="48" r="36" fill="none"
              stroke={isComplete ? '#10b981' : isActive ? '#f59e0b' : '#10b981'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={isComplete ? 0 : circumference * (1 - progress)}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-mono font-bold tracking-tighter transition-colors duration-500 ${isComplete ? 'text-emerald-400' : isActive ? 'text-amber-300' : 'text-white'}`}>
              {isComplete ? '✓' : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={toggleTimer}
            aria-label={isActive ? 'Pausa timer' : 'Avvia timer'}
            className={`h-10 w-10 rounded-full p-0 transition-colors duration-300 ${isActive ? 'bg-amber-500 text-amber-950 hover:bg-amber-400' : 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400'}`}
          >
            {isActive ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
          </Button>
          <Button
            variant="ghost"
            onClick={resetTimer}
            aria-label="Reimposta timer"
            className="h-10 w-10 rounded-full text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <RotateCcw size={18} />
          </Button>
        </div>

        <p className={`text-[10px] uppercase tracking-widest font-bold transition-colors duration-500 ${isComplete ? 'text-emerald-500/70' : isActive ? 'text-amber-500/60' : 'text-zinc-500'}`}>
          {isComplete ? 'Sessione completata' : isActive ? 'Sessione in corso' : 'Deep Work Session'}
        </p>
      </CardContent>
    </Card>
  );
}
