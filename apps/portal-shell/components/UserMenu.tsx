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
    <div ref={ref} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Popup panel */}
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-white/20 transition-all duration-200 origin-bottom-right",
          "bg-white/70 backdrop-blur-2xl shadow-float",
          open
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-1 pointer-events-none"
        )}
        style={{ minWidth: "220px" }}
      >
        {/* Email row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-black/5">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-white">{initials}</span>
          </div>
          <span className="text-[13px] text-foreground/80 truncate font-medium">
            {user.email}
          </span>
        </div>

        {/* Actions */}
        <div className="p-1.5">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
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
          "h-12 w-12 rounded-full flex items-center justify-center shrink-0",
          "bg-white/70 backdrop-blur-2xl border border-white/30 shadow-float",
          "hover:scale-105 active:scale-95 transition-all duration-150",
          open && "ring-2 ring-primary/40 ring-offset-2"
        )}
        title={user.email ?? "Usuário"}
      >
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
          <span className="text-[11px] font-bold text-white">{initials}</span>
        </div>
      </button>
    </div>
  );
}
