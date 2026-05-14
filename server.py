#!/usr/bin/env python3
"""Simple SQLite download counter for Planet Seeker."""

import sqlite3
import os
from http.server import SimpleHTTPRequestHandler, BaseHTTPRequestHandler
import json

DB_PATH = "planet_downloads.db"

def init_db():
    """Initialize the database with schema and default data."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create table if not exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS planet_downloads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            planet_name TEXT NOT NULL UNIQUE,
            total_count INTEGER NOT NULL DEFAULT 0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Insert default planets if table is empty
    cursor.execute("SELECT COUNT(*) FROM planet_downloads")
    if cursor.fetchone()[0] == 0:
        default_planets = [
            ("Moon", 0), ("Mercury", 0), ("Venus", 0), ("Mars", 0),
            ("Jupiter", 0), ("Saturn", 0), ("Uranus", 0), ("Neptune", 0)
        ]
        cursor.executemany(
            "INSERT INTO planet_downloads (planet_name, total_count) VALUES (?, ?)",
            default_planets
        )
    
    conn.commit()
    conn.close()

def get_download_count(planet_name):
    """Get the current download count for a planet."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT total_count FROM planet_downloads WHERE planet_name = ?", (planet_name,))
        result = cursor.fetchone()
        conn.close()
        return result[0] if result else 0
    except Exception:
        return 0

def increment_download(planet_name):
    """Increment the download count for a planet."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Use INSERT OR REPLACE to atomically update the count
        cursor.execute("""
            INSERT INTO planet_downloads (planet_name, total_count) 
            VALUES (?, 1) 
            ON CONFLICT(planet_name) DO UPDATE SET total_count = total_count + 1
        """, (planet_name,))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error incrementing download count for {planet_name}: {e}")
        return False

def get_all_counts():
    """Get all planet download counts."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT planet_name, total_count FROM planet_downloads ORDER BY planet_name")
        results = cursor.fetchall()
        conn.close()
        return {row[0]: row[1] for row in results}
    except Exception:
        return {}

def save_html_template():
    """Save the HTML template to a file."""
    html_content = read_file("Planets.html")
    
    # Find and replace download count display sections
    replacements = []
    
    # Pattern: <span class="download-count" id="X-count">Downloads: 0</span>
    import re
    
    def replace_count(match):
        planet_id = match.group(1)
        current_count = get_download_count(planet_id)
        return f'<span class="download-count" id="{planet_id}-count">Downloads: {current_count}</span>'
    
    # Replace all download count displays
    pattern = r'(<span class="download-count" id="(Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune)-count">\s*Downloads:\s*\d+</span>)'
    html_content, _ = replace_all(html_content, pattern, replace_count)
    
    # Save the updated HTML
    with open("Planets.html", "w") as f:
        f.write(html_content)

def read_file(path):
    """Read file contents."""
    try:
        with open(path, "r") as f:
            return f.read()
    except Exception:
        return ""

def replace_all(text, pattern, replacer):
    """Replace all matches of a regex pattern using the replacer function."""
    import re
    
    def match_replacer(match):
        result = replacer(match)
        if isinstance(result, tuple):
            return result[1], result[0]  # (replacement, count)
        return result, 1
    
    new_text, total_count = re.subn(pattern, match_replacer, text)
    return new_text, total_count

def main():
    """Main entry point."""
    print("Starting Planet Seeker Download Counter Server...")
    
    # Initialize database
    init_db()
    
    # Save HTML template with live counts
    save_html_template()
    
    # Start simple HTTP server on port 8000
    print("\nServer running at http://localhost:8000")
    print("Press Ctrl+C to stop\n")
    
    handler = SimpleHTTPRequestHandler
    
    # Use ThreadingHTTPServer for concurrent requests
    from socketserver import ThreadingMixIn
    class ThreadedHTTPServer(ThreadingMixIn, BaseHTTPRequestHandler):
        allow_reuse_address = True
        
        def do_GET(self):
            if self.path == "/api/increment/<planet_name>":
                # Extract planet name from URL
                import urllib.parse
                parsed = urllib.parse.urlparse(self.path)
                path_parts = parsed.path.split("/")
                if len(path_parts) >= 3 and path_parts[-2] == "api" and path_parts[-1].startswith("increment"):
                    planet_name = path_parts[-1].replace("increment_", "")
                    
                    # Increment download count
                    increment_download(planet_name)
                    
                    # Return JSON response
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    response = json.dumps({"success": True, "planet": planet_name})
                    self.wfile.write(response.encode())
                    return
            
            # Default: serve static files
            SimpleHTTPRequestHandler.do_GET(self)
        
        def log_message(self, format, *args):
            print(f"[Server] {format % args}")
    
    server_address = ("127.0.0.1", 8000)
    httpd = ThreadedHTTPServer(server_address, handler)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.shutdown()

if __name__ == "__main__":
    main()