import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Zap, ChevronRight, X, AlertTriangle, CheckCircle, Info, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface TopHeaderProps {
  onShowPricing: () => void;
}

export function TopHeader({ onShowPricing }: TopHeaderProps) {
  const { profile } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Chiudi cliccando fuori
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const planColor = {
    free: 'text-zinc-400 border-zinc-700',
    pro: 'text-emerald-400 border-emerald-500/50',
    max: 'text-purple-400 border-purple-500/50',
  }[profile?.plan || 'free'];

  const planLabel = {
    free: 'Free',
    pro: 'Pro',
    max: 'Max',
  }[profile?.plan || 'free'];

  const credits = profile?.credits_remaining ?? 0;
  const maxCredits = profile?.plan === 'max' ? 50 : profile?.plan === 'pro' ? 15 : 3;
  const creditsPercent = Math.round((credits / maxCredits) * 100);

  // Genera notifiche dinamiche basate sullo stato dell'utente
  const notifiche = [];

  if (profile?.plan === 'free') {
    notifiche.push({
      id: 1,
      type: 'upgrade',
      icon: Crown,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      title: 'Passa a Pro',
      message: 'Sblocca Quiz, Chat con documenti, Piano di studio e molto altro.',
      cta: 'Upgrade',
      onClick: onShowPricing,
    });
  }

  if (profile?.plan !== 'max' && (profile?.credits_remaining ?? 0) <= 1) {
    notifiche.push({
      id: 2,
      type: 'warning',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      title: 'Crediti quasi esauriti',
      message: `Ti rimane solo ${profile?.credits_remaining ?? 0} credito oggi. I crediti si ricaricano a mezzanotte.`,
      cta: profile?.plan === 'free' ? 'Upgrade' : null,
      onClick: onShowPricing,
    });
  }

  if (profile?.plan === 'pro') {
    notifiche.push({
      id: 3,
      type: 'info',
      icon: Crown,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      title: 'Scopri il Piano Max',
      message: 'Con Max ottieni crediti illimitati, confronto PDF e analisi gap del programma.',
      cta: 'Scopri Max',
      onClick: onShowPricing,
    });
  }

  notifiche.push({
    id: 4,
    type: 'success',
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    title: 'Crediti di oggi',
    message: `Hai usato ${maxCredits - credits} crediti su ${maxCredits} oggi (${creditsPercent}%).`,
    cta: null,
    onClick: null,
  });

  notifiche.push({
    id: 5,
    type: 'info',
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    title: 'Novità IlluminaHub',
    message: 'Ora puoi esportare i tuoi appunti in PDF e chattare direttamente con i documenti!',
    cta: null,
    onClick: null,
  });

  const hasUnread = notifiche.length > 0;

  return (
    <header className="sticky top-0 z-30 w-full glass h-16 flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="text-zinc-500 hover:text-zinc-300">IlluminaHub</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight size={14} className="text-zinc-700" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-zinc-100 font-medium">Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-6 flex-1 justify-end">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" size={16} />
          <Input
            placeholder={`Cerca tra i tuoi appunti, ${profile?.nickname}...`}
            className="bg-zinc-900/50 border-zinc-800 pl-10 pr-16 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-[10px] text-zinc-500 font-mono">
            <span className="text-xs">⌘</span>K
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Badge crediti */}
          <button
            onClick={onShowPricing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all hover:opacity-80 ${planColor}`}
          >
            <Zap size={12} className="fill-current" />
            {credits}/{maxCredits} · {planLabel}
          </button>

          {/* Campanella notifiche */}
          <div className="relative" ref={ref}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotifOpen(o => !o)}
              className="relative text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
            >
              <Bell size={20} />
              {hasUnread && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-black animate-pulse" />
              )}
            </Button>

            {/* Dropdown notifiche */}
            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                  <h3 className="text-sm font-bold text-white">Notifiche</h3>
                  <button onClick={() => setNotifOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                    <X size={14} />
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifiche.map(n => {
                    const Icon = n.icon;
                    return (
                      <div key={n.id} className="p-4 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`h-8 w-8 rounded-lg ${n.bg} flex items-center justify-center shrink-0`}>
                            <Icon size={15} className={n.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white">{n.title}</p>
                            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{n.message}</p>
                            {n.cta && n.onClick && (
                              <button
                                onClick={() => { n.onClick!(); setNotifOpen(false); }}
                                className={`mt-2 text-xs font-bold ${n.color} hover:opacity-80 transition-opacity`}
                              >
                                {n.cta} →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <Button onClick={onShowPricing} className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400 font-semibold gap-2 emerald-glow">
            <Zap size={18} />
            Upgrade
          </Button>
        </div>
      </div>
    </header>
  );
}
