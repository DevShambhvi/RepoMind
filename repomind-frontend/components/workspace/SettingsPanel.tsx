"use client";

import { useState } from "react";
import {
  Settings,
  Sliders,
  Database,
  Eye,
  ShieldAlert,
  Cpu,
  Check,
  Loader2,
} from "lucide-react";

import { deleteCollection, getCollectionInfo } from "@/lib/api";
import { useWorkspace } from "@/lib/store";
import { useCollectionInfo } from "@/lib/hooks";

export default function SettingsPanel() {
  const { activeRepo, setActiveRepo } = useWorkspace();
  const { info, loading: infoLoading, refresh: refreshInfo } = useCollectionInfo();

  const [activeTab, setActiveTab] = useState<
    "general" | "ai" | "indexing" | "appearance"
  >("general");

  // Settings States
  const [projectName, setProjectName] = useState(
    activeRepo
      ? activeRepo.replace(/https?:\/\/github\.com\//, "").replace(/\.git$/, "")
      : "repomind-workspace",
  );
  const [aiModel, setAiModel] = useState("gemini-2.0-flash");
  const [contextTokens, setContextTokens] = useState(64);
  const [autoIndex, setAutoIndex] = useState(true);
  const [excludeDirs, setExcludeDirs] = useState(
    "node_modules, .next, .git, dist, __pycache__, .venv",
  );
  const [paperGrain, setPaperGrain] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState("");

  const handleDeleteCollection = async () => {
    if (!confirm("Are you sure? This will delete ALL indexed vectors.")) return;
    setIsDeleting(true);
    setDeleteMsg("");
    try {
      const res = await deleteCollection();
      setActiveRepo("");
      setDeleteMsg(`✓ ${res.message}`);
      refreshInfo();
    } catch (err) {
      setDeleteMsg(
        `✗ Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-card rounded-xl border border-border overflow-hidden shadow-sm bg-grain">
      {/* Settings Navigation Sidebar */}
      <div className="w-full md:w-[240px] border-b md:border-b-0 md:border-r border-border p-4 bg-muted/15 space-y-4">
        <div>
          <h2 className="text-[13.5px] font-serif font-semibold uppercase tracking-wider flex items-center gap-2 text-foreground">
            <Settings className="size-4 text-rust" />
            System Settings
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Configure your workspace environment.
          </p>
        </div>

        <div className="space-y-0.5">
          {[
            { id: "general", label: "General Config", icon: <Settings className="size-3.5" /> },
            { id: "ai", label: "AI Cognitive Model", icon: <Cpu className="size-3.5" /> },
            { id: "indexing", label: "Repository Index", icon: <Database className="size-3.5" /> },
            { id: "appearance", label: "Physical Interface", icon: <Eye className="size-3.5" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(
                    tab.id as "general" | "ai" | "indexing" | "appearance",
                  )
                }
                className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left text-xs transition-all ${
                  isActive
                    ? "bg-accent text-rust border-l-2 border-rust pl-1.5"
                    : "hover:bg-muted/40 text-foreground/80 pl-2.5"
                }`}
              >
                {tab.icon}
                <span className="font-medium font-sans">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-2xl">
        {activeTab === "general" && (
          <div className="space-y-6">
            <div className="border-b border-border/80 pb-3">
              <h3 className="text-base font-serif font-medium text-foreground">
                General Workspace Configuration
              </h3>
              <p className="text-xs text-muted-foreground">
                General metadata and directories mapping settings.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Workspace Project Name
                </label>
                <input
                  type="text"
                  className="w-full bg-card border border-border rounded-lg p-2 text-xs focus:ring-2 focus:ring-rust/35 outline-none font-mono"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Active Repository
                </label>
                <input
                  type="text"
                  className="w-full bg-card border border-border rounded-lg p-2 text-xs text-muted-foreground select-none outline-none font-mono bg-muted/30"
                  value={activeRepo || "No repository connected"}
                  readOnly
                />
                <span className="text-[10px] text-muted-foreground/60 font-mono block">
                  Connected via the ingestion pipeline.
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 border border-border bg-muted/20 rounded-xl">
                <div className="space-y-1 pr-4">
                  <h4 className="text-xs font-serif font-semibold text-foreground">
                    Background Synchronization
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Automatically index code changes on file save.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoIndex(!autoIndex)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoIndex ? "bg-rust" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block size-4 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out ${
                      autoIndex ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="space-y-6">
            <div className="border-b border-border/80 pb-3">
              <h3 className="text-base font-serif font-medium text-foreground">
                AI Cognitive Engine Configuration
              </h3>
              <p className="text-xs text-muted-foreground">
                Adjust semantic cognitive models and memory vectors.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider block">
                  Active Reasoning Model
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      id: "gemini-2.0-flash",
                      name: "Gemini 2.0 Flash",
                      speed: "Recommended",
                    },
                    {
                      id: "gemini-2.5-pro",
                      name: "Gemini 2.5 Pro",
                      speed: "High Reasoning",
                    },
                  ].map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setAiModel(model.id)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        aiModel === model.id
                          ? "border-rust bg-rust-light/35 text-foreground"
                          : "border-border hover:bg-muted/30 text-foreground/80"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-medium font-sans">
                          {model.name}
                        </span>
                        {aiModel === model.id && (
                          <Check className="size-3 text-rust shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 font-mono mt-2 block">
                        {model.speed}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="uppercase tracking-wider">
                    Context Window Size
                  </span>
                  <span className="font-semibold text-foreground">
                    {contextTokens}k tokens
                  </span>
                </div>
                <input
                  type="range"
                  min="32"
                  max="128"
                  step="16"
                  className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-rust"
                  value={contextTokens}
                  onChange={(e) => setContextTokens(Number(e.target.value))}
                />
                <span className="text-[10px] text-muted-foreground/60 block leading-normal">
                  Higher token allocation allows processing larger dependency
                  contexts, but consumes more local memory cache vectors.
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "indexing" && (
          <div className="space-y-6">
            <div className="border-b border-border/80 pb-3">
              <h3 className="text-base font-serif font-medium text-foreground">
                Codebase Indexing Settings
              </h3>
              <p className="text-xs text-muted-foreground">
                Specify ignore guidelines and directory scan constraints.
              </p>
            </div>

            <div className="space-y-4">
              {/* Collection Stats */}
              {info && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="border border-border rounded-lg p-3 bg-muted/10">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">
                      Points
                    </div>
                    <span className="text-lg font-serif font-medium text-foreground">
                      {info.points_count.toLocaleString()}
                    </span>
                  </div>
                  <div className="border border-border rounded-lg p-3 bg-muted/10">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">
                      Vectors
                    </div>
                    <span className="text-lg font-serif font-medium text-foreground">
                      {info.vectors_count.toLocaleString()}
                    </span>
                  </div>
                  <div className="border border-border rounded-lg p-3 bg-muted/10">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">
                      Status
                    </div>
                    <span className="text-lg font-serif font-medium text-foreground capitalize">
                      {info.status}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Ignored Glob Directories
                </label>
                <textarea
                  className="w-full bg-card border border-border rounded-lg p-2 text-xs focus:ring-2 focus:ring-rust/35 outline-none font-mono min-h-[90px] leading-relaxed"
                  value={excludeDirs}
                  onChange={(e) => setExcludeDirs(e.target.value)}
                />
                <span className="text-[10px] text-muted-foreground/60 font-mono block">
                  Comma-separated glob syntax for folder ignoring patterns.
                </span>
              </div>

              <div className="p-4 border border-border/80 bg-muted/15 rounded-xl flex items-start gap-3">
                <ShieldAlert className="size-4 text-rust shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-serif font-semibold text-foreground">
                    Reset Indexed Vector Storage Cache
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Re-triggers parsing cycle for the entire project. This
                    action purges all existing vector embeddings from Qdrant.
                  </p>
                  {deleteMsg && (
                    <p
                      className={`text-[11px] font-mono mt-1 ${
                        deleteMsg.startsWith("✓")
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {deleteMsg}
                    </p>
                  )}
                  <button
                    onClick={handleDeleteCollection}
                    disabled={isDeleting}
                    className="mt-2.5 px-3 py-1.5 text-[11px] font-medium bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isDeleting && (
                      <Loader2 className="size-3 animate-spin" />
                    )}
                    {isDeleting ? "Deleting..." : "Clear Vector Store"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "appearance" && (
          <div className="space-y-6">
            <div className="border-b border-border/80 pb-3">
              <h3 className="text-base font-serif font-medium text-foreground">
                Physical Interface Options
              </h3>
              <p className="text-xs text-muted-foreground">
                Personalize layout parameters and visual density configurations.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 border border-border bg-muted/20 rounded-xl">
                <div className="space-y-1 pr-4">
                  <h4 className="text-xs font-serif font-semibold text-foreground">
                    Subtle Paper Grain Texture
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Toggles the SVG turbulence noise layout pattern.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPaperGrain(!paperGrain)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    paperGrain ? "bg-rust" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block size-4 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out ${
                      paperGrain ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 border border-border/80 bg-muted/20 rounded-xl">
                <div className="space-y-1 pr-4">
                  <h4 className="text-xs font-serif font-semibold text-foreground">
                    Workspace Contrast Mode
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Adjust text rendering contrast for serif headlines.
                  </p>
                </div>
                <select className="bg-card border border-border rounded px-2.5 py-1 text-xs outline-none">
                  <option>Standard Editorial (Muted)</option>
                  <option>High Contrast</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
