import { useEffect, useRef, useState } from 'react';
import { X, FileText, BrainCircuit, Zap, BookOpen, ClipboardList, BarChart2, MessageSquare, GitCompare, Download, Target, Lock, ChevronRight, ChevronLeft, Check, RotateCcw, Send, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const CHART_COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#3b82f6', '#ef4444', '#06b6d4', '#ec4899'];

interface NoteDetailViewProps {
  note: any;
  allNotes?: any[];
  onClose: () => void;
  onShowPricing?: () => void;
}

// ─── KaTeX ───────────────────────────────────────────────────────────────────
function useKaTeX() {
  useEffect(() => {
    if (document.querySelector('link[href*="katex"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';
    document.head.appendChild(script);
    const ar = document.createElement('script');
    ar.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js';
    document.head.appendChild(ar);
  }, []);
}

function renderKaTeX(el: HTMLElement) {
  const try_ = (n = 0) => {
    const fn = (window as any).renderMathInElement;
    if (fn) fn(el, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }, { left: '\\(', right: '\\)', display: false }, { left: '\\[', right: '\\]', display: true }], throwOnError: false });
    else if (n < 20) setTimeout(() => try_(n + 1), 300);
  };
  try_();
}

function MathBlock({ html, className = '' }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) renderKaTeX(ref.current); }, [html]);
  return <div ref={ref} className={`math-content ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

// ─── Markdown / Table helpers ─────────────────────────────────────────────────
function parseTableRow(row: string): string[] {
  const cells: string[] = [];
  let current = '';
  let i = 0;
  while (i < row.length) {
    if (row[i] === '\\' && row[i + 1] === '|') { current += '|'; i += 2; }
    else if (row[i] === '|') { cells.push(current.trim()); current = ''; i++; }
    else { current += row[i]; i++; }
  }
  if (current.trim()) cells.push(current.trim());
  return cells.filter(c => c.length > 0);
}

function convertMarkdownTable(text: string): string {
  return text.replace(/(\|.+\|\n\|[-| :]+\|\n(?:\|.+\|\n?)+)/g, (table) => {
    const rows = table.trim().split('\n');
    const cols = parseTableRow(rows[0]);
    const body = rows.slice(2).filter(r => r.trim());
    const headerHtml = `<thead><tr>${cols.map(c => `<th class="px-4 py-2 text-left text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-700 bg-zinc-900 whitespace-nowrap">${c}</th>`).join('')}</tr></thead>`;
    const bodyHtml = `<tbody>${body.map((row, i) => {
      const cells = parseTableRow(row);
      return `<tr class="${i % 2 === 0 ? 'bg-zinc-900/50' : 'bg-black/20'}">${cells.map(c => `<td class="px-4 py-2.5 text-sm text-zinc-300 border-b border-zinc-800/50">${c}</td>`).join('')}</tr>`;
    }).join('')}</tbody>`;
    return `<div class="overflow-x-auto my-4 rounded-lg border border-zinc-700"><table class="w-full text-left table-auto">${headerHtml}${bodyHtml}</table></div>`;
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function mdToHtml(text: string): string {
  // Escape raw HTML first to prevent XSS, then apply markdown transforms
  let t = escapeHtml(text);
  t = t.replace(/\*\*([^*\n]+)\n\*\*/g, '**$1** ');
  t = t.replace(/\*\*(.+?)\*\*/gs, '<strong class="text-white font-semibold">$1</strong>');
  t = t.replace(/\*(.+?)\*/gs, '<em>$1</em>');
  t = t.replace(/`([^`]+)`/g, '<code class="bg-zinc-800 text-emerald-300 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');
  t = convertMarkdownTable(t);
  t = t.split(/\n{2,}/).map(p => `<p class="mb-3 leading-relaxed">${p.replace(/\n/g, '<br/>')}</p>`).join('');
  return t;
}

// ─── Content parsers ──────────────────────────────────────────────────────────
function splitSections(content: string) {
  const cleanContent = content.replace(/<<<CHARTS>>>[\s\S]*?<<<END_CHARTS>>>/g, '').trim();
  const result: Record<string, string> = {};
  const matches = [...cleanContent.matchAll(/^##\s*\d+\.\s*(.+)$/gm)];
  matches.forEach((match, i) => {
    const key = match[1].trim().toLowerCase();
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[i + 1]?.index ?? cleanContent.length;
    result[key] = cleanContent.slice(start, end).trim();
  });
  return result;
}

function extractCharts(content: string): any[] {
  try {
    const match = content.match(/<<<CHARTS>>>([\s\S]*?)<<<END_CHARTS>>>/);
    if (!match) return [];
    return JSON.parse(match[1].trim()).charts || [];
  } catch { return []; }
}

function parseListItems(text: string): { label: string; desc: string }[] {
  return text.split('\n').filter(l => l.trim().match(/^[-*•]/)).map(line => {
    const clean = line.replace(/^[-*•]\s*/, '').replace(/\*\*/g, '').replace(/\n/g, ' ').trim();
    const colonIdx = clean.search(/:\s/);
    if (colonIdx > 0 && colonIdx < 70) return { label: clean.slice(0, colonIdx).trim(), desc: clean.slice(colonIdx + 1).trim() };
    return { label: '', desc: clean };
  }).filter(item => item.desc.length > 3);
}

function parseQA(text: string): { q: string; a: string }[] {
  const results: { q: string; a: string }[] = [];
  const blocks = text.split(/(?=\n?\s*-\s*Domanda:|(?:^|\n)Domanda\s*\d*:)/i).filter(b => b.trim());
  for (const block of blocks) {
    const qMatch = block.match(/(?:Domanda\s*\d*:?\s*)(.+?)(?=\s*Risposta:|$)/is);
    const aMatch = block.match(/Risposta:?\s*([\s\S]+)/is);
    const q = qMatch?.[1]?.replace(/\*\*/g, '').trim() ?? '';
    const a = aMatch?.[1]?.replace(/\*\*/g, '').trim() ?? '';
    if (q.length > 5) results.push({ q, a });
  }
  return results;
}

// ─── Chart widget ─────────────────────────────────────────────────────────────
function ChartWidget({ chart }: { chart: any }) {
  if (!chart?.data?.length) return null;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
      <div>
        <p className="text-sm font-semibold text-white">{chart.title}</p>
        {chart.description && <p className="text-xs text-zinc-500 mt-0.5">{chart.description}</p>}
      </div>
      {chart.type === 'bar' && (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chart.data} margin={{ top: 5, right: 10, left: -20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fill: '#a1a1aa', fontSize: 10 }} domain={[0, 100]} />
            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, color: '#fff' }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chart.data.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      {chart.type === 'radar' && (
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={chart.data}>
            <PolarGrid stroke="#3f3f46" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
            <Radar dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, color: '#fff' }} />
          </RadarChart>
        </ResponsiveContainer>
      )}
      {chart.type === 'pie' && (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} labelLine={false}>
              {chart.data.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} />
            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, color: '#fff' }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Plan gate ────────────────────────────────────────────────────────────────
function PlanGate({ requiredPlan, currentPlan, onShowPricing, children }: { requiredPlan: 'pro' | 'max'; currentPlan: string; onShowPricing?: () => void; children: React.ReactNode }) {
  const planOrder = { free: 0, pro: 1, max: 2 };
  const hasAccess = (planOrder[currentPlan as keyof typeof planOrder] ?? 0) >= planOrder[requiredPlan];
  if (hasAccess) return <>{children}</>;
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center px-8">
      <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        <Lock size={24} className="text-zinc-600" />
      </div>
      <div>
        <p className="text-white font-semibold">Funzionalità {requiredPlan === 'pro' ? 'Pro' : 'Max'}</p>
        <p className="text-zinc-500 text-sm mt-1">Questa funzione è disponibile dal piano {requiredPlan === 'pro' ? 'Pro (4,99€/mese)' : 'Max (9,99€/mese)'}.</p>
      </div>
      <Button onClick={onShowPricing} className={requiredPlan === 'pro' ? 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400 font-bold' : 'bg-purple-500 text-white hover:bg-purple-400 font-bold'}>
        <Zap size={16} className="mr-2" /> Passa a {requiredPlan === 'pro' ? 'Pro' : 'Max'}
      </Button>
    </div>
  );
}

// ─── FLASHCARD Tab ───────────────────────────────────────────────────────────
function FlashcardsTab({ domande, concetti }: { domande: { q: string; a: string }[]; concetti: { label: string; desc: string }[] }) {
  type Card = { front: string; back: string };
  const cards: Card[] = [
    ...domande.map(d => ({ front: d.q, back: d.a })),
    ...concetti.filter(c => c.label).map(c => ({ front: c.label, back: c.desc })),
  ];

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<boolean[]>([]);

  if (cards.length === 0) return (
    <p className="text-zinc-500 text-sm text-center py-10">Nessuna flashcard disponibile per questo documento.</p>
  );

  if (index >= cards.length) {
    const score = known.filter(Boolean).length;
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
        <div className="h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <span className="text-3xl font-bold text-emerald-400">{score}/{cards.length}</span>
        </div>
        <p className="text-white font-semibold text-xl">{score === cards.length ? 'Perfetto! 🎉' : score >= cards.length / 2 ? 'Ottimo! 👍' : 'Continua a studiare! 💪'}</p>
        <Button onClick={() => { setIndex(0); setFlipped(false); setKnown([]); }} className="bg-zinc-800 hover:bg-zinc-700 gap-2">
          <RotateCcw size={16} /> Ricomincia
        </Button>
      </div>
    );
  }

  const card = cards[index];
  return (
    <div className="space-y-6 p-2">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span className="font-mono">{index + 1} / {cards.length}</span>
        <div className="flex gap-1">
          {cards.map((_, i) => (
            <div key={i} className={`h-1.5 w-6 rounded-full ${i < index ? (known[i] ? 'bg-emerald-500' : 'bg-red-500') : i === index ? 'bg-zinc-400' : 'bg-zinc-800'}`} />
          ))}
        </div>
      </div>

      <div
        onClick={() => setFlipped(f => !f)}
        className="cursor-pointer min-h-[200px] rounded-2xl border border-zinc-800 bg-zinc-900 p-8 flex items-center justify-center text-center transition-all hover:border-emerald-500/30"
      >
        {!flipped ? (
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Domanda</p>
            <p className="text-white font-semibold text-base leading-relaxed">{card.front}</p>
            <p className="text-[10px] text-zinc-600 mt-4">Clicca per vedere la risposta</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-emerald-500/70 font-bold">Risposta</p>
            <p className="text-zinc-300 text-sm leading-relaxed">{card.back}</p>
          </div>
        )}
      </div>

      {flipped && (
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => { setKnown(k => [...k, false]); setIndex(i => i + 1); setFlipped(false); }}
            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 font-semibold gap-2">
            <X size={16} /> Non sapevo
          </Button>
          <Button onClick={() => { setKnown(k => [...k, true]); setIndex(i => i + 1); setFlipped(false); }}
            className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 font-semibold gap-2">
            <Check size={16} /> Sapevo
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── QUIZ Tab ─────────────────────────────────────────────────────────────────
function QuizTab({ domande }: { domande: { q: string; a: string }[] }) {
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);

  if (domande.length === 0) return <p className="text-zinc-500 text-sm text-center py-10">Nessuna domanda disponibile per questo documento.</p>;

  if (finished) {
    const score = correct.filter(Boolean).length;
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
        <div className="h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <span className="text-3xl font-bold text-emerald-400">{score}/{domande.length}</span>
        </div>
        <p className="text-white font-semibold text-xl">{score === domande.length ? 'Perfetto! 🎉' : score >= domande.length / 2 ? 'Buon lavoro! 👍' : 'Riprova! 💪'}</p>
        <p className="text-zinc-500 text-sm">Hai risposto correttamente a {score} domande su {domande.length}</p>
        <Button onClick={() => { setCurrent(0); setRevealed(false); setCorrect([]); setFinished(false); }} className="bg-zinc-800 hover:bg-zinc-700 gap-2">
          <RotateCcw size={16} /> Ricomincia
        </Button>
      </div>
    );
  }

  const d = domande[current];
  return (
    <div className="space-y-6 p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 font-mono">{current + 1} / {domande.length}</span>
        <div className="flex gap-1">
          {domande.map((_, i) => (
            <div key={i} className={`h-1.5 w-8 rounded-full ${i < current ? (correct[i] ? 'bg-emerald-500' : 'bg-red-500') : i === current ? 'bg-zinc-400' : 'bg-zinc-800'}`} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 min-h-[140px] flex items-center">
        <MathBlock html={`<p class="text-white font-semibold text-base leading-relaxed">${mdToHtml(d.q)}</p>`} />
      </div>

      {!revealed ? (
        <Button onClick={() => setRevealed(true)} className="w-full bg-zinc-800 hover:bg-zinc-700 font-semibold">
          Rivela risposta
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
            <p className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-wider mb-2">Risposta</p>
            <MathBlock html={`<div class="text-sm text-zinc-300 leading-relaxed">${mdToHtml(d.a)}</div>`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => {
              const newCorrect = [...correct, false];
              setCorrect(newCorrect);
              if (current + 1 >= domande.length) setFinished(true);
              else { setCurrent(c => c + 1); setRevealed(false); }
            }} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 font-semibold gap-2">
              <X size={16} /> Non sapevo
            </Button>
            <Button onClick={() => {
              const newCorrect = [...correct, true];
              setCorrect(newCorrect);
              if (current + 1 >= domande.length) setFinished(true);
              else { setCurrent(c => c + 1); setRevealed(false); }
            }} className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 font-semibold gap-2">
              <Check size={16} /> Sapevo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CHAT Tab ─────────────────────────────────────────────────────────────────
function ChatTab({ noteContent, noteTitle }: { noteContent: string; noteTitle: string }) {
  const { session } = useAuth();
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: `Ciao! Sono il tuo assistente per "${noteTitle}". Chiedimi qualsiasi cosa sul documento!` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const cleanContent = noteContent.replace(/<<<CHARTS>>>[\s\S]*?<<<END_CHARTS>>>/g, '').substring(0, 20000);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const token = session?.access_token;
      const response = await fetch('/.netlify/functions/chat-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ noteContent: cleanContent, question: userMsg }),
      });
      const data = await response.json();
      const aiText = data.answer || 'Non ho trovato una risposta nel documento.';
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Errore nella risposta. Riprova.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: 9999, behavior: 'smooth' }), 100);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ minHeight: '400px' }}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 p-2 mb-4" style={{ maxHeight: '400px' }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-emerald-500 text-emerald-950 font-medium' : 'bg-zinc-900 border border-zinc-800 text-zinc-300'}`}>
              {m.role === 'ai' ? <MathBlock html={mdToHtml(m.text)} /> : m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-2xl">
              <Loader2 size={16} className="text-emerald-400 animate-spin" />
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-auto">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Chiedi qualcosa sul documento..."
          className="bg-zinc-900 border-zinc-800 flex-1"
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim()} className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400 shrink-0">
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}

// ─── PIANO DI STUDIO Tab ──────────────────────────────────────────────────────
function PianoStudioTab({ noteContent, noteTitle }: { noteContent: string; noteTitle: string }) {
  const { session } = useAuth();
  const [examDate, setExamDate] = useState('');
  const [piano, setPiano] = useState('');
  const [loading, setLoading] = useState(false);

  const generatePiano = async () => {
    if (!examDate) { toast.error('Inserisci la data dell\'esame'); return; }
    setLoading(true);
    const daysLeft = Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) { toast.error('La data deve essere nel futuro'); setLoading(false); return; }

    const cleanContent = noteContent.replace(/<<<CHARTS>>>[\s\S]*?<<<END_CHARTS>>>/g, '').substring(0, 15000);

    try {
      const response = await fetch('/.netlify/functions/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          prompt: `Sei un esperto di pianificazione dello studio universitario. Crea un piano di studio dettagliato per il seguente documento.

DOCUMENTO: ${noteTitle}
GIORNI DISPONIBILI: ${daysLeft} giorni prima dell'esame
CONTENUTO: ${cleanContent}

Crea un piano di studio giornaliero in italiano con:
1. Divisione degli argomenti per ogni giorno
2. Tempo stimato per ciascun argomento
3. Consigli pratici per ogni sessione
4. Giorni di ripasso prima dell'esame

Formato: usa ## Giorno X - [Data] per ogni giorno, poi elenca gli argomenti con i tempi.`,
          temperature: 0.3,
          maxOutputTokens: 3000,
        }),
      });
      const data = await response.json();
      setPiano(data.result || 'Errore nella generazione.');
    } catch {
      toast.error('Errore nella generazione del piano');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-2">
      {!piano ? (
        <div className="space-y-4">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <Calendar size={16} />
              <h3 className="text-sm font-bold uppercase tracking-widest">Quando è il tuo esame?</h3>
            </div>
            <input
              type="date"
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
            <Button onClick={generatePiano} disabled={loading || !examDate} className="w-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400 font-bold gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
              {loading ? 'Generazione piano...' : 'Genera Piano di Studio'}
            </Button>
          </div>
          <p className="text-xs text-zinc-600 text-center">Gemini AI creerà un piano personalizzato basato sul contenuto del documento</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Piano di Studio Generato</p>
            <Button onClick={() => setPiano('')} variant="ghost" className="text-xs text-zinc-500 hover:text-zinc-300 gap-1">
              <RotateCcw size={12} /> Rigenera
            </Button>
          </div>
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5">
            <MathBlock html={mdToHtml(piano)} className="text-sm text-zinc-300 leading-relaxed" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CONFRONTA Tab ────────────────────────────────────────────────────────────
function ConfrontaTab({ currentNote, allNotes }: { currentNote: any; allNotes: any[] }) {
  const { session } = useAuth();
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [confronto, setConfronto] = useState('');
  const [loading, setLoading] = useState(false);

  const otherNotes = allNotes.filter(n => n.id !== currentNote.id);

  const generateConfronto = async () => {
    if (!selectedNoteId) { toast.error('Seleziona un documento da confrontare'); return; }
    const otherNote = allNotes.find(n => n.id === selectedNoteId);
    if (!otherNote) return;
    setLoading(true);

    const content1 = currentNote.content.replace(/<<<CHARTS>>>[\s\S]*?<<<END_CHARTS>>>/g, '').substring(0, 10000);
    const content2 = otherNote.content.replace(/<<<CHARTS>>>[\s\S]*?<<<END_CHARTS>>>/g, '').substring(0, 10000);

    try {
      const response = await fetch('/.netlify/functions/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          prompt: `Confronta i seguenti due documenti universitari e trova:
1. Concetti in comune tra i due documenti
2. Concetti presenti solo nel primo documento
3. Concetti presenti solo nel secondo documento
4. Come i concetti si collegano e si completano a vicenda
5. Consiglio su come studiare i due documenti insieme

DOCUMENTO 1: ${currentNote.title}
${content1}

DOCUMENTO 2: ${otherNote.title}
${content2}

Rispondi in italiano con sezioni chiare.`,
          maxOutputTokens: 3000,
        }),
      });
      const data = await response.json();
      setConfronto(data.result || 'Errore nel confronto.');
    } catch {
      toast.error('Errore nel confronto');
    } finally {
      setLoading(false);
    }
  };

  if (otherNotes.length === 0) return (
    <div className="text-center py-10 space-y-2">
      <FileText size={32} className="text-zinc-700 mx-auto" />
      <p className="text-zinc-500 text-sm">Carica almeno un altro documento per poterli confrontare.</p>
    </div>
  );

  return (
    <div className="space-y-4 p-2">
      {!confronto ? (
        <div className="space-y-4">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <GitCompare size={16} />
              <h3 className="text-sm font-bold uppercase tracking-widest">Seleziona documento da confrontare</h3>
            </div>
            <select
              value={selectedNoteId}
              onChange={e => setSelectedNoteId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="">Scegli un documento...</option>
              {otherNotes.map(n => <option key={n.id} value={n.id}>{n.title} ({n.subject})</option>)}
            </select>
            <Button onClick={generateConfronto} disabled={loading || !selectedNoteId} className="w-full bg-purple-500 text-white hover:bg-purple-400 font-bold gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <GitCompare size={16} />}
              {loading ? 'Analisi in corso...' : 'Confronta Documenti'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Analisi Comparativa</p>
            <Button onClick={() => setConfronto('')} variant="ghost" className="text-xs text-zinc-500 gap-1">
              <RotateCcw size={12} /> Nuovo confronto
            </Button>
          </div>
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5">
            <MathBlock html={mdToHtml(confronto)} className="text-sm text-zinc-300 leading-relaxed" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ESPORTA Tab ──────────────────────────────────────────────────────────────
function EsportaTab({ note, sections, domande, concetti, punti }: any) {
  const exportPDF = () => {
    const printContent = `
      <html><head>
      <title>${note.title}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #111; }
        h1 { color: #059669; border-bottom: 2px solid #059669; padding-bottom: 8px; }
        h2 { color: #374151; margin-top: 32px; }
        .badge { background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
        .qa { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 12px 0; }
        .qa .q { font-weight: bold; color: #111; }
        .qa .a { color: #374151; margin-top: 8px; border-top: 1px solid #e5e7eb; padding-top: 8px; }
        ul { padding-left: 20px; }
        li { margin: 6px 0; }
      </style>
      </head><body>
      <h1>${note.title}</h1>
      <p><span class="badge">${note.subject}</span> &nbsp; Aggiunto il ${note.date}</p>
      
      ${sections.riassunto ? `<h2>📝 Riassunto</h2><p>${sections.riassunto.replace(/\n/g, '<br>')}</p>` : ''}
      
      ${domande.length > 0 ? `<h2>❓ Domande di Studio</h2>${domande.map((d: any, i: number) => `<div class="qa"><div class="q">Domanda ${i + 1}: ${d.q}</div>${d.a ? `<div class="a">${d.a}</div>` : ''}</div>`).join('')}` : ''}
      
      ${concetti.length > 0 ? `<h2>🔑 Concetti Chiave</h2><ul>${concetti.map((c: any) => `<li><strong>${c.label ? c.label + ': ' : ''}</strong>${c.desc}</li>`).join('')}</ul>` : ''}
      
      ${punti.length > 0 ? `<h2>✅ Punti da Ricordare</h2><ul>${punti.map((p: any) => `<li><strong>${p.label ? p.label + ': ' : ''}</strong>${p.desc}</li>`).join('')}</ul>` : ''}
      
      </body></html>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(printContent);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="space-y-6 p-2">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4">
        <div className="flex items-center gap-2 text-blue-400">
          <Download size={16} />
          <h3 className="text-sm font-bold uppercase tracking-widest">Esporta Appunti</h3>
        </div>
        <p className="text-zinc-500 text-sm">Scarica i tuoi appunti come PDF formattato, pronto da stampare o condividere.</p>
        <div className="space-y-2 text-xs text-zinc-600">
          <p>✓ Riassunto completo</p>
          <p>✓ Domande di studio con risposte</p>
          <p>✓ Concetti chiave</p>
          <p>✓ Punti da ricordare</p>
        </div>
        <Button onClick={exportPDF} className="w-full bg-blue-500 text-white hover:bg-blue-400 font-bold gap-2">
          <Download size={16} /> Esporta come PDF
        </Button>
      </div>
    </div>
  );
}


// ─── ANALISI GAP Tab ──────────────────────────────────────────────────────────
function AnalisiGapTab({ noteContent, noteTitle }: { noteContent: string; noteTitle: string }) {
  const { session } = useAuth();
  const [programma, setProgramma] = useState('');
  const [analisi, setAnalisi] = useState('');
  const [loading, setLoading] = useState(false);

  const generateAnalisi = async () => {
    if (!programma.trim()) { toast.error("Incolla il programma dell'esame"); return; }
    setLoading(true);

    const cleanContent = noteContent.replace(/<<<CHARTS>>>[\s\S]*?<<<END_CHARTS>>>/g, '').substring(0, 15000);

    try {
      const response = await fetch('/.netlify/functions/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          prompt: `Sei un esperto universitario. Analizza la copertura degli appunti rispetto al programma dell'esame.

PROGRAMMA DELL'ESAME:
${programma}

APPUNTI DELLO STUDENTE (${noteTitle}):
${cleanContent}

Fornisci in italiano:

## 1. Argomenti Coperti ✅
Elenca gli argomenti del programma che sono ben coperti negli appunti.

## 2. Argomenti Parzialmente Coperti ⚠️
Argomenti presenti ma trattati in modo insufficiente, con indicazione di cosa manca.

## 3. Argomenti Mancanti ❌
Argomenti del programma completamente assenti dagli appunti.

## 4. Priorità di Studio
In base ai gap trovati, indica i 5 argomenti più urgenti da studiare, in ordine di priorità.

## 5. Valutazione Complessiva
Un voto da 0 a 10 sulla completezza degli appunti rispetto al programma, con motivazione.

Sii preciso e basati esclusivamente sui contenuti forniti.`,
          maxOutputTokens: 3000,
        }),
      });
      const data = await response.json();
      setAnalisi(data.result || 'Errore nella generazione.');
    } catch {
      toast.error('Errore nella generazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-2">
      {!analisi ? (
        <div className="space-y-4">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <Target size={16} />
              <h3 className="text-sm font-bold uppercase tracking-widest">Incolla il Programma dell'Esame</h3>
            </div>
            <p className="text-zinc-500 text-xs">Copia il programma dal sito dell'università e incollalo qui. Gemini confronterà i tuoi appunti con il programma e troverà i gap.</p>
            <textarea
              value={programma}
              onChange={e => setProgramma(e.target.value)}
              placeholder="Incolla qui il programma dell'esame..."
              rows={8}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 resize-none"
            />
            <Button onClick={generateAnalisi} disabled={loading || !programma.trim()} className="w-full bg-red-500 text-white hover:bg-red-400 font-bold gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Target size={16} />}
              {loading ? 'Analisi in corso...' : 'Analizza i Gap'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Risultati Analisi Gap</p>
            <Button onClick={() => setAnalisi('')} variant="ghost" className="text-xs text-zinc-500 gap-1">
              <RotateCcw size={12} /> Nuova analisi
            </Button>
          </div>
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5">
            <MathBlock html={mdToHtml(analisi)} className="text-sm text-zinc-300 leading-relaxed" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function NoteDetailView({ note, allNotes = [], onClose, onShowPricing }: NoteDetailViewProps) {
  useKaTeX();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('appunti');

  if (!note) return null;

  const title = note.title || 'Documento senza titolo';
  const subject = note.subject || 'Generale';
  const date = note.date || '';
  const content = note.content || '';
  const currentPlan = profile?.plan || 'free';

  const sections = splitSections(content);
  const charts = extractCharts(content);

  const summaryKey = Object.keys(sections).find(k => k.includes('riassunto'));
  const domandeKey = Object.keys(sections).find(k => k.includes('domande'));
  const concettiKey = Object.keys(sections).find(k => k.includes('concetti'));
  const puntiKey = Object.keys(sections).find(k => k.includes('punti'));
  const tabelleKey = Object.keys(sections).find(k => k.includes('schemi') || k.includes('tabelle'));

  const summaryHtml = summaryKey ? mdToHtml(sections[summaryKey]) : '';
  const domande = domandeKey ? parseQA(sections[domandeKey]) : [];
  const concetti = concettiKey ? parseListItems(sections[concettiKey]) : [];
  const punti = puntiKey ? parseListItems(sections[puntiKey]) : [];
  const tabelleHtml = tabelleKey ? mdToHtml(sections[tabelleKey]) : '';

  const tabs = [
    { id: 'appunti', label: 'Appunti', icon: FileText, plan: null },
    { id: 'flashcard', label: 'Flashcard', icon: Zap, plan: null },
    { id: 'quiz', label: 'Quiz', icon: BookOpen, plan: 'pro' },
    { id: 'piano', label: 'Piano Studio', icon: Calendar, plan: 'pro' },
    { id: 'chat', label: 'Chat', icon: MessageSquare, plan: 'pro' },
    { id: 'confronta', label: 'Confronta', icon: GitCompare, plan: 'max' },
    { id: 'gap', label: 'Analisi Gap', icon: Target, plan: 'max' },
    { id: 'esporta', label: 'Esporta PDF', icon: Download, plan: 'pro' },
  ];

  const planOrder: Record<string, number> = { free: 0, pro: 1, max: 2 };
  const hasTabAccess = (requiredPlan: string | null) => {
    if (!requiredPlan) return true;
    return (planOrder[currentPlan] ?? 0) >= (planOrder[requiredPlan] ?? 0);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[900px] bg-zinc-950 border-l border-zinc-800 z-50 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">

      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-black/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
            <FileText size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-white truncate">{title}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-400 uppercase tracking-wider">{subject}</Badge>
              {date && <span className="text-[10px] text-zinc-600">Aggiunto il {date}</span>}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white shrink-0 ml-4">
          <X size={18} />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-0 border-b border-zinc-800 shrink-0 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const accessible = hasTabAccess(tab.plan);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all whitespace-nowrap border-b-2 ${activeTab === tab.id ? 'text-white border-emerald-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
            >
              <Icon size={13} />
              {tab.label}
              {!accessible && <Lock size={10} className="text-zinc-600" />}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <ScrollArea className="flex-1">
        <div className="p-6 sm:p-8">

          {/* APPUNTI TAB */}
          {activeTab === 'appunti' && (
            <div className="space-y-10">
              {summaryHtml && (
                <section>
                  <div className="flex items-center gap-2 text-emerald-400 mb-4">
                    <BrainCircuit size={17} />
                    <h3 className="text-xs font-bold uppercase tracking-widest">Riassunto</h3>
                  </div>
                  <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/60 p-5 text-sm text-zinc-300">
                    <MathBlock html={summaryHtml} />
                  </div>
                </section>
              )}
              {charts.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 text-cyan-400 mb-4">
                    <BarChart2 size={17} />
                    <h3 className="text-xs font-bold uppercase tracking-widest">Grafici</h3>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {charts.map((chart, i) => <ChartWidget key={i} chart={chart} />)}
                  </div>
                </section>
              )}
              {tabelleHtml && (
                <section>
                  <div className="flex items-center gap-2 text-cyan-400 mb-4">
                    <FileText size={17} />
                    <h3 className="text-xs font-bold uppercase tracking-widest">Schemi e Tabelle</h3>
                  </div>
                  <MathBlock html={tabelleHtml} className="text-sm text-zinc-300" />
                </section>
              )}
              {domande.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 text-amber-400 mb-4">
                    <BookOpen size={17} />
                    <h3 className="text-xs font-bold uppercase tracking-widest">Domande di Studio</h3>
                  </div>
                  <div className="space-y-4">
                    {domande.map((d, i) => (
                      <div key={i} className="rounded-xl border border-zinc-800 overflow-hidden">
                        <div className="bg-zinc-900 px-5 py-3 border-b border-zinc-800">
                          <span className="text-[10px] font-bold text-amber-500/70 uppercase tracking-wider">Domanda {i + 1}</span>
                          <MathBlock html={`<div class="mt-1 text-sm font-semibold text-white leading-relaxed">${mdToHtml(d.q)}</div>`} />
                        </div>
                        {d.a && (
                          <div className="bg-black/20 px-5 py-3">
                            <span className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-wider">Risposta</span>
                            <MathBlock html={`<div class="mt-1 text-sm text-zinc-300 leading-relaxed">${mdToHtml(d.a)}</div>`} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {concetti.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 text-purple-400 mb-4">
                    <Zap size={17} />
                    <h3 className="text-xs font-bold uppercase tracking-widest">Concetti Chiave</h3>
                  </div>
                  <div className="grid gap-2">
                    {concetti.map((c, i) => (
                      <div key={i} className="rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-3 flex items-start gap-3">
                        <span className="text-purple-400 font-bold text-[10px] shrink-0 mt-1 font-mono">{String(i + 1).padStart(2, '0')}</span>
                        <MathBlock html={`<div class="text-sm text-zinc-300 leading-relaxed">${c.label ? `<strong class="text-white font-semibold">${c.label}:</strong> ` : ''}${mdToHtml(c.desc)}</div>`} />
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {punti.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 text-blue-400 mb-4">
                    <ClipboardList size={17} />
                    <h3 className="text-xs font-bold uppercase tracking-widest">Punti da Ricordare</h3>
                  </div>
                  <ul className="space-y-3">
                    {punti.map((p, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-emerald-400 shrink-0 mt-1 text-sm">✓</span>
                        <MathBlock html={`<div class="text-sm text-zinc-300 leading-relaxed">${p.label ? `<strong class="text-white font-semibold">${p.label}:</strong> ` : ''}${mdToHtml(p.desc)}</div>`} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {/* FLASHCARD TAB */}
          {activeTab === 'flashcard' && (
            <FlashcardsTab domande={domande} concetti={concetti} />
          )}

          {/* QUIZ TAB */}
          {activeTab === 'quiz' && (
            <PlanGate requiredPlan="pro" currentPlan={currentPlan} onShowPricing={onShowPricing}>
              <QuizTab domande={domande} />
            </PlanGate>
          )}

          {/* PIANO STUDIO TAB */}
          {activeTab === 'piano' && (
            <PlanGate requiredPlan="pro" currentPlan={currentPlan} onShowPricing={onShowPricing}>
              <PianoStudioTab noteContent={content} noteTitle={title} />
            </PlanGate>
          )}

          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <PlanGate requiredPlan="pro" currentPlan={currentPlan} onShowPricing={onShowPricing}>
              <ChatTab noteContent={content} noteTitle={title} />
            </PlanGate>
          )}

          {/* CONFRONTA TAB */}
          {activeTab === 'confronta' && (
            <PlanGate requiredPlan="max" currentPlan={currentPlan} onShowPricing={onShowPricing}>
              <ConfrontaTab currentNote={note} allNotes={allNotes} />
            </PlanGate>
          )}

          {/* GAP TAB */}
          {activeTab === 'gap' && (
            <PlanGate requiredPlan="max" currentPlan={currentPlan} onShowPricing={onShowPricing}>
              <AnalisiGapTab noteContent={content} noteTitle={title} />
            </PlanGate>
          )}

          {/* ESPORTA TAB */}
          {activeTab === 'esporta' && (
            <PlanGate requiredPlan="pro" currentPlan={currentPlan} onShowPricing={onShowPricing}>
              <EsportaTab note={note} sections={sections} domande={domande} concetti={concetti} punti={punti} />
            </PlanGate>
          )}

        </div>
      </ScrollArea>
    </div>
  );
}
