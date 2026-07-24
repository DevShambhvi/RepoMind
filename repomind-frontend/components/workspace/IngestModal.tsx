"use client";

/**
 * IngestModal – Modal dialog for ingesting a GitHub repository.
 *
 * Provides:
 * - GitHub URL input
 * - Branch selection
 * - File extensions checkboxes
 * - Progress polling with visual feedback
 */

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  GitBranch,
  Loader2,
  X,
  Sparkles,
  Database,
} from "lucide-react";

import { ingestRepo } from "@/lib/api";
import { useIngestPoll } from "@/lib/hooks";
import { useWorkspace } from "@/lib/store";

interface IngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (repoUrl: string) => void;
}

const DEFAULT_EXTENSIONS = [
  { ext: ".py", label: "Python", checked: true },
  { ext: ".js", label: "JavaScript", checked: true },
  { ext: ".ts", label: "TypeScript", checked: true },
  { ext: ".tsx", label: "TSX", checked: true },
  { ext: ".jsx", label: "JSX", checked: true },
  { ext: ".go", label: "Go", checked: true },
  { ext: ".md", label: "Markdown", checked: true },
  { ext: ".txt", label: "Text", checked: false },
];

export default function IngestModal({ isOpen, onClose, onSuccess }: IngestModalProps) {
  const { setActiveRepo } = useWorkspace();
  const { status, polling, start } = useIngestPoll();

  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [extensions, setExtensions] = useState(DEFAULT_EXTENSIONS);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleExt = (ext: string) => {
    setExtensions((prev) =>
      prev.map((e) => (e.ext === ext ? { ...e, checked: !e.checked } : e)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = repoUrl.trim();
    if (!trimmed) {
      setError("Please enter a repository URL.");
      return;
    }
    if (!trimmed.includes("github.com/")) {
      setError("Please enter a valid GitHub URL (e.g. https://github.com/owner/repo).");
      return;
    }

    const selectedExts = extensions.filter((e) => e.checked).map((e) => e.ext);
    if (selectedExts.length === 0) {
      setError("Please select at least one file extension.");
      return;
    }

    setSubmitting(true);
    try {
      const accepted = await ingestRepo(trimmed, branch, selectedExts);
      start(accepted.task_id);
      setActiveRepo(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start ingestion.");
    } finally {
      setSubmitting(false);
    }
  };

  const isComplete = status?.status === "completed";
  const isFailed = status?.status === "failed";
  const isProcessing = polling || submitting;

  const handleDone = () => {
    if (isComplete) {
      onSuccess?.(repoUrl.trim());
    }
    // Reset state
    setRepoUrl("");
    setBranch("main");
    setExtensions(DEFAULT_EXTENSIONS);
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 dark:bg-background/90 backdrop-blur-md"
        onClick={!isProcessing ? handleDone : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl bg-grain overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/80">
          <div className="flex items-center gap-2">
            <Database className="size-4 text-rust" />
            <h2 className="text-[14px] font-serif font-semibold text-foreground">
              Connect Repository
            </h2>
          </div>
          <button
            onClick={handleDone}
            disabled={isProcessing && !isComplete && !isFailed}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-5">
          {/* Success state */}
          {isComplete && (
            <div className="flex flex-col items-center text-center py-4 space-y-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle className="size-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-base font-serif font-medium text-foreground">
                  Repository Ingested
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {status?.result?.files_processed} files processed,{" "}
                  {status?.result?.chunks_stored} chunks stored in vector database.
                </p>
              </div>
              <button
                onClick={handleDone}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-all"
              >
                Open Workspace
              </button>
            </div>
          )}

          {/* Failed state */}
          {isFailed && (
            <div className="flex flex-col items-center text-center py-4 space-y-3">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertCircle className="size-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-serif font-medium text-foreground">
                  Ingestion Failed
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  {status?.detail ?? "An unknown error occurred. Check the backend logs."}
                </p>
              </div>
              <button
                onClick={() => {
                  setError("");
                  onClose();
                }}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-all"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Processing state */}
          {polling && !isComplete && !isFailed && (
            <div className="flex flex-col items-center text-center py-6 space-y-4">
              <Loader2 className="size-8 text-rust animate-spin" />
              <div>
                <h3 className="text-sm font-serif font-medium text-foreground">
                  {status?.status === "pending" ? "Queued for processing..." : "Indexing repository..."}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Fetching files, generating embeddings, and storing in vector database.
                </p>
              </div>
              {/* Progress bar */}
              <div className="w-full max-w-xs">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-rust rounded-full transition-all duration-700 ease-out"
                    style={{
                      width:
                        status?.status === "pending"
                          ? "15%"
                          : status?.status === "processing"
                          ? "65%"
                          : "100%",
                    }}
                  />
                </div>
                <p className="text-[10px] font-mono text-muted-foreground mt-1 capitalize">
                  {status?.status ?? "initializing"}
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          {!polling && !isComplete && !isFailed && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Repo URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  GitHub Repository URL
                </label>
                <input
                  type="text"
                  className="w-full bg-card border border-border rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-rust/35 outline-none font-mono placeholder:text-muted-foreground/50"
                  placeholder="https://github.com/owner/repository"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Branch */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Branch
                </label>
                <div className="flex items-center gap-2">
                  <GitBranch className="size-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    className="flex-1 bg-card border border-border rounded-lg p-2 text-xs focus:ring-2 focus:ring-rust/35 outline-none font-mono"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  />
                </div>
              </div>

              {/* Extensions */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  File Extensions
                </label>
                <div className="flex flex-wrap gap-2">
                  {extensions.map((ext) => (
                    <button
                      key={ext.ext}
                      type="button"
                      onClick={() => toggleExt(ext.ext)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all border ${
                        ext.checked
                          ? "bg-rust-light border-rust/30 text-rust font-medium"
                          : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      {ext.ext}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs text-red-700 dark:text-red-300">
                  <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium rounded-lg transition-all shadow-sm disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                <span>{submitting ? "Starting..." : "Begin Ingestion"}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
