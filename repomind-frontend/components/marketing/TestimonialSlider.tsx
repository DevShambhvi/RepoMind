"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  date: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "RepoMind is a visual revelation for understanding legacy repositories. Instead of standard code search, I can physically view the dependencies and trace structural flows on a paper-like layout. It is calming and incredibly precise.",
    author: "Elena Rostova",
    role: "Principal Systems Architect",
    company: "Linear Systems",
    date: "Spring Issue 2026"
  },
  {
    quote: "Modern codebases are getting too massive to reason about in normal text editors. RepoMind restores visual hierarchy. The zero-leak local model parsing provides context that standard RAG systems completely miss.",
    author: "Marcus Vance",
    role: "Staff Engineer, DevPlatform",
    company: "Stripe",
    date: "Issue 42 • Technology review"
  },
  {
    quote: "Quiet, fast, and elegantly visual. It completely does away with the chat-bubble cliché and replaces it with a premium engineering workbench. It feels less like another SaaS and more like a physical drawing board.",
    author: "Sora Takahashi",
    role: "Design Partner",
    company: "Vercel / Design Labs",
    date: "June 2026"
  }
];

export default function TestimonialSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
      setIsAnimating(false);
    }, 250); // duration matching transition
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setActiveIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
      setIsAnimating(false);
    }, 250);
  };

  const current = TESTIMONIALS[activeIndex];

  return (
    <div className="w-full max-w-4xl mx-auto border-t border-b border-border py-12 md:py-16 flex flex-col md:flex-row gap-10 items-start justify-between relative select-none">
      
      {/* Testimonial Quote Section (Left column: 8 columns width on MD) */}
      <div className="flex-1 space-y-8 min-h-[220px]">
        <div className="inline-flex items-center gap-1.5 text-rust">
          <Quote className="size-4 shrink-0 fill-rust/10" />
          <span className="text-[10px] font-mono tracking-widest uppercase">
            Architect Chronicles
          </span>
        </div>

        <blockquote className="space-y-4">
          <p 
            className={`font-serif italic text-xl md:text-2xl lg:text-3xl text-foreground leading-relaxed transition-all duration-300 ${
              isAnimating ? "opacity-0 translate-x-2" : "opacity-100 translate-x-0"
            }`}
          >
            &ldquo;{current.quote}&rdquo;
          </p>
        </blockquote>

        {/* Author details */}
        <div 
          className={`flex flex-col sm:flex-row sm:items-center gap-2 text-xs font-serif italic text-muted-foreground transition-all duration-300 ${
            isAnimating ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="font-semibold text-foreground not-italic font-sans text-xs uppercase tracking-wider">
            {current.author}
          </span>
          <span className="hidden sm:inline">•</span>
          <span>{current.role} at {current.company}</span>
        </div>
      </div>

      {/* Navigation Controls (Right column / corner) */}
      <div className="w-full md:w-auto flex md:flex-col justify-between items-center gap-6 shrink-0 md:self-stretch md:justify-between border-t md:border-t-0 md:border-l border-border/80 pt-6 md:pt-0 md:pl-8">
        
        {/* Editorial Index Tracker (e.g. 01 / 03) */}
        <div className="font-mono text-xs text-muted-foreground">
          <span className="text-foreground font-semibold">0{activeIndex + 1}</span>
          <span className="mx-1 text-border">/</span>
          <span>0{TESTIMONIALS.length}</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            className="p-2 border border-border hover:border-rust hover:text-rust bg-card rounded-lg transition-colors cursor-pointer text-muted-foreground"
            aria-label="Previous testimonial"
          >
            <ArrowLeft className="size-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 border border-border hover:border-rust hover:text-rust bg-card rounded-lg transition-colors cursor-pointer text-muted-foreground"
            aria-label="Next testimonial"
          >
            <ArrowRight className="size-4" />
          </button>
        </div>

        {/* Issue Date stamp */}
        <div className="hidden md:block font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60 text-right">
          {current.date}
        </div>
      </div>
    </div>
  );
}
