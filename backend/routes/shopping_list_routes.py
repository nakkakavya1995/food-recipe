from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from pymongo.errors import PyMongoError
from models.shopping_list_model import create_shopping_list_document

shopping_bp = Blueprint("shopping", __name__)


@shopping_bp.get("/")
@jwt_required()
def get_user_shopping_list():
    db = current_app.extensions["mongo_db"]
    user_id = get_jwt_identity()

    try:
        items = list(db.shopping_lists.find({"user_id": str(user_id)}).sort("created_at", -1))
        for item in items:
            item["_id"] = str(item["_id"])
        return jsonify({"shopping_lists": items}), 200
    except PyMongoError:
        return jsonify({"message": "Error fetching shopping list"}), 500


@shopping_bp.post("/")
@jwt_required()
def add_to_shopping_list():
    db = current_app.extensions["mongo_db"]
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    recipe_id = data.get("recipe_id")
    items = data.get("items", [])

    if not items:
        return jsonify({"message": "Items are required"}), 400

    doc = create_shopping_list_document(user_id, recipe_id, items)
    try:
        res = db.shopping_lists.insert_one(doc)
        doc["_id"] = str(res.inserted_id)
        return jsonify({"message": "Shopping list saved", "shopping_list": doc}), 201
    except PyMongoError:
        return jsonify({"message": "Failed to save shopping list"}), 500


@shopping_bp.delete("/<item_id>")
@jwt_required()
def delete_shopping_list(item_id):
    db = current_app.extensions["mongo_db"]
    user_id = get_jwt_identity()

    if not ObjectId.is_valid(item_id):
        return jsonify({"message": "Invalid item ID"}), 400

    try:
        result = db.shopping_lists.delete_one({"_id": ObjectId(item_id), "user_id": str(user_id)})
        if result.deleted_count == 0:
            return jsonify({"message": "Shopping list item not found or unauthorized"}), 404
        return jsonify({"message": "Item deleted successfully"}), 200
    except PyMongoError:
        return jsonify({"message": "Failed to delete item"}), 500
