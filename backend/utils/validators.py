
import re
def valid_email(email):
    return bool(
        isinstance(email, str)
        and re.fullmatch(
            r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
            email.strip()
        )
    )
def valid_recipe(data):
    if not isinstance(data, dict):
        return False

    name = data.get("name")
    ingredients = data.get("ingredients")
    instructions = data.get("instructions")

    if not isinstance(name, str) or not name.strip():
        return False

    if not isinstance(ingredients, list) or not ingredients:
        return False

    if not all(
        isinstance(item, str) and item.strip()
        for item in ingredients
    ):
        return False

    if not isinstance(instructions, list) or not instructions:
        return False

    def is_valid_step(item):
        if isinstance(item, str) and item.strip():
            return True
        if isinstance(item, dict):
            text = item.get("instruction") or item.get("text") or ""
            return isinstance(text, str) and bool(text.strip())
        return False

    if not all(is_valid_step(item) for item in instructions):
        return False

    try:
        cooking_time = int(data.get("cooking_time", 0))
        if cooking_time < 0 or cooking_time > 1440:
            return False
    except (TypeError, ValueError):
        return False

    return True
