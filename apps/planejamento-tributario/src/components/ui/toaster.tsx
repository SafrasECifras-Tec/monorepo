import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isError = variant === "destructive";
        return (
          <Toast key={id} variant={variant} {...props} className="p-0 gap-0">
            <div className={cn(
              "flex w-16 shrink-0 items-center justify-center",
              isError ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
            )}>
              {isError ? (
                <XCircle className="h-7 w-7 stroke-[1.5]" />
              ) : (
                <CheckCircle2 className="h-7 w-7 stroke-[1.5]" />
              )}
            </div>
            
            <div className="flex flex-1 flex-col justify-center px-4 py-3.5">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>

            <div className="flex shrink-0 items-stretch border-l border-border/40">
              {action ? (
                action
              ) : (
                <ToastClose />
              )}
            </div>
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
