import sqlite3
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import requests
import re
from datetime import datetime, timedelta, timezone
import os
import dotenv

dotenv.load_dotenv()

app = FastAPI(title="GitHub Comments API", description="API for trending repos and nested comments")

# Database path
DB_PATH = 'comments.db'

# GitHubDiscovery class (copied from app.py)
class GitHubDiscovery:
    def __init__(self, token=None):
        self.token = token
        self.base_url = "https://api.github.com"
        self.headers = {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/vnd.github.v3+json'
        }
        if self.token:
            self.headers['Authorization'] = f'token {self.token}'

    def get_trending_repo_url(self, days_back=1):
        """Finds the most starred repository with proper URL encoding."""
        date_limit = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
        
        search_url = f"{self.base_url}/search/repositories"
        
        # Using a dictionary for 'params' ensures the '>' is encoded to '%3E'
        query_params = {
            'q': f'created:>{date_limit}',
            'sort': 'stars',
            'order': 'desc',
            'per_page': 1
        }
        
        response = requests.get(search_url, headers=self.headers, params=query_params)
        
        if response.status_code == 200:
            data = response.json()
            items = data.get('items', [])
            if items:
                return items[0]['html_url']
        
        # Fallback: If no repo found for today, check the last 30 days
        if days_back < 30:
            print(f"No results for the last {days_back} day(s). Expanding search...")
            return self.get_trending_repo_url(days_back=30)
            
        return None

    def get_trending_repos(self, count: int = 10, days_back: int = 1):
        """Returns a list of top repos (by stars) created within the last N days."""
        date_limit = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
        search_url = f"{self.base_url}/search/repositories"
        query_params = {
            'q': f'created:>{date_limit}',
            'sort': 'stars',
            'order': 'desc',
            'per_page': count
        }
        
        response = requests.get(search_url, headers=self.headers, params=query_params)
        if response.status_code != 200:
            return []

        data = response.json()
        items = data.get('items', [])
        if not items and days_back < 30:
            # Expand the search window if nothing is found
            return self.get_trending_repos(count=count, days_back=30)

        repos = []
        for item in items:
            html_url = item.get('html_url')
            if not html_url:
                continue
            details = {
                "id": item.get("id"),
                "Username": (item.get("owner") or {}).get("login"),
                "Repo Name": item.get("name"),
                "Full Name": item.get("full_name"),
                "Description": item.get("description"),
                "Stars": item.get("stargazers_count"),
                "Forks": item.get("forks_count"),
                "Contributor Count": None,
                "Owner Avatar": (item.get("owner") or {}).get("avatar_url"),
                "Social Share Image": f"https://opengraph.githubassets.com/1/{(item.get('owner') or {}).get('login')}/{item.get('name')}",
                "URL": html_url,
                "Demo": None or item.get("homepage"),
            }
            repos.append(details)

        return repos

    def get_popular_repos_latest_releases(
        self,
        n: int = 10,
        release_days_back: int = 30,
        min_stars: int = 50,
        per_page: int = 50,
        max_pages: int = 10,
    ):
        now_utc = datetime.now(timezone.utc)
        cutoff = now_utc - timedelta(days=release_days_back)

        search_url = f"{self.base_url}/search/repositories"
        results = []

        for page in range(1, max_pages + 1):
            query_params = {
                'q': f'stars:>={min_stars} archived:false',
                'sort': 'stars',
                'order': 'desc',
                'per_page': per_page,
                'page': page,
            }

            response = requests.get(search_url, headers=self.headers, params=query_params)
            if response.status_code in (401, 403):
                try:
                    payload = response.json()
                except Exception:
                    payload = {}
                message = payload.get('message') or f"GitHub API returned {response.status_code}"
                reset = response.headers.get('X-RateLimit-Reset')
                if reset and 'rate limit' in message.lower():
                    try:
                        reset_dt = datetime.fromtimestamp(int(reset), tz=timezone.utc)
                        message = f"{message} (resets at {reset_dt.isoformat()})"
                    except Exception:
                        pass
                raise RuntimeError(message)
            if response.status_code != 200:
                break

            data = response.json()
            items = data.get('items', [])
            if not items:
                break

            for item in items:
                full_name = item.get('full_name')
                html_url = item.get('html_url')
                if not full_name or not html_url:
                    continue

                latest_release_url = f"{self.base_url}/repos/{full_name}/releases/latest"
                r = requests.get(latest_release_url, headers=self.headers)
                if r.status_code == 404:
                    continue
                if r.status_code in (401, 403):
                    try:
                        payload = r.json()
                    except Exception:
                        payload = {}
                    message = payload.get('message') or f"GitHub API returned {r.status_code}"
                    reset = r.headers.get('X-RateLimit-Reset')
                    if reset and 'rate limit' in message.lower():
                        try:
                            reset_dt = datetime.fromtimestamp(int(reset), tz=timezone.utc)
                            message = f"{message} (resets at {reset_dt.isoformat()})"
                        except Exception:
                            pass
                    raise RuntimeError(message)
                if r.status_code != 200:
                    continue

                release = r.json()
                published_at = release.get('published_at')
                if not published_at:
                    continue

                try:
                    published_dt = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                except Exception:
                    continue

                if published_dt < cutoff:
                    continue

                details = {
                    "id": item.get("id"),
                    "Username": (item.get("owner") or {}).get("login"),
                    "Repo Name": item.get("name"),
                    "Full Name": item.get("full_name"),
                    "Description": item.get("description"),
                    "Stars": item.get("stargazers_count"),
                    "Forks": item.get("forks_count"),
                    "Contributor Count": None,
                    "Owner Avatar": (item.get("owner") or {}).get("avatar_url"),
                    "Social Share Image": f"https://opengraph.githubassets.com/1/{(item.get('owner') or {}).get('login')}/{item.get('name')}",
                    "URL": html_url,
                    "Demo": None or item.get("homepage"),
                }

                details["Latest Release"] = {
                    "Name": release.get("name"),
                    "Tag": release.get("tag_name"),
                    "Published At": published_at,
                    "URL": release.get("html_url"),
                }
                results.append(details)

        return results

# Pydantic models
class CommentCreate(BaseModel):
    entity_id: str
    content: str
    parent_id: Optional[int] = None

class CommentResponse(BaseModel):
    id: int
    entity_id: str
    content: str
    parent_id: Optional[int]
    likes: int
    created_at: str
    replies: List['CommentResponse'] = []

CommentResponse.model_rebuild()

# Database functions
def get_db_connection():
    return sqlite3.connect(DB_PATH)

def add_comment(entity_id: str, content: str, parent_id: Optional[int] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO comments (entity_id, content, parent_id) VALUES (?, ?, ?)",
        (entity_id, content, parent_id)
    )
    comment_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return comment_id

def get_comments_for_entity(entity_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, entity_id, content, parent_id, likes, created_at FROM comments WHERE entity_id = ? ORDER BY created_at",
        (entity_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    
    # Build nested structure
    comment_dict = {}
    root_comments = []
    
    for row in rows:
        comment = {
            "id": row[0],
            "entity_id": row[1],
            "content": row[2],
            "parent_id": row[3],
            "likes": row[4],
            "created_at": row[5],
            "replies": []
        }
        comment_dict[row[0]] = comment
    
    for comment in comment_dict.values():
        if comment["parent_id"]:
            if comment["parent_id"] in comment_dict:
                comment_dict[comment["parent_id"]]["replies"].append(comment)
        else:
            root_comments.append(comment)
    
    return root_comments

# API Routes
@app.get("/trending-repo")
def get_trending_repo():
    """Get details of the top trending GitHub repositories."""
    token = os.getenv("GITHUB_TOKEN")
    github = GitHubDiscovery(token)
    repos = github.get_trending_repos(count=10, days_back=3)
    if not repos:
        raise HTTPException(status_code=404, detail="No trending repos found")
    return repos

@app.get("/popular-latest-releases")
def get_popular_latest_releases(n: int = 10, release_days_back: int = 30, min_stars: int = 50):
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        raise HTTPException(status_code=400, detail="Missing GITHUB_TOKEN. Set it in your environment to avoid GitHub API rate limits.")
    github = GitHubDiscovery(token)
    try:
        repos = github.get_popular_repos_latest_releases(
            n=n,
            release_days_back=release_days_back,
            min_stars=min_stars,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    if not repos:
        raise HTTPException(status_code=404, detail="No repos with recent releases found")
    return repos

@app.post("/comment", response_model=dict)
def create_comment(comment: CommentCreate):
    """Create a new comment or reply."""
    comment_id = add_comment(comment.entity_id, comment.content, comment.parent_id)
    return {"id": comment_id, "message": "Comment added successfully"}

@app.get("/comments/{entity_id}", response_model=List[CommentResponse])
def get_comments(entity_id: str):
    """Get all comments and replies for a specific entity."""
    return get_comments_for_entity(entity_id)

@app.patch("/comment/{comment_id}/like")
def like_comment(comment_id: int):
    """Increment likes for a comment."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE comments SET likes = likes + 1 WHERE id = ?", (comment_id,))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Comment not found")
    conn.commit()
    conn.close()
    return {"message": "Like added"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)