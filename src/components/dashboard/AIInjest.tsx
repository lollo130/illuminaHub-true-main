import { useRef, useState } from 'react';
import { Upload, FileText, Music, FileJson, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export function AIInjest() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.info(`Inizio elaborazione di: ${file.name}`);
      
      // Simula caricamento e naviga alla sezione note
      setTimeout(() => {
        toast.success("File ricevuto! Ti porto alla sezione AI Notes.");
        window.dispatchEvent(new CustomEvent('change-view', { detail: 'notes' }));
      }, 1500);
    }
  };

  return (
    <Card 
      onClick={() => fileInputRef.current?.click()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-zinc-900/50 border-2 border-dashed border-zinc-800 hover:border-emerald-500/30 hover:bg-emerald-500/[0.02] transition-all duration-300 group cursor-pointer relative overflow-hidden"
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
      />
      
      <CardContent className="p-8 flex flex-col items-center justify-center text-center relative z-10">
        <div className={`h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 transition-all duration-500 shadow-2xl ${isHovered ? 'scale-110 border-emerald-500/50 rotate-3' : ''}`}>
          <Upload className={`transition-colors duration-300 ${isHovered ? 'text-emerald-400' : 'text-zinc-500'}`} size={28} />
        </div>
        
        <h3 className="text-lg font-semibold text-white mb-1">Ingestione Rapida IA</h3>
        <p className="text-zinc-500 text-sm max-w-xs">
          Trascina slide, PDF o registrazioni audio per generare guide di studio istantanee.
        </p>
        
        <div className="flex items-center gap-6 mt-6">
          {[
            { icon: FileText, label: 'PDF', color: 'text-blue-400' },
            { icon: Music, label: 'Audio', color: 'text-purple-400' },
            { icon: FileJson, label: 'Slides', color: 'text-orange-400' }
          ].map((type, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-zinc-300 transition-colors">
                <type.icon size={16} className={isHovered ? type.color : ''} />
              </div>
              <span className="text-[10px] font-medium text-zinc-600 group-hover:text-zinc-400">{type.label}</span>
            </div>
          ))}
        </div>
      </CardContent>

      <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity duration-500 ${isHovered ? 'opacity-100' : ''}`} />
    </Card>
  );
}
