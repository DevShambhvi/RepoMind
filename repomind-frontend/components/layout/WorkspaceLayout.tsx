"use client";

import { useEffect, useState } from "react";

import IngestModal from "@/components/workspace/IngestModal";
import SearchOverlay from "@/components/shared/SearchOverlay";
import AiAssistant from "@/components/workspace/AiAssistant";
import DependencyGraph from "@/components/workspace/DependencyGraph";
import DocumentationExplorer from "@/components/workspace/DocumentationExplorer";
import RepositoryOverview from "@/components/workspace/RepositoryOverview";
import SettingsPanel from "@/components/workspace/SettingsPanel";
import { cn } from "@/lib/utils";
import { WorkspaceProvider, useWorkspace } from "@/lib/store";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type WorkspacePanel = "overview" | "graph" | "docs" | "settings";

function WorkspaceInner() {
  const {
    isDark,
    toggleTheme,
    isIngestOpen,
    openIngest,
    closeIngest,
    activeRepo,
  } = useWorkspace();

  const [activeNavItem, setActiveNavItem] = useState<WorkspacePanel>("overview");
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      className={cn(
        "bg-grain flex h-screen flex-col overflow-hidden bg-background text-foreground",
      )}
    >
      <Topbar
        isRightPanelOpen={isRightPanelOpen}
        isDark={isDark}
        onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
        onToggleRightPanel={() => setIsRightPanelOpen((current) => !current)}
        onToggleTheme={toggleTheme}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenIngest={openIngest}
      />

      <div className="flex min-h-0 flex-1 pt-16">
        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            className="fixed inset-0 z-20 bg-foreground/10 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <Sidebar
          activeItem={activeNavItem}
          onSelectItem={(id) => {
            setActiveNavItem(id as WorkspacePanel);
            setIsSidebarOpen(false);
          }}
          className={cn(
            "fixed inset-y-16 left-0 z-30 transition-transform duration-200 lg:static lg:translate-x-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        />

        <main className="z-10 min-w-0 flex-1 overflow-y-auto bg-muted/5">
          {activeNavItem === "overview" && (
            <RepositoryOverview
              onNavigateToDocs={() => setActiveNavItem("docs")}
              onNavigateToGraph={() => setActiveNavItem("graph")}
              onOpenIngest={openIngest}
            />
          )}
          {activeNavItem === "graph" && <DependencyGraph />}
          {activeNavItem === "docs" && <DocumentationExplorer />}
          {activeNavItem === "settings" && <SettingsPanel />}
        </main>

        {isRightPanelOpen && (
          <div className="fixed inset-y-16 right-0 z-30 w-[min(360px,100vw)] shadow-lg lg:static lg:z-auto lg:shadow-none">
            <AiAssistant />
          </div>
        )}
      </div>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <IngestModal
        isOpen={isIngestOpen}
        onClose={closeIngest}
        onSuccess={() => {
          // Refresh happens automatically through hooks
        }}
      />
    </div>
  );
}

export default function WorkspaceLayout() {
  return (
    <WorkspaceProvider>
      <WorkspaceInner />
    </WorkspaceProvider>
  );
}
