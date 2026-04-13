import { useState } from 'react';
import { Check, Zap, Crown, Infinity, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0€',
    period: '/mese',
    credits: '3 crediti/giorno',
    icon: Zap,
    color: 'text-zinc-400',
    border: 'border-zinc-800',
    features: [
      'Analisi PDF base',
      'Riassunto automatico',
      'Domande di studio',
      'Concetti chiave',
      'Salvataggio su cloud',
    ],
    locked: [
      'Grafici e tabelle',
      'Quiz interattivi',
      'Piano di studio AI',
      'Chat con documento',
      'Esporta in PDF',
    ],
    priceId: null,
    buttonText: 'Piano attuale',
    disabled: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '4,99€',
    period: '/mese',
    credits: '20 crediti/giorno',
    icon: Crown,
    color: 'text-emerald-400',
    border: 'border-emerald-500/50',
    badge: 'Più popolare',
    features: [
      'Tutto del piano Free',
      'Grafici e tabelle interattivi',
      'Quiz di studio generati da AI',
      'Piano di ripasso automatico',
      'Analisi approfondita del documento',
      'Priorità nella coda AI',
    ],
    locked: [
      'Chat con documento',
      'Confronta più PDF',
      'Esporta in PDF',
      'Analisi gap programma',
    ],
    priceId: 'price_1TL5kC3XBPI9jVOiw92s8tXO',
    buttonText: 'Passa a Pro',
    disabled: false,
  },
  {
    id: 'max',
    name: 'Max',
    price: '9,99€',
    period: '/mese',
    credits: 'Crediti illimitati',
    icon: Infinity,
    color: 'text-purple-400',
    border: 'border-purple-500/50',
    features: [
      'Tutto del piano Pro',
      'Crediti illimitati',
      'Chat diretta con il documento',
      'Confronta più PDF',
      'Esporta appunti in PDF',
      'Analisi gap rispetto al programma',
      'Supporto prioritario',
    ],
    locked: [],
    priceId: 'price_1TL5kl3XBPI9jVOiYKE1UbS3',
    buttonText: 'Passa a Max',
    disabled: false,
  },
];

interface PricingProps {
  onClose: () => void;
}

export default function Pricing({ onClose }: PricingProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (priceId: string, planId: string) => {
    if (!user) { toast.error('Devi essere loggato'); return; }
    setLoading(planId);
    try {
      const res = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId: user.id, userEmail: user.email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error);
    } catch (err: any) {
      toast.error('Errore: ' + err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Scegli il tuo piano</h2>
          <p className="text-zinc-400">Potenzia il tuo studio con l'intelligenza artificiale</p>
          <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white text-2xl">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = profile?.plan === plan.id || (plan.id === 'free' && !profile?.plan);

            return (
              <div key={plan.id} className={`relative rounded-2xl border ${plan.border} bg-zinc-950 p-6 flex flex-col ${plan.id === 'pro' ? 'ring-1 ring-emerald-500/30' : ''}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-emerald-950 text-xs font-bold">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <div className={`flex items-center gap-2 mb-3`}>
                    <Icon size={20} className={plan.color} />
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-zinc-500 text-sm">{plan.period}</span>
                  </div>
                  <p className={`text-xs mt-1 font-medium ${plan.color}`}>{plan.credits}</p>
                </div>

                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                      <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                  {plan.locked.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 line-through">
                      <Check size={14} className="text-zinc-700 shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => plan.priceId && handleUpgrade(plan.priceId, plan.id)}
                  disabled={plan.disabled || isCurrent || loading === plan.id}
                  className={`w-full font-bold ${plan.id === 'pro' ? 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400' : plan.id === 'max' ? 'bg-purple-500 text-white hover:bg-purple-400' : 'bg-zinc-800 text-zinc-400 cursor-default'}`}
                >
                  {loading === plan.id ? <Loader2 size={16} className="animate-spin" /> : isCurrent ? 'Piano attuale' : plan.buttonText}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
