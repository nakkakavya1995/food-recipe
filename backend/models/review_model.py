
from datetime import datetime, timezone
def create_review_document(user_id, recipe_id, rating, comment):
    return {
        "user_id": user_id,
        "recipe_id": recipe_id,
        "rating": rating,
        "comment": comment.strip(),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
