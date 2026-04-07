"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ChevronLeft, LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { title: "Launchpad", href: "/", icon: LayoutDashboard },
];

interface SidebarProps {
  user: User;
}

export function Sidebar({ user }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  };

  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : "??";

  return (
    <aside
      className={cn(
        "flex flex-col shrink-0 border-r border-sidebar-border/60",
        "bg-sidebar transition-all duration-200",
        collapsed ? "w-[5.25rem]" : "w-[17rem]"
      )}
    >
      {/* Logo area */}
      <div
        className={cn(
          "flex items-center border-b border-sidebar-border/60",
          collapsed ? "p-3 justify-center" : "gap-3 px-5 py-5"
        )}
      >
        <div className="h-10 w-10 rounded-xl shrink-0 overflow-hidden bg-primary/5 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-safras-cifras.png"
            alt="Safras & Cifras"
            className="h-12 w-12 object-contain"
          />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-sidebar-foreground leading-tight truncate">
              Safras &amp; Cifras
            </p>
            <p className="text-[11px] text-sidebar-muted truncate mt-0.5">
              Sócios do Agro
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href} className={cn(collapsed && "flex justify-center")}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 py-3 rounded-[1.25rem] transition-all duration-200",
                    "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/90",
                    isActive &&
                      "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-card",
                    collapsed ? "w-11 p-3 justify-center" : "w-full px-3.5"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      isActive ? "text-sidebar-primary-foreground" : "text-sidebar-muted"
                    )}
                  />
                  {!collapsed && (
                    <span className="text-[13px]">{item.title}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom bar: user info + actions */}
      <div
        className={cn(
          "border-t border-sidebar-border/60 flex items-center gap-2",
          collapsed ? "flex-col p-2" : "px-3 py-2"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-xl flex-1 min-w-0",
            collapsed ? "justify-center" : "px-2 py-2"
          )}
        >
          <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-primary">{initials}</span>
          </div>
          {!collapsed && (
            <span className="text-[12px] text-sidebar-foreground/70 truncate">
              {user.email}
            </span>
          )}
        </div>

        <button
          onClick={handleSignOut}
          title="Sair"
          className="p-2 rounded-full text-sidebar-muted hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
        >
          <LogOut className="h-4 w-4" />
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expandir" : "Recolher"}
          className="p-2 rounded-full text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors shrink-0"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </div>
    </aside>
  );
}
