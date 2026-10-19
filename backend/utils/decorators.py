
from functools import wraps
import os
from flask import jsonify, current_app
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity
from bson import ObjectId
def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify(message="Access denied: Administrator privileges required."), 403

        identity = get_jwt_identity()
        if not ObjectId.is_valid(identity):
            return jsonify(message="Invalid authorization token identity."), 401

        db = current_app.extensions.get("mongo_db")
        if db is not None:
            user = db.users.find_one({"_id": ObjectId(identity)})
            admin_email = os.getenv("ADMIN_EMAIL", "").strip().lower()

            if not user or user.get("role") != "admin":
                return jsonify(message="Access denied: Administrator privileges required."), 403

            if admin_email and user.get("email", "").strip().lower() != admin_email:
                return jsonify(message="Access denied: Only the single designated administrator account has access."), 403

        return fn(*args, **kwargs)

    return wrapper
