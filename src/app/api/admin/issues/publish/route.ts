import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { EditorialError, publishIssue } from "@/lib/editorial";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const issueId = typeof payload.issueId === "string" ? payload.issueId.trim() : "";
    if (!issueId) return NextResponse.json({ error: "issueId is required." }, { status: 400 });

    const issue = await publishIssue(prisma, issueId);

    for (const path of ["/", "/issues", `/issues/${issue.id}`, "/search", "/admin"]) revalidatePath(path);
    return NextResponse.json({ issue });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
    const message = error instanceof Error ? error.message : "Publication failed.";
    const status = error instanceof EditorialError ? error.status : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
