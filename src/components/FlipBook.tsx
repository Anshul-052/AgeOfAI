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

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = document.fullscreenElement !== null;
      setIsFullscreen(active);
      if (active) {
        setIsOpened(true); // Fullscreen always opens directly into 2-page spread
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
      {/* Control Bar */}
      <div className={`w-full flex flex-wrap items-center justify-between gap-2 mb-2 px-3 select-none shrink-0 ${
        isFullscreen ? "absolute top-3 right-4 z-50 w-auto bg-black/60 p-1.5 rounded-lg backdrop-blur-md" : ""
      }`}>
        {!isFullscreen && (
          <span className="text-[10px] font-mono uppercase bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 font-bold">
            {preview ? 'Private draft preview' : `Template: ${layout.replace(/-/g, ' ')}`} • {children.length} pages {isMobile ? '• Mobile' : '• 16:9 fullscreen spread'}
          </span>
        )}

        <button
          onClick={toggleFullscreen}
          className="bg-primary text-on-primary font-label-caps text-xs uppercase px-3.5 py-1.5 rounded hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-lg font-bold"
          title={isFullscreen ? "Exit Fullscreen (Esc)" : "Enter Fullscreen Reader Mode"}
        >
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
      </div>

      {/* Closed-Book Starting State on Dashboard View */}
      {!isOpened && !isFullscreen ? (
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
