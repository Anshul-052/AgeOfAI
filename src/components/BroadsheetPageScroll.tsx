"use client";

import React from 'react';

interface BroadsheetPageScrollProps {
  children: React.ReactNode;
  className?: string;
}

export default function BroadsheetPageScroll({ children, className = '' }: BroadsheetPageScrollProps) {
  const handleScrollEvents = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className={`broadsheet-scroll ${className}`}
      onTouchStart={handleScrollEvents}
      onTouchMove={handleScrollEvents}
      onWheel={handleScrollEvents}
    >
      {children}
    </div>
  );
}
