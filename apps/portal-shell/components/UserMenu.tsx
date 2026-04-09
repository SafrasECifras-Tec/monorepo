"use client";

import { useState, useRef, useEffect } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

interface UserMenuProps {
  user: User;
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  const initials = user.email
    ? user.email.slice(0, 2).toUpperCase()
    : "??";
  const picture = (user.user_metadata?.avatar_url as string | undefined) || "";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  };

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-2">
      {/* Popup panel */}
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-border transition-all duration-200 origin-bottom-left",
          "bg-popover shadow-float",
          open
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-1 pointer-events-none"
        )}
        style={{ minWidth: "220px" }}
      >
        {/* Email row */}
        <div className="px-2 py-1.5 border-b border-border/50">
          <p className="text-[11px] text-muted-foreground truncate px-1">{user.email}</p>
        </div>

        {/* Actions */}
        <div className="p-1.5 space-y-0.5">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium text-destructive hover:bg-destructive/10 transition-colors text-left"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
      </div>

      {/* Avatar trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "h-11 w-11 rounded-2xl flex items-center justify-center shrink-0",
          "bg-popover border border-border shadow-float",
          "hover:bg-accent transition-all duration-150",
          open && "ring-2 ring-primary/30 ring-offset-2"
        )}
        title={user.email ?? "Usuário"}
      >
        {picture ? (
          <img src={picture} alt={user.email ?? ""} className="h-7 w-7 rounded-lg object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary">{initials}</span>
          </div>
        )}
      </button>
    </div>
  );
}
