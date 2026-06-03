import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'dev.db')
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute('PRAGMA foreign_keys = ON;')

cur.execute('''
CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    isApproved INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
''')

cur.execute('''
CREATE TABLE IF NOT EXISTS Property (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    location TEXT NOT NULL,
    images TEXT NOT NULL DEFAULT '[]',
    isPublished INTEGER NOT NULL DEFAULT 1,
    landlordId TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(landlordId) REFERENCES User(id) ON DELETE CASCADE
);
''')

seed_users = [
    ('admin@local.test', 'Local Admin', '$2a$10$BC54v1LWswFxEHYLZuMKWuspuuLa/O0wFnOctWg03dzlUZ5ytWRci', 'ADMIN', 1),
    ('landlord@local.test', 'Local Landlord', '$2a$10$IBA8WVLP83GU8NqiQuKCKOGLApYu0ZyKK5mix7513nPixm8gx.JVy', 'LANDLORD', 1),
    ('tenant@local.test', 'Local Tenant', '$2a$10$utAM6hM4Efslih4abdaT3.BMkJid2c8WALt7J90cgU23SlWDax5GS', 'TENANT', 1),
]

for email, name, hashed_password, role, approved in seed_users:
    cur.execute('SELECT id FROM User WHERE email = ?', (email,))
    if cur.fetchone() is None:
        cur.execute(
            'INSERT INTO User (id, name, email, password, role, isApproved, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            (os.urandom(16).hex(), name, email, hashed_password, role, approved, datetime.utcnow().isoformat(), datetime.utcnow().isoformat())
        )
        print('Created user', email)
    else:
        print('Already exists', email)

conn.commit()
conn.close()
print('SQLite seed complete. Dev users: admin@local.test/Admin123!, landlord@local.test/Landlord123!, tenant@local.test/Tenant123!')
