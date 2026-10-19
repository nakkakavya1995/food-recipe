import json
import re
import urllib.request
from html import unescape
def parse_iso_duration(duration_str):
    if not duration_str or not isinstance(duration_str, str):
        return 30
    duration_str = duration_str.upper()
    hours = 0
    minutes = 0

    h_match = re.search(r"(\d+)\s*H", duration_str)
    if h_match:
        hours = int(h_match.group(1))

    m_match = re.search(r"(\d+)\s*M", duration_str)
    if m_match:
        minutes = int(m_match.group(1))

    total = hours * 60 + minutes
    return total if total > 0 else 30


def clean_text(text):
    if not text or not isinstance(text, str):
        return ""
    text = unescape(text)
    text = re.sub(r"<[^>]+>", " ", text)
    return " ".join(text.split()).strip()


def extract_recipe_from_url(url):
    if not url or not (url.startswith("http://") or url.startswith("https://")):
        raise ValueError("A valid HTTP or HTTPS URL is required.")

    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/118.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    )

    with urllib.request.urlopen(req, timeout=12) as response:
        raw_html = response.read().decode("utf-8", errors="ignore")

    # 1. Try JSON-LD schema
    recipe_json = None
    json_ld_matches = re.findall(
        r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        raw_html,
        re.DOTALL | re.IGNORECASE,
    )

    for script_content in json_ld_matches:
        try:
            data = json.loads(script_content.strip())
            # Can be a single object or a list or an object with @graph
            candidates = []
            if isinstance(data, list):
                candidates.extend(data)
            elif isinstance(data, dict):
                if "@graph" in data and isinstance(data["@graph"], list):
                    candidates.extend(data["@graph"])
                else:
                    candidates.append(data)

            for cand in candidates:
                cand_type = cand.get("@type")
                if cand_type == "Recipe" or (isinstance(cand_type, list) and "Recipe" in cand_type):
                    recipe_json = cand
                    break
            if recipe_json:
                break
        except Exception:
            continue

    # 2. Extract OpenGraph and Title fallbacks
    og_title_match = re.search(r'<meta[^>]*property=["\']og:title["\'][^>]*content=["\'](.*?)["\']', raw_html, re.I)
    title_match = re.search(r"<title[^>]*>(.*?)</title>", raw_html, re.I)
    og_desc_match = re.search(r'<meta[^>]*property=["\']og:description["\'][^>]*content=["\'](.*?)["\']', raw_html, re.I)
    meta_desc_match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']', raw_html, re.I)
    og_image_match = re.search(r'<meta[^>]*property=["\']og:image["\'][^>]*content=["\'](.*?)["\']', raw_html, re.I)

    default_title = clean_text(og_title_match.group(1) if og_title_match else (title_match.group(1) if title_match else "Scraped Recipe"))
    # Clean up standard site suffixes like " | BBC Good Food" or " - Allrecipes"
    default_title = re.sub(r"\s*[-|•]\s*(BBC Good Food|Allrecipes|Food Network|Tasty|Simply Recipes|Food\.com).*$", "", default_title, flags=re.I).strip()

    default_desc = clean_text(og_desc_match.group(1) if og_desc_match else (meta_desc_match.group(1) if meta_desc_match else ""))
    default_image = og_image_match.group(1).strip() if og_image_match else ""

    if recipe_json:
        # Extract title
        name = clean_text(recipe_json.get("name") or default_title)

        # Extract description
        description = clean_text(recipe_json.get("description") or default_desc)

        # Extract ingredients
        raw_ingredients = recipe_json.get("recipeIngredient") or []
        if isinstance(raw_ingredients, str):
            raw_ingredients = [raw_ingredients]
        ingredients = [clean_text(str(x)) for x in raw_ingredients if clean_text(str(x))]

        # Extract instructions
        instructions = []
        raw_instructions = recipe_json.get("recipeInstructions") or []
        if isinstance(raw_instructions, str):
            instructions = [clean_text(s) for s in raw_instructions.split("\n") if clean_text(s)]
        elif isinstance(raw_instructions, list):
            for step in raw_instructions:
                if isinstance(step, str):
                    s = clean_text(step)
                    if s:
                        instructions.append(s)
                elif isinstance(step, dict):
                    # Could be HowToStep or HowToSection
                    if step.get("@type") == "HowToSection" and "itemListElement" in step:
                        for sub in step["itemListElement"]:
                            s = clean_text(sub.get("text") or sub.get("name") or "")
                            if s:
                                instructions.append(s)
                    else:
                        s = clean_text(step.get("text") or step.get("name") or "")
                        if s:
                            instructions.append(s)

        # Extract cooking time
        time_str = recipe_json.get("totalTime") or recipe_json.get("cookTime") or recipe_json.get("prepTime")
        cooking_time = parse_iso_duration(time_str)

        # Extract image
        image_url = ""
        img_field = recipe_json.get("image")
        if isinstance(img_field, str):
            image_url = img_field
        elif isinstance(img_field, list) and img_field:
            first = img_field[0]
            image_url = first if isinstance(first, str) else (first.get("url", "") if isinstance(first, dict) else "")
        elif isinstance(img_field, dict):
            image_url = img_field.get("url", "")
        if not image_url:
            image_url = default_image

        # Cuisine & Meal Type
        cuisine = recipe_json.get("recipeCuisine")
        if isinstance(cuisine, list):
            cuisine = cuisine[0] if cuisine else "International"
        cuisine = clean_text(str(cuisine or "International"))

        meal_type = recipe_json.get("recipeCategory")
        if isinstance(meal_type, list):
            meal_type = meal_type[0] if meal_type else "Dinner"
        meal_type = clean_text(str(meal_type or "Dinner"))

        # Servings
        yield_val = recipe_json.get("recipeYield")
        servings = 4
        if yield_val:
            if isinstance(yield_val, list):
                yield_val = yield_val[0]
            match = re.search(r"\d+", str(yield_val))
            if match:
                servings = int(match.group(0))

        if not ingredients:
            ingredients = ["Fresh seasonal ingredients according to taste", "Pantry staples and seasoning"]
        if not instructions:
            instructions = [
                "Prepare all ingredients as required.",
                "Follow standard cooking procedure and heat until properly cooked.",
                "Garnish and serve fresh."
            ]

        return {
            "name": name,
            "title": name,
            "description": description or f"A fantastic dish curated from {url}",
            "ingredients": ingredients,
            "instructions": instructions,
            "cuisine": cuisine if cuisine in ["Indian", "Italian", "Chinese", "Mexican", "Continental", "American", "Mediterranean"] else "Continental",
            "meal_type": meal_type if meal_type in ["Breakfast", "Lunch", "Dinner", "Dessert", "Snack"] else "Lunch",
            "cooking_time": cooking_time,
            "servings": servings,
            "image_url": image_url,
            "source_url": url,
        }

    # Fallback if no JSON-LD found: parse from HTML tags
    name = default_title or "Delicious Recipe from Web"
    description = default_desc or f"Imported recipe from {url}"
    image_url = default_image

    return {
        "name": name,
        "title": name,
        "description": description,
        "ingredients": [
            "Primary fresh ingredients for this dish",
            "Seasonings, spices, and olive oil to taste",
        ],
        "instructions": [
            "Prep the ingredients and prepare the cooking surface.",
            "Combine and cook over medium heat according to recipe method.",
            "Plate and serve hot.",
        ],
        "cuisine": "Continental",
        "meal_type": "Lunch",
        "cooking_time": 30,
        "servings": 4,
        "image_url": image_url,
        "source_url": url,
    }
