"use client";

/**
 * MarkdownRenderer – Lightweight markdown to JSX converter.
 *
 * Supports: bold, italic, inline code, code blocks, headings, lists,
 * links, and file path references.  No heavy dependencies.
 */

import { FileText } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  const blocks = parseBlocks(content);

  return (
    <div className={`space-y-2 ${className}`}>
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}

// ── Types ────────────────────────────────────────────────

type BlockType =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: number; text: string }
  | { type: "code"; lang: string; code: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "blockquote"; text: string };

// ── Parser ───────────────────────────────────────────────

function parseBlocks(raw: string): BlockType[] {
  const lines = raw.split("\n");
  const blocks: BlockType[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block (``` ... ```)
    if (line.trimStart().startsWith("```")) {
      const lang = line.trimStart().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "code", lang, code: codeLines.join("\n") });
      i++; // skip closing ```
      continue;
    }

    // Heading (# ... ######)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      i++;
      continue;
    }

    // Blockquote
    if (line.trimStart().startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith("> ")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "blockquote", text: quoteLines.join("\n") });
      continue;
    }

    // Unordered list (- or *)
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    // Ordered list (1. 2. etc.)
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    // Empty line – skip
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph (consecutive non-empty lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trimStart().startsWith("```") &&
      !lines[i].match(/^#{1,6}\s/) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !lines[i].trimStart().startsWith("> ")
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: "paragraph", text: paraLines.join(" ") });
    }
  }

  return blocks;
}

// ── Block renderer ───────────────────────────────────────

function Block({ block }: { block: BlockType }) {
  switch (block.type) {
    case "heading": {
      const Tag = (`h${Math.min(block.level, 6)}`) as keyof JSX.IntrinsicElements;
      const sizes: Record<number, string> = {
        1: "text-lg font-semibold",
        2: "text-base font-semibold",
        3: "text-sm font-semibold",
        4: "text-sm font-medium",
        5: "text-xs font-medium",
        6: "text-xs font-medium",
      };
      return (
        <Tag className={`${sizes[block.level] ?? sizes[3]} font-serif text-foreground mt-3`}>
          <InlineText text={block.text} />
        </Tag>
      );
    }

    case "code":
      return (
        <div className="border border-border rounded-xl overflow-hidden bg-muted/60 shadow-sm text-xs font-mono my-2">
          {block.lang && (
            <div className="px-3.5 py-1.5 border-b border-border/80 text-[10px] text-muted-foreground bg-card/40 uppercase font-bold tracking-wider">
              {block.lang}
            </div>
          )}
          <pre className="p-3.5 overflow-x-auto text-[11px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
            <code>{block.code}</code>
          </pre>
        </div>
      );

    case "list":
      return block.ordered ? (
        <ol className="list-decimal list-inside space-y-0.5 text-[13px] leading-relaxed pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="text-foreground/90">
              <InlineText text={item} />
            </li>
          ))}
        </ol>
      ) : (
        <ul className="list-disc list-inside space-y-0.5 text-[13px] leading-relaxed pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="text-foreground/90">
              <InlineText text={item} />
            </li>
          ))}
        </ul>
      );

    case "blockquote":
      return (
        <blockquote className="border-l-2 border-rust/60 pl-3 py-1 text-sm italic text-muted-foreground font-serif">
          <InlineText text={block.text} />
        </blockquote>
      );

    case "paragraph":
    default:
      return (
        <p className="text-[13px] leading-relaxed text-foreground/90">
          <InlineText text={block.text} />
        </p>
      );
  }
}

// ── Inline text renderer ─────────────────────────────────

function InlineText({ text }: { text: string }) {
  // Process inline formatting: bold, italic, inline code, file paths, links
  const parts = parseInline(text);
  return (
    <>
      {parts.map((part, i) => {
        switch (part.type) {
          case "bold":
            return (
              <strong key={i} className="font-semibold text-foreground">
                {part.text}
              </strong>
            );
          case "italic":
            return (
              <em key={i} className="italic">
                {part.text}
              </em>
            );
          case "code":
            return (
              <code
                key={i}
                className="bg-muted/70 border border-border/60 px-1 py-0.5 rounded text-[11px] font-mono text-foreground/90"
              >
                {part.text}
              </code>
            );
          case "file":
            return (
              <span
                key={i}
                className="inline-flex items-center gap-1 bg-card px-1.5 py-0.5 rounded border border-border/60 text-[10px] font-mono text-rust hover:bg-accent transition-colors cursor-pointer"
              >
                <FileText className="size-2.5" />
                {part.text}
              </span>
            );
          case "link":
            return (
              <a
                key={i}
                href={part.href}
                className="text-rust underline underline-offset-2 hover:text-rust/80 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                {part.text}
              </a>
            );
          default:
            return <span key={i}>{part.text}</span>;
        }
      })}
    </>
  );
}

type InlinePart =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "code"; text: string }
  | { type: "file"; text: string }
  | { type: "link"; text: string; href: string };

function parseInline(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  // Combined regex for inline code, bold, italic, markdown links, and file paths
  const regex =
    /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))|(`[^`]+\.[a-z]+`)/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Push preceding plain text
    if (match.index > lastIndex) {
      parts.push({ type: "text", text: text.slice(lastIndex, match.index) });
    }

    const m = match[0];

    if (m.startsWith("`") && m.endsWith("`")) {
      const inner = m.slice(1, -1);
      // Check if it looks like a file path
      if (/\.[a-z]{1,4}$/.test(inner) && inner.includes("/")) {
        parts.push({ type: "file", text: inner });
      } else {
        parts.push({ type: "code", text: inner });
      }
    } else if (m.startsWith("**") && m.endsWith("**")) {
      parts.push({ type: "bold", text: m.slice(2, -2) });
    } else if (m.startsWith("*") && m.endsWith("*")) {
      parts.push({ type: "italic", text: m.slice(1, -1) });
    } else if (m.startsWith("[")) {
      const linkMatch = m.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push({ type: "link", text: linkMatch[1], href: linkMatch[2] });
      } else {
        parts.push({ type: "text", text: m });
      }
    }

    lastIndex = match.index + m.length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push({ type: "text", text: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", text }];
}
