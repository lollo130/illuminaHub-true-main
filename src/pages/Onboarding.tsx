import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || nickname.length < 3) return;

    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            nickname: nickname.toLowerCase(),
            avatar_url: user.user_metadata.avatar_url,
            plan: 'free',
            credits_remaining: 3,
            credits_reset_date: today,
          }
        ]);

      if (error) {
        if (error.code === '23505') {
          toast.error('Questo nickname è già stato preso!');
        } else {
          toast.error('Errore durante il salvataggio.');
        }
        return;
      }

      await refreshProfile();
      toast.success('Benvenuto su IlluminaHub!');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-md p-8">
        <div className="glass border border-zinc-800/50 p-10 rounded-3xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Zap size={20} className="fill-current" />
            </div>
            <h2 className="text-2xl font-bold text-white">Ultimo passaggio</h2>
          </div>

          <p className="text-zinc-400">
            Scegli un nickname unico per identificarti nella community di IlluminaHub.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-zinc-300">Nickname</Label>
              <Input
                id="nickname"
                placeholder="es. alex_dev"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="bg-zinc-900/50 border-zinc-800 h-12 text-lg focus:ring-emerald-500"
                required
                minLength={3}
                maxLength={20}
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting || nickname.length < 3}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-lg rounded-xl"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Inizia a studiare'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
