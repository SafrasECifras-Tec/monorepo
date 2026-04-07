import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, RefreshCw, Save } from "lucide-react";

interface ConflictWarningDialogProps {
  open: boolean;
  onReload: () => void;
  onOverwrite: () => void;
  onCancel: () => void;
}

export default function ConflictWarningDialog({
  open, onReload, onOverwrite, onCancel,
}: ConflictWarningDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Dados alterados por outro usuário
          </AlertDialogTitle>
          <AlertDialogDescription>
            Outro consultor salvou alterações nesta fazenda enquanto você editava.
            Você pode recarregar os dados mais recentes (perdendo suas alterações locais)
            ou sobrescrever com as suas alterações.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onReload}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Recarregar
          </AlertDialogAction>
          <AlertDialogAction
            onClick={onOverwrite}
            className="bg-amber-600 text-white hover:bg-amber-700 gap-2"
          >
            <Save className="h-4 w-4" /> Sobrescrever
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
