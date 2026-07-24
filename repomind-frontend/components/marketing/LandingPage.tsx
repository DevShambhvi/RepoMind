"use client";

import React, { useState } from "react";
import { 
  ArrowRight, 
  ArrowUpRight, 
  Sparkles, 
  Terminal, 
  FileText, 
  Database, 
  Layers, 
  Shield, 
  GitBranch, 
  Zap, 
  Check, 
  Copy, 
  Maximize2, 
  Eye, 
  HelpCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ArchitectureVis from "./ArchitectureVis";
import TestimonialSlider from "./TestimonialSlider";

interface LandingPageProps {
  onEnterWorkspace: () => void;
  onViewDesignSpec?: () => void;
}

export default function LandingPage({ onEnterWorkspace, onViewDesignSpec }: LandingPageProps) {
  const [copied, setCopied] = useState(false);
  const [showSpecSheet, setShowSpecSheet] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText("npx repomind@latest init");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSpecSheet = () => {
    if (onViewDesignSpec) {
      onViewDesignSpec();
    } else {
      setShowSpecSheet(!showSpecSheet);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground bg-grain flex flex-col justify-between selection:bg-rust-light select-none">
      
      {/* Editorial Grid Subtle BG */}
      <div className="absolute inset-0 bg-editorial-grid pointer-events-none z-0 opacity-15 dark:opacity-10 h-[800px]" />

      {/* Landing Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between z-10 shrink-0 border-b border-border/80">
        <div className="flex items-center gap-2.5">
          <span className="font-serif text-lg font-bold tracking-tight bg-primary text-primary-foreground px-2 py-0.5 rounded shadow-[0_2px_4px_rgba(44,43,42,0.08)]">RM</span>
          <div className="flex flex-col">
            <span className="font-serif text-sm font-semibold tracking-tight text-foreground/90">RepoMind</span>
            <span className="text-[8px] font-mono text-muted-foreground tracking-widest uppercase">System Journal</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={onEnterWorkspace}
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer bg-transparent border-none hover:underline underline-offset-4"
          >
            Workspace Console
          </button>
          <Button 
            onClick={onEnterWorkspace}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-medium rounded-lg transition-all duration-300 shadow-[0_2px_8px_rgba(44,43,42,0.06)] hover:shadow-[0_4px_12px_rgba(44,43,42,0.12)] cursor-pointer hover:translate-y-[-1px]"
          >
            <span>Launch Workspace</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </header>

      {/* Main Editorial Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 md:py-24 flex flex-col gap-24 md:gap-36 z-10">
        
        {/* SECTION 1: HERO */}
        <section id="hero" className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Headline (7 columns) */}
          <div className="lg:col-span-7 space-y-8 max-w-xl md:max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-rust/15 bg-rust-light/50 text-rust text-[9px] font-mono font-medium uppercase tracking-wider">
              <Sparkles className="size-3" />
              <span>AST-Graph Mapping Engine • v2.4.0</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-serif font-normal text-foreground leading-[1.08] tracking-tight">
              An engineering workspace built for <span className="italic font-serif text-rust">reasoning</span> codebase architecture.
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground/90 leading-relaxed font-serif italic max-w-xl">
              Imagine if GitHub, Notion and a premium architecture journal had a child. A physical, calm environment for understanding codebase structures.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={onEnterWorkspace}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-rust text-primary-foreground hover:bg-rust/95 text-xs font-semibold rounded-lg transition-all duration-300 shadow-[0_4px_12px_rgba(204,93,47,0.15)] hover:shadow-[0_6px_18px_rgba(204,93,47,0.22)] hover:translate-y-[-1px] group cursor-pointer"
              >
                <span>Enter Workspace Console</span>
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <button 
                onClick={toggleSpecSheet}
                className="flex items-center justify-center gap-1.5 px-6 py-3 border border-border bg-card hover:bg-muted/40 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer shadow-sm hover:translate-y-[-1px]"
              >
                <span>View Design Spec</span>
                <ArrowUpRight className="size-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Side Info Board (5 columns) */}
          <div className="lg:col-span-5 lg:pl-12 space-y-8 border-l border-border/80 pl-0 py-2">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block">System Manifesto</span>
              <h2 className="font-serif text-2xl font-normal text-foreground">Core Editorial Principles</h2>
            </div>
            
            <div className="space-y-8">
              {[
                { icon: <Layers className="size-4 text-rust" />, title: "Less Dashboard, More Code", desc: "No complex charts or flashing widgets. An uncluttered layout where code flows, files, and relationships are the core focus." },
                { icon: <Database className="size-4 text-rust" />, title: "Local Symbol Sync", desc: "Your folders are parsed into local AST graphs and vector tokens, matching file-save triggers in your IDE." },
                { icon: <Terminal className="size-4 text-rust" />, title: "Quiet & Elegant Reasoning", desc: "No noisy chatbot overlays. Ask deep architectural questions inline and inspect dependencies visually." }
              ].map((f, idx) => (
                <div key={idx} className="flex gap-4 group">
                  <div className="shrink-0 p-2 bg-rust-light rounded-lg h-fit border border-rust/10 transition-transform duration-300 group-hover:scale-105">
                    {f.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-serif font-semibold text-foreground group-hover:text-rust transition-colors duration-200">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* INLINE DESIGN SPEC DRAWER (Conditional) */}
        {showSpecSheet && (
          <section className="border border-rust/20 bg-rust-light/30 rounded-xl p-6 md:p-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-rust uppercase tracking-wider">Design Specification</span>
                <span className="h-1.5 w-1.5 rounded-full bg-rust" />
              </div>
              <button 
                onClick={() => setShowSpecSheet(false)}
                className="text-xs font-mono text-muted-foreground hover:text-foreground cursor-pointer"
              >
                [ Close Spec ]
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-[11px] text-muted-foreground">
              <div className="space-y-3">
                <span className="text-foreground font-semibold block text-[12px]">01 / COLOR SYSTEMS</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2"><div className="size-4 rounded bg-[#faf9f6] border border-border" /><span>Warm Paper: #faf9f6</span></div>
                  <div className="flex items-center gap-2"><div className="size-4 rounded bg-[#2c2b2a] border border-border" /><span>Warm Charcoal: #2c2b2a</span></div>
                  <div className="flex items-center gap-2"><div className="size-4 rounded bg-[#cc5d2f] border border-border" /><span>Rust Highlight: #cc5d2f</span></div>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-foreground font-semibold block text-[12px]">02 / TYPOGRAPHY RULES</span>
                <div className="space-y-1 leading-relaxed">
                  <p>Headings: Newsreader Serif (Italic highlights)</p>
                  <p>UI Elements: Geist Sans (Interportional)</p>
                  <p>Labels & Data: Geist Mono (Condensed)</p>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-foreground font-semibold block text-[12px]">03 / SPACE & GRID</span>
                <div className="space-y-1 leading-relaxed">
                  <p>Section Margin: Apple Spacing (96px - 144px)</p>
                  <p>Borders: 1px Soft Boundary (oklch 92% L)</p>
                  <p>Interactions: Card Lift & Soft Shadows</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: PROBLEM */}
        <section id="problem" className="border-t border-border pt-16 space-y-12">
          <div className="max-w-2xl">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">The Crisis of Scale</span>
            <h2 className="text-3xl md:text-5xl font-serif font-normal leading-tight text-foreground">
              Codebases sprawl faster than human memory can organize them.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: "01",
                title: "Context Fragmentation",
                desc: "As codebases expand, modular boundaries dissolve. Developers spends up to 60% of their coding time simply searching for where logic is implemented, tracking import threads through folders."
              },
              {
                num: "02",
                title: "Flat Vector Disconnect",
                desc: "Standard AI search parses directories as a flat list of text snippets. It can find matches, but is blind to parent-child AST structures, missing dependency links and structural context."
              },
              {
                num: "03",
                title: "Chat Overload fatigue",
                desc: "Flashing chatbot panels force engineers to write continuous explanatory prompts. We read conversation messages in sidebar bubbles instead of observing the physical layout of the system."
              }
            ].map((p, idx) => (
              <div key={idx} className="border border-border bg-card/40 rounded-xl p-6 space-y-4 hover:border-rust/30 hover:bg-card/75 transition-all duration-300">
                <div className="font-serif italic text-2xl text-rust">{p.num}</div>
                <h3 className="font-serif text-lg font-semibold text-foreground">{p.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: HOW IT WORKS */}
        <section id="how-it-works" className="border-t border-border pt-16 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-xl space-y-2">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Clear Flow Pipeline</span>
              <h2 className="text-3xl md:text-4xl font-serif font-normal text-foreground">A calm, tactile methodology for mapping code.</h2>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground max-w-sm leading-relaxed">
              No cloud syncing issues or telemetry leakage. A self-contained background parser running on your physical machine.
            </p>
          </div>

          {/* Handcrafted Card Deck (Soft Shadows and Card Lift Hover) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {[
              {
                step: "Phase I",
                title: "Static AST Digest",
                desc: "RepoMind indexes folders on start, compiles symbols into local abstract syntax trees, and maps physical file nodes."
              },
              {
                step: "Phase II",
                title: "Memory Index Vectoring",
                desc: "Code snippets are mapped to high-dimensional embeddings locally. Watches workspace file changes to hot-reload coordinates."
              },
              {
                step: "Phase III",
                title: "Semantic Visual Reasoning",
                desc: "Ask queries or browse links. RepoMind highlights matching nodes and draws connecting paths directly onto your canvas."
              }
            ].map((s, idx) => (
              <div 
                key={idx} 
                className="group border border-border bg-card rounded-xl p-8 space-y-6 shadow-[0_4px_16px_rgba(44,43,42,0.02)] hover:shadow-[0_12px_28px_rgba(44,43,42,0.05)] hover:-translate-y-1 transition-all duration-300 ease-out cursor-default relative overflow-hidden"
              >
                {/* Visual card accent line */}
                <div className="absolute top-0 left-0 w-full h-[3px] bg-border group-hover:bg-rust transition-colors duration-300" />
                <span className="text-[9px] font-mono uppercase tracking-widest text-rust">{s.step}</span>
                <h3 className="font-serif text-xl font-normal text-foreground group-hover:text-rust transition-colors duration-200">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: ENGINEERING INTELLIGENCE */}
        <section id="engineering-intelligence" className="border-t border-border pt-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Typographic side (5 columns) */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block">Structural Audit</span>
            <h2 className="text-3xl md:text-4xl font-serif font-normal leading-tight text-foreground">
              High density code indexing, compiled locally.
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              We replace standard text layouts with visual hierarchy grids. View file lines, export density, and reference counts instantly.
            </p>
            <div className="space-y-4 pt-2">
              <div className="flex gap-3 items-start">
                <Check className="size-4 text-rust shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Fast Symbol Search</h4>
                  <p className="text-[11px] text-muted-foreground">Jump directly to class definitions or functions without opening layout files.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <Check className="size-4 text-rust shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Zero-Data Leakage</h4>
                  <p className="text-[11px] text-muted-foreground">AST compilation and vectors stay entirely on your disk. Safe for secure enterprise codebases.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Terminal side (7 columns) */}
          <div className="lg:col-span-7">
            <div className="border border-border bg-card/75 rounded-xl overflow-hidden font-mono shadow-[0_4px_20px_rgba(44,43,42,0.03)]">
              {/* Header bar */}
              <div className="h-9 border-b border-border/80 bg-muted/25 px-4 flex items-center justify-between text-[9px] text-muted-foreground select-none">
                <div className="flex items-center gap-1.5">
                  <Terminal className="size-3 text-rust" />
                  <span>repomind-parser-daemon</span>
                </div>
                <span>active</span>
              </div>
              
              {/* Terminal code logs */}
              <div className="p-5 text-[10px] leading-relaxed space-y-1.5 overflow-x-auto text-muted-foreground">
                <div className="text-rust/80">$ repomind index --dir=./repomind-frontend</div>
                <div className="text-foreground/80">[14:59:11] Indexing components/marketing/LandingPage.tsx ...</div>
                <div>&nbsp;&nbsp;└─ AST compile complete (24,015 bytes)</div>
                <div>&nbsp;&nbsp;└─ Identified 12 imports, 2 interfaces, 1 default export</div>
                <div className="text-foreground/80">[14:59:12] Indexing components/marketing/ArchitectureVis.tsx ...</div>
                <div>&nbsp;&nbsp;└─ AST compile complete (12,810 bytes)</div>
                <div>&nbsp;&nbsp;└─ Identified 6 dependencies, 1 state hook</div>
                <div className="text-foreground/80">[14:59:13] Building local semantic vectors graph ...</div>
                <div className="text-rust/90">&nbsp;&nbsp;✔ Indexed 11 system components mapped inside memory vector.</div>
                <div className="flex items-center gap-2 text-foreground/90 pt-2 border-t border-border/40 mt-3 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-rust animate-pulse" />
                  <span>Watcher listening for file save triggers...</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: ARCHITECTURE VISUALIZATION */}
        <section id="visualization" className="border-t border-border pt-16 space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block">Interactive Blueprint</span>
            <h2 className="text-3xl md:text-5xl font-serif font-normal text-foreground leading-tight">
              The Living Code Blueprint.
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-xl">
              An interactive visual map representing RepoMind's actual module relationships. Hover nodes to trace inputs, view exports, and audit codebase hierarchy.
            </p>
          </div>

          {/* SVG Visual Component */}
          <div className="w-full">
            <ArchitectureVis />
          </div>
        </section>

        {/* SECTION 6: FEATURE GRID */}
        <section id="features" className="border-t border-border pt-16 space-y-12">
          <div className="max-w-2xl">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Handcrafted Toolkit</span>
            <h2 className="text-3xl md:text-4xl font-serif font-normal text-foreground">
              Refined features, no aesthetic compromise.
            </h2>
          </div>

          {/* Grid Layout styled like fine architectural boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-border">
            {[
              { icon: <Shield className="size-4" />, title: "Local Sandboxing", desc: "No codebase data ever leaves your device. All calculations, vector matching, and AST mapping occur offline." },
              { icon: <Terminal className="size-4" />, title: "CLI Initialization", desc: "Start workspace parsing with a single terminal command. Integrates nicely with custom build flows." },
              { icon: <GitBranch className="size-4" />, title: "AST Branch Resolving", desc: "Presents import pathways visually so you can track side-effects before merging commits." },
              { icon: <Database className="size-4" />, title: "Embedded Vector DB", desc: "Utilizes an optimized high-performance vector library compiled directly to client WebAssembly." },
              { icon: <Zap className="size-4" />, title: "Instant File Watcher", desc: "Detects file saves and updates vector clusters inside 100ms without fully re-indexing directories." },
              { icon: <Maximize2 className="size-4" />, title: "Apple Spacing UI", desc: "Designed with generous padding sizes, minimal borders, and elegant typographical grids." }
            ].map((feat, idx) => (
              <div 
                key={idx} 
                className="border-r border-b border-border p-8 hover:bg-card/45 transition-colors duration-200 flex flex-col justify-between min-h-[180px] group"
              >
                <div className="text-rust p-2 bg-rust-light rounded-lg w-fit border border-rust/5 transition-transform duration-300 group-hover:translate-y-[-2px]">
                  {feat.icon}
                </div>
                <div className="space-y-1.5 pt-6">
                  <h3 className="font-serif text-sm font-semibold text-foreground group-hover:text-rust transition-colors duration-200">{feat.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 7: TESTIMONIALS */}
        <section id="testimonials" className="border-t border-border pt-16 space-y-8">
          <div className="max-w-xl">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Critical Reviews</span>
            <h2 className="text-3xl font-serif font-normal text-foreground">Voices from the field.</h2>
          </div>
          
          <TestimonialSlider />
        </section>

        {/* SECTION 8: CTA */}
        <section id="cta" className="border-t border-border pt-16">
          <div className="bg-card border border-border rounded-2xl p-8 md:p-16 flex flex-col items-center text-center space-y-8 relative overflow-hidden shadow-[0_4px_30px_rgba(44,43,42,0.03)]">
            {/* Backdrop Grid */}
            <div className="absolute inset-0 bg-editorial-grid opacity-10 pointer-events-none" />

            <div className="space-y-4 max-w-xl relative z-10">
              <span className="text-[10px] font-mono text-rust uppercase tracking-widest bg-rust-light px-3 py-1 rounded-full border border-rust/10">Get Started</span>
              <h2 className="text-4xl md:text-5xl font-serif font-normal text-foreground leading-[1.1] tracking-tight">
                Reclaim codebase clarity.
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                Step away from cluttered AI dashboards and flashing panels. Initialize RepoMind on your project directory in under a minute.
              </p>
            </div>

            {/* Handcrafted Terminal Copy Command Box */}
            <div className="w-full max-w-md border border-border bg-background/95 rounded-xl p-3 flex items-center justify-between font-mono text-xs relative z-10 hover:border-rust/45 transition-colors duration-300">
              <div className="flex items-center gap-2 text-muted-foreground pl-1">
                <span className="text-rust select-none font-bold">$</span>
                <span className="text-foreground font-semibold">npx repomind@latest init</span>
              </div>
              <button 
                onClick={copyToClipboard}
                className="p-1.5 rounded-md hover:bg-muted border border-transparent hover:border-border text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer flex items-center gap-1 text-[10px]"
              >
                {copied ? (
                  <>
                    <Check className="size-3 text-rust" />
                    <span className="text-rust text-[9px] font-semibold uppercase">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3" />
                  </>
                )}
              </button>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 relative z-10">
              <Button 
                onClick={onEnterWorkspace}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold rounded-lg transition-all duration-300 shadow-sm cursor-pointer hover:translate-y-[-1px]"
              >
                <span>Launch Workspace Console</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </section>

      </main>

      {/* SECTION 9: FOOTER */}
      <footer className="border-t border-border/80 shrink-0 bg-card/35 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto w-full px-6 py-12 flex flex-col md:flex-row items-start justify-between gap-10">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-serif text-md font-bold tracking-tight bg-primary text-primary-foreground px-2 py-0.5 rounded">RM</span>
              <span className="font-serif text-md font-normal tracking-tight text-foreground/90">RepoMind</span>
            </div>
            <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed font-serif italic">
              A physical workspace engineered under Swiss editorial layouts to reason about code architecture.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-16 font-mono text-[10px] text-muted-foreground">
            <div className="space-y-3">
              <span className="font-semibold text-foreground uppercase tracking-widest text-[9px] block">Console</span>
              <div className="space-y-2">
                <button onClick={onEnterWorkspace} className="hover:text-rust block text-left cursor-pointer hover:underline underline-offset-2">Workspace</button>
                <a href="#visualization" className="hover:text-rust block hover:underline underline-offset-2">SVG Blueprint</a>
                <a href="#features" className="hover:text-rust block hover:underline underline-offset-2">System Spec</a>
              </div>
            </div>
            
            <div className="space-y-3">
              <span className="font-semibold text-foreground uppercase tracking-widest text-[9px] block">Details</span>
              <div className="space-y-2">
                <button onClick={toggleSpecSheet} className="hover:text-rust block text-left cursor-pointer hover:underline underline-offset-2">Design Tokens</button>
                <span>Local Engine</span>
                <span>Open Source</span>
              </div>
            </div>

            <div className="space-y-3 col-span-2 sm:col-span-1">
              <span className="font-semibold text-foreground uppercase tracking-widest text-[9px] block">Technology</span>
              <div className="space-y-2">
                <div>TypeScript + Next.js</div>
                <div>Tailwind V4 CSS</div>
                <div>Newsreader + Geist</div>
              </div>
            </div>
          </div>

        </div>

        <div className="border-t border-border/80">
          <div className="max-w-7xl mx-auto w-full px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-mono text-[10px]">
            <span>RepoMind Inc. Built locally with offline-first static parsing.</span>
            <div className="flex items-center gap-6">
              <span>Local Host 127.0.0.1</span>
              <span>•</span>
              <span>Stable Build 2.4.0</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
