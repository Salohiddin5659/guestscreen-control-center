import sqlite3
import os
import datetime
from config import ALLOWED_USERS, USER_NAMES

DB_PATH = os.environ.get("BOT_DB_PATH", "/opt/open_door_bot/bot.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                is_active INTEGER NOT NULL DEFAULT 1,
                added_by INTEGER,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        conn.commit()

        # Seed initial users if table is empty
        cursor.execute("SELECT COUNT(*) as count FROM users")
        count = cursor.fetchone()["count"]
        if count == 0:
            now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            for uid in ALLOWED_USERS:
                name = USER_NAMES.get(uid, f"User {uid}")
                role = "admin" if uid == 364227737 else "user"
                cursor.execute("""
                    INSERT INTO users (user_id, name, role, is_active, added_by, created_at, updated_at)
                    VALUES (?, ?, ?, 1, 364227737, ?, ?)
                """, (uid, name, role, now, now))
            conn.commit()

def get_user(user_id: int) -> dict | None:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

def get_all_users() -> list[dict]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users ORDER BY role DESC, name ASC")
        return [dict(r) for r in cursor.fetchall()]

def is_user_allowed(user_id: int) -> bool:
    user = get_user(user_id)
    if not user:
        return False
    return bool(user.get("is_active", 0) == 1)

def is_user_admin(user_id: int) -> bool:
    if user_id == 364227737:  # Super Admin fallback
        return True
    user = get_user(user_id)
    if not user:
        return False
    return user.get("role") == "admin" and user.get("is_active") == 1

def add_user(user_id: int, name: str, role: str = "user", added_by: int = None) -> tuple[bool, str]:
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        existing = cursor.fetchone()
        if existing:
            # Reactivate if inactive or update name
            cursor.execute("""
                UPDATE users SET name = ?, role = ?, is_active = 1, updated_at = ?
                WHERE user_id = ?
            """, (name, role, now, user_id))
            conn.commit()
            return True, "Foydalanuvchi ma'lumotlari yangilandi va faollashtirildi."
        
        cursor.execute("""
            INSERT INTO users (user_id, name, role, is_active, added_by, created_at, updated_at)
            VALUES (?, ?, ?, 1, ?, ?, ?)
        """, (user_id, name, role, added_by, now, now))
        conn.commit()
        return True, "Yangi foydalanuvchi muvaffaqiyatli qo'shildi."

def update_user_name(user_id: int, new_name: str) -> bool:
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET name = ?, updated_at = ? WHERE user_id = ?", (new_name, now, user_id))
        conn.commit()
        return cursor.rowcount > 0

def update_user_role(user_id: int, new_role: str) -> bool:
    if user_id == 364227737:
        return False  # Protect Super Admin
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET role = ?, updated_at = ? WHERE user_id = ?", (new_role, now, user_id))
        conn.commit()
        return cursor.rowcount > 0

def toggle_user_active(user_id: int) -> bool:
    if user_id == 364227737:
        return False  # Protect Super Admin
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET is_active = 1 - is_active, updated_at = ? WHERE user_id = ?", (now, user_id))
        conn.commit()
        return cursor.rowcount > 0

def delete_user(user_id: int) -> bool:
    if user_id == 364227737:
        return False  # Protect Super Admin
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE user_id = ?", (user_id,))
        conn.commit()
        return cursor.rowcount > 0
