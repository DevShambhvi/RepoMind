"use client";

/**
 * WorkspaceProvider – Global context for workspace-wide state.
 *
 * Provides:
 * - Active repo URL (persisted in localStorage)
 * - Backend connectivity status
 * - Dark mode toggle (persisted in localStorage)
 * - Ingest modal open/close
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { healthCheck, listRepos } from "@/lib/api";

// ── Types ────────────────────────────────────────────────

interface WorkspaceState {
  /** The currently active repo URL (or empty string). */
  activeRepo: string;
  setActiveRepo: (url: string) => void;

  /** Whether the backend at NEXT_PUBLIC_API_URL is reachable. */
  backendOnline: boolean;

  /** Dark mode preference. */
  isDark: boolean;
  toggleTheme: () => void;

  /** Ingest modal visibility. */
  isIngestOpen: boolean;
  openIngest: () => void;
  closeIngest: () => void;
}

const WorkspaceContext = createContext<WorkspaceState | null>(null);

// ── localStorage helpers ─────────────────────────────────

function readLS(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key: string, value: string) {
  try {
    if (!value) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {
    /* ignore in SSR or private mode */
  }
}

// ── Provider ─────────────────────────────────────────────

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [activeRepo, setActiveRepoRaw] = useState("");
  const [backendOnline, setBackendOnline] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isIngestOpen, setIsIngestOpen] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const storedRepo = readLS("rm_active_repo", "");
    if (storedRepo) setActiveRepoRaw(storedRepo);

    const storedDark = readLS("rm_dark_mode", "false");
    if (storedDark === "true") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Check backend health and validate active repo against ingested repos
  useEffect(() => {
    healthCheck()
      .then(async () => {
        setBackendOnline(true);
        try {
          const data = await listRepos();
          const stored = readLS("rm_active_repo", "");
          if (data.repos.length === 0) {
            setActiveRepoRaw("");
            writeLS("rm_active_repo", "");
          } else if (stored && !data.repos.some((r) => r.repo_url === stored)) {
            const fallback = data.repos[0]?.repo_url || "";
            setActiveRepoRaw(fallback);
            writeLS("rm_active_repo", fallback);
          }
        } catch {
          /* ignore error */
        }
      })
      .catch(() => setBackendOnline(false));
  }, []);

  const setActiveRepo = useCallback((url: string) => {
    setActiveRepoRaw(url);
    writeLS("rm_active_repo", url);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      writeLS("rm_dark_mode", String(next));
      return next;
    });
  }, []);

  const openIngest = useCallback(() => setIsIngestOpen(true), []);
  const closeIngest = useCallback(() => setIsIngestOpen(false), []);

  return (
    <WorkspaceContext.Provider
      value={{
        activeRepo,
        setActiveRepo,
        backendOnline,
        isDark,
        toggleTheme,
        isIngestOpen,
        openIngest,
        closeIngest,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────

export function useWorkspace(): WorkspaceState {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return ctx;
}
