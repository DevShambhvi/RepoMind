"use client";

import { BookOpen, Grid, Network, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/store";
import { useFiles } from "@/lib/hooks";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: Grid },
  { id: "graph", label: "Dependency Graph", icon: Network },
  { id: "docs", label: "Documentation", icon: BookOpen },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

interface SidebarProps {
  activeItem: string;
  onSelectItem: (id: string) => void;
  className?: string;
}

export default function Sidebar({
  activeItem,
  onSelectItem,
  className,
}: SidebarProps) {
  const { activeRepo } = useWorkspace();
  const { files } = useFiles(activeRepo);

  // Extract top-level directories from indexed files as "scopes"
  const scopes = Array.from(
    new Set(
      files
        .map((f) => {
          const parts = f.file_path.split("/");
          return parts.length > 1 ? parts[0] : null;
        })
        .filter(Boolean) as string[],
    ),
  ).slice(0, 6); // Show max 6

  return (
    <aside
      className={cn(
        "flex h-full w-[240px] shrink-0 flex-col justify-between border-r border-border/80 bg-sidebar select-none",
        className,
      )}
    >
      <div className="space-y-6 p-4">
        <div className="space-y-1">
          <span className="px-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Navigation
          </span>
          <div className="space-y-0.5 pt-1.5">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = activeItem === id;

              return (
                <Button
                  key={id}
                  variant="ghost"
                  onClick={() => onSelectItem(id)}
                  className={cn(
                    "h-auto w-full justify-start gap-2.5 rounded-lg p-2 text-left text-xs font-medium",
                    isActive
                      ? "border-l-2 border-rust bg-accent pl-1.5 text-rust hover:bg-accent hover:text-rust"
                      : "pl-2 text-foreground/80 hover:bg-sidebar-accent",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <span className="px-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Workspace Scopes
          </span>
          <div className="space-y-1.5 px-2 pt-1 font-mono text-xs text-muted-foreground">
            {scopes.length > 0 ? (
              scopes.map((scope, index) => (
                <div
                  key={scope}
                  className="flex cursor-default items-center gap-2"
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      index === 0 ? "bg-rust" : "bg-muted-foreground/60",
                    )}
                  />
                  <span>{scope}/</span>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-muted-foreground/50 italic">
                No repo indexed yet
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/60 bg-muted/10 p-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-rust/20 bg-rust-light font-serif text-xs font-semibold text-rust">
            D
          </div>
          <div className="min-w-0 truncate">
            <p className="truncate text-xs font-medium text-foreground">
              Developer Profile
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              Local Dev Mode
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
          v1.0
        </span>
      </div>
    </aside>
  );
}
