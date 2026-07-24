"use client";

import { useState } from "react";
import { BookOpen, FileText, Search, MessageSquare, Compass, Terminal, ShieldAlert } from "lucide-react";

interface DocItem {
  id: string;
  title: string;
  category: string;
  updated: string;
  sections: string[];
  content: React.ReactNode;
}

export default function DocumentationExplorer() {
  const [activeDoc, setActiveDoc] = useState<string>("creative-direction");
  const [searchQuery, setSearchQuery] = useState("");

  const documents: DocItem[] = [
    {
      id: "creative-direction",
      title: "CREATIVE_DIRECTION.md",
      category: "Design System",
      updated: "1d ago",
      sections: ["Product Vision", "Design Philosophy", "Emotional Goals", "Visual Language", "Typography", "Component Philosophy"],
      content: (
        <article className="space-y-6 text-foreground/90">
          <div className="space-y-2">
            <span className="text-xs font-mono text-rust uppercase tracking-wider font-semibold">Active Specification</span>
            <h1 className="text-4xl font-serif font-normal text-foreground leading-tight">RepoMind Product Vision & Design Principles</h1>
            <p className="text-sm italic text-muted-foreground font-serif">A guide explaining styling constraints, typography rhythm, and off-white layouts.</p>
          </div>

          <hr className="border-border" />

          <section className="space-y-3">
            <h2 className="text-2xl font-serif text-foreground font-normal mt-6">Product Vision</h2>
            <p className="text-[13.5px] leading-relaxed">
              RepoMind is not another AI chatbot. It is an **AI Engineering Workspace** where developers explore, understand and reason about large codebases naturally. Think of it as if GitHub, Notion, and an editorial architecture magazine had a child.
            </p>
            <div className="bg-muted/40 p-4 border border-border/80 rounded-xl my-4 text-xs font-mono text-muted-foreground">
              &ldquo;The experience should feel calm, premium and intelligent. The interface should disappear so the engineering thinking becomes the focus.&rdquo;
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-serif text-foreground font-normal mt-6">Design Philosophy</h2>
            <p className="text-[13.5px] leading-relaxed">
              Our core alignment dictates physical, grounded structures rather than cyberpunk elements:
            </p>
            <ul className="list-disc pl-5 text-[13.5px] space-y-1.5 leading-relaxed">
              <li><strong>Less Dashboard:</strong> Focus on content, workspace layouts, and clean grid structures.</li>
              <li><strong>Less SaaS:</strong> Look like a premium operating system or custom editor environment.</li>
              <li><strong>Less AI:</strong> No massive glowing banners. Treat AI as a helpful, quiet compiler subagent.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-serif text-foreground font-normal mt-6">Typography & Visual Rhythm</h2>
            <p className="text-[13.5px] leading-relaxed">
              Typography is our primary design vector. Hero headings and page titles are set in an editorial serif font (<span className="italic">Newsreader</span>) to convey craftsmanship. Workspace grids, files, stats, and text inputs utilize modern sans-serif fonts (<span className="italic">Geist Sans</span>) for clean readability.
            </p>
            <blockquote>
              <p className="border-l-2 border-rust pl-4 text-sm italic text-muted-foreground font-serif my-4">
                &ldquo;Spacing is more important than color. Avoid screaming highlights. Let the whitespace define the grouping.&rdquo;
              </p>
            </blockquote>
          </section>
        </article>
      )
    },
    {
      id: "architecture",
      title: "ARCHITECTURE.md",
      category: "System Core",
      updated: "3d ago",
      sections: ["Module Topology", "AI Parsing Pipeline", "Local Vector Store", "Caching Strategies"],
      content: (
        <article className="space-y-6 text-foreground/90">
          <div className="space-y-2">
            <span className="text-xs font-mono text-rust uppercase tracking-wider font-semibold">Technical Architecture</span>
            <h1 className="text-4xl font-serif font-normal text-foreground leading-tight">Codebase Indexing & Vector Routing</h1>
            <p className="text-sm italic text-muted-foreground font-serif">Structural topology mapping and indexing cycles.</p>
          </div>

          <hr className="border-border" />

          <section className="space-y-3">
            <h2 className="text-2xl font-serif text-foreground font-normal mt-6">Local Parsing Topology</h2>
            <p className="text-[13.5px] leading-relaxed">
              RepoMind reads local folders and compiles an abstract syntax tree (AST) cache directly inside local memory. File indexes are converted to vector tokens using localized parsing pipelines.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-serif text-foreground font-normal mt-6">Dependencies Sync</h2>
            <p className="text-[13.5px] leading-relaxed">
              Every import and import alias is resolved automatically. Changes on disk trigger a partial AST recalculation that updates the local Dependency Graph.
            </p>
          </section>
        </article>
      )
    },
    {
      id: "getting-started",
      title: "GETTING_STARTED.md",
      category: "Setup",
      updated: "1w ago",
      sections: ["Prerequisites", "Installation", "Repository Sync", "Indexing Command"],
      content: (
        <article className="space-y-6 text-foreground/90">
          <div className="space-y-2">
            <span className="text-xs font-mono text-rust uppercase tracking-wider font-semibold">Operations Guide</span>
            <h1 className="text-4xl font-serif font-normal text-foreground leading-tight">Starting with RepoMind Workspace</h1>
            <p className="text-sm italic text-muted-foreground font-serif">Step-by-step developer integration checklist.</p>
          </div>

          <hr className="border-border" />

          <section className="space-y-3">
            <h2 className="text-2xl font-serif text-foreground font-normal mt-6">Initial Commands</h2>
            <p className="text-[13.5px] leading-relaxed">
              To begin local execution, clone this workspace and verify your configurations:
            </p>
            <div className="border border-border rounded-xl bg-muted/60 p-4 font-mono text-xs text-foreground/90 my-3">
              <span className="text-muted-foreground select-none">$ </span>npm install<br />
              <span className="text-muted-foreground select-none">$ </span>npm run dev
            </div>
          </section>
        </article>
      )
    }
  ];

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeDocData = documents.find((doc) => doc.id === activeDoc) || documents[0];

  return (
    <div className="h-full flex flex-col md:flex-row bg-card rounded-xl border border-border overflow-hidden shadow-sm bg-grain">
      
      {/* Left Navigation: Docs Directory */}
      <div className="w-full md:w-[280px] border-b md:border-b-0 md:border-r border-border p-4 bg-muted/15 flex flex-col gap-4">
        {/* Search */}
        <div className="relative flex items-center border border-border bg-card px-2.5 py-1.5 rounded-lg focus-within:ring-2 focus-within:ring-rust/30 text-xs">
          <Search className="size-3.5 text-muted-foreground mr-2" />
          <input
            type="text"
            className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/60"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories / Navigation list */}
        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-2">Knowledge Base</span>
            
            <div className="space-y-0.5 pt-1.5">
              {filteredDocs.map((doc) => {
                const isActive = doc.id === activeDoc;
                return (
                  <button
                    key={doc.id}
                    onClick={() => setActiveDoc(doc.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-all ${
                      isActive 
                        ? "bg-accent text-rust border-l-2 border-rust pl-1.5" 
                        : "hover:bg-muted/40 text-foreground/80 pl-2"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="size-3.5 shrink-0" />
                      <span className="truncate font-medium font-mono">{doc.title}</span>
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground/70 shrink-0">{doc.updated}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Outline inside sidebar */}
          <div className="border-t border-border/60 pt-4 px-2 space-y-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Section Outline</span>
            <div className="space-y-2 pt-1">
              {activeDocData.sections.map((sect) => (
                <div key={sect} className="flex items-start gap-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer">
                  <span className="size-1 rounded-full bg-muted-foreground/50 mt-1.5 shrink-0" />
                  <span>{sect}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Editorial Reader */}
      <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10 bg-card max-h-[85vh]">
        <div className="max-w-2xl mx-auto flex flex-col justify-between h-full">
          {activeDocData.content}

          {/* Discussion callout at bottom of article */}
          <div className="mt-12 pt-6 border-t border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Need Deep Code Context?</span>
              <p className="text-xs text-muted-foreground">Ask the AI assistant to trace, analyze, or explain functions referenced in this document.</p>
            </div>
            <button 
              onClick={() => alert(`Asking AI about: ${activeDocData.title}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium rounded-lg transition-all shadow-sm font-sans"
            >
              <MessageSquare className="size-3.5" />
              <span>Discuss with AI</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
