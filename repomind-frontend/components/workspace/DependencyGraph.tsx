"use client";

import { useMemo, useState } from "react";
import { Network, ArrowRight, Eye, RefreshCw, ZoomIn, ZoomOut } from "lucide-react";

import { useWorkspace } from "@/lib/store";
import { useFiles } from "@/lib/hooks";

interface Node {
  id: string;
  label: string;
  type: "page" | "layout" | "component" | "lib";
  size: number;
  cx: number;
  cy: number;
  imports: string[];
}

interface Link {
  source: string;
  target: string;
}

export default function DependencyGraph() {
  const { activeRepo } = useWorkspace();
  const { files, loading } = useFiles(activeRepo);

  const [selectedNode, setSelectedNode] = useState<string>("");
  const [zoom, setZoom] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Build nodes and links from the file index
  const { nodes, links } = useMemo(() => {
    if (files.length === 0) {
      return { nodes: [] as Node[], links: [] as Link[] };
    }

    // Group files by top-level directory
    const dirGroups = new Map<string, typeof files>();
    for (const f of files) {
      const parts = f.file_path.split("/");
      const dir = parts.length > 1 ? parts[0] : "(root)";
      if (!dirGroups.has(dir)) dirGroups.set(dir, []);
      dirGroups.get(dir)!.push(f);
    }

    const builtNodes: Node[] = [];
    const builtLinks: Link[] = [];
    const dirs = Array.from(dirGroups.keys()).slice(0, 10); // Cap at 10 dirs

    // Layout: place directories in a circle
    const centerX = 350;
    const centerY = 350;
    const radius = 200;

    // Root node
    const rootLabel = activeRepo
      ? activeRepo.split("/").pop() ?? "project"
      : "project";
    builtNodes.push({
      id: "root",
      label: rootLabel,
      type: "layout",
      size: 32,
      cx: centerX,
      cy: centerY,
      imports: dirs,
    });

    dirs.forEach((dir, i) => {
      const angle = (i / dirs.length) * 2 * Math.PI - Math.PI / 2;
      const cx = centerX + radius * Math.cos(angle);
      const cy = centerY + radius * Math.sin(angle);
      const fileCount = dirGroups.get(dir)!.length;

      const nodeType: Node["type"] =
        dir === "app"
          ? "page"
          : dir === "components"
          ? "component"
          : dir === "lib" || dir === "utils"
          ? "lib"
          : "layout";

      builtNodes.push({
        id: dir,
        label: `${dir}/`,
        type: nodeType,
        size: Math.min(16 + fileCount * 2, 36),
        cx,
        cy,
        imports: dirGroups.get(dir)!.slice(0, 4).map((f) => f.file_path),
      });

      builtLinks.push({ source: "root", target: dir });

      // Add file nodes around each directory (max 4 per dir)
      const dirFiles = dirGroups.get(dir)!.slice(0, 4);
      const innerRadius = 80;
      dirFiles.forEach((f, fi) => {
        const fileAngle =
          angle + ((fi - (dirFiles.length - 1) / 2) * 0.4);
        const fcx = cx + innerRadius * Math.cos(fileAngle);
        const fcy = cy + innerRadius * Math.sin(fileAngle);

        builtNodes.push({
          id: f.file_path,
          label: f.file_path.split("/").pop() ?? f.file_path,
          type: "lib",
          size: 14,
          cx: fcx,
          cy: fcy,
          imports: [],
        });

        builtLinks.push({ source: dir, target: f.file_path });
      });
    });

    return { nodes: builtNodes, links: builtLinks };
  }, [files, activeRepo]);

  // Default selection
  const effectiveSelected = selectedNode || (nodes.length > 0 ? nodes[0].id : "");
  const activeNodeData = nodes.find((n) => n.id === effectiveSelected) || nodes[0];

  const isLinkHighlight = (link: Link) => {
    const focusNode = hoveredNode || effectiveSelected;
    return link.source === focusNode || link.target === focusNode;
  };

  if (!activeRepo) {
    return (
      <div className="h-full flex items-center justify-center text-center p-8">
        <div className="space-y-3">
          <Network className="size-10 text-muted-foreground/40 mx-auto" />
          <h3 className="text-lg font-serif text-foreground">No Repository Connected</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Connect and ingest a repository to visualize its dependency structure.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground gap-2">
        <Network className="size-5 animate-pulse" />
        <span className="text-sm">Building dependency graph...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      {/* Graph Visual Canvas */}
      <div className="flex-1 relative bg-muted/10 min-h-[450px] lg:min-h-0 flex flex-col justify-between p-4">
        {/* Graph Header */}
        <div className="flex items-center justify-between z-10">
          <div className="space-y-1">
            <h2 className="text-[15px] font-serif font-medium text-foreground flex items-center gap-2">
              <Network className="size-4 text-rust" />
              Interactive Dependency Graph
            </h2>
            <p className="text-xs text-muted-foreground">
              {nodes.length} modules • {links.length} connections
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-card border border-border p-1 rounded-lg shadow-sm">
            <button
              onClick={() => setZoom((prev) => Math.min(prev + 0.1, 1.5))}
              className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="size-3.5" />
            </button>
            <button
              onClick={() => setZoom((prev) => Math.max(prev - 0.1, 0.4))}
              className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="size-3.5" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setSelectedNode(nodes.length > 0 ? nodes[0].id : "");
              }}
              className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
              title="Reset View"
            >
              <RefreshCw className="size-3.5" />
            </button>
          </div>
        </div>

        {/* SVG Drawing Canvas */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <svg
            className="w-full h-full select-none cursor-grab active:cursor-grabbing transition-transform duration-300"
            style={{ transform: `scale(${zoom})` }}
            viewBox="0 0 700 700"
          >
            {/* Draw Links */}
            {links.map((link, idx) => {
              const sourceNode = nodes.find((n) => n.id === link.source);
              const targetNode = nodes.find((n) => n.id === link.target);
              if (!sourceNode || !targetNode) return null;

              const highlighted = isLinkHighlight(link);
              return (
                <line
                  key={`l-${idx}`}
                  x1={sourceNode.cx}
                  y1={sourceNode.cy}
                  x2={targetNode.cx}
                  y2={targetNode.cy}
                  stroke={highlighted ? "var(--rust)" : "var(--border)"}
                  strokeWidth={highlighted ? 2 : 1}
                  strokeDasharray={highlighted ? "4 2" : "none"}
                  className="transition-all duration-300"
                />
              );
            })}

            {/* Draw Nodes */}
            {nodes.map((node) => {
              const isSelected = effectiveSelected === node.id;
              const isHovered = hoveredNode === node.id;

              return (
                <g
                  key={node.id}
                  className="cursor-pointer group"
                  onClick={() => setSelectedNode(node.id)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <circle
                    cx={node.cx}
                    cy={node.cy}
                    r={node.size / 2 + 4}
                    fill={isSelected ? "var(--rust-light)" : "var(--card)"}
                    stroke={
                      isSelected
                        ? "var(--rust)"
                        : isHovered
                        ? "var(--rust-light)"
                        : "var(--border)"
                    }
                    strokeWidth={isSelected ? 2 : 1.5}
                    className="transition-all duration-300 drop-shadow-sm group-hover:scale-110"
                  />
                  <circle
                    cx={node.cx}
                    cy={node.cy}
                    r={4}
                    fill={isSelected ? "var(--rust)" : "var(--primary)"}
                  />
                  <text
                    x={node.cx}
                    y={node.cy + node.size / 2 + 16}
                    textAnchor="middle"
                    className={`text-[10px] font-mono select-none transition-all ${
                      isSelected
                        ? "fill-rust font-bold"
                        : "fill-muted-foreground"
                    }`}
                  >
                    {node.label.length > 18
                      ? node.label.slice(0, 16) + "…"
                      : node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 bg-card/60 backdrop-blur-sm border border-border p-2.5 rounded-lg text-[10px] font-mono text-muted-foreground z-10 self-start">
          <div className="flex items-center gap-1">
            <span className="size-2 rounded-full border border-border bg-card" />
            <span>Module</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-rust/35" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1 animate-pulse">
            <span className="size-2 bg-rust rounded-full" />
            <span>Connected</span>
          </div>
        </div>
      </div>

      {/* Inspector Panel */}
      <div className="w-full lg:w-[320px] border-t lg:border-t-0 lg:border-l border-border bg-card/50 backdrop-blur-sm p-5 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">
              Selected Module
            </span>
            {activeNodeData && (
              <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground capitalize">
                {activeNodeData.type}
              </span>
            )}
          </div>

          {activeNodeData ? (
            <>
              <div className="space-y-2">
                <h3 className="text-base font-mono font-bold text-foreground truncate select-all">
                  {activeNodeData.id}
                </h3>
                <p className="text-xs text-muted-foreground">
                  This is a {activeNodeData.type} module with{" "}
                  {activeNodeData.imports.length} outgoing connection
                  {activeNodeData.imports.length !== 1 ? "s" : ""}.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-2">
                    Contains ({activeNodeData.imports.length})
                  </span>
                  {activeNodeData.imports.length === 0 ? (
                    <p className="text-xs italic text-muted-foreground/80 pl-1">
                      Leaf node — no children
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                      {activeNodeData.imports.map((imp) => (
                        <div
                          key={imp}
                          className="flex items-center gap-2 text-xs bg-muted/40 p-2 rounded-lg border border-border/60 hover:border-rust/40 transition-colors cursor-pointer"
                          onClick={() => setSelectedNode(imp)}
                        >
                          <ArrowRight className="size-3 text-rust" />
                          <span className="font-mono text-foreground/80 truncate">
                            {imp}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-2">
                    Dependents
                  </span>
                  {(() => {
                    const dependents = nodes.filter((n) =>
                      n.imports.includes(activeNodeData.id),
                    );
                    return dependents.length === 0 ? (
                      <p className="text-xs italic text-muted-foreground/80 pl-1">
                        No parent dependencies
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {dependents.map((dep) => (
                          <div
                            key={dep.id}
                            className="flex items-center gap-2 text-xs bg-muted/40 p-2 rounded-lg border border-border/60 cursor-pointer hover:border-rust/40 transition-colors"
                            onClick={() => setSelectedNode(dep.id)}
                          >
                            <span className="size-1.5 bg-muted-foreground rounded-full" />
                            <span className="font-mono text-foreground/85 truncate">
                              {dep.id}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Select a node to inspect
            </p>
          )}
        </div>

        {/* Action button */}
        {activeNodeData && (
          <div className="pt-6 border-t border-border/60">
            <button
              onClick={() =>
                alert(`Viewing module: ${activeNodeData.id}`)
              }
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium rounded-lg transition-all shadow-sm"
            >
              <Eye className="size-3.5" />
              <span>View Module Details</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
