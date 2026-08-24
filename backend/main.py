import json
import os
import sqlite3
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

DB_PATH = '/workspace/data/app.db'

def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS dashboard_state (
          id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )''')

app = FastAPI()
init_db()

class StatePayload(BaseModel):
    data: dict

@app.get('/api/health')
def health():
    return {'ok': True}

@app.get('/api/state')
def get_state():
    with get_db() as conn:
        row = conn.execute('SELECT data FROM dashboard_state WHERE id = 1').fetchone()
    return {'data': json.loads(row['data']) if row else None}

@app.put('/api/state')
def save_state(payload: StatePayload):
    encoded = json.dumps(payload.data, ensure_ascii=False)
    with get_db() as conn:
        conn.execute('''INSERT INTO dashboard_state (id, data, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP''', (encoded,))
    return {'ok': True}

@app.delete('/api/state')
def clear_state():
    with get_db() as conn:
        conn.execute('DELETE FROM dashboard_state WHERE id = 1')
    return {'ok': True}
