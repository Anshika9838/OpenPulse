import requests
import re
from datetime import datetime, timedelta
import dotenv
import os

dotenv.load_dotenv()

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
            "id": data.get("id"),
            "Username": username,
            "Repo Name": repo_name,
            "Description": data.get("description"),
            "Stars": data.get("stargazers_count"),
            "Contributor Count": contributor_count,
            "Social Share Image": f"https://opengraph.githubassets.com/1/{username}/{repo_name}",
            "URL": repo_url,
            "Demo": None or data.get("homepage")
        }

# --- Execution ---
my_token = os.getenv("GITHUB_TOKEN")
github = GitHubDiscovery(token=my_token)

trending_url = github.get_trending_repo_url(days_back=3)

if trending_url:
    details = github.get_repo_details(trending_url)
    print("\n--- REPOSITORY OF THE DAY ---")
    for k, v in details.items():
        print(f"{k}: {v}")
else:
    print("Search failed. Verify your token permissions.")
