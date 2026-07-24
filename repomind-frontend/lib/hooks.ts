"use client";

/**
 * Custom hooks for data fetching and polling.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type { CollectionInfo, FileInfo, IngestStatus, RepoInfo } from "@/lib/api";
import {
  getCollectionInfo,
  getIngestStatus,
  listFiles,
  listRepos,
} from "@/lib/api";

// ── useRepos ─────────────────────────────────────────────

export function useRepos() {
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listRepos();
      setRepos(data.repos);
    } catch {
      setRepos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { repos, loading, refresh };
}

// ── useFiles ─────────────────────────────────────────────

export function useFiles(repoUrl: string) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!repoUrl) {
      setFiles([]);
      setTotalChunks(0);
      return;
    }
    setLoading(true);
    try {
      const data = await listFiles(repoUrl);
      setFiles(data.files);
      setTotalChunks(data.total_chunks);
    } catch {
      setFiles([]);
      setTotalChunks(0);
    } finally {
      setLoading(false);
    }
  }, [repoUrl]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { files, totalChunks, loading, refresh };
}

// ── useCollectionInfo ────────────────────────────────────

export function useCollectionInfo() {
  const [info, setInfo] = useState<CollectionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCollectionInfo();
      setInfo(data);
    } catch {
      setInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { info, loading, refresh };
}

// ── useIngestPoll ────────────────────────────────────────

/**
 * Polls an ingestion task until it completes or fails.
 * Returns the latest status and a `start(taskId)` function.
 */
export function useIngestPoll() {
  const [status, setStatus] = useState<IngestStatus | null>(null);
  const [polling, setPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPolling(false);
  }, []);

  const start = useCallback(
    (taskId: string) => {
      stop();
      setPolling(true);
      setStatus({ task_id: taskId, status: "pending", detail: null, result: null });

      intervalRef.current = setInterval(async () => {
        try {
          const s = await getIngestStatus(taskId);
          setStatus(s);
          if (s.status === "completed" || s.status === "failed") {
            stop();
          }
        } catch {
          stop();
        }
      }, 2000);
    },
    [stop],
  );

  // Cleanup on unmount
  useEffect(() => stop, [stop]);

  return { status, polling, start, stop };
}
