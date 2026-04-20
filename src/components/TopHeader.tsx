import { Search, Zap, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TopHeaderProps {
  onShowPricing: () => void;
  onMenuClick?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  currentView?: string;
}

const viewLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  notes: 'AI Notes Engine',
  timetable: 'Orario Lezioni',
  roadmap: 'Exam Roadmap',
  analytics: 'Grade Analytics',
};

export function TopHeader({ onShowPricing, onMenuClick, searchQuery = '', onSearchChange, currentView = 'dashboard' }: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full bg-zinc-950/95 backdrop-blur border-b border-zinc-800/50 h-14 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
        >
          <Menu size={20} />
        </Button>
        <h1 className="text-sm font-bold text-white">{viewLabels[currentView] ?? currentView}</h1>
      </div>

      <div className="flex items-center gap-3">
        {onSearchChange && (
          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors"
              size={15}
            />
            <Input
              placeholder="Cerca appunti..."
              className="bg-zinc-900/50 border-zinc-800 pl-9 pr-4 h-9 text-sm w-56 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
            />
          </div>
        )}
        <Button
          onClick={onShowPricing}
          className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400 font-semibold gap-1.5 h-9 px-4"
        >
          <Zap size={14} className="fill-current" />
          Upgrade
        </Button>
      </div>
    </header>
  );
}
