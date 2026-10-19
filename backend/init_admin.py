import os
import bcrypt
from dotenv import load_dotenv
from config.db import connect_db

load_dotenv()

def init_admin():
    db = connect_db()
    admin_email = os.getenv("ADMIN_EMAIL", "admin@recipenest.com").strip().lower()
    default_password = os.getenv("ADMIN_DEFAULT_PASSWORD", "Admin@123456")
    admin_name = os.getenv("ADMIN_NAME", "System Administrator")

    hashed = bcrypt.hashpw(default_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    # Ensure admin user exists with role 'admin'
    existing = db.users.find_one({"email": admin_email})
    if not existing:
        db.users.insert_one({
            "name": admin_name,
            "email": admin_email,
            "password_hash": hashed,
            "role": "admin"
        })
        print(f"Created new admin account: {admin_email}")
    else:
        db.users.update_one(
            {"_id": existing["_id"]},
            {"$set": {"role": "admin", "password_hash": hashed, "name": admin_name}}
        )
        print(f"Updated existing account to admin: {admin_email}")

    # Demote all other users to role 'user' so ONLY this email is admin
    demoted = db.users.update_many(
        {"email": {"$ne": admin_email}},
        {"$set": {"role": "user"}}
    )
    print(f"Demoted {demoted.modified_count} non-admin accounts to role 'user'.")
    print(f"Admin setup complete. Single authorized admin: {admin_email}")

if __name__ == "__main__":
    init_admin()
