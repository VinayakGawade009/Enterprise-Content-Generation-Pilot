import sqlite3
from langgraph.checkpoint.sqlite import SqliteSaver
import os

def test_sqlite():
    DB_PATH = "test.sqlite"
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    memory = SqliteSaver(conn)
    print("Success, SqliteSaver working synchronously")
    
if __name__ == "__main__":
    test_sqlite()
