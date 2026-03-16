import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/posts/[id]/comments
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const comments = await prisma.comment.findMany({
        where: { postId: id, parentId: null },
        include: {
            author: { select: { id: true, name: true, image: true } },
            replies: {
                include: { author: { select: { id: true, name: true, image: true } } },
                orderBy: { createdAt: "asc" },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(comments);
}

// POST /api/posts/[id]/comments
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, parentId } = await req.json();

    const comment = await prisma.comment.create({
        data: {
            content,
            postId: id,
            authorId: session.user.id,
            parentId: parentId || null,
        },
        include: {
            author: { select: { id: true, name: true, image: true } },
        },
    });

    return NextResponse.json(comment, { status: 201 });
}
