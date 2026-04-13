import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
  plan: 'free' | 'pro' | 'max';
  credits_remaining: number;
  credits_reset_date: string;
  stripe_subscription_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  useCredit: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        // Reset crediti se è un nuovo giorno
        const today = new Date().toISOString().split('T')[0];
        if (data.credits_reset_date !== today && data.plan !== 'max') {
          const defaultCredits = data.plan === 'pro' ? 20 : 3;
          await supabase
            .from('profiles')
            .update({ credits_remaining: defaultCredits, credits_reset_date: today })
            .eq('id', userId);
          data.credits_remaining = defaultCredits;
          data.credits_reset_date = today;
        }
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
    }
  };

  const useCredit = async (): Promise<boolean> => {
    if (!user || !profile) return false;
    if (profile.plan === 'max') return true; // illimitati
    if (profile.credits_remaining <= 0) return false;

    const { error } = await supabase
      .from('profiles')
      .update({ credits_remaining: profile.credits_remaining - 1 })
      .eq('id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, credits_remaining: prev.credits_remaining - 1 } : null);
      return true;
    }
    return false;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, refreshProfile, signOut, useCredit }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
