from datetime import datetime, timezone
def normalize_instructions(raw_instructions):
    if not isinstance(raw_instructions, list):
        return []
    normalized = []
    for idx, item in enumerate(raw_instructions, start=1):
        if isinstance(item, str):
            text = item.strip()
            if text:
                normalized.append({
                    "step": idx,
                    "instruction": text,
                    "image_url": ""
                })
        elif isinstance(item, dict):
            text = (item.get("instruction") or item.get("text") or item.get("step_text") or "").strip()
            image_url = (item.get("image_url") or item.get("image") or "").strip()
            step_num = item.get("step") or idx
            try:
                step_num = int(step_num)
            except (ValueError, TypeError):
                step_num = idx
            if text:
                normalized.append({
                    "step": step_num,
                    "instruction": text,
                    "image_url": image_url
                })
    return normalized


def create_recipe_document(data, user_id):
    return {
        "name": data["name"].strip(),
        "description": data.get("description", "").strip(),
        "ingredients": [i.strip() for i in data["ingredients"] if isinstance(i, str) and i.strip()],
        "instructions": normalize_instructions(data.get("instructions", [])),
        "cuisine": data.get("cuisine", "").strip(),
        "meal_type": data.get("meal_type", "").strip(),
        "cooking_time": int(data.get("cooking_time", 0)),
        "difficulty": data.get("difficulty", "Easy").strip(),
        "image_url": data.get("image_url", "").strip(),
        "video_url": data.get("video_url", "").strip(),
        "created_by": user_id,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
