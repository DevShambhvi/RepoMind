"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, FileText, Loader2 } from "lucide-react";

import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import { queryRAG } from "@/lib/api";
import { useWorkspace } from "@/lib/store";

interface Message {
  role: "user" | "assistant";
  content: string;
  references?: string[];
}

export default function AiAssistant() {
  const { activeRepo, backendOnline } = useWorkspace();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello. I'm ready to answer questions about your codebase. Connect and ingest a repository to get started, then ask me anything about its architecture, dependencies, or code patterns.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setIsLoading(true);

    try {
      if (!activeRepo) {
        throw new Error("no-repo");
      }

      const data = await queryRAG(userMsg, activeRepo, 5);
      const refs = Array.from(
        new Set(data.sources?.map((s) => s.file_path) || []),
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          references: refs,
        },
      ]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "";

      let fallbackContent: string;
      if (errMsg === "no-repo") {
        fallbackContent =
          "No repository is connected yet. Please click **Connect Repo** in the top bar to ingest a repository first, then I can answer questions about its code.";
      } else if (!backendOnline) {
        fallbackContent =
          "The backend server appears to be offline. Please make sure the FastAPI server is running at `localhost:8000` and Qdrant is available at `localhost:6333`.";
      } else {
        fallbackContent = `I encountered an error processing your question. This might mean the repository hasn't been ingested yet, or the backend hit an issue.\n\n**Error:** ${errMsg || "Unknown error"}`;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: fallbackContent,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    "Explain the project architecture",
    "What are the main dependencies?",
    "How is routing handled?",
  ];

  return (
    <div className="h-full flex flex-col justify-between bg-card text-foreground flex-1 relative bg-grain">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-border/80 flex items-center justify-between bg-card/65 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-rust" />
          <h2 className="text-[13.5px] font-serif font-semibold uppercase tracking-wider">
            AI Assistant
          </h2>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded ${
            activeRepo
              ? "text-rust bg-rust-light"
              : "text-muted-foreground bg-muted"
          }`}
        >
          {activeRepo ? "Index Active" : "No Index"}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`space-y-2.5 max-w-[90%] ${
              msg.role === "user" ? "ml-auto" : "mr-auto"
            }`}
          >
            {/* Sender header */}
            <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground select-none">
              <span className="font-semibold uppercase">
                {msg.role === "user" ? "Developer" : "Assistant"}
              </span>
              <span>•</span>
              <span>Just now</span>
            </div>

            {/* Bubble */}
            <div
              className={`p-4 rounded-xl text-[13px] leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/40 border border-border/80 text-foreground/90"
              }`}
            >
              {msg.role === "assistant" ? (
                <MarkdownRenderer content={msg.content} />
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}

              {/* References widget */}
              {msg.references && msg.references.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-border/40 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                  <span>Sources:</span>
                  {Array.from(new Set(msg.references)).map((ref, i) => (
                    <span
                      key={`${ref}-${i}`}
                      className="bg-card px-1.5 py-0.5 rounded border border-border/60 hover:text-rust transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <FileText className="size-2.5 text-rust/80" />
                      {ref.split("/").pop()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="mr-auto space-y-2.5 max-w-[90%]">
            <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground select-none">
              <span className="font-semibold uppercase">Assistant</span>
              <span>•</span>
              <span>Thinking...</span>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/80 flex items-center gap-2">
              <Loader2 className="size-4 text-rust animate-spin" />
              <span className="text-xs text-muted-foreground">
                Searching codebase and generating response...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input / Quick Actions Footer */}
      <div className="p-4 border-t border-border/80 bg-card/65 backdrop-blur-sm z-10 space-y-3">
        {/* Quick Prompts */}
        <div className="flex flex-wrap gap-1.5">
          {quickActions.map((act) => (
            <button
              key={act}
              onClick={() => setInput(act)}
              className="text-[10px] font-mono px-2 py-1 rounded bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-border/40"
            >
              {act}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="relative flex items-center border border-border rounded-xl bg-card overflow-hidden pl-3 pr-1.5 py-1.5 focus-within:ring-2 focus-within:ring-rust/35 shadow-sm"
        >
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground/60 pr-10"
            placeholder={
              activeRepo
                ? "Ask AI anything about the codebase..."
                : "Connect a repo first to ask questions..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="p-2 bg-primary text-primary-foreground hover:bg-primary/95 transition-all rounded-lg disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
          </button>
        </form>
        <div className="flex justify-between items-center text-[10px] text-muted-foreground/60 px-1 font-mono">
          <span>
            {activeRepo
              ? `Indexed: ${activeRepo.split("/").slice(-1)[0]}`
              : "No repository connected"}
          </span>
          <span>Press Enter to ask</span>
        </div>
      </div>
    </div>
  );
}
