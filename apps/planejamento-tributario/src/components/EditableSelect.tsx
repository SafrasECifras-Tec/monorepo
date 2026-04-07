import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface EditableSelectProps {
  value: string;
  options: { label: string; value: string }[];
  onSave: (value: string) => void;
  variant?: "badge" | "text";
  badgeVariant?: "default" | "secondary" | "outline" | "destructive";
  className?: string;
  disabled?: boolean;
}

export default function EditableSelect({ value, options, onSave, variant = "text", badgeVariant, className = "", disabled }: EditableSelectProps) {
  return (
    <Select value={value} onValueChange={onSave} disabled={disabled}>
      <SelectTrigger className={`h-7 px-1 py-0 text-xs border-0 bg-transparent shadow-none hover:bg-accent/30 min-w-[60px] ${className}`}>
        {variant === "badge" ? (
          <Badge variant={badgeVariant || "default"} className="text-[10px]">{value}</Badge>
        ) : (
          <SelectValue>{value}</SelectValue>
        )}
      </SelectTrigger>
      <SelectContent className="bg-popover z-50">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
