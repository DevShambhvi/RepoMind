"use client";

import {
  GitBranch,
  Folder,
  FileCode,
  Clock,
  Users,
  Database,
  ArrowUpRight,
  Plus,
  Loader2,
} from "lucide-react";

import { useWorkspace } from "@/lib/store";
import { useFiles, useCollectionInfo } from "@/lib/hooks";

interface RepositoryOverviewProps {
  onNavigateToDocs: () => void;
  onNavigateToGraph: () => void;
  onOpenIngest: () => void;
}

export default function RepositoryOverview({
  onNavigateToDocs,
  onNavigateToGraph,
  onOpenIngest,
}: RepositoryOverviewProps) {
  const { activeRepo, backendOnline } = useWorkspace();
  const { files, totalChunks, loading: filesLoading } = useFiles(activeRepo);
  const { info, loading: infoLoading } = useCollectionInfo();

  const repoDisplayName = activeRepo
    ? activeRepo.replace(/https?:\/\/github\.com\//, "").replace(/\.git$/, "")
    : "repomind-workspace";

  // Derive top-level folders from indexed files
  const folderMap = new Map<string, { count: number; desc: string }>();
  for (const file of files) {
    const parts = file.file_path.split("/");
    const topDir = parts.length > 1 ? parts[0] + "/" : "(root)";
    const existing = folderMap.get(topDir);
    if (existing) {
      existing.count++;
    } else {
      folderMap.set(topDir, { count: 1, desc: file.file_path });
    }
  }
  const folders = Array.from(folderMap.entries())
    .map(([name, data]) => ({
      name,
      files: `${data.count} files`,
      desc:
        data.count === 1
          ? data.desc
          : `${data.count} indexed files in this directory`,
      status: "Indexed",
    }))
    .slice(0, 8);

  const isLoading = filesLoading || infoLoading;

  // Empty / no-repo state
  if (!activeRepo) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 px-8 text-center space-y-6">
        <div className="p-4 bg-rust-light rounded-2xl">
          <Database className="size-10 text-rust" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-serif font-normal text-foreground">
            Welcome to RepoMind
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Connect a GitHub repository to begin exploring its architecture.
            RepoMind will index the codebase, generate vector embeddings, and
            enable AI-powered questions about the code.
          </p>
        </div>
        <button
          onClick={onOpenIngest}
          className="flex items-center gap-2 px-5 py-2.5 bg-rust text-primary-foreground hover:bg-rust/95 text-xs font-semibold rounded-lg transition-all shadow-sm"
        >
          <Plus className="size-4" />
          <span>Connect Repository</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-6 px-8 max-w-5xl mx-auto">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border/80 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-muted-foreground text-xs uppercase tracking-wider font-mono mb-2">
            <span>Engineering Workspace</span>
            <span>•</span>
            <div className="flex items-center gap-1 bg-rust/10 text-rust px-2 py-0.5 rounded font-medium">
              <span className="relative flex size-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rust opacity-75" />
                <span className="relative inline-flex rounded-full size-1.5 bg-rust" />
              </span>
              <span>
                {backendOnline ? "Vector Database Synchronized" : "Backend Offline"}
              </span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-normal tracking-tight text-foreground">
            {repoDisplayName}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-mono text-foreground/80 shadow-sm">
            <GitBranch className="size-3.5 text-muted-foreground" />
            <span>main</span>
          </div>
          <button
            onClick={onNavigateToGraph}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all shadow-sm"
          >
            <span>Explore Graph</span>
            <ArrowUpRight className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            icon: <FileCode className="size-4 text-rust" />,
            label: "Repository Files",
            value: isLoading ? "..." : `${files.length} files`,
            detail: isLoading
              ? "Loading..."
              : `${files.reduce((sum, f) => sum + f.total_lines, 0).toLocaleString()} Total LOC`,
          },
          {
            icon: <Database className="size-4 text-rust" />,
            label: "Vector Index",
            value: isLoading
              ? "..."
              : `${info?.points_count?.toLocaleString() ?? 0} vectors`,
            detail: isLoading
              ? "Loading..."
              : `${totalChunks} chunks indexed`,
          },
          {
            icon: <Users className="size-4 text-rust" />,
            label: "Collection Status",
            value: info?.status === "green" ? "Healthy" : info?.status ?? "—",
            detail: `Collection: ${info?.name ?? "git_rag"}`,
          },
          {
            icon: <Clock className="size-4 text-rust" />,
            label: "Top Directories",
            value: `${folderMap.size} dirs`,
            detail: `Across ${files.length} indexed files`,
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-card border border-border/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-rust-light rounded-lg">{item.icon}</div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
                {item.label}
              </span>
            </div>
            <p className="text-2xl font-serif text-foreground font-normal">
              {item.value}
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1">{item.detail}</p>
          </div>
        ))}
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Directories Navigation (Span 2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-normal text-foreground">
              Code Structure
            </h2>
            <span className="text-xs font-mono text-muted-foreground">
              {files.length} files indexed
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">Loading file index...</span>
            </div>
          ) : folders.length === 0 ? (
            <div className="border border-border rounded-xl bg-card p-8 text-center text-muted-foreground">
              <p className="text-sm">No files indexed yet.</p>
              <p className="text-xs mt-1">
                The ingestion may still be in progress, or no matching files were found.
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
              <div className="grid grid-cols-12 px-4 py-2.5 bg-muted/20 border-b border-border/80 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                <div className="col-span-5">Name</div>
                <div className="col-span-5">Scope / Focus</div>
                <div className="col-span-2 text-right">Items</div>
              </div>

              <div className="divide-y divide-border/60">
                {folders.map((folder, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 px-4 py-3.5 text-xs items-center hover:bg-accent/40 transition-colors cursor-pointer"
                  >
                    <div className="col-span-5 flex items-center gap-2">
                      <Folder className="size-4 text-rust/70" />
                      <span className="font-mono font-medium text-foreground hover:underline">
                        {folder.name}
                      </span>
                    </div>
                    <div className="col-span-5 text-muted-foreground truncate">
                      {folder.desc}
                    </div>
                    <div className="col-span-2 text-right text-muted-foreground font-mono">
                      {folder.files}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Guide Trigger */}
          <div className="border border-border/80 rounded-xl bg-rust-light/30 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-serif font-medium text-rust">
                Need help understanding design principles?
              </h4>
              <p className="text-xs text-muted-foreground max-w-lg">
                Read the design guidelines for sizing proportions, fonts layout,
                and editorial visuals of the workspace.
              </p>
            </div>
            <button
              onClick={onNavigateToDocs}
              className="px-3.5 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-all whitespace-nowrap"
            >
              Open Guide
            </button>
          </div>
        </div>

        {/* Sidebar — File list (Span 1) */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-serif font-normal text-foreground">
              Recent Files
            </h2>

            <div className="relative border-l border-border pl-4 space-y-4 py-2">
              {files.slice(0, 6).map((file, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-[21px] top-1.5 size-2.5 rounded-full border border-border bg-card group-hover:bg-rust transition-colors" />
                  <div className="text-xs space-y-1">
                    <span className="font-mono text-rust font-medium">
                      {file.file_path.split("/").pop()}
                    </span>
                    <p className="text-muted-foreground text-[11px] truncate">
                      {file.file_path}
                    </p>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {file.chunks_count} chunks · {file.total_lines} lines
                    </div>
                  </div>
                </div>
              ))}
              {files.length === 0 && !isLoading && (
                <p className="text-xs text-muted-foreground/60 italic">No files indexed</p>
              )}
            </div>
          </div>

          {/* Language distribution visual widget */}
          <div className="border border-border rounded-xl p-5 bg-card space-y-4 shadow-sm">
            <h3 className="text-sm font-serif font-medium text-foreground">
              File Types
            </h3>

            {(() => {
              // Compute extension distribution from real files
              const extCounts = new Map<string, number>();
              for (const f of files) {
                const dot = f.file_path.lastIndexOf(".");
                const ext = dot !== -1 ? f.file_path.slice(dot) : "other";
                extCounts.set(ext, (extCounts.get(ext) ?? 0) + 1);
              }
              const total = files.length || 1;
              const sorted = Array.from(extCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4);

              const colors = ["bg-rust", "bg-primary", "bg-muted-foreground/50", "bg-accent-foreground/40"];

              return (
                <div className="space-y-3.5">
                  <div className="h-2 rounded-full overflow-hidden flex bg-muted">
                    {sorted.map(([ext, count], i) => (
                      <div
                        key={ext}
                        className={`${colors[i]} h-full`}
                        style={{ width: `${(count / total) * 100}%` }}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {sorted.map(([ext, count], i) => (
                      <div key={ext}>
                        <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
                          <span className={`size-1.5 rounded-full ${colors[i]}`} />
                          <span>{ext}</span>
                        </div>
                        <span className="font-medium font-serif ml-3">
                          {((count / total) * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
