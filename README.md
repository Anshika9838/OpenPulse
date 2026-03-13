# GitHub Trending Repos & Comments API

A Python application that discovers trending GitHub repositories and provides a REST API for nested commenting and liking functionality. Built with FastAPI and SQLite for lightweight, scalable comment management.

## Features

- **Trending Repository Discovery**: Automatically finds the most starred GitHub repository from recent days using the GitHub API
- **Nested Comments System**: SQLite-based database supporting unlimited nested replies and likes
- **RESTful API**: FastAPI-powered endpoints for repository details, commenting, and interaction
- **Authentication Support**: Optional GitHub token for higher API rate limits
- **Auto-generated Documentation**: Interactive API docs at `/docs` and `/redoc`

## Project Structure

```
CodeBit/
├── app.py                 # CLI script for trending repo discovery
├── api.py                 # FastAPI server application
├── setup_db.py           # Database initialization script
├── comments.db           # SQLite database (generated)
├── requirements.txt      # Python dependencies
├── .env                  # Environment variables (optional)
├── .gitignore           # Git ignore rules
├── README.md            # This file
├── LICENSE              # MIT License
└── CODE_OF_CONDUCT.md   # Contributor guidelines
```

## Prerequisites

- Python 3.8 or higher
- GitHub Personal Access Token (optional, for higher API limits)

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd CodeBit
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment**:
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up environment variables** (optional):
   Create a `.env` file in the root directory:
   ```
   GITHUB_TOKEN=your_github_personal_access_token_here
   ```
   Get a token from [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens).

6. **Initialize the database**:
   ```bash
   python setup_db.py
   ```

## Usage

### CLI Mode (Trending Repo Discovery)

Run the CLI script to discover and display trending repository details:

```bash
python app.py
```

Example output:
```
--- REPOSITORY OF THE DAY ---
Username: microsoft
Repo Name: vscode
Description: Visual Studio Code
Stars: 150000
Contributor Count: 1200
Social Share Image: https://opengraph.githubassets.com/1/microsoft/vscode
URL: https://github.com/microsoft/vscode
Demo: https://code.visualstudio.com/
```

### API Server Mode

Start the FastAPI server:

```bash
python api.py
```

The server will start at `http://localhost:8000`.

#### API Endpoints

- **`GET /trending-repo`**
  - Returns details of the current trending GitHub repository
  - Response includes repository ID for commenting

- **`POST /comment`**
  - Create a new comment or reply
  - Body: `{"entity_id": "string", "content": "string", "parent_id": null|int}`
  - `entity_id`: Repository identifier (e.g., "owner/repo")
  - `parent_id`: null for top-level comments, comment ID for replies

- **`GET /comments/{entity_id}`**
  - Retrieve nested comment threads for a repository
  - Returns hierarchical comment structure

- **`PATCH /comment/{comment_id}/like`**
  - Increment the like count for a specific comment

#### API Documentation

Visit `http://localhost:8000/docs` for interactive Swagger UI documentation, or `http://localhost:8000/redoc` for ReDoc documentation.

#### Example API Usage

1. Get trending repo:
   ```bash
   curl http://localhost:8000/trending-repo
   ```

2. Add a comment:
   ```bash
   curl -X POST http://localhost:8000/comment \
     -H "Content-Type: application/json" \
     -d '{"entity_id": "microsoft/vscode", "content": "Great project!", "parent_id": null}'
   ```

3. Get comments:
   ```bash
   curl http://localhost:8000/comments/microsoft/vscode
   ```

4. Like a comment:
   ```bash
   curl -X PATCH http://localhost:8000/comment/1/like
   ```

## Database Schema

The SQLite database (`comments.db`) contains a single `comments` table:

```sql
CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_id TEXT NOT NULL,           -- Repository or entity identifier
    content TEXT NOT NULL,             -- Comment content
    parent_id INTEGER,                 -- Parent comment ID (null for top-level)
    likes INTEGER DEFAULT 0,           -- Like count
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES comments(id)
);
```

Indexes are created on `parent_id` and `entity_id` for efficient queries.

## Development

### Running Tests

Currently, no automated tests are implemented. Manual testing via API endpoints is recommended.

### Code Style

This project follows standard Python conventions. Consider using tools like `black` for code formatting and `flake8` for linting.

## Contributing

We welcome contributions! Please read our `CODE_OF_CONDUCT.md` before contributing.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -am 'Add some feature'`
5. Push to the branch: `git push origin feature/your-feature`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.

## Support

If you encounter issues or have questions:

1. Check the API documentation at `/docs`
2. Review the code in `api.py` and `app.py`
3. Ensure your environment is set up correctly
4. Check GitHub API rate limits if using without a token

## Roadmap

- [ ] User authentication and authorization
- [ ] Comment editing and deletion
- [ ] Pagination for large comment threads
- [ ] Webhook integration for real-time updates
- [ ] Caching layer for performance
- [ ] Docker containerization
