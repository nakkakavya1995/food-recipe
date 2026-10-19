
from datetime import datetime, timezone

from bson import ObjectId
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from pymongo.errors import DuplicateKeyError, PyMongoError

from models.review_model import create_review_document

review_bp = Blueprint("reviews", __name__)
@review_bp.get("/<recipe_id>")
def get_reviews(recipe_id):
    if not ObjectId.is_valid(recipe_id):
        return jsonify(message="Invalid recipe ID."), 400

    db = current_app.extensions["mongo_db"]

    try:
        reviews = list(db.reviews.find({"recipe_id": recipe_id}).sort(
            "created_at", -1
        ))

        # Look up reviewer names
        user_ids = []
        for r in reviews:
            uid = r.get("user_id")
            if uid and ObjectId.is_valid(uid):
                user_ids.append(ObjectId(uid))

        users_map = {}
        if user_ids:
            for u in db.users.find({"_id": {"$in": user_ids}}):
                users_map[str(u["_id"])] = u.get("name", "Home Cook")

        for review in reviews:
            review["_id"] = str(review["_id"])
            if not review.get("user_name"):
                review["user_name"] = users_map.get(str(review.get("user_id")), "Home Cook")
            if "created_at" in review and hasattr(review["created_at"], "isoformat"):
                review["created_at"] = review["created_at"].isoformat()
            if "updated_at" in review and hasattr(review["updated_at"], "isoformat"):
                review["updated_at"] = review["updated_at"].isoformat()

            raw_replies = review.get("replies") or []
            formatted_replies = []
            for rep in raw_replies:
                rep_copy = dict(rep)
                if "_id" in rep_copy:
                    rep_copy["_id"] = str(rep_copy["_id"])
                if "created_at" in rep_copy and hasattr(rep_copy["created_at"], "isoformat"):
                    rep_copy["created_at"] = rep_copy["created_at"].isoformat()
                formatted_replies.append(rep_copy)
            review["replies"] = formatted_replies

        average = (
            sum(review.get("rating", 5) for review in reviews) / len(reviews)
            if reviews else 0
        )

        return jsonify({
            "reviews": reviews,
            "average_rating": round(average, 1),
            "total_reviews": len(reviews)
        }), 200
    except PyMongoError:
        current_app.logger.exception("Review retrieval failed")
        return jsonify(message="Unable to retrieve reviews."), 500


@review_bp.post("/<recipe_id>")
@jwt_required()
def add_review(recipe_id):
    if not ObjectId.is_valid(recipe_id):
        return jsonify(message="Invalid recipe ID."), 400

    data = request.get_json(silent=True) or {}
    rating = data.get("rating", 5)
    comment = str(data.get("comment", "")).strip()

    if not comment:
        return jsonify(message="Please write a comment or review."), 400

    if len(comment) > 2000:
        return jsonify(message="Comment must be text up to 2000 characters."), 400

    try:
        rating = int(rating)
        if not 1 <= rating <= 5:
            rating = 5
    except (ValueError, TypeError):
        rating = 5

    db = current_app.extensions["mongo_db"]

    if not db.recipes.find_one({"_id": ObjectId(recipe_id)}):
        return jsonify(message="Recipe not found."), 404

    user_id = str(get_jwt_identity())
    user = None
    if ObjectId.is_valid(user_id):
        user = db.users.find_one({"_id": ObjectId(user_id)})
    user_name = user.get("name", "Home Cook") if user else "Home Cook"

    now = datetime.now(timezone.utc)
    review_doc = {
        "user_id": user_id,
        "user_name": user_name,
        "recipe_id": recipe_id,
        "rating": rating,
        "comment": comment,
        "updated_at": now
    }

    try:
        existing = db.reviews.find_one({"user_id": user_id, "recipe_id": recipe_id})
        if existing:
            db.reviews.update_one(
                {"_id": existing["_id"]},
                {"$set": review_doc}
            )
            review_doc["_id"] = str(existing["_id"])
            review_doc["created_at"] = existing.get("created_at", now).isoformat() if hasattr(existing.get("created_at", now), "isoformat") else str(existing.get("created_at", now))
            review_doc["updated_at"] = now.isoformat()
            return jsonify(message="Your comment has been updated!", review=review_doc), 200
        else:
            review_doc["created_at"] = now
            result = db.reviews.insert_one(review_doc)
            review_doc["_id"] = str(result.inserted_id)
            review_doc["created_at"] = now.isoformat()
            review_doc["updated_at"] = now.isoformat()
            return jsonify(message="Comment posted successfully!", review=review_doc), 201
    except PyMongoError:
        current_app.logger.exception("Adding review failed")
        return jsonify(message="Unable to add comment."), 500


@review_bp.put("/<review_id>")
@jwt_required()
def update_review(review_id):
    if not ObjectId.is_valid(review_id):
        return jsonify(message="Invalid review ID."), 400

    data = request.get_json(silent=True) or {}
    rating = data.get("rating", 5)
    comment = str(data.get("comment", "")).strip()

    if not comment or len(comment) > 2000:
        return jsonify(message="Invalid comment."), 400

    try:
        rating = int(rating)
        if not 1 <= rating <= 5:
            rating = 5
    except (ValueError, TypeError):
        rating = 5

    db = current_app.extensions["mongo_db"]
    user_id = str(get_jwt_identity())

    result = db.reviews.update_one(
        {"_id": ObjectId(review_id), "user_id": user_id},
        {"$set": {
            "rating": rating,
            "comment": comment,
            "updated_at": datetime.now(timezone.utc)
        }}
    )

    if result.matched_count == 0:
        return jsonify(message="Review not found or not yours."), 404

    return jsonify(message="Review updated successfully."), 200


@review_bp.delete("/<review_id>")
@jwt_required()
def delete_review(review_id):
    if not ObjectId.is_valid(review_id):
        return jsonify(message="Invalid review ID."), 400

    db = current_app.extensions["mongo_db"]
    user_id = str(get_jwt_identity())
    from flask_jwt_extended import get_jwt
    is_admin = get_jwt().get("role") == "admin"

    query = {"_id": ObjectId(review_id)}
    if not is_admin:
        query["user_id"] = user_id

    result = db.reviews.delete_one(query)

    if result.deleted_count == 0:
        return jsonify(message="Review not found or not yours."), 404

    return jsonify(message="Review deleted successfully."), 200


@review_bp.post("/<review_id>/reply")
@jwt_required()
def add_review_reply(review_id):
    if not ObjectId.is_valid(review_id):
        return jsonify(message="Invalid review ID."), 400

    data = request.get_json(silent=True) or {}
    comment = str(data.get("comment", "")).strip()
    reply_to = str(data.get("reply_to", "")).strip()

    if not comment:
        return jsonify(message="Please write your reply comment."), 400

    if len(comment) > 2000:
        return jsonify(message="Reply must be up to 2000 characters."), 400

    db = current_app.extensions["mongo_db"]
    review = db.reviews.find_one({"_id": ObjectId(review_id)})
    if not review:
        return jsonify(message="Parent review not found."), 404

    user_id = str(get_jwt_identity())
    user = None
    if ObjectId.is_valid(user_id):
        user = db.users.find_one({"_id": ObjectId(user_id)})

    from flask_jwt_extended import get_jwt
    claims = get_jwt()
    user_role = claims.get("role") or (user.get("role") if user else "user")
    user_name = user.get("name", "Home Cook") if user else (claims.get("name") or "User")

    if not reply_to:
        reply_to = review.get("user_name", "Author")

    now = datetime.now(timezone.utc)
    reply_doc = {
        "_id": str(ObjectId()),
        "user_id": user_id,
        "user_name": user_name,
        "user_role": user_role,
        "reply_to": reply_to,
        "comment": comment,
        "created_at": now.isoformat()
    }

    try:
        db.reviews.update_one(
            {"_id": ObjectId(review_id)},
            {"$push": {"replies": reply_doc}}
        )
        return jsonify(message="Reply posted successfully!", reply=reply_doc), 201
    except PyMongoError:
        current_app.logger.exception("Posting reply failed")
        return jsonify(message="Unable to post reply."), 500


@review_bp.delete("/<review_id>/reply/<reply_id>")
@jwt_required()
def delete_review_reply(review_id, reply_id):
    if not ObjectId.is_valid(review_id):
        return jsonify(message="Invalid review ID."), 400

    db = current_app.extensions["mongo_db"]
    user_id = str(get_jwt_identity())
    from flask_jwt_extended import get_jwt
    is_admin = get_jwt().get("role") == "admin"

    review = db.reviews.find_one({"_id": ObjectId(review_id)})
    if not review:
        return jsonify(message="Review not found."), 404

    # If not admin, check if user created this reply
    if not is_admin:
        replies = review.get("replies", [])
        matched = next((r for r in replies if str(r.get("_id")) == str(reply_id) and str(r.get("user_id")) == user_id), None)
        if not matched:
            return jsonify(message="Reply not found or not yours."), 403

    try:
        db.reviews.update_one(
            {"_id": ObjectId(review_id)},
            {"$pull": {"replies": {"_id": reply_id}}}
        )
        return jsonify(message="Reply deleted successfully."), 200
    except PyMongoError:
        return jsonify(message="Unable to delete reply."), 500

