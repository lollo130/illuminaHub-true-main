import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotesTableProps {
  notes: Record<string, unknown>[];
  onRowClick: (note: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}

export function NotesTable({ notes, onRowClick, onDelete }: NotesTableProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <Table>
        <TableHeader className="bg-zinc-900/80">
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Documento</TableHead>
            <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Materia</TableHead>
            <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Data</TableHead>
            <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Stato IA</TableHead>
            <TableHead className="w-[100px] text-right px-6">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notes.map((note, i) => (
            <TableRow
              key={note.id}
              className="border-zinc-800 hover:bg-emerald-500/[0.02] group transition-colors animate-stagger-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <TableCell className="py-4" onClick={() => onRowClick(note)}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-emerald-400 transition-colors">
                    <FileText size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-200">{note.title}</span>
                    <span className="text-[10px] text-zinc-600 uppercase font-bold">{note.type} • {note.size}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell onClick={() => onRowClick(note)}>
                <Badge variant="outline" className="border-zinc-800 text-zinc-400 bg-zinc-950">
                  {note.subject}
                </Badge>
              </TableCell>
              <TableCell className="text-zinc-500 text-sm" onClick={() => onRowClick(note)}>{note.date}</TableCell>
              <TableCell onClick={() => onRowClick(note)}>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-none">
                  {note.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right px-6">
                <div className="flex items-center justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-zinc-600 hover:text-white"
                    onClick={() => onRowClick(note)}
                  >
                    <ExternalLink size={14} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-zinc-600 hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(note.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
