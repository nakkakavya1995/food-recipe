
from datetime import datetime, timezone

from bson import ObjectId
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from pymongo.errors import PyMongoError

from models.recipe_model import create_recipe_document, normalize_instructions
from utils.validators import valid_recipe
recipe_bp = Blueprint("recipes", __name__)
import re
from utils.recipe_scraper import extract_recipe_from_url
def public_recipe(recipe):
    recipe["_id"] = str(recipe["_id"])
    recipe["created_by"] = str(recipe.get("created_by", ""))
    return recipe
def get_object_id(value):
    return ObjectId(value) if ObjectId.is_valid(value) else None
@recipe_bp.get("/")
def list_recipes():
    db = current_app.extensions["mongo_db"]

    query = {}
    search = request.args.get("search", "").strip()
    cuisine = request.args.get("cuisine", "").strip()
    meal_type = request.args.get("meal_type", "").strip()
    max_time = request.args.get("max_time", "").strip()

    if search:
        # Split search terms for versatile ingredient/recipe matching (e.g. "chicken, garlic")
        raw_terms = [t.strip() for t in re.split(r"[,+]+", search) if t.strip()]
        if not raw_terms:
            raw_terms = [search]

        or_conditions = [
            {"name": {"$regex": re.escape(search), "$options": "i"}},
            {"description": {"$regex": re.escape(search), "$options": "i"}},
            {"cuisine": {"$regex": re.escape(search), "$options": "i"}},
            {"meal_type": {"$regex": re.escape(search), "$options": "i"}},
            {"ingredients": {"$regex": re.escape(search), "$options": "i"}},
        ]

        # Also match individual terms against ingredients or title
        for term in raw_terms:
            or_conditions.append({"ingredients": {"$regex": re.escape(term), "$options": "i"}})
            or_conditions.append({"name": {"$regex": re.escape(term), "$options": "i"}})

        query["$or"] = or_conditions

    if cuisine:
        query["cuisine"] = {"$regex": f"^{re.escape(cuisine)}$", "$options": "i"}

    if meal_type:
        query["meal_type"] = {"$regex": f"^{re.escape(meal_type)}$", "$options": "i"}

    if max_time:
        try:
            time_value = int(max_time)
            if time_value < 0 or time_value > 1440:
                raise ValueError
            query["cooking_time"] = {"$lte": time_value}
        except ValueError:
            return jsonify(message="Invalid max_time."), 400

    try:
        recipes = list(
            db.recipes.find(query).sort("_id", -1).limit(100)
        )
        return jsonify({
            "recipes": [public_recipe(r) for r in recipes]
        }), 200
    except PyMongoError:
        current_app.logger.exception("Recipe search failed")
        return jsonify(message="Unable to retrieve recipes."), 500


@recipe_bp.post("/parse-url")
def parse_recipe_url():
    """Extracts recipe data from a URL for preview and form autofill."""
    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()

    if not url:
        return jsonify(message="Recipe URL is required."), 400

    try:
        recipe_data = extract_recipe_from_url(url)
        return jsonify({
            "status": "success",
            "recipe": recipe_data
        }), 200
    except Exception as e:
        current_app.logger.exception("Recipe parsing failed")
        return jsonify(message=f"Could not extract recipe from URL: {str(e)}"), 400


@recipe_bp.post("/publish-url")
def publish_from_url():
    """Directly extracts and publishes a recipe from a URL into the database."""
    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()

    if not url:
        return jsonify(message="Recipe URL is required."), 400

    db = current_app.extensions["mongo_db"]

    # Try to get user id if token is provided
    user_id = "community_chef"
    from flask_jwt_extended import verify_jwt_in_request
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity:
            user_id = str(identity)
    except Exception:
        pass

    try:
        extracted = extract_recipe_from_url(url)
        recipe_doc = create_recipe_document(extracted, user_id)
        result = db.recipes.insert_one(recipe_doc)
        recipe_doc["_id"] = str(result.inserted_id)

        return jsonify({
            "status": "success",
            "message": "Recipe successfully extracted and published!",
            "recipe": public_recipe(recipe_doc)
        }), 201
    except Exception as e:
        current_app.logger.exception("Publish from URL failed")
        return jsonify(message=f"Failed to publish recipe from URL: {str(e)}"), 400
@recipe_bp.get("/<recipe_id>")
def get_recipe(recipe_id):
    db = current_app.extensions["mongo_db"]
    oid = get_object_id(recipe_id)

    if oid is None:
        return jsonify(message="Invalid recipe ID."), 400

    recipe = db.recipes.find_one({"_id": oid})

    if not recipe:
        return jsonify(message="Recipe not found."), 404

    return jsonify({"recipe": public_recipe(recipe)}), 200


@recipe_bp.post("/")
@jwt_required()
def create_recipe():
    data = request.get_json(silent=True) or {}

    if not valid_recipe(data):
        return jsonify(
            message="Provide a name, ingredient list, instructions, and valid cooking time."
        ), 400

    db = current_app.extensions["mongo_db"]
    user_id = get_jwt_identity()

    try:
        recipe = create_recipe_document(data, user_id)
        result = db.recipes.insert_one(recipe)
        recipe["_id"] = str(result.inserted_id)

        return jsonify({
            "message": "Recipe created successfully.",
            "recipe": recipe
        }), 201
    except PyMongoError:
        current_app.logger.exception("Recipe creation failed")
        return jsonify(message="Unable to create recipe."), 500


@recipe_bp.put("/<recipe_id>")
@jwt_required()
def update_recipe(recipe_id):
    oid = get_object_id(recipe_id)

    if oid is None:
        return jsonify(message="Invalid recipe ID."), 400

    db = current_app.extensions["mongo_db"]
    user_id = str(get_jwt_identity())
    recipe = db.recipes.find_one({"_id": oid})

    if not recipe:
        return jsonify(message="Recipe not found."), 404

    from flask_jwt_extended import get_jwt
    is_admin = get_jwt().get("role") == "admin"
    created_by = str(recipe.get("created_by") or "")

    # Normal users can only edit recipes they created; Admins can edit any recipe
    if not is_admin and created_by != user_id:
        return jsonify(message="Access denied: You can only edit recipes that you created."), 403

    data = request.get_json(silent=True) or {}

    if not valid_recipe(data):
        return jsonify(message="Recipe data is invalid."), 400

    updated = {
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
        "updated_at": datetime.now(timezone.utc)
    }

    try:
        db.recipes.update_one({"_id": oid}, {"$set": updated})
        updated_recipe = db.recipes.find_one({"_id": oid})
        return jsonify({
            "message": "Recipe updated successfully.",
            "recipe": public_recipe(updated_recipe)
        }), 200
    except PyMongoError:
        current_app.logger.exception("Recipe update failed")
        return jsonify(message="Unable to update recipe."), 500
@recipe_bp.delete("/<recipe_id>")
@jwt_required()
def delete_recipe(recipe_id):
    oid = get_object_id(recipe_id)

    if oid is None:
        return jsonify(message="Invalid recipe ID."), 400

    db = current_app.extensions["mongo_db"]
    user_id = str(get_jwt_identity())
    recipe = db.recipes.find_one({"_id": oid})

    if not recipe:
        return jsonify(message="Recipe not found."), 404

    from flask_jwt_extended import get_jwt
    is_admin = get_jwt().get("role") == "admin"
    created_by = str(recipe.get("created_by") or "")

    # Normal users can only delete recipes they created; Admins can delete any recipe
    if not is_admin and created_by != user_id:
        return jsonify(message="Access denied: You can only delete recipes that you created."), 403

    try:
        db.recipes.delete_one({"_id": oid})
        db.favorites.delete_many({"recipe_id": str(oid)})
        db.reviews.delete_many({"recipe_id": str(oid)})
        db.shopping_lists.delete_many({"recipe_id": str(oid)})

        return jsonify(message="Recipe deleted successfully."), 200
    except PyMongoError:
        current_app.logger.exception("Recipe deletion failed")
        return jsonify(message="Unable to delete recipe."), 500
