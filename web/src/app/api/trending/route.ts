export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const REFRESH_MS = 5 * 60 * 1000;
const MAX_REPOS = 100;

// Trending repos served from DB cache (refreshes every 5 minutes)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const daysBack = Math.min(30, Math.max(1, parseInt(searchParams.get("days") || "3", 10)));

    const meta = await prisma.trendingMeta.findUnique({ where: { id: 1 } });
    const now = Date.now();
    if (!meta || now - meta.lastFetched.getTime() > REFRESH_MS) {
        await refreshTrending(daysBack);
    }

    const total = await prisma.trendingRepo.count();
    const items = await prisma.trendingRepo.findMany({
        orderBy: [{ stars: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
    });

    const mapped = items.map((item) => ({
        id: item.id,
        name: item.name,
        fullName: item.fullName,
        description: item.description,
        url: item.url,
        stars: item.stars,
        forks: item.forks,
        language: item.language,
        owner: {
            login: item.ownerLogin,
            avatar: item.ownerAvatar,
        },
        ogImage: item.ogImage,
    }));

    const hasMore = page * limit < total;
    return NextResponse.json({ items: mapped, page, limit, total, hasMore });
}

async function refreshTrending(daysBack: number) {
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

    const res = await fetch(
        `https://api.github.com/search/repositories?q=created:>${since}&sort=stars&order=desc&per_page=${MAX_REPOS}&page=1`,
        {
            headers: {
                Accept: "application/vnd.github.v3+json",
                ...(process.env.GITHUB_TOKEN
                    ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
                    : {}),
            },
            cache: "no-store",
        }
    );

    if (!res.ok) {
        return;
    }

    const data = await res.json();
    const repos = (data.items || []).map((item: any) => ({
        id: item.id as number,
        name: item.name as string,
        fullName: item.full_name as string,
        description: item.description as string | null,
        url: item.html_url as string,
        stars: item.stargazers_count as number,
        forks: item.forks_count as number,
        language: item.language as string | null,
        ownerLogin: item.owner.login as string,
        ownerAvatar: item.owner.avatar_url as string,
        ogImage: `/api/og/${item.owner.login}/${item.name}`,
        fetchedAt: new Date(),
    }));

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        // Without a token we cannot reliably detect custom social images.
        // Disable OG images to avoid showing the default GitHub logo.
        repos.forEach(repo => { repo.ogImage = null; });
    }
    if (token && repos.length > 0) {
        // Chunk GraphQL queries to avoid size limits
        for (let i = 0; i < repos.length; i += 50) {
            const chunk = repos.slice(i, i + 50);
            const queryParts = chunk.map((repo, idx) => (
                `r${idx}: repository(owner: "${repo.ownerLogin}", name: "${repo.name}") { usesCustomOpenGraphImage }`
            ));
            const query = `query { ${queryParts.join(" ")} }`;

            try {
                const gqlRes = await fetch("https://api.github.com/graphql", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ query }),
                });

                if (gqlRes.ok) {
                    const gqlData = await gqlRes.json();
                    const repoFlags = gqlData?.data || {};
                    chunk.forEach((repo, idx) => {
                        const flag = repoFlags[`r${idx}`]?.usesCustomOpenGraphImage;
                        if (flag === false) {
                            repo.ogImage = null;
                        }
                    });
                }
            } catch {
                // If GraphQL fails, fall back to showing OG images.
            }
        }
    }

    await prisma.$transaction([
        prisma.trendingRepo.deleteMany(),
        prisma.trendingRepo.createMany({ data: repos }),
        prisma.trendingMeta.upsert({
            where: { id: 1 },
            create: { id: 1, lastFetched: new Date() },
            update: { lastFetched: new Date() },
        }),
    ]);
}
