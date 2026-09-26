import type { Metadata } from "next";
import LandingFlipbook from "@/components/LandingFlipbook";

export const metadata: Metadata = {
  title: "AgeOfAI — Read across technology",
  description: "All of technology, mapped into a source-checked weekly magazine with a permanent searchable archive.",
};

export default function Home() {
  return <LandingFlipbook />;
}
