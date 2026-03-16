import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: Fetch paginated posts (feed)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const type = searchParams.get("type"); // 'REPOSITORY' | 'PITCH'

    const posts = await prisma.post.findMany({
        where: type ? { type: type as "REPOSITORY" | "PITCH" } : {},
        include: {
            author: { select: { id: true, name: true, image: true } },
            _count: { select: { stars: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
    });

    return NextResponse.json(posts);
}

// POST: Create a new post
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, url, mediaUrl, tags, type } = await req.json();

    const post = await prisma.post.create({
        data: {
            title,
            description,
            url,
            mediaUrl,
            tags: Array.isArray(tags) ? tags.join(",") : (tags || ""),
            type: type || "REPOSITORY",
            authorId: session.user.id,
        },
        include: {
            author: { select: { id: true, name: true, image: true } },
            _count: { select: { stars: true, comments: true } },
        },
    });

    return NextResponse.json(post, { status: 201 });
}
