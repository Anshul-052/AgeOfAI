"use client";

import React, { useEffect, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";

interface FlipBookProps {
  children: React.ReactNode[];
  layout?: string;
  preview?: boolean;
}

interface FlipBookHandle {
  pageFlip(): {
    flipNext(): void;
    flipPrev(): void;
  };
}

export default function FlipBook({ children, layout = "lead-story-focus", preview = false }: FlipBookProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<FlipBookHandle | null>(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 720 });
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const visiblePages = isMobile ? 1 : 2;

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = document.fullscreenElement === containerRef.current;
      setIsFullscreen(active);
      if (active) setIsOpened(true);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const calculateDimensions = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const mobile = viewportWidth < 768;
      setIsMobile(mobile);

      if (document.fullscreenElement === containerRef.current) {
        setDimensions(mobile
          ? { width: viewportWidth, height: viewportHeight }
          : { width: Math.floor(viewportWidth / 2), height: viewportHeight });
        return;
      }

      const containerTop = containerRef.current?.getBoundingClientRect().top ?? 120;
      const availableHeight = Math.max(420, viewportHeight - containerTop - 30);
      const availablePageWidth = mobile ? Math.max(300, viewportWidth - 24) : Math.max(300, (viewportWidth - 40) / 2);
      const pageRatio = mobile ? 0.75 : 8 / 9;
      const height = Math.min(availableHeight, availablePageWidth / pageRatio);
      setDimensions({ width: Math.floor(height * pageRatio), height: Math.floor(height) });
    };

    calculateDimensions();
    window.addEventListener("resize", calculateDimensions);
    window.addEventListener("orientationchange", calculateDimensions);
    return () => {
      window.removeEventListener("resize", calculateDimensions);
      window.removeEventListener("orientationchange", calculateDimensions);
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        bookRef.current?.pageFlip().flipNext();
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        bookRef.current?.pageFlip().flipPrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await containerRef.current?.requestFullscreen({ navigationUI: "hide" });
    } catch (error) {
      console.error("Fullscreen toggle error:", error);
    }
  };

  const pageEnd = Math.min(children.length, currentPage + visiblePages);

  return (
    <div
      ref={containerRef}
      className={`w-full flex flex-col items-center justify-center ${isFullscreen
        ? "fixed inset-0 z-50 m-0 overflow-hidden bg-neutral-950 p-0"
        : "my-1 max-w-full overflow-hidden rounded-lg border border-outline-variant/60 bg-surface-variant/15 p-2 shadow-2xl md:p-3"}`}
    >
      {!isFullscreen && <div className="mb-2 flex w-full shrink-0 select-none flex-wrap items-center justify-between gap-2 px-3">
        <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-[10px] font-bold uppercase text-primary">
          {preview ? "Private draft preview" : `Template: ${layout.replace(/-/g, " ")}`} · {children.length} pages · Animated flipbook
        </span>
        <button type="button" onClick={toggleFullscreen} className="bg-primary px-3.5 py-1.5 text-xs font-bold uppercase text-on-primary shadow-lg hover:opacity-90">Fullscreen</button>
      </div>}

      {!isOpened && !isFullscreen ? (
        <button type="button" onClick={() => setIsOpened(true)} className="group my-3 flex cursor-pointer flex-col items-center justify-center">
          <span className="relative block overflow-hidden rounded-r-md border-4 border-primary bg-surface shadow-2xl" style={{ width: dimensions.width, height: dimensions.height }}>
            <span className="pointer-events-none block h-full w-full">{children[0]}</span>
            <span className="absolute inset-0 grid place-items-center bg-black/10 transition-colors group-hover:bg-black/20">
              <span className="rounded-full border-2 border-on-primary bg-primary px-6 py-3 font-headline-md text-sm font-black uppercase tracking-wider text-on-primary shadow-2xl">Open broadsheet issue</span>
            </span>
          </span>
          <span className="mt-2.5 font-mono text-xs font-bold uppercase tracking-widest text-on-surface-variant">Click cover to open the animated edition</span>
        </button>
      ) : (
        <>
          {/* react-pageflip retains its first measurements, so the fullscreen key
              deliberately remounts it at the exact viewport dimensions. */}
          <HTMLFlipBook
            key={`${isFullscreen ? "fullscreen" : "inline"}-${dimensions.width}x${dimensions.height}`}
            ref={bookRef}
            startPage={Math.min(currentPage, Math.max(0, children.length - 1))}
            width={dimensions.width}
            height={dimensions.height}
            size="fixed"
            minWidth={dimensions.width}
            maxWidth={dimensions.width}
            minHeight={dimensions.height}
            maxHeight={dimensions.height}
            drawShadow
            flippingTime={700}
            usePortrait={isMobile}
            startZIndex={10}
            autoSize={false}
            maxShadowOpacity={0.45}
            showCover={false}
            mobileScrollSupport
            clickEventForward
            useMouseEvents
            swipeDistance={30}
            showPageCorners
            disableFlipByClick={false}
            onFlip={(event: { data: number }) => setCurrentPage(event.data)}
            className="demo-book"
            style={{ margin: 0 }}
          >
            {children.map((child, index) => (
              <div key={index} className="page page-curl flex h-full flex-col justify-between overflow-hidden border border-outline-variant/80 bg-surface p-4 box-border" style={{ width: dimensions.width, height: dimensions.height }}>
                {child}
              </div>
            ))}
          </HTMLFlipBook>

          {isFullscreen && <div className="absolute inset-x-0 bottom-4 z-[100] mx-auto flex w-fit items-center gap-2 rounded-full border border-white/30 bg-black/85 p-1.5 text-white shadow-2xl backdrop-blur-md">
            <button type="button" disabled={currentPage <= 0} onClick={() => bookRef.current?.pageFlip().flipPrev()} className="rounded-full px-3 py-2 text-xs font-bold uppercase disabled:opacity-35">Previous</button>
            <span className="min-w-28 text-center font-mono text-[10px] uppercase">{preview ? "Draft · " : ""}{currentPage + 1}–{pageEnd} / {children.length}</span>
            <button type="button" disabled={pageEnd >= children.length} onClick={() => bookRef.current?.pageFlip().flipNext()} className="rounded-full px-3 py-2 text-xs font-bold uppercase disabled:opacity-35">Next</button>
            <span aria-hidden="true" className="h-6 w-px bg-white/30" />
            <button type="button" onClick={toggleFullscreen} className="rounded-full bg-white px-3 py-2 text-xs font-bold uppercase text-black">Exit</button>
          </div>}
        </>
      )}
    </div>
  );
}
