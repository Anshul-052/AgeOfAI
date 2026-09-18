import StoryCard, { Story } from "./StoryCard";

interface DramaSectionProps {
  stories: Story[];
}

export default function DramaSection({ stories }: DramaSectionProps) {
  if (!stories || stories.length === 0) return null;

  return (
    <section className="bg-neutral-950 text-neutral-100 p-4 sm:p-6 border-4 border-amber-500 rounded-none relative shadow-2xl my-4 font-serif">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-neutral-950 font-mono text-xs uppercase px-4 py-1 border border-neutral-950 font-black tracking-widest">
        THE BACK PAGE: AI DRAMA AND CONTROVERSY
      </div>
      
      <div className="text-center border-b border-amber-500/40 pb-3 mb-4 mt-2">
        <h2 className="font-headline-xl text-2xl md:text-3xl uppercase tracking-wider text-amber-400 font-black leading-tight">
          Industry Feuds, Benchmark Contamination & Model Glitches
        </h2>
        <p className="text-xs font-mono text-neutral-400 mt-1 uppercase tracking-widest">
          Editorial Commentary & Uncensored Tech Opinion
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stories.map(story => (
          <div key={story.id} className="bg-neutral-900/90 p-4 border border-amber-500/30 rounded text-justify hyphens-auto">
            <StoryCard story={story} />
          </div>
        ))}
      </div>
    </section>
  );
}
