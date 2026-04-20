import { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Map,
  BarChart3,
  Settings,
  ChevronDown,
  Zap,
  User,
  LogOut,
  Plus,
  Check,
  UserCircle,
  Trash2,
  Save,
  GraduationCap,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface SidebarProps {
  onViewChange: (view: string) => void;
  currentView: string;
  onShowPricing: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ onViewChange, currentView, onShowPricing, mobileOpen = false, onMobileClose }: SidebarProps) {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const [workspaces, setWorkspaces] = useLocalStorage<string[]>('illuminahub_workspaces', []);
  const [activeWorkspace, setActiveWorkspace] = useLocalStorage<string>('illuminahub_active_workspace', '');
  const [isAdding, setIsAdding] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  // Modal states
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Profile editing
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Settings
  const [notifiche, setNotifiche] = useLocalStorage<boolean>('setting_notifiche', true);
  const [temaScuro, setTemaScuro] = useLocalStorage<boolean>('setting_tema_scuro', true);
  const [salvaAutomatico, setSalvaAutomatico] = useLocalStorage<boolean>('setting_salva_auto', true);

  const navItems = [
    { name: 'Dashboard', id: 'dashboard', icon: LayoutDashboard },
    { name: 'AI Notes Engine', id: 'notes', icon: BookOpen },
    { name: 'Timetable', id: 'timetable', icon: Calendar },
    { name: 'Exam Roadmap', id: 'roadmap', icon: Map },
    { name: 'Grade Analytics', id: 'analytics', icon: BarChart3 },
  ];

  const addWorkspace = () => {
    if (!newWorkspaceName.trim()) return;
    if (workspaces.includes(newWorkspaceName.trim())) {
      toast.error('Questa materia esiste già');
      return;
    }
    const updated = [...workspaces, newWorkspaceName.trim()];
    setWorkspaces(updated);
    setActiveWorkspace(newWorkspaceName.trim());
    setNewWorkspaceName('');
    setIsAdding(false);
    toast.success('Materia aggiunta con successo');
  };

  const saveProfile = async () => {
    if (!nickname.trim()) { toast.error('Il nickname non può essere vuoto'); return; }
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ nickname: nickname.trim() })
      .eq('id', user!.id);
    if (error) {
      toast.error('Errore nel salvataggio');
    } else {
      await refreshProfile();
      toast.success('Profilo aggiornato!');
      setProfileOpen(false);
    }
    setSavingProfile(false);
  };

  const deleteAllNotes = async () => {
    if (!confirm('Sei sicuro di voler eliminare TUTTE le tue note? Questa azione è irreversibile.')) return;
    const { error } = await supabase.from('notes').delete().eq('user_id', user!.id);
    if (error) toast.error('Errore nella cancellazione');
    else { toast.success('Tutte le note eliminate'); window.location.reload(); }
  };

  const sidebarContent = () => (
    <aside className="flex h-full w-64 flex-col bg-zinc-950 border-r border-zinc-800/80">
        {/* Workspace Switcher */}
        <div className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-3 bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-900 hover:text-white transition-all overflow-hidden">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-emerald-500/20 text-emerald-400">
                    <Zap size={14} className="fill-current" />
                  </div>
                  <span className="font-semibold text-sm truncate text-left">
                    {activeWorkspace || 'Seleziona Materia'}
                  </span>
                </div>
                <ChevronDown size={14} className="text-zinc-500 shrink-0 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-zinc-950 border-zinc-800 text-zinc-300 p-2" align="start">
              <DropdownMenuLabel className="text-xs text-zinc-500 uppercase tracking-widest px-2 py-1">Le tue Materie</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <ScrollArea className={cn('pr-2', workspaces.length > 5 ? 'h-48' : 'h-auto')}>
                {workspaces.length === 0 && !isAdding && (
                  <div className="px-2 py-4 text-center text-xs text-zinc-600 italic">Nessuna materia aggiunta</div>
                )}
                {workspaces.map((ws) => (
                  <DropdownMenuItem
                    key={ws}
                    onClick={() => setActiveWorkspace(ws)}
                    className={cn('focus:bg-emerald-500/10 focus:text-emerald-400 cursor-pointer flex justify-between items-center gap-2', activeWorkspace === ws && 'bg-emerald-500/5 text-emerald-400')}
                  >
                    <span className="truncate flex-1">{ws}</span>
                    {activeWorkspace === ws && <Check size={12} className="shrink-0" />}
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
              <DropdownMenuSeparator className="bg-zinc-800" />
              {isAdding ? (
                <div className="p-2 flex gap-2">
                  <Input autoFocus value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addWorkspace()} placeholder="Nome materia..." className="h-8 text-xs bg-zinc-900 border-zinc-800" />
                  <Button size="icon" className="h-8 w-8 bg-emerald-500 hover:bg-emerald-400 shrink-0" onClick={addWorkspace}>
                    <Plus size={14} className="text-emerald-950" />
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" className="w-full justify-start gap-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/5 h-9" onClick={(e) => { e.preventDefault(); setIsAdding(true); }}>
                  <Plus size={14} /> Aggiungi Materia
                </Button>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1 py-2">
            {navItems.map((item) => (
              <Button key={item.id} variant="ghost" onClick={() => onViewChange(item.id)}
                aria-current={currentView === item.id ? 'page' : undefined}
                className={cn('w-full justify-start gap-3 px-3 font-medium transition-all duration-200',
                  currentView === item.id ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-300' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                )}>
                <item.icon size={18} /> {item.name}
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Credits Bar */}
        {profile && (
          <div className="px-4 pb-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Crediti oggi</span>
                <span className="text-[10px] font-bold text-emerald-400">
                  {profile.credits_remaining} / {profile.plan === 'max' ? 50 : profile.plan === 'pro' ? 15 : 3}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (profile.credits_remaining / (profile.plan === 'max' ? 50 : profile.plan === 'pro' ? 15 : 3)) * 100)}%`
                  }}
                />
              </div>
              {profile.credits_remaining === 0 && (
                <button
                  onClick={onShowPricing}
                  className="w-full text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold text-center transition-colors"
                >
                  Upgrade per più crediti →
                </button>
              )}
            </div>
          </div>
        )}

        {/* User Profile */}
        <div className="p-4 border-t border-zinc-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between p-2 rounded-lg bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-900 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-8 w-8 border border-zinc-700 shrink-0">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="bg-zinc-800 text-zinc-400">
                      {profile?.nickname?.substring(0, 2).toUpperCase() || <User size={14} />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-xs font-semibold text-zinc-100 truncate w-full text-left">@{profile?.nickname || 'utente'}</span>
                    <span className="text-[10px] text-zinc-500 capitalize">Piano {profile?.plan || 'Free'}</span>
                  </div>
                </div>
                <Settings size={14} className="text-zinc-500 group-hover:text-zinc-300 shrink-0 ml-2" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-zinc-950 border-zinc-800 text-zinc-300" align="end" side="top">
              <DropdownMenuLabel>Il mio Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem className="focus:bg-zinc-900 cursor-pointer gap-2" onClick={() => { setNickname(profile?.nickname || ''); setProfileOpen(true); }}>
                <UserCircle size={14} /> Profilo
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-zinc-900 cursor-pointer gap-2" onClick={() => setSettingsOpen(true)}>
                <Settings size={14} /> Impostazioni
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem onClick={() => signOut()} className="focus:bg-red-500/10 focus:text-red-400 text-red-500 cursor-pointer gap-2">
                <LogOut size={14} /> Esci
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
  );

  const modals = (
    <>
      {/* MODAL PROFILO */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserCircle size={18} className="text-emerald-400" /> Il tuo Profilo</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-2">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-zinc-700">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xl">
                  {profile?.nickname?.substring(0, 2).toUpperCase() || '??'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-white">@{profile?.nickname}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{user?.email}</p>
                <span className="mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">Piano {profile?.plan || 'Free'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nickname</label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Il tuo nickname..."
                className="bg-zinc-900 border-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email</label>
              <Input value={user?.email || ''} disabled className="bg-zinc-900 border-zinc-800 opacity-50" />
              <p className="text-[10px] text-zinc-600">L'email è collegata al tuo account Google e non può essere modificata.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Materie attive</label>
              <div className="flex flex-wrap gap-2">
                {workspaces.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic">Nessuna materia aggiunta</p>
                ) : workspaces.map(ws => (
                  <span key={ws} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
                    <GraduationCap size={10} className="text-emerald-400" /> {ws}
                    <button onClick={() => setWorkspaces(workspaces.filter(w => w !== ws))} className="text-zinc-600 hover:text-red-400 transition-colors ml-1">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <Button onClick={saveProfile} disabled={savingProfile} className="w-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400 font-bold">
              <Save size={16} className="mr-2" />
              {savingProfile ? 'Salvataggio...' : 'Salva Modifiche'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL IMPOSTAZIONI */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Settings size={18} className="text-emerald-400" /> Impostazioni</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-2">

            <div className="space-y-3">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Preferenze</p>

              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <div>
                  <p className="text-sm font-medium text-white">Notifiche</p>
                  <p className="text-xs text-zinc-500">Ricevi notifiche sulle scadenze esami</p>
                </div>
                <Switch checked={notifiche} onCheckedChange={setNotifiche} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <div>
                  <p className="text-sm font-medium text-white">Tema scuro</p>
                  <p className="text-xs text-zinc-500">Sempre attivo per proteggere gli occhi</p>
                </div>
                <Switch checked={temaScuro} onCheckedChange={setTemaScuro} disabled />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <div>
                  <p className="text-sm font-medium text-white">Salvataggio automatico</p>
                  <p className="text-xs text-zinc-500">Salva le note automaticamente su Supabase</p>
                </div>
                <Switch checked={salvaAutomatico} onCheckedChange={setSalvaAutomatico} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Account</p>

              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                <p className="text-xs text-zinc-400">Email account</p>
                <p className="text-sm font-medium text-white">{user?.email}</p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                <p className="text-xs text-zinc-400">Piano attivo</p>
                <p className="text-sm font-medium text-emerald-400 capitalize">Piano {profile?.plan || 'Free'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-red-500/70 uppercase tracking-wider">Zona Pericolosa</p>
              <Button
                variant="ghost"
                onClick={deleteAllNotes}
                className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-2"
              >
                <Trash2 size={16} />
                Elimina tutte le note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 z-40 h-screen w-64">
        {sidebarContent()}
      </div>

      {/* Mobile: overlay + slide-in */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onMobileClose}
          />
          <div className="fixed left-0 top-0 z-50 h-screen w-64 lg:hidden animate-in slide-in-from-left duration-300">
            {sidebarContent()}
          </div>
        </>
      )}

      {modals}
    </>
  );
}
