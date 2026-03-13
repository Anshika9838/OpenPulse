import sqlite3
import os

# Database file path
DB_PATH = 'comments.db'

def create_database():
    """Create the SQLite database and comments table."""
    # Remove existing database if it exists (for fresh start)
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    
    # Connect to SQLite database (creates it if it doesn't exist)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create comments table with nesting support
    cursor.execute('''
        CREATE TABLE comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_id TEXT NOT NULL,
            content TEXT NOT NULL,
            parent_id INTEGER,
            likes INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES comments(id)
        )
    ''')
    
    # Create index on parent_id for efficient nested queries
    cursor.execute('''
        CREATE INDEX idx_parent_id ON comments(parent_id)
    ''')
    
    # Create index on entity_id for efficient entity queries
    cursor.execute('''
        CREATE INDEX idx_entity_id ON comments(entity_id)
    ''')
    
    # Commit changes and close connection
    conn.commit()
    conn.close()
    
    print(f"Database created successfully at {DB_PATH}")

if __name__ == "__main__":
    create_database()