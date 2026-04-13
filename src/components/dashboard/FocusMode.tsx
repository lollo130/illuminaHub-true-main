import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function FocusMode() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
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

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <Card className="bg-zinc-900 border-zinc-800 h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-400">Focus Mode</CardTitle>
          <div className="flex items-center gap-1 text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full text-[10px] font-bold">
            <Flame size={12} />
            Pomodoro
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center py-4">
        <div className="text-5xl font-mono font-bold text-white mb-6 tracking-tighter">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={toggleTimer}
            className={`${isActive ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400'} h-10 w-10 rounded-full p-0`}
          >
            {isActive ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
          </Button>
          <Button 
            variant="ghost" 
            onClick={resetTimer}
            className="h-10 w-10 rounded-full text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <RotateCcw size={18} />
          </Button>
        </div>
        
        <p className="mt-6 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Deep Work Session</p>
      </CardContent>
    </Card>
  );
}
