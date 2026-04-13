import { useState, useRef, useEffect } from 'react';
import { FileText, Plus, Upload, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { NotesTable } from '@/components/notes/NotesTable';
import { NoteDetailView } from '@/components/notes/NoteDetailView';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const MAX_FILE_SIZE_MB = 20;

async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const runExtraction = async () => {
      try {
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        const maxPages = Math.min(pdf.numPages, 30);
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        resolve(fullText.trim());
      } catch (err) {
        reject(err);
      }
    };

    if ((window as any).pdfjsLib) {
      runExtraction();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => runExtraction();
      script.onerror = () => reject(new Error('Impossibile caricare pdf.js'));
      document.head.appendChild(script);
    }
  });
}

async function analyzeWithBackend(text: string, filename: string, token: string): Promise<{ content: string; credits_remaining: number | null }> {
  const response = await fetch('/.netlify/functions/analyze-document', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ text, filename }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Errore analisi documento');
  }

  return data;
}


export default function AINotesEngine() {
  const { user, session, profile, refreshProfile } = useAuth();
  const [workspaces] = useLocalStorage<string[]>('illuminahub_workspaces', []);
  const [notes, setNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carica note da Supabase all'avvio
  useEffect(() => {
    if (!user) return;
    const fetchNotes = async () => {
      setLoadingNotes(true);
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        toast.error('Errore nel caricamento delle note');
      } else {
        setNotes(data || []);
      }
      setLoadingNotes(false);
    };
    fetchNotes();
  }, [user]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedSubject) { toast.error('Seleziona prima una materia'); return; }
    if (!file.type.includes('pdf') && !file.type.includes('word') && !file.type.includes('officedocument')) {
      toast.error('Formato non supportato. Carica un PDF o DOCX.'); return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`Il file supera i ${MAX_FILE_SIZE_MB}MB consentiti.`); return;
    }
    // Controllo crediti lato client (pre-check UI, validazione reale è server-side)
    if (!profile || (profile.plan !== 'max' && profile.credits_remaining <= 0)) {
      toast.error("Crediti esauriti! Passa a un piano superiore per continuare.", { action: { label: "Upgrade", onClick: () => window.dispatchEvent(new CustomEvent("show-pricing")) } });
      return;
    }
    await startProcessing(file);
  };

  const startProcessing = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      setProcessingStep('Lettura del documento...');
      setUploadProgress(15);

      let extractedText = '';
      if (file.type.includes('pdf')) {
        setProcessingStep('Estrazione testo dal PDF...');
        setUploadProgress(30);
        extractedText = await extractTextFromPDF(file);
      } else {
        extractedText = await file.text();
      }

      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error('Impossibile estrarre testo. Assicurati che il PDF non sia fatto solo di immagini scansionate.');
      }

      setProcessingStep('Analisi con Gemini AI...');
      setUploadProgress(60);

      const token = session?.access_token;
      if (!token) throw new Error('Sessione scaduta, effettua il login.');

      const { content: aiContent } = await analyzeWithBackend(extractedText, file.name, token);

      setProcessingStep('Salvataggio su Supabase...');
      setUploadProgress(90);

      const newNote = {
        user_id: user!.id,
        title: file.name.replace(/\.[^/.]+$/, ''),
        subject: selectedSubject,
        type: file.type.includes('pdf') ? 'PDF' : 'DOCX',
        date: new Date().toLocaleDateString('it-IT'),
        status: 'Summarized',
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        content: aiContent,
      };

      const { data, error } = await supabase.from('notes').insert(newNote).select().single();
      if (error) throw new Error('Errore nel salvataggio: ' + error.message);

      setNotes(prev => [data, ...prev]);
      setUploadProgress(100);
      setUploading(false);
      setIsAddOpen(false);
      setSelectedSubject('');
      await refreshProfile();
      toast.success('Documento analizzato e salvato! 🎉');
    } catch (error: any) {
      console.error('Errore analisi:', error);
      toast.error(`Errore: ${error.message}`);
      setUploading(false);
    }
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) {
      toast.error('Errore nella rimozione');
    } else {
      setNotes(prev => prev.filter(n => n.id !== id));
      toast.success('Documento rimosso');
    }
  };

  return (
    <div className="p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            AI Notes Engine
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
              <Sparkles size={12} /> Gemini AI
            </span>
          </h1>
          <p className="text-zinc-500">Carica un PDF e Gemini AI lo trasforma in una guida di studio.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400 font-bold shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <Plus size={18} className="mr-2" /> Nuovo Appunto
        </Button>
      </div>

      <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open && uploading) { if (confirm("Sei sicuro di voler annullare l'analisi?")) { setUploading(false); setIsAddOpen(false); } } else { setIsAddOpen(open); } }}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{uploading ? 'Gemini sta analizzando...' : 'Carica Materiale'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {!uploading ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Materia di riferimento</label>
                  <Select onValueChange={setSelectedSubject} value={selectedSubject}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                      <SelectValue placeholder="Scegli una materia..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      {workspaces.map(ws => (
                        <SelectItem key={ws} value={ws}>{ws}</SelectItem>
                      ))}
                      {workspaces.length === 0 && (
                        <div className="p-2 text-xs text-zinc-500 italic">Aggiungi una materia nel sidebar</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div
                  onClick={() => selectedSubject ? fileInputRef.current?.click() : toast.error('Seleziona prima una materia')}
                  className={cn(
                    'border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer group',
                    selectedSubject ? 'border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-500/5' : 'border-zinc-900 opacity-50 cursor-not-allowed'
                  )}
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.doc" onChange={handleFileSelect} disabled={!selectedSubject} />
                  <div className="h-16 w-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="text-emerald-400" size={28} />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">Seleziona un file</h3>
                  <p className="text-sm text-zinc-500">PDF o DOCX fino a 20MB</p>
                </div>
              </>
            ) : (
              <div className="space-y-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Loader2 className="text-emerald-400 animate-spin" size={20} />
                    <span className="text-sm font-medium text-zinc-300">{processingStep}</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2 bg-zinc-900" />
                <p className="text-xs text-zinc-600 text-center">Gemini sta leggendo il tuo documento...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {loadingNotes ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="text-emerald-400 animate-spin" size={32} />
        </div>
      ) : notes.length === 0 ? (
        <EmptyState icon={FileText} title="Nessun appunto presente" description="Carica il tuo primo documento per iniziare l'analisi con Gemini AI." actionLabel="Carica ora" onAction={() => setIsAddOpen(true)} />
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            I tuoi Materiali
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] uppercase tracking-wider">{notes.length} File</span>
          </h2>
          <NotesTable notes={notes} onRowClick={setSelectedNote} onDelete={deleteNote} />
        </div>
      )}

      {selectedNote && <NoteDetailView note={selectedNote} allNotes={notes} onClose={() => setSelectedNote(null)} onShowPricing={() => window.dispatchEvent(new CustomEvent("show-pricing"))} />}
    </div>
  );
}
