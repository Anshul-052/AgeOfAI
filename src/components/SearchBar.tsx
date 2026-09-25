export default function SearchBar() {
  return (
    <form action="/search" method="get" className="flex items-center border-b border-primary">
      <input
        type="text"
        name="q"
        placeholder="Find a story, topic, tool…"
        aria-label="Search the story archive"
        className="bg-transparent border-none outline-none focus:ring-0 text-label-caps font-label-caps uppercase w-48 placeholder-on-surface-variant px-2 py-1"
      />
      <button type="submit" aria-label="Search" className="p-1 hover:text-primary text-on-surface-variant">
        <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m16.25 16.25 4 4" />
        </svg>
      </button>
    </form>
  );
}
