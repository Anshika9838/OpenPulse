import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/messages?otherUserId=xxx (conversation thread)
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get("otherUserId");
    if (!otherUserId) return NextResponse.json({ error: "otherUserId required" }, { status: 400 });

    const messages = await prisma.message.findMany({
        where: {
            OR: [
                { senderId: session.user.id, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: session.user.id },
            ],
        },
        orderBy: { createdAt: "asc" },
        include: {
            sender: { select: { id: true, name: true, image: true } },
        },
    });

    // Mark received messages as read
    await prisma.message.updateMany({
        where: { senderId: otherUserId, receiverId: session.user.id, read: false },
        data: { read: true },
    });

    return NextResponse.json(messages);
}

// POST /api/messages (send a message)
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { receiverId, content } = await req.json();
    if (!receiverId || !content) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const message = await prisma.message.create({
        data: { senderId: session.user.id, receiverId, content },
        include: { sender: { select: { id: true, name: true, image: true } } },
    });

    return NextResponse.json(message, { status: 201 });
}
