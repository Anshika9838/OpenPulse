import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const failureCache = new Map<string, number>();
const FAILURE_TTL_MS = 10 * 60 * 1000;

// Proxy GitHub OpenGraph images through the server to avoid client-side 429s
export async function GET(
  _req: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  const { owner, repo } = params;
  const cacheKey = `${owner}/${repo}`;

  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) {
    return NextResponse.json({ error: "Invalid repo" }, { status: 400 });
  }

  const cachedFailAt = failureCache.get(cacheKey);
  if (cachedFailAt && Date.now() - cachedFailAt < FAILURE_TTL_MS) {
    return new NextResponse(null, { status: 404 });
  }

  const ogUrl = `https://opengraph.githubassets.com/1/${owner}/${repo}`;
  const res = await fetch(ogUrl, {
    headers: {
      Accept: "image/*",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    failureCache.set(cacheKey, Date.now());
    return new NextResponse(null, { status: 404 });
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
