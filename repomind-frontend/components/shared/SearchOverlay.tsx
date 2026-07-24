"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  Search,
  FileCode,
  Terminal,
  BookOpen,
  Command,
  CornerDownLeft,
  Sliders,
  X,
  Loader2,
} from "lucide-react";

import { queryRAG, listFiles } from "@/lib/api";
import { useWorkspace } from "@/lib/store";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: "file" | "doc" | "action" | "semantic";
  meta?: string;
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const { activeRepo } = useWorkspace();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"all" | "files" | "docs" | "actions">("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [backendResults, setBackendResults] = useState<SearchResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
      // Load file results on open if we have a repo
      if (activeRepo) {
        fetchFileResults();
      }
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setBackendResults([]);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, activeRepo]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Fetch file list from backend
  const fetchFileResults = useCallback(async () => {
    if (!activeRepo) return;
    try {
      const data = await listFiles(activeRepo);
      const fileResults: SearchResult[] = data.files.slice(0, 20).map((f, i) => ({
        id: `file-${i}`,
        title: f.file_path,
        subtitle: `${f.chunks_count} chunks · ${f.total_lines} lines indexed`,
        type: "file" as const,
        meta: f.file_path.split(".").pop()?.toUpperCase() ?? "FILE",
      }));
      setBackendResults(fileResults);
    } catch {
      // Silently fail — fall back to static results
    }
  }, [activeRepo]);

  // Debounced semantic search
  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      setSelectedIndex(0);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      // Only do semantic search if query is long enough and in all/actions mode
      if (value.length >= 4 && activeRepo && (mode === "all" || mode === "actions")) {
        debounceRef.current = setTimeout(async () => {
          setLoading(true);
          try {
            const data = await queryRAG(value, activeRepo, 3);
            const semanticResults: SearchResult[] = data.sources.map(
              (src, i) => ({
                id: `semantic-${i}`,
                title: src.file_path,
                subtitle: src.content.slice(0, 100) + "...",
                type: "semantic" as const,
                meta: `Score: ${(src.score * 100).toFixed(0)}%`,
              }),
            );
            setBackendResults((prev) => {
              // Replace semantic results, keep file results
              const existing = prev.filter((r) => r.type !== "semantic");
              return [...semanticResults, ...existing];
            });
          } catch {
            // fail silently
          } finally {
            setLoading(false);
          }
        }, 600);
      }
    },
    [activeRepo, mode],
  );

  if (!isOpen) return null;

  // Static docs and actions results
  const staticResults: SearchResult[] = [
    {
      id: "doc-1",
      title: "CREATIVE_DIRECTION.md",
      subtitle: "Product design principles, colors and tone guidelines",
      type: "doc",
      meta: "Docs",
    },
    {
      id: "doc-2",
      title: "Architecture overview & layout strategies",
      subtitle: "Comprehensive layout guidelines",
      type: "doc",
      meta: "Docs",
    },
    {
      id: "action-1",
      title: "Ask AI about this workspace",
      subtitle: "Send a question to the AI assistant panel",
      type: "action",
      meta: "AI Agent",
    },
    {
      id: "action-2",
      title: "Reset repository indexing vector cache",
      subtitle: "Rebuild local code database indexing files",
      type: "action",
      meta: "Admin",
    },
  ];

  const allResults = [...backendResults, ...staticResults];

  const filteredResults = allResults.filter((item) => {
    // Mode filter
    if (mode === "files" && item.type !== "file") return false;
    if (mode === "docs" && item.type !== "doc") return false;
    if (mode === "actions" && item.type !== "action" && item.type !== "semantic")
      return false;

    // Search query filter
    if (!query) return true;
    const lowerQuery = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(lowerQuery) ||
      item.subtitle.toLowerCase().includes(lowerQuery)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredResults.length ? (prev + 1) % filteredResults.length : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredResults.length
          ? (prev - 1 + filteredResults.length) % filteredResults.length
          : 0,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 dark:bg-background/90 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Main Palette */}
      <div
        ref={containerRef}
        className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl bg-grain flex flex-col max-h-[60vh] transition-all duration-300 transform scale-100"
      >
        {/* Search Input Area */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/80">
          <Search className="size-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/60 text-[15px]"
            placeholder={
              activeRepo
                ? "Search files, code, or ask semantic questions..."
                : "Connect a repo to search indexed files..."
            }
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {loading && <Loader2 className="size-4 animate-spin text-rust" />}
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setBackendResults((prev) =>
                  prev.filter((r) => r.type !== "semantic"),
                );
              }}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-border bg-muted/60 text-[10px] font-mono text-muted-foreground select-none">
            <Command className="size-2.5" />
            <span>K</span>
          </div>
        </div>

        {/* Filter Quick Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border/40 bg-muted/20 text-xs">
          <span className="text-muted-foreground mr-1.5">Filter:</span>
          {(
            [
              { id: "all", label: "All" },
              { id: "files", label: "Files" },
              { id: "docs", label: "Documentation" },
              { id: "actions", label: "Commands & AI" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setMode(tab.id);
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                mode === tab.id
                  ? "bg-primary text-primary-foreground font-mono"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredResults.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-sm">
                {query
                  ? `No results found for \u201c${query}\u201d`
                  : activeRepo
                  ? "Start typing to search..."
                  : "Connect a repository to search indexed files."}
              </p>
              <p className="text-xs mt-1 text-muted-foreground/60">
                {query
                  ? "Try searching for workspace paths, settings, or markdown documents."
                  : ""}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredResults.map((result, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={result.id}
                    onClick={() => onClose()}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? "bg-accent text-foreground border-l-[3px] border-rust pl-[9px]"
                        : "hover:bg-muted/40 text-foreground/80 pl-3 border-l-[3px] border-transparent"
                    }`}
                  >
                    {/* Icon mapping */}
                    <div
                      className={`p-1.5 rounded-md mt-0.5 ${
                        isSelected
                          ? "bg-card text-rust"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {result.type === "file" && (
                        <FileCode className="size-4" />
                      )}
                      {result.type === "doc" && (
                        <BookOpen className="size-4" />
                      )}
                      {result.type === "action" && (
                        <Terminal className="size-4" />
                      )}
                      {result.type === "semantic" && (
                        <Sliders className="size-4 text-rust" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[13.5px] font-medium truncate ${
                            isSelected
                              ? "text-foreground"
                              : "text-foreground/90"
                          }`}
                        >
                          {result.title}
                        </span>
                        {result.meta && (
                          <span className="text-[10px] text-muted-foreground shrink-0 uppercase tracking-wider font-mono">
                            {result.meta}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {result.subtitle}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="self-center flex items-center gap-1 text-[10px] text-muted-foreground shrink-0 bg-card border border-border px-1.5 py-0.5 rounded font-mono">
                        <span>Select</span>
                        <CornerDownLeft className="size-2.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-muted/30 border-t border-border/80 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              Use{" "}
              <span className="font-mono bg-muted px-1 py-0.5 rounded">
                ↑↓
              </span>{" "}
              to navigate
            </span>
            <span>
              <span className="font-mono bg-muted px-1 py-0.5 rounded">
                Enter
              </span>{" "}
              to select
            </span>
          </div>
          <span>Esc to exit</span>
        </div>
      </div>
    </div>
  );
}
