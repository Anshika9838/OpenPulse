export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

// Trending repos pulled from GitHub search API
export async function GET() {
    const daysBack = 3;
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

    const res = await fetch(
        `https://api.github.com/search/repositories?q=created:>${since}&sort=stars&order=desc&per_page=20`,
        {
            headers: {
                Accept: "application/vnd.github.v3+json",
                ...(process.env.GITHUB_TOKEN
                    ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
                    : {}),
            },
            next: { revalidate: 3600 }, // Cache for 1 hour on Vercel
        }
    );

    if (!res.ok) {
        return NextResponse.json({ error: "GitHub API failed" }, { status: 502 });
    }

    const data = await res.json();
    const repos = data.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        fullName: item.full_name,
        description: item.description,
        url: item.html_url,
        stars: item.stargazers_count,
        forks: item.forks_count,
        language: item.language,
        owner: {
            login: item.owner.login,
            avatar: item.owner.avatar_url,
        },
        ogImage: `https://opengraph.githubassets.com/1/${item.full_name}`,
    }));

    // Shuffle to show in random order as specified
    const shuffled = repos.sort(() => Math.random() - 0.5);

    return NextResponse.json(shuffled);
}
