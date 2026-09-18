import { Story } from '@/components/StoryCard';

const BOOKMARKS_KEY = 'ageofai_bookmarks';
const LEGACY_BOOKMARKS_KEY = 'ages_of_ai_bookmarks';

export function getBookmarks(): Story[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY) ?? localStorage.getItem(LEGACY_BOOKMARKS_KEY);
    if (raw && !localStorage.getItem(BOOKMARKS_KEY)) {
      localStorage.setItem(BOOKMARKS_KEY, raw);
      localStorage.removeItem(LEGACY_BOOKMARKS_KEY);
    }
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBookmarks(bookmarks: Story[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    window.dispatchEvent(new Event('bookmarks-changed'));
  } catch (err) {
    console.error('Failed to save bookmarks:', err);
  }
}

export function isBookmarked(storyId: string): boolean {
  const bookmarks = getBookmarks();
  return bookmarks.some(b => b.id === storyId);
}

export function toggleBookmark(story: Story): boolean {
  const bookmarks = getBookmarks();
  const exists = bookmarks.some(b => b.id === story.id);
  
  if (exists) {
    const updated = bookmarks.filter(b => b.id !== story.id);
    saveBookmarks(updated);
    return false;
  } else {
    const updated = [...bookmarks, story];
    saveBookmarks(updated);
    return true;
  }
}

export function generateStudyGuideMarkdown(bookmarks: Story[]): string {
  const dateStr = new Date().toLocaleDateString('en-US', { dateStyle: 'full' });
  let md = `# 🎓 AgeOfAI — Computer Science Study Guide\n`;
  md += `*Generated on ${dateStr}*\n\n`;
  md += `---\n\n`;

  if (bookmarks.length === 0) {
    md += `*No bookmarked stories in collection.*\n`;
    return md;
  }

  bookmarks.forEach((story, idx) => {
    md += `## ${idx + 1}. ${story.title}\n`;
    md += `**Domain:** ${story.domain} | **Severity:** ${story.severity}\n`;
    md += `**Original Source:** [${story.sourceUrl}](${story.sourceUrl})\n\n`;
    md += `### Summary & Crux\n`;
    md += `${story.crux}\n\n`;
    if (story.tags && story.tags.length > 0) {
      md += `**Tags:** ${story.tags.map(t => `\`${t.name}\``).join(', ')}\n\n`;
    }
    md += `---\n\n`;
  });

  return md;
}
