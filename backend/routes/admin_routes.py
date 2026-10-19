
from bson import ObjectId
from flask import Blueprint, jsonify, current_app, request
from pymongo.errors import PyMongoError
from datetime import datetime
from utils.decorators import admin_required
admin_bp = Blueprint("admin", __name__)
@admin_bp.get("/stats")
@admin_required
def dashboard_stats():
    db = current_app.extensions["mongo_db"]

    try:
        total_users = db.users.count_documents({})
        total_recipes = db.recipes.count_documents({})
        total_reviews = db.reviews.count_documents({})

        # Find all admin user IDs
        admin_users = list(db.users.find({"role": "admin"}, {"_id": 1}))
        admin_ids = [str(u["_id"]) for u in admin_users]

        # Count recipes created by admin vs normal users
        recipes_by_admin = db.recipes.count_documents({
            "$or": [
                {"created_by": {"$in": admin_ids}},
                {"created_by": None},
                {"is_admin_recipe": True}
            ]
        })
        recipes_by_user = max(0, total_recipes - recipes_by_admin)

        return jsonify({
            "users": total_users,
            "recipes": total_recipes,
            "recipes_by_admin": recipes_by_admin,
            "recipes_by_user": recipes_by_user,
            "reviews": total_reviews
        }), 200
    except Exception as e:
        current_app.logger.exception("Admin statistics failed")
        return jsonify(message="Unable to load statistics.", error=str(e)), 500
@admin_bp.get("/users")
@admin_required
def list_users():
    db = current_app.extensions["mongo_db"]

    try:
        users = list(db.users.find(
            {},
            {"password_hash": 0}
        ).sort("_id", -1).limit(200))

        # Calculate recipe count for each user
        for user in users:
            uid_str = str(user["_id"])
            user["_id"] = uid_str
            user["recipe_count"] = db.recipes.count_documents({"created_by": uid_str})
            if "status" not in user:
                user["status"] = "active"
            if "created_at" in user and isinstance(user["created_at"], datetime):
                user["created_at"] = user["created_at"].isoformat()

        return jsonify({"users": users}), 200
    except Exception as e:
        current_app.logger.exception("Admin user list failed")
        return jsonify(message="Unable to retrieve users.", error=str(e)), 500
@admin_bp.patch("/users/<user_id>/status")
@admin_required
def update_user_status(user_id):
    if not ObjectId.is_valid(user_id):
        return jsonify(message="Invalid user ID."), 400

    data = request.get_json(silent=True) or {}
    new_status = data.get("status", "").strip().lower()

    if new_status not in ["active", "restricted", "deactivated"]:
        return jsonify(message="Invalid status. Must be 'active', 'restricted', or 'deactivated'."), 400

    db = current_app.extensions["mongo_db"]
    user = db.users.find_one({"_id": ObjectId(user_id)})

    if not user:
        return jsonify(message="User not found."), 404

    if user.get("role") == "admin":
        return jsonify(message="Administrator status cannot be modified."), 403

    try:
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"status": new_status, "status_updated_at": datetime.utcnow().isoformat()}}
        )
        return jsonify(message=f"User account status updated to {new_status}.", status=new_status), 200
    except PyMongoError:
        current_app.logger.exception("Admin user status update failed")
        return jsonify(message="Unable to update user status."), 500
@admin_bp.delete("/users/<user_id>")
@admin_required
def delete_user(user_id):
    if not ObjectId.is_valid(user_id):
        return jsonify(message="Invalid user ID."), 400

    db = current_app.extensions["mongo_db"]
    user = db.users.find_one({"_id": ObjectId(user_id)})

    if not user:
        return jsonify(message="User not found."), 404

    if user.get("role") == "admin":
        return jsonify(message="Admin accounts cannot be deleted here."), 403

    try:
        db.users.delete_one({"_id": ObjectId(user_id)})
        uid_str = str(user["_id"])

        db.recipes.delete_many({"created_by": uid_str})
        db.favorites.delete_many({"user_id": uid_str})
        db.reviews.delete_many({"user_id": uid_str})
        db.shopping_lists.delete_many({"user_id": uid_str})

        return jsonify(message="User and associated content deleted."), 200
    except PyMongoError:
        current_app.logger.exception("Admin user deletion failed")
        return jsonify(message="Unable to delete user."), 500
@admin_bp.get("/recipes")
@admin_required
def list_admin_recipes():
    db = current_app.extensions["mongo_db"]
    try:
        recipes = list(db.recipes.find({}).sort("_id", -1).limit(300))

        # Collect user ids for fast lookup
        created_by_ids = []
        for r in recipes:
            cb = r.get("created_by")
            if cb and ObjectId.is_valid(str(cb)):
                created_by_ids.append(ObjectId(str(cb)))

        user_map = {}
        if created_by_ids:
            found_users = list(db.users.find({"_id": {"$in": created_by_ids}}, {"name": 1, "email": 1, "role": 1}))
            for u in found_users:
                user_map[str(u["_id"])] = {
                    "id": str(u["_id"]),
                    "name": u.get("name", "Chef"),
                    "email": u.get("email", ""),
                    "role": u.get("role", "user")
                }

        for r in recipes:
            r["_id"] = str(r["_id"])
            cb = str(r.get("created_by") or "")
            creator = user_map.get(cb)

            if creator:
                r["creator_name"] = creator["name"]
                r["creator_email"] = creator["email"]
                r["creator_role"] = creator["role"]
            else:
                is_admin = r.get("is_admin_recipe", False) or not cb
                r["creator_name"] = "System Administrator" if is_admin else "Community Chef"
                r["creator_email"] = "admin@recipenest.com" if is_admin else "user@recipenest.com"
                r["creator_role"] = "admin" if is_admin else "user"

            if "created_at" in r and isinstance(r["created_at"], datetime):
                r["created_at"] = r["created_at"].isoformat()
            if "updated_at" in r and isinstance(r["updated_at"], datetime):
                r["updated_at"] = r["updated_at"].isoformat()

        return jsonify({"recipes": recipes}), 200
    except Exception as e:
        current_app.logger.exception("Admin recipe list failed")
        return jsonify(message="Unable to retrieve recipes.", error=str(e)), 500
@admin_bp.get("/reviews")
@admin_required
def list_admin_reviews():
    db = current_app.extensions["mongo_db"]
    try:
        reviews = list(db.reviews.find({}).sort("_id", -1).limit(200))

        # Resolve recipe titles
        recipe_ids = []
        for r in reviews:
            rid = r.get("recipe_id")
            if rid and ObjectId.is_valid(str(rid)):
                recipe_ids.append(ObjectId(str(rid)))

        recipe_map = {}
        if recipe_ids:
            recipes = list(db.recipes.find({"_id": {"$in": recipe_ids}}, {"name": 1}))
            for rec in recipes:
                recipe_map[str(rec["_id"])] = rec.get("name", "Recipe")

        for r in reviews:
            r["_id"] = str(r["_id"])
            r["recipe_name"] = recipe_map.get(str(r.get("recipe_id")), "Delicious Recipe")
            if "created_at" in r and hasattr(r["created_at"], "isoformat"):
                r["created_at"] = r["created_at"].isoformat()

            raw_replies = r.get("replies") or []
            formatted_replies = []
            for rep in raw_replies:
                rep_copy = dict(rep)
                if "_id" in rep_copy:
                    rep_copy["_id"] = str(rep_copy["_id"])
                if "created_at" in rep_copy and hasattr(rep_copy["created_at"], "isoformat"):
                    rep_copy["created_at"] = rep_copy["created_at"].isoformat()
                formatted_replies.append(rep_copy)
            r["replies"] = formatted_replies

        return jsonify({"reviews": reviews}), 200
    except Exception as e:
        current_app.logger.exception("Admin reviews list failed")
        return jsonify(message="Unable to retrieve reviews.", error=str(e)), 500
@admin_bp.delete("/reviews/<review_id>")
@admin_required
def delete_admin_review(review_id):
    if not ObjectId.is_valid(review_id):
        return jsonify(message="Invalid review ID."), 400

    db = current_app.extensions["mongo_db"]
    try:
        db.reviews.delete_one({"_id": ObjectId(review_id)})
        return jsonify(message="Review deleted successfully."), 200
    except PyMongoError:
        current_app.logger.exception("Admin review deletion failed")
        return jsonify(message="Unable to delete review."), 500
@admin_bp.post("/contact-creator")
@admin_required
def contact_creator():
    from flask_jwt_extended import get_jwt_identity
    from utils.mailer import send_recipe_contact_email
    from datetime import timezone

    data = request.get_json(silent=True) or {}
    recipe_id = data.get("recipe_id", "").strip()
    recipient_email = data.get("recipient_email", "").strip().lower()
    recipient_name = data.get("recipient_name", "Chef").strip()
    subject = data.get("subject", "").strip() or "Inquiry regarding your recipe"
    message = data.get("message", "").strip()

    if not recipe_id or not recipient_email or not message:
        return jsonify(message="Recipe ID, recipient email, and message body are required."), 400

    db = current_app.extensions["mongo_db"]

    # Look up recipe
    recipe = None
    if ObjectId.is_valid(recipe_id):
        recipe = db.recipes.find_one({"_id": ObjectId(recipe_id)})
    recipe_name = recipe.get("name", "Recipe") if recipe else data.get("recipe_name", "Recipe")

    # to Look up admin details
    admin_id = get_jwt_identity()
    admin_user = db.users.find_one({"_id": ObjectId(admin_id)}) if ObjectId.is_valid(admin_id) else None
    admin_name = admin_user.get("name", "RecipeNest Administrator") if admin_user else "RecipeNest Administrator"
    admin_email = admin_user.get("email", "admin@recipenest.com") if admin_user else "admin@recipenest.com"

    # to Find recipient user if exists in DB
    target_user = db.users.find_one({"email": recipient_email})

    inquiry_doc = {
        "recipe_id": recipe_id,
        "recipe_name": recipe_name,
        "user_id": str(target_user["_id"]) if target_user else str(recipe.get("created_by") if recipe else ""),
        "user_email": recipient_email,
        "user_name": recipient_name,
        "admin_id": str(admin_id),
        "admin_name": admin_name,
        "admin_email": admin_email,
        "subject": subject,
        "message": message,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    try:
        inserted = db.recipe_inquiries.insert_one(inquiry_doc)
        inquiry_doc["_id"] = str(inserted.inserted_id)

        # Dispatch email
        email_result = send_recipe_contact_email(
            to_email=recipient_email,
            recipient_name=recipient_name,
            recipe_name=recipe_name,
            subject=subject,
            message_text=message,
            admin_name=admin_name
        )

        return jsonify({
            "message": f"Inquiry regarding '{recipe_name}' dispatched to {recipient_name} ({recipient_email}).",
            "inquiry": inquiry_doc,
            "email_status": email_result
        }), 201

    except PyMongoError:
        current_app.logger.exception("Failed to store recipe inquiry")
        return jsonify(message="Database error while saving inquiry."), 500
@admin_bp.get("/inquiries")
@admin_required
def list_inquiries():
    db = current_app.extensions["mongo_db"]
    try:
        inquiries = list(db.recipe_inquiries.find({}).sort("_id", -1).limit(100))
        for item in inquiries:
            item["_id"] = str(item["_id"])
        return jsonify({"inquiries": inquiries}), 200
    except PyMongoError:
        current_app.logger.exception("Failed to retrieve recipe inquiries")
        return jsonify(message="Unable to load inquiries."), 500
