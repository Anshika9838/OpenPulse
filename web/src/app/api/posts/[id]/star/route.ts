import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/posts/[id]/star  -- toggle star
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.star.findUnique({
        where: { userId_postId: { userId: session.user.id, postId: id } },
    });

    if (existing) {
        await prisma.star.delete({ where: { id: existing.id } });
        return NextResponse.json({ starred: false });
    }

    await prisma.star.create({
        data: { userId: session.user.id, postId: id },
    });

    return NextResponse.json({ starred: true });
}
