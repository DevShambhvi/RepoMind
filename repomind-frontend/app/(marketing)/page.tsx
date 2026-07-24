"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Terminal, FileText, Database, Layers } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground bg-grain flex flex-col justify-between selection:bg-rust-light select-none">
      
      {/* Landing Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-serif text-lg font-bold tracking-tight bg-primary text-primary-foreground px-2 py-0.5 rounded">RM</span>
          <span className="font-serif text-lg font-normal tracking-tight text-foreground/90">RepoMind</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/workspace" className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
            Workspace Console
          </Link>
          <Link 
            href="/workspace" 
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium rounded-lg transition-all shadow-sm"
          >
            <span>Launch Workspace</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Editorial Hero */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 md:py-20 flex flex-col justify-center gap-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Headline (6 columns) */}
          <div className="lg:col-span-7 space-y-8 max-w-xl md:max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-rust/20 bg-rust-light/45 text-rust text-[10px] font-mono font-medium uppercase tracking-wider">
              <Sparkles className="size-3" />
              <span>Context-Aware Parsing Engine</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-serif font-normal text-foreground leading-[1.1] tracking-tight">
              An engineering workspace built for <span className="italic font-serif">reasoning</span> codebase architecture.
            </h1>

            <p className="text-base md:text-lg text-muted-foreground/80 leading-relaxed max-w-lg font-serif italic">
              Imagine if GitHub, Notion and a premium architecture journal had a child. A physical, calm environment for understanding codebase structures.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link 
                href="/workspace"
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-rust text-primary-foreground hover:bg-rust/95 text-xs font-semibold rounded-lg transition-all shadow-sm group"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a 
                href="#preview"
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 border border-border bg-card hover:bg-muted/40 text-xs font-semibold rounded-lg transition-colors"
              >
                <span>View Design Spec</span>
              </a>
            </div>
          </div>

          {/* Side Info Board (5 columns) */}
          <div className="lg:col-span-5 lg:pl-10 space-y-6 border-l border-border/80 pl-0">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block">Core Framework Principles</span>
            
            <div className="space-y-6">
              {[
                { icon: <Layers className="size-4 text-rust" />, title: "Less Dashboard, More Code", desc: "No complex grid dashboards or charts. An uncluttered workspace layout where files and logical code flows are the core focus." },
                { icon: <Database className="size-4 text-rust" />, title: "Physical Memory Vector Sync", desc: "Your folders are parsed into local AST graphs and vector tokens, matching file-save triggers in your IDE." },
                { icon: <Terminal className="size-4 text-rust" />, title: "Quiet & Elegant Reasoning", desc: "No flashing chatbot popups. Ask architectural questions inline and inspect dependencies visually." }
              ].map((f, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="shrink-0 p-1.5 bg-rust-light rounded-lg h-fit">
                    {f.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-serif font-semibold text-foreground">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Workspace Design Mockup Preview */}
        <section id="preview" className="space-y-4 pt-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-border/80 pb-3 gap-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Interactive Console Preview</span>
            <span className="text-xs font-serif italic text-muted-foreground">Clicking enter workspace opens the live environment.</span>
          </div>

          {/* Visual Workspace Mockup */}
          <div className="border border-border bg-card rounded-xl shadow-2xl overflow-hidden bg-grain aspect-video max-w-4xl mx-auto flex flex-col">
            {/* Mock Header */}
            <div className="h-10 border-b border-border/80 px-4 flex items-center justify-between text-[10px] font-mono text-muted-foreground bg-muted/20 shrink-0">
              <div className="flex items-center gap-4">
                <span className="font-bold text-foreground">RM</span>
                <span>repomind-frontend</span>
              </div>
              <div className="px-12 py-1 bg-card rounded border border-border/80 w-[240px] text-center select-none text-[9px]">
                Search workspace files (⌘K)...
              </div>
              <div className="size-3.5 rounded-full bg-rust/35" />
            </div>

            {/* Mock Grid columns */}
            <div className="flex-1 flex min-h-0 bg-card/40">
              {/* Mock Sidebar */}
              <div className="w-[160px] border-r border-border/80 p-3 space-y-4 text-[9px] font-mono text-muted-foreground/80 bg-muted/10 shrink-0">
                <div className="space-y-1">
                  <div className="font-bold text-foreground/90 uppercase tracking-widest text-[8px] mb-1">Navigation</div>
                  <div className="p-1 rounded bg-accent text-rust font-medium">Overview</div>
                  <div className="p-1 rounded">Dependency Graph</div>
                  <div className="p-1 rounded">Documentation</div>
                </div>
              </div>

              {/* Mock Main Panel */}
              <div className="flex-1 p-4 space-y-4 overflow-hidden border-r border-border/80">
                <div className="flex items-center justify-between border-b border-border/85 pb-2">
                  <span className="font-serif text-sm font-semibold">Workspace Overview</span>
                  <span className="text-[9px] font-mono text-rust bg-rust-light px-1.5 py-0.5 rounded">Sync Active</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="border border-border/60 p-2.5 rounded bg-card/65 text-[9px]">
                    <div className="text-[8px] font-mono uppercase text-muted-foreground mb-1">Files Indexed</div>
                    <span className="font-serif font-bold text-xs text-foreground">1,248 files</span>
                  </div>
                  <div className="border border-border/60 p-2.5 rounded bg-card/65 text-[9px]">
                    <div className="text-[8px] font-mono uppercase text-muted-foreground mb-1">Model Config</div>
                    <span className="font-serif font-bold text-xs text-foreground">Gemini 3.5</span>
                  </div>
                  <div className="border border-border/60 p-2.5 rounded bg-card/65 text-[9px]">
                    <div className="text-[8px] font-mono uppercase text-muted-foreground mb-1">Context</div>
                    <span className="font-serif font-bold text-xs text-foreground">64k tokens</span>
                  </div>
                </div>

                {/* Mock file list */}
                <div className="border border-border/60 rounded bg-card overflow-hidden text-[9px] font-mono">
                  <div className="grid grid-cols-3 p-1.5 bg-muted/30 border-b border-border/60 text-muted-foreground">
                    <span>Path</span>
                    <span>Focus</span>
                    <span className="text-right">Size</span>
                  </div>
                  <div className="grid grid-cols-3 p-1.5 border-b border-border/40">
                    <span className="text-rust">app/layout.tsx</span>
                    <span className="truncate text-muted-foreground">Injects Google Newsreader</span>
                    <span className="text-right text-muted-foreground">1.2 KB</span>
                  </div>
                  <div className="grid grid-cols-3 p-1.5">
                    <span className="text-rust">app/globals.css</span>
                    <span className="truncate text-muted-foreground">Warm off-white styles</span>
                    <span className="text-right text-muted-foreground">4.3 KB</span>
                  </div>
                </div>
              </div>

              {/* Mock AI assistant sidebar */}
              <div className="w-[180px] p-3 space-y-3 bg-muted/10 text-[9px] flex flex-col justify-between shrink-0">
                <div className="space-y-2">
                  <div className="font-bold text-foreground/90 uppercase tracking-widest text-[8px]">AI Assistant</div>
                  <div className="bg-card border border-border p-2 rounded leading-relaxed text-muted-foreground">
                    Hello. I have fully indexed this workspace directory. Ask questions about the design variables.
                  </div>
                </div>
                <div className="border border-border bg-card rounded p-1 flex items-center text-muted-foreground/60 text-[8px]">
                  <span>Ask anything...</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Landing Footer */}
      <footer className="border-t border-border/80 shrink-0 bg-card/65 backdrop-blur-md">
        <div className="max-w-7xl mx-auto w-full px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>RepoMind Workspace console. Built under editorial design specs.</span>
          </div>
          <div className="flex items-center gap-6 font-mono text-[10px]">
            <span>Local Instance</span>
            <span>•</span>
            <span>TypeScript + Tailwind V4</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
