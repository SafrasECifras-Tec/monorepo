import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@socios/ui';
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (p: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

export default function TableSearchPagination({ search, onSearchChange, page, totalPages, totalItems, onPageChange, pageSize, onPageSizeChange }: Props) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full sm:w-52">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => { onSearchChange(e.target.value); onPageChange(1); }}
          className="h-9 rounded-full border-border/60 bg-background/80 pl-9 pr-4 text-sm shadow-soft"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span className="control-pill-muted">{totalItems} registros</span>
        {totalPages > 1 && (
          <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 p-1 shadow-soft">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="tabular-nums px-2 text-xs font-semibold text-foreground">{page}/{totalPages}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        {onPageSizeChange && pageSize !== undefined && (
          <Select
            value={String(pageSize)}
            onValueChange={(v) => { onPageSizeChange(Number(v)); onPageChange(1); }}
          >
            <SelectTrigger className="h-9 w-[88px] rounded-full border-border/60 bg-background/80 text-xs shadow-soft whitespace-nowrap">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" className="rounded-2xl">
              {PAGE_SIZE_OPTIONS.map((s) => (
                <SelectItem key={s} value={String(s)} className="text-xs whitespace-nowrap">{s} / pág.</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
