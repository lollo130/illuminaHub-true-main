import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/10 animate-in fade-in zoom-in duration-500">
      <div className="h-16 w-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-6 border border-zinc-800">
        <Icon size={32} className="text-zinc-600" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-zinc-500 max-w-xs mb-8 text-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && (
        <Button 
          onClick={onAction}
          className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400 font-bold px-8"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
