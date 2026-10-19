import re
from datetime import datetime, timezone
from bson import ObjectId
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from pymongo.errors import PyMongoError

recommendation_bp = Blueprint("recommendations", __name__)
def public_recipe(recipe):
    recipe["_id"] = str(recipe["_id"])
    recipe["created_by"] = str(recipe.get("created_by", ""))
    return recipe


@recommendation_bp.post("/search-history")
def log_search():
    """
    Logs a recipe search keyword for the logged-in user.
    """
    db = current_app.extensions["mongo_db"]

    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity and ObjectId.is_valid(identity):
            user_id = str(identity)
    except Exception:
        pass

    if not user_id:
        return jsonify({"status": "ignored", "message": "Guest search not logged."}), 200

    data = request.get_json(silent=True) or {}
    query = (data.get("query") or "").strip().lower()

    if not query or len(query) < 2:
        return jsonify({"status": "ignored", "message": "Query too short."}), 200

    try:
        # Keep track of search history with timestamp
        db.search_history.insert_one({
            "user_id": user_id,
            "query": query,
            "created_at": datetime.now(timezone.utc)
        })
        return jsonify({"status": "success", "message": "Search logged."}), 201
    except PyMongoError:
        return jsonify({"status": "error", "message": "Failed to log search."}), 500


@recommendation_bp.get("/search-history")
def get_search_history():
    """Returns recent search history for the logged-in user."""
    db = current_app.extensions["mongo_db"]
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity and ObjectId.is_valid(identity):
            user_id = str(identity)
    except Exception:
        pass

    if not user_id:
        return jsonify({"history": []}), 200

    try:
        records = list(
            db.search_history.find({"user_id": user_id})
            .sort("created_at", -1)
            .limit(15)
        )
        unique_queries = []
        seen = set()
        for r in records:
            q = r.get("query", "").strip()
            if q and q not in seen:
                seen.add(q)
                unique_queries.append(q)
        return jsonify({"history": unique_queries}), 200
    except PyMongoError:
        return jsonify({"history": []}), 500


@recommendation_bp.route("/personalized", methods=["GET", "POST"])
def get_personalized():
    """
    Personalized recipe recommendations based strictly on the user's Favorited Recipes.
    Excludes recipes already favorited by the user, and falls back to popular recipes
    if the user has not yet saved any favorites.
    """
    db = current_app.extensions["mongo_db"]

    user_id = None
    fav_recipes = []
    favorite_ids = set()

    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity and ObjectId.is_valid(identity):
            user_id = str(identity)
    except Exception:
        pass

    # Retrieve user's favorites
    if user_id:
        try:
            fav_docs = list(db.favorites.find({"user_id": user_id}))
            valid_ids = [
                ObjectId(f["recipe_id"])
                for f in fav_docs
                if ObjectId.is_valid(f.get("recipe_id"))
            ]
            if valid_ids:
                fav_recipes = list(db.recipes.find({"_id": {"$in": valid_ids}}))
                favorite_ids = {str(r["_id"]) for r in fav_recipes}
        except PyMongoError:
            fav_recipes = []

    # Fetch all candidate recipes from database
    try:
        all_recipes = list(db.recipes.find().sort("_id", -1).limit(60))
    except PyMongoError:
        all_recipes = []

    # If user has no favorites, return popular fallback recipes
    if not fav_recipes:
        fallback = [public_recipe(r) for r in all_recipes[:8]]
        return jsonify({
            "status": "success",
            "personalized": False,
            "title": "Recommended for You",
            "reason": "Add recipes to your Favorites (click the heart icon) to receive personalized recommendations tailored to your taste!",
            "recommendations": fallback,
            "recipes": fallback
        }), 200

    # Build preference profile strictly from favorites
    fav_cuisines = {}
    fav_meal_types = {}
    fav_ingredients = set()

    for r in fav_recipes:
        c = (r.get("cuisine") or "").strip().lower()
        if c:
            fav_cuisines[c] = fav_cuisines.get(c, 0) + 1

        m = (r.get("meal_type") or "").strip().lower()
        if m:
            fav_meal_types[m] = fav_meal_types.get(m, 0) + 1

        for ing in (r.get("ingredients") or []):
            if isinstance(ing, str):
                words = re.findall(r"[a-z]{3,}", ing.lower())
                for w in words:
                    if w not in {"cups", "cup", "tbsp", "tsp", "tablespoon", "teaspoon", "grams", "pinch", "salt", "water", "oil"}:
                        fav_ingredients.add(w)

    scored_recipes = []

    for recipe in all_recipes:
        rec_id = str(recipe["_id"])
        # Exclude recipes already favorited
        if rec_id in favorite_ids:
            continue

        score = 0
        reasons = []

        rec_name = (recipe.get("name") or "").lower()
        rec_cuisine = (recipe.get("cuisine") or "").strip().lower()
        rec_meal = (recipe.get("meal_type") or "").strip().lower()

        rec_ingredients_str = " ".join(
            [i if isinstance(i, str) else i.get("name", "") for i in recipe.get("ingredients") or []]
        ).lower()

        # 1. Favorite cuisine matching
        if rec_cuisine and rec_cuisine in fav_cuisines:
            score += 30 * fav_cuisines[rec_cuisine]
            reasons.append(f"Matches your favorite {recipe.get('cuisine')} cuisine")

        # 2. Favorite meal type matching
        if rec_meal and rec_meal in fav_meal_types:
            score += 18
            reasons.append(f"Matches your favorite {recipe.get('meal_type')} meal style")

        # 3. Ingredients overlap with favorited recipes
        ingredient_matches = []
        for word in fav_ingredients:
            if word in rec_ingredients_str:
                score += 10
                ingredient_matches.append(word)

        if ingredient_matches:
            reasons.append(f"Shares ingredients ({', '.join(ingredient_matches[:2])}) with your favorites")

        if score > 0:
            scored_recipe = public_recipe(recipe)
            scored_recipe["score"] = score
            scored_recipe["match_reason"] = " & ".join(reasons) if reasons else "Selected from your favorites profile"
            scored_recipes.append(scored_recipe)

    # Sort candidates by score descending
    scored_recipes.sort(key=lambda x: x["score"], reverse=True)

    recommendations = scored_recipes[:8]
    if len(recommendations) < 6:
        existing_ids = {r["_id"] for r in recommendations} | favorite_ids
        for r in all_recipes:
            if str(r["_id"]) not in existing_ids:
                pub = public_recipe(r)
                pub["match_reason"] = "Popular community favorite"
                recommendations.append(pub)
                existing_ids.add(pub["_id"])
                if len(recommendations) >= 6:
                    break

    fav_count = len(fav_recipes)
    fav_word = "recipe" if fav_count == 1 else "recipes"
    top_cuisine = list(fav_cuisines.keys())[0].capitalize() if fav_cuisines else ""

    reason_msg = f"Personalized from your {fav_count} saved favorite {fav_word}"
    if top_cuisine:
        reason_msg += f", highlighting {top_cuisine} and matching flavor pairings."
    else:
        reason_msg += " and shared flavor profiles."

    return jsonify({
        "status": "success",
        "personalized": True,
        "title": "Recommended for You",
        "reason": reason_msg,
        "recommendations": recommendations,
        "recipes": recommendations
    }), 200
