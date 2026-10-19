
from datetime import datetime, timezone
def create_user_document(name, email, password_hash, role="user"):
    return {
        "name": name,
        "email": email.lower().strip(),
        "password_hash": password_hash,
        "role": role,
        "created_at": datetime.now(timezone.utc)
    }
