import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function ProcessingUpload() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsProcessing(false);
            return 100;
          }
          return prev + 1;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isProcessing]);

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-purple-500/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-8 overflow-hidden">
        {isProcessing ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Loader2 className="text-emerald-400 animate-spin" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    AI Processing <Sparkles size={16} className="text-emerald-400" />
                  </h3>
                  <p className="text-zinc-500 text-sm font-mono">Analyzing Machine_Learning_Ch4.pdf...</p>
                </div>
              </div>
              <span className="text-emerald-400 font-mono font-bold">{progress}%</span>
            </div>
            
            <div className="space-y-2">
              <Progress value={progress} className="h-2 bg-zinc-800" />
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                <span>Extracting Semantic Structure</span>
                <span>Generating Vector Embeddings</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-center animate-in zoom-in-95 duration-500">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="text-emerald-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Analysis Complete</h3>
            <p className="text-zinc-400 text-sm mb-6">"Machine_Learning_Ch4.pdf" has been indexed into your database.</p>
            <button 
              onClick={() => { setIsProcessing(true); setProgress(0); }}
              className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Upload Another File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
