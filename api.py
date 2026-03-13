import sqlite3
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import requests
import re
from datetime import datetime, timedelta
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

    def get_repo_details(self, repo_url):
        """Parses the repo and gets the contributor count + metadata."""
        match = re.search(r"github\.com/([^/]+)/([^/]+)", repo_url)
        if not match: return {"error": "Invalid URL"}

        username, repo_name = match.groups()
        repo_name = repo_name.replace(".git", "")
        api_url = f"{self.base_url}/repos/{username}/{repo_name}"

        # 1. Main Data
        res = requests.get(api_url, headers=self.headers)
        if res.status_code != 200: return {"error": f"API Fail: {res.status_code}"}
        data = res.json()

        # 2. Contributor Count (Pagination Trick)
        c_url = f"{api_url}/contributors?per_page=1&anon=1"
        c_res = requests.get(c_url, headers=self.headers)
        
        if "Link" in c_res.headers:
            last_page = re.search(r'page=(\d+)>; rel="last"', c_res.headers["Link"])
            contributor_count = int(last_page.group(1)) if last_page else 0
        else:
            res_json = c_res.json()
            contributor_count = len(res_json) if isinstance(res_json, list) else 0

        return {
            "id": data.get("id"),  # Add ID for commenting
            "Username": username,
            "Repo Name": repo_name,
            "Description": data.get("description"),
            "Stars": data.get("stargazers_count"),
            "Contributor Count": contributor_count,
            "Social Share Image": f"https://opengraph.githubassets.com/1/{username}/{repo_name}",
            "URL": repo_url,
            "Demo": None or data.get("homepage")
        }

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

CommentResponse.update_forward_refs()

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
    """Get details of the trending GitHub repository."""
    token = os.getenv("GITHUB_TOKEN")
    github = GitHubDiscovery(token)
    url = github.get_trending_repo_url(days_back=3)
    if not url:
        raise HTTPException(status_code=404, detail="No trending repo found")
    details = github.get_repo_details(url)
    if "error" in details:
        raise HTTPException(status_code=500, detail=details["error"])
    return details

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