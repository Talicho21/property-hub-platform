import sqlite3
import json

conn = sqlite3.connect('dev.db')
cur = conn.cursor()
try:
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    print('TABLES:', cur.fetchall())
    cur.execute('PRAGMA table_info(User);')
    print('USER SCHEMA:', cur.fetchall())
    cur.execute('SELECT id,name,email,role,isApproved,createdAt FROM User;')
    rows = cur.fetchall()
    print('USERS:', json.dumps([{'id':r[0],'name':r[1],'email':r[2],'role':r[3],'isApproved':bool(r[4]),'createdAt':r[5]} for r in rows], indent=2))
except Exception as e:
    print('ERROR', e)
finally:
    conn.close()
