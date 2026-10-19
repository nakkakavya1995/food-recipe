
from bson import ObjectId
from flask import Blueprint, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from pymongo.errors import PyMongoError
favorite_bp = Blueprint("favorites", __name__)
@favorite_bp.get("/")
@jwt_required()
def get_favorites():
    db = current_app.extensions["mongo_db"]
    user_id = get_jwt_identity()

    try:
        favorites = list(db.favorites.find({"user_id": user_id}))
        ids = [
            ObjectId(item["recipe_id"])
            for item in favorites
            if ObjectId.is_valid(item["recipe_id"])
        ]

        recipes = list(db.recipes.find({"_id": {"$in": ids}}))
        for recipe in recipes:
            recipe["_id"] = str(recipe["_id"])
            recipe["created_by"] = str(recipe["created_by"])

        return jsonify({"favorites": recipes}), 200
    except PyMongoError:
        current_app.logger.exception("Favorite retrieval failed")
        return jsonify(message="Unable to retrieve favorites."), 500


@favorite_bp.post("/")
@favorite_bp.post("/<recipe_id>")
@jwt_required()
def add_favorite(recipe_id=None):
    if not recipe_id:
        data = request.get_json(silent=True) or {}
        recipe_id = data.get("recipe_id") or data.get("id")

    if not recipe_id or not ObjectId.is_valid(recipe_id):
        return jsonify(message="Invalid recipe ID."), 400

    db = current_app.extensions["mongo_db"]
    user_id = get_jwt_identity()

    recipe = db.recipes.find_one({"_id": ObjectId(recipe_id)})
    if not recipe:
        return jsonify(message="Recipe not found."), 404

    try:
        db.favorites.update_one(
            {"user_id": user_id, "recipe_id": str(recipe_id)},
            {"$setOnInsert": {"user_id": user_id, "recipe_id": str(recipe_id)}},
            upsert=True
        )

        recipe["_id"] = str(recipe["_id"])
        recipe["created_by"] = str(recipe.get("created_by", ""))

        return jsonify({
            "message": "Recipe added to favorites.",
            "isFavorite": True,
            "recipe": recipe
        }), 200
    except PyMongoError:
        current_app.logger.exception("Adding favorite failed")
        return jsonify(message="Unable to add favorite."), 500
@favorite_bp.delete("/<recipe_id>")
@jwt_required()
def remove_favorite(recipe_id):
    if not ObjectId.is_valid(recipe_id):
        return jsonify(message="Invalid recipe ID."), 400

    db = current_app.extensions["mongo_db"]
    user_id = get_jwt_identity()

    try:
        db.favorites.delete_one({
            "user_id": user_id,
            "recipe_id": recipe_id
        })
        return jsonify(message="Favorite removed."), 200
    except PyMongoError:
        current_app.logger.exception("Removing favorite failed")
        return jsonify(message="Unable to remove favorite."), 500
