"use client";

import { MessageSquare } from "lucide-react";

import { cn } from "@/lib/utils";

interface RightPanelProps {
  className?: string;
}

export default function RightPanel({ className }: RightPanelProps) {
  return (
    <aside
      className={cn(
        "flex h-full w-full shrink-0 flex-col border-l border-border/80 bg-sidebar lg:w-[360px]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/80 px-4 py-3">
        <MessageSquare className="size-4 text-rust" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          AI Assistant
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Assistant responses will appear here. This panel is reserved for
              architectural reasoning and codebase questions.
            </p>
          </div>

          <div className="space-y-2">
            <div className="ml-6 max-w-[85%] rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">
                Placeholder message bubble
              </p>
            </div>
            <div className="mr-6 max-w-[85%] self-end rounded-lg border border-border bg-card px-3 py-2">
              <p className="text-[11px] text-foreground/80">
                Placeholder user prompt
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card px-3 py-2.5">
          <p className="text-xs text-muted-foreground/60">Ask anything...</p>
        </div>
      </div>
    </aside>
  );
}
