"use client";

import React, { useState } from "react";
import { Folder, FileCode, ArrowRight, Activity, Cpu, Layers } from "lucide-react";

interface Node {
  id: string;
  label: string;
  type: "folder" | "file";
  x: number;
  y: number;
  group: string;
  size?: string;
  desc: string;
  connections: string[]; // connects to these node IDs
}

const NODES: Node[] = [
  // Level 1: Folders (Left-ish column)
  {
    id: "app",
    label: "app/",
    type: "folder",
    x: 80,
    y: 100,
    group: "routing",
    desc: "Next.js App Router root layout, static branding page routes, and workspace view controllers.",
    connections: ["layout_tsx", "page_tsx"]
  },
  {
    id: "components",
    label: "components/",
    type: "folder",
    x: 80,
    y: 220,
    group: "ui",
    desc: "Modular UI components, reusable shared layout assets, and layout structures for the editor.",
    connections: ["landing_page", "arch_vis"]
  },
  {
    id: "lib",
    label: "lib/",
    type: "folder",
    x: 80,
    y: 340,
    group: "engine",
    desc: "The analytical core: parses workspace codebase into AST graphs, extracts semantic functions, and indexes local files.",
    connections: ["parser_ts", "vector_ts"]
  },
  {
    id: "hooks",
    label: "hooks/",
    type: "folder",
    x: 80,
    y: 460,
    group: "state",
    desc: "System state hooks. Watcher adapters that hook into local filesystem events to trigger automatic background indexing.",
    connections: ["sync_ts"]
  },

  // Level 2: Files (Right-ish column)
  {
    id: "layout_tsx",
    label: "layout.tsx",
    type: "file",
    x: 320,
    y: 70,
    group: "routing",
    size: "1.2 KB",
    desc: "Binds Google Newsreader serif fonts and Geist Sans UI typography to the main document layout.",
    connections: []
  },
  {
    id: "page_tsx",
    label: "page.tsx",
    type: "file",
    x: 320,
    y: 130,
    group: "routing",
    size: "11.5 KB",
    desc: "Home route entry that renders the marketing framework and hooks callbacks into the workspace.",
    connections: ["landing_page"]
  },
  {
    id: "landing_page",
    label: "LandingPage.tsx",
    type: "file",
    x: 320,
    y: 190,
    group: "ui",
    size: "24.0 KB",
    desc: "Premium editorial style homepage constructed from clean, modular design sections.",
    connections: ["arch_vis"]
  },
  {
    id: "arch_vis",
    label: "ArchitectureVis.tsx",
    type: "file",
    x: 320,
    y: 250,
    group: "ui",
    size: "12.8 KB",
    desc: "Interactive SVG blueprint visualizing modular node relationships and dependencies.",
    connections: []
  },
  {
    id: "parser_ts",
    label: "parser.ts",
    type: "file",
    x: 320,
    y: 310,
    group: "engine",
    size: "8.4 KB",
    desc: "Compiles filesystem text patterns into abstract syntax tree nodes for physical flow graphs.",
    connections: []
  },
  {
    id: "vector_ts",
    label: "vector.ts",
    type: "file",
    x: 320,
    y: 370,
    group: "engine",
    size: "14.2 KB",
    desc: "Stores and retrieves high-dimensional embeddings locally. Connects natural queries to code snippets.",
    connections: ["parser_ts"]
  },
  {
    id: "sync_ts",
    label: "useSync.ts",
    type: "file",
    x: 320,
    y: 460,
    group: "state",
    size: "4.8 KB",
    desc: "Orchestrates hot-reload pipeline, bridging AST graphs to workspace visual nodes.",
    connections: ["vector_ts"]
  }
];

export default function ArchitectureVis() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node>(NODES[2]); // Default focus on lib/

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
  };

  const handleNodeHover = (nodeId: string | null) => {
    setHoveredNode(nodeId);
  };

  // Helper to determine if a node or connection is currently highlighted
  const isNodeHighlighted = (id: string) => {
    if (!hoveredNode) return false;
    if (hoveredNode === id) return true;
    
    // Check if hovered node connects to this node
    const hNode = NODES.find((n) => n.id === hoveredNode);
    if (hNode && hNode.connections.includes(id)) return true;

    // Check if this node connects to hovered node
    const thisNode = NODES.find((n) => n.id === id);
    if (thisNode && thisNode.connections.includes(hoveredNode)) return true;

    return false;
  };

  // Helper to determine if a line path is highlighted
  const isPathHighlighted = (fromId: string, toId: string) => {
    if (!hoveredNode) return false;
    return (
      (hoveredNode === fromId && toId === hoveredNode) ||
      (hoveredNode === fromId) ||
      (hoveredNode === toId)
    );
  };

  return (
    <div className="w-full border border-border bg-card/65 rounded-xl shadow-[0_4px_24px_rgba(44,43,42,0.04)] overflow-hidden flex flex-col md:flex-row relative">
      {/* Editorial Grid Subtle BG */}
      <div className="absolute inset-0 bg-editorial-grid pointer-events-none z-0" />

      {/* SVG Canvas Area (Left Side) */}
      <div className="flex-1 p-6 flex flex-col justify-between z-10 min-h-[380px] md:min-h-[500px]">
        <div className="flex items-center justify-between border-b border-border/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rust opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rust"></span>
            </span>
            <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground">
              Workspace AST Visualizer (Interactive)
            </span>
          </div>
          <span className="text-[10px] font-mono text-rust bg-rust-light px-2 py-0.5 rounded-full font-medium">
            AST Synced
          </span>
        </div>

        <div className="relative flex-1 flex items-center justify-center">
          <svg
            viewBox="0 0 460 540"
            className="w-full max-w-[420px] aspect-[460/540] overflow-visible select-none"
          >
            {/* Draw Connecting Paths */}
            {NODES.map((node) => {
              return node.connections.map((targetId) => {
                const target = NODES.find((n) => n.id === targetId);
                if (!target) return null;

                const startX = node.x;
                const startY = node.y;
                const endX = target.x;
                const endY = target.y;

                // Bezier curve controls
                const cp1x = (startX + endX) / 2;
                const cp1y = startY;
                const cp2x = (startX + endX) / 2;
                const cp2y = endY;

                const isHighlighted = isPathHighlighted(node.id, target.id);

                return (
                  <g key={`${node.id}-${target.id}`}>
                    {/* Background glow path */}
                    <path
                      d={`M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`}
                      fill="none"
                      stroke={isHighlighted ? "var(--rust)" : "var(--border)"}
                      strokeWidth={isHighlighted ? 3 : 1.2}
                      strokeOpacity={isHighlighted ? 0.35 : 0.6}
                      className="transition-all duration-300"
                    />
                    {/* Main stroke path */}
                    <path
                      d={`M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`}
                      fill="none"
                      stroke={isHighlighted ? "var(--rust)" : "var(--border)"}
                      strokeWidth={isHighlighted ? 1.5 : 1}
                      strokeDasharray={isHighlighted ? "4 4" : "none"}
                      className="transition-all duration-300"
                    />

                    {/* Animated Pulsing Dot along active path */}
                    {isHighlighted && (
                      <circle r="3" fill="var(--rust)">
                        <animateMotion
                          dur="2.5s"
                          repeatCount="indefinite"
                          path={`M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`}
                        />
                      </circle>
                    )}
                  </g>
                );
              });
            })}

            {/* Draw Nodes */}
            {NODES.map((node) => {
              const isHovered = hoveredNode === node.id;
              const isHighlighted = isNodeHighlighted(node.id);
              const isSelected = selectedNode.id === node.id;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer"
                  onMouseEnter={() => handleNodeHover(node.id)}
                  onMouseLeave={() => handleNodeHover(null)}
                  onClick={() => handleNodeClick(node)}
                >
                  {/* Subtle hover/selected background ring */}
                  <circle
                    r={node.type === "folder" ? 22 : 18}
                    fill="none"
                    stroke={isHighlighted || isSelected ? "var(--rust)" : "transparent"}
                    strokeWidth={1.5}
                    strokeOpacity={isHighlighted ? 0.6 : isSelected ? 0.9 : 0}
                    className="transition-all duration-300 scale-100 group-hover:scale-110"
                  />

                  {/* Core node body */}
                  <circle
                    r={node.type === "folder" ? 17 : 14}
                    fill={isSelected ? "var(--rust-light)" : "var(--card)"}
                    stroke={isSelected ? "var(--rust)" : isHighlighted ? "var(--rust)" : "var(--border)"}
                    strokeWidth={isSelected ? 1.5 : 1.2}
                    className="transition-all duration-300 hover:translate-y-[-2px] shadow-[0_2px_4px_rgba(44,43,42,0.02)]"
                  />

                  {/* Node icon inside SVG */}
                  <g transform="translate(-7, -7) scale(0.85)">
                    {node.type === "folder" ? (
                      <path
                        d="M2.5 3.5a1 1 0 0 1 1-1h3.1a1 1 0 0 1 .7.3l1.4 1.4a1 1 0 0 0 .7.3h8.1a1 1 0 0 1 1 1v8.5a1 1 0 0 1-1 1h-14a1 1 0 0 1-1-1v-11.5z"
                        fill={isSelected ? "var(--rust)" : "none"}
                        stroke={isSelected ? "var(--rust)" : isHighlighted ? "var(--rust)" : "var(--muted-foreground)"}
                        strokeWidth="1.8"
                      />
                    ) : (
                      <path
                        d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"
                        fill={isSelected ? "var(--rust)" : "none"}
                        stroke={isSelected ? "var(--rust)" : isHighlighted ? "var(--rust)" : "var(--muted-foreground)"}
                        strokeWidth="1.8"
                      />
                    )}
                  </g>

                  {/* Node label text beside the node */}
                  <text
                    x={node.type === "folder" ? 26 : 22}
                    y="4"
                    fontFamily="var(--font-geist-mono), monospace"
                    fontSize="9.5"
                    fontWeight={isSelected ? "bold" : "normal"}
                    fill={isSelected ? "var(--rust)" : isHovered ? "var(--foreground)" : "var(--muted-foreground)"}
                    className="transition-all duration-200"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="text-[10px] font-mono text-muted-foreground border-t border-border/80 pt-3 mt-4 flex justify-between">
          <span>* Click any node to load into inspector</span>
          <span>Nodes: {NODES.length}</span>
        </div>
      </div>

      {/* Code Inspector Panel (Right Side, styled like index card) */}
      <div className="w-full md:w-[250px] border-t md:border-t-0 md:border-l border-border bg-card/90 p-6 flex flex-col justify-between shrink-0 z-10 selection:bg-rust-light/50">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/80 pb-2">
            <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
              Node Inspector
            </span>
            <span className="text-[9px] font-mono uppercase text-rust px-1 rounded bg-rust-light font-medium">
              {selectedNode.group}
            </span>
          </div>

          {/* Node Meta Details */}
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-foreground">
                {selectedNode.type === "folder" ? (
                  <Folder className="size-4 text-rust shrink-0" />
                ) : (
                  <FileCode className="size-4 text-rust shrink-0" />
                )}
                <span className="font-mono text-sm font-semibold tracking-tight truncate">
                  {selectedNode.label}
                </span>
              </div>
              {selectedNode.size && (
                <div className="text-[10px] font-mono text-muted-foreground">
                  File Size: <span className="font-semibold text-foreground/80">{selectedNode.size}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed font-serif italic border-l-2 border-rust-light pl-2">
              &ldquo;{selectedNode.desc}&rdquo;
            </p>
          </div>

          {/* Logic connections summary */}
          <div className="space-y-2">
            <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground block">
              Outgoing References ({selectedNode.connections.length})
            </span>
            {selectedNode.connections.length > 0 ? (
              <div className="space-y-1.5">
                {selectedNode.connections.map((cId) => {
                  const target = NODES.find((n) => n.id === cId);
                  if (!target) return null;
                  return (
                    <div
                      key={cId}
                      className="flex items-center gap-1.5 text-[10px] font-mono text-foreground/80 hover:text-rust transition-colors cursor-pointer"
                      onClick={() => handleNodeClick(target)}
                    >
                      <ArrowRight className="size-2.5 text-rust shrink-0" />
                      <span>{target.label}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <span className="text-[9px] font-mono italic text-muted-foreground">Leaf node (no outgoing imports)</span>
            )}
          </div>
        </div>

        {/* Sync Status Info */}
        <div className="border-t border-border/80 pt-4 mt-6 space-y-2">
          <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground">
            <span>AST Node sync</span>
            <span className="font-bold text-foreground">100%</span>
          </div>
          <div className="w-full bg-border rounded-full h-1">
            <div className="bg-rust h-1 rounded-full transition-all duration-500 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
