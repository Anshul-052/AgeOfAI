"use client";

import React, { useState, useEffect, useRef } from "react";
import HTMLFlipBook from "react-pageflip";

interface FlipBookProps {
  children: React.ReactNode[];
  layout?: string;
  preview?: boolean;
}

export default function FlipBook({ children, layout = "lead-story-focus", preview = false }: FlipBookProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [pageStart, setPageStart] = useState(0);
  const spreadSize = isMobile ? 1 : 2;
  const lastPageStart = Math.max(0, Math.floor((children.length - 1) / spreadSize) * spreadSize);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = document.fullscreenElement !== null;
      setIsFullscreen(active);
      if (active) {
        setIsOpened(true);
        setPageStart(0);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const calculateDimensions = () => {
      if (typeof window === "undefined") return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const mobile = viewportWidth < 768;
      setIsMobile(mobile);

      if (document.fullscreenElement) {
        if (mobile) {
          setDimensions({ width: viewportWidth, height: viewportHeight });
        } else {
          // Each page is half of a 16:9 spread. At 1920x1080 this is
          // exactly two 960x1080 pages with no letterboxing.
          setDimensions({ width: Math.floor(viewportWidth / 2), height: viewportHeight });
        }
      } else {
        // Dynamically calculate top offset based on rendered container position
        const containerTop = containerRef.current ? containerRef.current.getBoundingClientRect().top : 120;
        const maxAvailableHeight = Math.max(360, viewportHeight - containerTop - 30);
        const pageRatio = mobile ? 0.75 : 8 / 9;
        const maxAvailableWidth = mobile ? Math.max(300, viewportWidth - 24) : Math.max(300, (viewportWidth - 40) / 2);
        const computedHeight = Math.min(maxAvailableHeight, maxAvailableWidth / pageRatio);
        const computedWidth = computedHeight * pageRatio;

        const width = Math.floor(Math.max(300, computedWidth));
        const height = Math.floor(Math.max(350, computedHeight));

        setDimensions({ width, height });
      }
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
      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault();
        setPageStart(current => Math.min(lastPageStart, current + spreadSize));
      }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        setPageStart(current => Math.max(0, current - spreadSize));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, lastPageStart, spreadSize]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen({ navigationUI: "hide" });
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error("Fullscreen toggle error:", err);
    }
  };

  const handleOpenBook = () => {
    setIsOpened(true);
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full flex flex-col items-center justify-center transition-all ${
        isFullscreen 
          ? "fixed inset-0 z-50 bg-neutral-950 p-0 m-0 overflow-hidden" 
          : "my-1 shadow-2xl bg-surface-variant/15 p-2 md:p-3 rounded-lg border border-outline-variant/60 max-w-full overflow-hidden"
      }`}
    >
      {!isFullscreen && <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-2 px-3 select-none shrink-0">
        <span className="text-[10px] font-mono uppercase bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 font-bold">
          {preview ? 'Private draft preview' : `Template: ${layout.replace(/-/g, ' ')}`} • {children.length} pages {isMobile ? '• Mobile' : '• 16:9 fullscreen spread'}
        </span>

        <button
          onClick={toggleFullscreen}
          className="bg-primary text-on-primary font-label-caps text-xs uppercase px-3.5 py-1.5 rounded hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-lg font-bold"
          title="Enter Fullscreen Reader Mode"
        >
          Fullscreen
        </button>
      </div>}

      {isFullscreen ? (
        <>
          <div className={`grid h-screen w-screen ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} bg-neutral-900`}>
            {Array.from({ length: spreadSize }, (_, offset) => {
              const pageIndex = pageStart + offset;
              const page = children[pageIndex];
              return (
                <section key={pageIndex} className="h-screen min-w-0 overflow-hidden border-r border-neutral-500 bg-surface p-3 sm:p-5 box-border" aria-label={page ? `Magazine page ${pageIndex + 1}` : 'End of issue'}>
                  {page || <div className="grid h-full place-items-center border border-outline-variant font-headline-xl text-3xl text-on-surface-variant">End of issue</div>}
                </section>
              );
            })}
          </div>
          <div className="absolute inset-x-0 bottom-4 z-50 mx-auto flex w-fit items-center gap-2 rounded-full border border-white/30 bg-black/80 p-1.5 text-white shadow-2xl backdrop-blur-md">
            <button type="button" disabled={pageStart === 0} onClick={() => setPageStart(current => Math.max(0, current - spreadSize))} className="rounded-full px-3 py-2 text-xs font-bold uppercase disabled:opacity-35">Previous</button>
            <span className="min-w-24 text-center font-mono text-[10px] uppercase">{preview ? 'Draft · ' : ''}{pageStart + 1}–{Math.min(children.length, pageStart + spreadSize)} / {children.length}</span>
            <button type="button" disabled={pageStart >= lastPageStart} onClick={() => setPageStart(current => Math.min(lastPageStart, current + spreadSize))} className="rounded-full px-3 py-2 text-xs font-bold uppercase disabled:opacity-35">Next</button>
            <span aria-hidden="true" className="h-6 w-px bg-white/30" />
            <button type="button" onClick={toggleFullscreen} className="rounded-full bg-white px-3 py-2 text-xs font-bold uppercase text-black">Exit</button>
          </div>
        </>
      ) : !isOpened ? (
        <div 
          onClick={handleOpenBook}
          className="cursor-pointer group flex flex-col items-center justify-center my-3 transition-transform duration-300 hover:scale-[1.015] select-none"
        >
          <div 
            className="bg-surface border-4 border-primary shadow-2xl rounded-r-md relative overflow-hidden flex flex-col justify-between p-0 box-border"
            style={{ 
              width: `${dimensions.width}px`, 
              height: `${dimensions.height}px`,
              boxShadow: "25px 25px 50px rgba(0,0,0,0.35), inset 8px 0 16px rgba(0,0,0,0.25)"
            }}
          >
            {/* Book Spine Overlay */}
            <div className="absolute top-0 left-0 bottom-0 w-6 bg-gradient-to-r from-neutral-900/60 via-neutral-900/20 to-transparent z-10 pointer-events-none border-r border-primary/40"></div>

            {/* Closed Cover Content Preview */}
            <div className="w-full h-full pointer-events-none">
              {children[0]}
            </div>

            {/* Click to Open Floating Action Callout */}
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors z-20 flex items-center justify-center p-4">
              <span className="bg-primary text-on-primary font-headline-md text-sm md:text-base uppercase px-6 py-3 rounded-full shadow-2xl border-2 border-on-primary font-black tracking-wider flex items-center gap-2 group-hover:scale-105 transition-transform">
                Open Broadsheet Issue
              </span>
            </div>
          </div>
          <p className="text-xs font-mono uppercase text-on-surface-variant mt-2.5 tracking-widest font-bold">
            Click Cover to Open Interactive Sunday Edition
          </p>
        </div>
      ) : (
        /* Open Broadsheet Spread Reading View */
        /* @ts-expect-error - react-pageflip types */
        <HTMLFlipBook
          key={`${dimensions.width}x${dimensions.height}`}
          width={dimensions.width} 
          height={dimensions.height}
          size="fixed"
          minWidth={300}
          maxWidth={1800}
          minHeight={350}
          maxHeight={1600}
          maxShadowOpacity={0.4}
          showCover={false}
          mobileScrollSupport={true}
          className="demo-book"
          style={{ margin: "0 auto" }}
        >
          {children.map((child, index) => (
            <div 
              key={index} 
              className="page bg-surface border border-outline-variant/80 overflow-hidden p-3 sm:p-4 page-curl h-full flex flex-col justify-between box-border"
              style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
            >
              {child}
            </div>
          ))}
        </HTMLFlipBook>
      )}
    </div>
  );
}
