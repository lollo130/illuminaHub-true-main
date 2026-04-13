import { FileText, MessageSquare, Share2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export function ActivityFeed() {
  const [notes] = useLocalStorage<any[]>('illuminahub_notes', []);
  
  // Filtriamo solo le attività reali (es. caricamento note)
  const activities = notes.slice(0, 5).map(note => ({
    type: 'note',
    title: `Documento elaborato: ${note.title}`,
    time: note.date,
    icon: FileText,
    color: 'text-emerald-400'
  }));

  return (
    <Card className="bg-zinc-900 border-zinc-800 flex flex-col h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-medium text-zinc-400">Attività Recenti</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Info size={24} className="text-zinc-700 mb-2" />
            <p className="text-xs text-zinc-600">Nessuna attività recente.<br/>Inizia a caricare materiali per vedere i log.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {activities.map((activity, i) => (
              <div key={i} className="flex gap-3 group">
                <div className={`h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center ${activity.color}`}>
                  <activity.icon size={14} />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-xs text-zinc-300 font-medium leading-relaxed">
                    {activity.title}
                  </p>
                  <span className="text-[10px] text-zinc-600 font-medium mt-0.5">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
