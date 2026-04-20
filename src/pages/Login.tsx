import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Zap, Chrome, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Log per verificare se ci sono errori nell'URL di ritorno (es. dopo un fallimento OAuth)
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    
    if (error) {
      console.error('OAuth Error from URL:', error, errorDescription);
      toast.error(`Errore Autenticazione: ${errorDescription || error}`);
    }
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    // Definiamo l'URL di redirect. 
    // In produzione forziamo l'URL di Netlify per evitare mismatch.
    const isProd = import.meta.env.PROD;
    const redirectTo = isProd 
      ? 'https://illuminahub.netlify.app' 
      : window.location.origin;

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Detailed Login Error:', error);
      toast.error(error.message || 'Errore durante l\'accesso con Google');
    } finally {
      // Nota: setIsLoading(false) non verrà quasi mai visto se il redirect ha successo
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#09090b] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/[0.07] blur-[140px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/[0.07] blur-[140px] rounded-full" />
      <div className="absolute top-[40%] right-[20%] w-[20%] h-[20%] bg-teal-400/[0.04] blur-[100px] rounded-full" />
      
      <div className="relative z-10 w-full max-w-md p-8">
        <div className="glass border border-zinc-800/50 p-10 rounded-3xl shadow-2xl flex flex-col items-center text-center space-y-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 emerald-glow">
            <Zap size={32} className="fill-current" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-white">IlluminaHub</h1>
            <p className="text-zinc-400 text-lg">Il tuo ecosistema di studio intelligente.</p>
          </div>

          <div className="w-full space-y-4">
            <Button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-14 bg-white hover:bg-zinc-100 text-black font-bold text-lg rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  <Chrome size={24} />
                  Accedi con Google
                </>
              )}
            </Button>
            
            <p className="text-xs text-zinc-500 px-4">
              Accedendo, accetti i nostri Termini di Servizio e la Privacy Policy.
            </p>
          </div>
          
          {/* Debug info visible only in dev if needed */}
          {import.meta.env.DEV && (
            <div className="mt-4 p-2 bg-zinc-900 rounded text-[10px] text-zinc-500 font-mono break-all">
              URL: {import.meta.env.VITE_SUPABASE_URL}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
