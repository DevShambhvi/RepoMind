"use client";

import {
  Command,
  Menu,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Search,
  Sun,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/store";

interface TopbarProps {
  isRightPanelOpen: boolean;
  isDark: boolean;
  onToggleSidebar: () => void;
  onToggleRightPanel: () => void;
  onToggleTheme: () => void;
  onOpenSearch: () => void;
  onOpenIngest: () => void;
}

export default function Topbar({
  isRightPanelOpen,
  isDark,
  onToggleSidebar,
  onToggleRightPanel,
  onToggleTheme,
  onOpenSearch,
  onOpenIngest,
}: TopbarProps) {
  const { activeRepo, setActiveRepo, backendOnline } = useWorkspace();

  // Extract "owner/repo" from full URL for display
  const repoDisplayName = activeRepo
    ? activeRepo.replace(/https?:\/\/github\.com\//, "").replace(/\.git$/, "")
    : "";

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border/80 bg-card/65 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-3 sm:gap-6">
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="size-4" />
        </Button>

        <div className="flex items-center gap-2">
          <span className="rounded bg-primary px-2 py-0.5 font-serif text-lg font-bold tracking-tight text-primary-foreground">
            RM
          </span>
          <span className="hidden font-serif text-[17px] font-normal tracking-tight text-foreground/90 sm:inline">
            RepoMind
          </span>
        </div>

        <span className="hidden h-4 w-px bg-border/80 sm:block" />

        <div className="hidden items-center gap-2 sm:flex">
          {/* Backend status indicator */}
          <div
            className={cn(
              "size-2 rounded-full transition-colors",
              backendOnline ? "bg-green-500" : "bg-muted-foreground/40",
            )}
            title={backendOnline ? "Backend connected" : "Backend offline"}
          />
          {repoDisplayName ? (
            <div className="flex items-center gap-1.5 bg-muted/40 hover:bg-muted/70 px-2 py-1 rounded-md transition-colors border border-border/40">
              <span className="truncate font-mono text-xs font-medium text-foreground/80 max-w-[200px]">
                {repoDisplayName}
              </span>
              <button
                onClick={() => setActiveRepo("")}
                title="Disconnect repository"
                className="text-muted-foreground hover:text-red-500 transition-colors p-0.5 rounded"
              >
                <X className="size-3" />
              </button>
            </div>
          ) : (
            <span className="font-mono text-xs text-muted-foreground/60 italic">
              No repo connected
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Connect Repo Button */}
        <Button
          variant="outline"
          size="sm"
          className="hidden h-8 gap-1.5 text-xs sm:flex"
          onClick={onOpenIngest}
        >
          <Plus className="size-3.5" />
          <span>Connect Repo</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="hidden h-8 max-w-[280px] flex-1 justify-start gap-2.5 text-muted-foreground md:flex lg:max-w-[320px]"
          aria-label="Search workspace"
          onClick={onOpenSearch}
        >
          <Search className="size-3.5 shrink-0" />
          <span className="truncate text-xs">Search files, code or docs...</span>
          <span className="ml-auto flex items-center gap-0.5 rounded border border-border/80 bg-card px-1.5 py-0.5 font-mono text-[9px]">
            <Command className="size-2" />
            <span>K</span>
          </span>
        </Button>

        <Button
          variant="outline"
          size="icon-sm"
          className="md:hidden"
          aria-label="Search workspace"
          onClick={onOpenSearch}
        >
          <Search className="size-4" />
        </Button>

        <span className="hidden h-4 w-px bg-border/80 sm:block" />

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleTheme}
          aria-label="Toggle color mode"
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleRightPanel}
          aria-label="Toggle assistant panel"
        >
          {isRightPanelOpen ? (
            <PanelRightClose className={cn("size-4", isRightPanelOpen && "text-rust")} />
          ) : (
            <PanelRightOpen className="size-4" />
          )}
        </Button>
      </div>
    </header>
  );
}
