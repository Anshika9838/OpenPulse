import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Proxy GitHub OpenGraph images through the server to avoid client-side 429s
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const repo = searchParams.get("repo");

  if (!repo || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
    return NextResponse.json({ error: "Invalid repo" }, { status: 400 });
  }

  const ogUrl = `https://opengraph.githubassets.com/1/${repo}`;
  const res = await fetch(ogUrl, {
    headers: {
      Accept: "image/*",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
  }

  const contentType = res.headers.get("content-type") || "image/png";
  const arrayBuffer = await res.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
