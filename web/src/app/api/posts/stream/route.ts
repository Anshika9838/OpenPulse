import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Server-Sent Events stream for new posts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const typeParam = searchParams.get("type");
  const type = typeParam === "REPOSITORY" || typeParam === "PITCH" ? typeParam : null;
  const sinceParam = searchParams.get("since");
  const sinceDate = sinceParam ? new Date(sinceParam) : null;
  let lastSeen = sinceDate && !isNaN(sinceDate.getTime()) ? sinceDate : new Date(0);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const send = (data: string) => {
        if (closed) return;
        controller.enqueue(encoder.encode(data));
      };

      send("retry: 5000\n\n");

      const tick = async () => {
        if (closed) return;
        try {
          const posts = await prisma.post.findMany({
            where: {
              ...(type ? { type: type as "REPOSITORY" | "PITCH" } : {}),
              createdAt: { gt: lastSeen },
            },
            include: {
              author: { select: { id: true, name: true, image: true } },
              _count: { select: { stars: true, comments: true } },
            },
            orderBy: { createdAt: "asc" },
            take: 20,
          });

          if (posts.length > 0) {
            lastSeen = posts[posts.length - 1].createdAt;
            send(`data: ${JSON.stringify(posts)}\n\n`);
          } else {
            // keep-alive comment
            send(":\n\n");
          }
        } catch {
          send("event: error\ndata: {}\n\n");
        }
      };

      const interval = setInterval(tick, 5000);
      tick();

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
