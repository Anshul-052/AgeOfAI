"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StoryCard, { Story } from '@/components/StoryCard';
import { getBookmarks, generateStudyGuideMarkdown, saveBookmarks } from '@/lib/bookmarks';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Story[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Bookmarks live in localStorage and can only be read after the client mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBookmarks(getBookmarks());
    setMounted(true);
  }, []);

  const handleClearAll = () => {
    if (confirm('Clear all saved bookmarks?')) {
      saveBookmarks([]);
      setBookmarks([]);
    }
  };

  const handleExportMarkdown = () => {
    const mdContent = generateStudyGuideMarkdown(bookmarks);
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ageofai-study-guide-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  if (!mounted) return null;

  return (
    <main className="max-w-screen-xl mx-auto px-edge-margin py-stack-lg min-h-screen">
      {/* Print-Only Header */}
      <div className="hidden print:block mb-8 text-center border-b-2 border-black pb-4">
        <h1 className="text-4xl font-serif font-black uppercase tracking-widest">AgeOfAI — STUDY GUIDE</h1>
        <p className="text-sm font-mono uppercase mt-1">Computer Science & Engineering Student Collection</p>
      </div>

      {/* Screen-Only Header & Actions */}
      <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-outline-variant pb-4 gap-4">
        <div>
          <h1 className="font-headline-xl text-headline-xl uppercase">Student Study Collection</h1>
          <p className="text-sm text-on-surface-variant">Your saved broadsheet articles and revision bookmarks.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {bookmarks.length > 0 && (
            <>
              <button
                onClick={handleExportMarkdown}
                className="bg-primary text-on-primary text-xs font-label-caps uppercase px-4 py-2 rounded hover:opacity-90 transition-opacity flex items-center gap-1"
              >
                📥 Export Markdown (.md)
              </button>
              <button
                onClick={handlePrintPdf}
                className="border border-primary text-primary text-xs font-label-caps uppercase px-4 py-2 rounded hover:bg-primary hover:text-on-primary transition-colors flex items-center gap-1"
              >
                🖨️ Print Broadsheet PDF
              </button>
              <button
                onClick={handleClearAll}
                className="border border-outline text-on-surface-variant text-xs font-label-caps uppercase px-3 py-2 rounded hover:bg-red-500/10 hover:text-red-600 transition-colors"
              >
                Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="p-12 border border-dashed border-outline text-center rounded-lg">
          <p className="text-on-surface-variant text-base mb-4 font-serif">No stories saved in your study collection yet.</p>
          <p className="text-xs text-on-surface-variant mb-6">
            Click <strong>☆ Bookmark</strong> on any story card while reading issues to save articles for exam prep or research.
          </p>
          <Link
            href="/"
            className="inline-block bg-primary text-on-primary px-6 py-2 font-label-caps uppercase text-xs rounded hover:opacity-90"
          >
            Browse Latest Issue →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:block print:space-y-6">
          {bookmarks.map(story => (
            <div key={story.id} className="print:break-inside-avoid">
              <StoryCard story={story} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
