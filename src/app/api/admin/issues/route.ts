import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const issues = await prisma.issue.findMany({
    select: { id: true, volume: true, issueNumber: true, isPublished: true },
    orderBy: [{ publishedAt: "desc" }, { issueNumber: "desc" }],
  });
  return NextResponse.json({ issues });
}
