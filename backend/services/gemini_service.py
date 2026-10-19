import os
import json
import logging
import re
import requests
from bson import ObjectId

logger = logging.getLogger(__name__)

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

def get_gemini_api_key(custom_key=None):
    if custom_key and isinstance(custom_key, str) and custom_key.strip():
        return custom_key.strip()
    return os.getenv("GEMINI_API_KEY", "").strip()


def call_gemini_api(prompt, api_key):
    url = f"{GEMINI_API_URL}?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 2048,
            "topP": 0.9,
        }
    }

    response = requests.post(url, headers=headers, json=payload, timeout=25)
    response.raise_for_status()
    data = response.json()

    candidates = data.get("candidates", [])
    if not candidates:
        raise ValueError("No candidates returned from Gemini API.")

    parts = candidates[0].get("content", {}).get("parts", [])
    if not parts:
        raise ValueError("Empty response parts from Gemini API.")

    text_content = parts[0].get("text", "").strip()
    cleaned_json = text_content
    if "```" in cleaned_json:
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned_json)
        if match:
            cleaned_json = match.group(1).strip()

    return json.loads(cleaned_json)


def generate_personalized_recommendations(
    user_info,
    user_favorites,
    available_catalog,
    dietary_preference="",
    pantry_ingredients="",
    max_time=None,
    mood="",
    custom_gemini_key=None
):
    api_key = get_gemini_api_key(custom_gemini_key)

    # Prepare condensed catalog for the prompt (titles, cuisines, cooking_time, ingredients)
    condensed_catalog = []
    for r in available_catalog[:30]:
        condensed_catalog.append({
            "id": str(r.get("_id", "")),
            "name": r.get("name") or r.get("title", ""),
            "cuisine": r.get("cuisine", ""),
            "meal_type": r.get("meal_type", ""),
            "cooking_time": r.get("cooking_time", 30),
            "image_url": r.get("image_url", ""),
            "video_url": r.get("video_url", ""),
            "ingredients": r.get("ingredients", [])[:8],
            "description": r.get("description", "")[:120],
        })

    # Prepare condensed favorites
    condensed_favorites = []
    for f in user_favorites[:10]:
        condensed_favorites.append({
            "name": f.get("name") or f.get("title", ""),
            "cuisine": f.get("cuisine", ""),
            "meal_type": f.get("meal_type", ""),
            "cooking_time": f.get("cooking_time", 30),
        })

    # If Gemini API key is present, invoke Gemini
    if api_key:
        try:
            prompt = f"""
You are an expert culinary AI sommelier and personal chef inside RecipeNest.
Your task is to generate personalized recipe recommendations tailored specifically to the user's taste and current criteria.

USER TASTE PROFILE:
- User Name: {user_info.get('name', 'Chef')}
- Favorited Recipes: {json.dumps(condensed_favorites)}

CURRENT USER REQUEST & CONSTRAINTS:
- Dietary Preference: {dietary_preference or 'No specific restriction'}
- Pantry / Fridge Ingredients Available: {pantry_ingredients or 'Any ingredients'}
- Max Cooking Time: {f"{max_time} minutes" if max_time else 'Any time'}
- Vibe / Mood: {mood or 'Delicious & satisfying'}

EXISTING RECIPE CATALOG IN DATABASE:
{json.dumps(condensed_catalog)}

INSTRUCTIONS:
1. Recommend 3 to 6 recipes.
2. Prioritize matching recipes from the EXISTING RECIPE CATALOG whenever relevant, linking them by their exact 'id'.
3. For existing recipes, write a warm, personalized 'why_recommended' explanation referencing the user's taste (e.g. why they will love it based on their favorites or pantry ingredients).
4. You may ALSO craft 1 or 2 new personalized custom recipe creations ('is_custom_ai': true, with 'id': null, and complete ingredients and instructions) if they perfectly solve the user's pantry ingredients or dietary needs.
5. Provide a realistic match score (e.g. "98%", "94%").
6. Provide an appetizing 'chef_summary' greeting the user and summarizing their tailored menu.

OUTPUT FORMAT:
Return ONLY valid JSON matching this exact structure:
{{
  "chef_summary": "A friendly 1-2 sentence culinary note explaining this menu curated for the user",
  "recommendations": [
    {{
      "id": "existing_id_or_null",
      "name": "Recipe Name",
      "description": "Short appetizing summary",
      "cuisine": "Indian / Italian / etc.",
      "meal_type": "Dinner / Lunch / Breakfast / etc.",
      "cooking_time": 30,
      "difficulty": "Easy / Medium / Hard",
      "match_score": "96%",
      "why_recommended": "Personalized reason highlighting taste match and pantry ingredients",
      "ingredients": ["ingredient 1 with qty", "ingredient 2"],
      "instructions": ["Step 1...", "Step 2..."],
      "image_url": "valid image url or url from existing catalog",
      "video_url": "video url if from catalog or empty string",
      "is_custom_ai": false
    }}
  ]
}}
"""
            result = call_gemini_api(prompt, api_key)
            result["ai_powered"] = True
            result["engine"] = "Gemini 1.5 Flash (Google AI)"
            return result

        except Exception as e:
            logger.warning(f"Gemini API request failed or timed out: {e}. Falling back to heuristic recommendations.")

    
    return fallback_recommendation_engine(
        user_info,
        user_favorites,
        available_catalog,
        dietary_preference,
        pantry_ingredients,
        max_time,
        mood
    )


def fallback_recommendation_engine(
    user_info,
    user_favorites,
    available_catalog,
    dietary_preference,
    pantry_ingredients,
    max_time,
    mood
):
    favorite_cuisines = {f.get("cuisine", "").lower() for f in user_favorites if f.get("cuisine")}
    favorite_meal_types = {f.get("meal_type", "").lower() for f in user_favorites if f.get("meal_type")}
    pantry_terms = [t.strip().lower() for t in pantry_ingredients.split(",") if t.strip()]

    scored_recipes = []

    for recipe in available_catalog:
        score = 60
        reasons = []

        # Cuisine matching
        rec_cuisine = recipe.get("cuisine", "").lower()
        if rec_cuisine in favorite_cuisines:
            score += 20
            reasons.append(f"matches your preferred {recipe.get('cuisine')} cuisine")

        # Meal type matching
        rec_meal = recipe.get("meal_type", "").lower()
        if rec_meal in favorite_meal_types:
            score += 10

        # Cooking time check
        rec_time = int(recipe.get("cooking_time", 30))
        if max_time and rec_time <= int(max_time):
            score += 10
            reasons.append(f"ready in just {rec_time} minutes")
        elif not max_time and rec_time <= 30:
            score += 5

        # Pantry ingredient matching
        rec_ingredients_str = " ".join(
            (recipe.get("ingredients") or [])
        ).lower()

        matched_pantry = []
        for term in pantry_terms:
            if term in rec_ingredients_str:
                score += 15
                matched_pantry.append(term)

        if matched_pantry:
            reasons.append(f"uses your pantry items ({', '.join(matched_pantry)})")

        # Dietary preference filter
        if dietary_preference:
            pref = dietary_preference.lower()
            if pref == "vegetarian" and any(meat in rec_ingredients_str for meat in ["chicken", "mutton", "beef", "pork", "fish", "shrimp"]):
                continue

        score = min(score, 99)
        why = f"Recommended for you: {', '.join(reasons)}." if reasons else f"A popular {recipe.get('cuisine', 'culinary')} favorite you'll love."

        scored_recipes.append({
            "id": str(recipe.get("_id", "")),
            "name": recipe.get("name") or recipe.get("title", ""),
            "description": recipe.get("description", ""),
            "cuisine": recipe.get("cuisine", "Continental"),
            "meal_type": recipe.get("meal_type", "Lunch"),
            "cooking_time": recipe.get("cooking_time", 30),
            "difficulty": recipe.get("difficulty", "Easy"),
            "match_score": f"{score}%",
            "why_recommended": why,
            "ingredients": recipe.get("ingredients", []),
            "instructions": recipe.get("instructions", []),
            "image_url": recipe.get("image_url", ""),
            "video_url": recipe.get("video_url", ""),
            "is_custom_ai": False,
            "_sort_score": score
        })

    # Sort by score descending
    scored_recipes.sort(key=lambda x: x["_sort_score"], reverse=True)
    top_picks = scored_recipes[:6]

    user_name = user_info.get("name", "Chef")
    summary = f"Hello {user_name}! Here are recipes specially tailored to your taste and favorite cuisines."
    if pantry_terms:
        summary += f" Prioritized dishes matching your pantry items: {', '.join(pantry_terms)}."

    return {
        "chef_summary": summary,
        "recommendations": top_picks,
        "ai_powered": False,
        "engine": "RecipeNest Smart Taste Matcher",
        "notice": "To activate Google Gemini AI recommendations, set GEMINI_API_KEY in backend/.env"
    }
