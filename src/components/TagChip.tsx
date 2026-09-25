import Link from "next/link";

interface TagChipProps {
  name: string;
}

export default function TagChip({ name }: TagChipProps) {
  return (
    <Link href={`/topics/${encodeURIComponent(name)}`}>
      <span className="inline-block border border-primary px-2 py-1 font-label-caps text-label-caps uppercase hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">
        {name}
      </span>
    </Link>
  );
}
