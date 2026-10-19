
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity
)
from bson import ObjectId
from pymongo.errors import DuplicateKeyError, PyMongoError
import bcrypt
import secrets
import re
from models.user_model import create_user_document
from utils.validators import valid_email
auth_bp = Blueprint("auth", __name__)
@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}

    name = data.get("name", "")
    email = data.get("email", "")
    password = data.get("password", "")

    if not isinstance(name, str) or not name.strip():
        return jsonify(message="Name is required."), 400

    if len(name.strip()) > 100:
        return jsonify(message="Name is too long."), 400

    if not valid_email(email):
        return jsonify(message="Enter a valid email address."), 400

    if not isinstance(password, str) or len(password) < 8:
        return jsonify(message="Password must contain at least 8 characters."), 400

    if len(password.encode("utf-8")) > 72:
        return jsonify(message="Password is too long."), 400

    db = current_app.extensions["mongo_db"]
    email = email.strip().lower()

    password_hash = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    # Only the configured admin email receives admin access.
    import os
    admin_email = os.getenv("ADMIN_EMAIL", "").strip().lower()
    role = "admin" if admin_email and email == admin_email else "user"

    user = create_user_document(name.strip(), email, password_hash, role)

    try:
        result = db.users.insert_one(user)
    except DuplicateKeyError:
        return jsonify(message="An account with this email already exists."), 409
    except PyMongoError:
        current_app.logger.exception("Registration failed")
        return jsonify(message="Unable to register right now."), 500

    token = create_access_token(
        identity=str(result.inserted_id),
        additional_claims={"role": role}
    )

    return jsonify({
        "message": "Registration successful.",
        "token": token,
        "user": {
            "id": str(result.inserted_id),
            "name": name.strip(),
            "email": email,
            "role": role
        }
    }), 201
@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "")
    password = data.get("password", "")

    if not isinstance(email, str) or not isinstance(password, str):
        return jsonify(message="Invalid email or password."), 400

    db = current_app.extensions["mongo_db"]

    try:
        user = db.users.find_one({"email": email.strip().lower()})
    except PyMongoError:
        current_app.logger.exception("Login lookup failed")
        return jsonify(message="Unable to log in right now."), 500

    if not user:
        return jsonify(message="Invalid email or password."), 401

    try:
        valid_password = bcrypt.checkpw(
            password.encode("utf-8"),
            user["password_hash"].encode("utf-8")
        )
    except (ValueError, KeyError):
        valid_password = False

    if not valid_password:
        return jsonify(message="Invalid email or password."), 401

    if user.get("status") == "deactivated":
        return jsonify(message="Your account has been deactivated by an administrator. Please contact support."), 403

    token = create_access_token(
        identity=str(user["_id"]),
        additional_claims={"role": user.get("role", "user")}
    )

    return jsonify({
        "message": "Login successful.",
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "user")
        }
    }), 200
@auth_bp.post("/admin-login")
def admin_login():
    import os
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not isinstance(email, str) or not isinstance(password, str) or not email or not password:
        return jsonify(message="Admin email and password are required."), 400

    admin_email = os.getenv("ADMIN_EMAIL", "").strip().lower()

    # Strictly check that the email matches the single authorized admin email
    if not admin_email or email != admin_email:
        return jsonify(message="Access denied: Only the authorized administrator email can access the Admin Portal."), 403

    db = current_app.extensions["mongo_db"]
    user = db.users.find_one({"email": email})

    if not user or user.get("role") != "admin":
        return jsonify(message="Access denied: This account does not have administrator privileges."), 403

    try:
        valid_password = bcrypt.checkpw(
            password.encode("utf-8"),
            user["password_hash"].encode("utf-8")
        )
    except (ValueError, KeyError):
        valid_password = False

    if not valid_password:
        return jsonify(message="Invalid administrator credentials."), 401

    token = create_access_token(
        identity=str(user["_id"]),
        additional_claims={"role": "admin"}
    )

    return jsonify({
        "message": "Admin authentication successful.",
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user.get("name", "Administrator"),
            "email": user["email"],
            "role": "admin"
        }
    }), 200
@auth_bp.get("/me")
@jwt_required()
def me():
    db = current_app.extensions["mongo_db"]
    identity = get_jwt_identity()

    if not ObjectId.is_valid(identity):
        return jsonify(message="Invalid user token."), 401

    user = db.users.find_one({"_id": ObjectId(identity)})

    if not user:
        return jsonify(message="User not found."), 404

    return jsonify({
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "user")
        }
    }), 200
@auth_bp.get("/inquiries")
@jwt_required()
def get_user_inquiries():
    db = current_app.extensions["mongo_db"]
    identity = get_jwt_identity()

    if not ObjectId.is_valid(identity):
        return jsonify(message="Invalid user token."), 401

    user = db.users.find_one({"_id": ObjectId(identity)})
    if not user:
        return jsonify(message="User not found."), 404

    user_email = user.get("email", "").strip().lower()
    inquiries = list(db.recipe_inquiries.find({
        "$or": [
            {"user_id": str(identity)},
            {"user_email": user_email}
        ]
    }).sort("_id", -1).limit(50))

    for item in inquiries:
        item["_id"] = str(item["_id"])

    return jsonify({"inquiries": inquiries}), 200
@auth_bp.post("/google")
def google_auth():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    name = data.get("name", "").strip() or "Google User"

    if not email:
        return jsonify(message="Email is required from Google sign-in."), 400

    db = current_app.extensions["mongo_db"]
    user = db.users.find_one({"email": email})

    import os
    admin_email = os.getenv("ADMIN_EMAIL", "").strip().lower()

    if not user:
        role = "admin" if admin_email and email == admin_email else "user"
        random_hash = bcrypt.hashpw(
            secrets.token_hex(16).encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")
        new_user = create_user_document(name, email, random_hash, role)
        result = db.users.insert_one(new_user)
        user_id = str(result.inserted_id)
        user_role = role
    else:
        user_id = str(user["_id"])
        user_role = user.get("role", "user")
        name = user.get("name", name)

    token = create_access_token(
        identity=user_id,
        additional_claims={"role": user_role}
    )

    return jsonify({
        "message": "Google authentication successful.",
        "token": token,
        "user": {
            "id": user_id,
            "name": name,
            "email": email,
            "role": user_role
        }
    }), 200
from utils.mailer import send_password_reset_email
from datetime import datetime, timezone, timedelta
@auth_bp.post("/forgot-password")
def forgot_password():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()

    if not email:
        return jsonify(message="Email address is required."), 400

    db = current_app.extensions["mongo_db"]
    user = db.users.find_one({"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}})

    if not user:
        return jsonify(message=f"No account found for {email}. Please check your email address or create a new account."), 404

    # Generate 6-digit numerical code and URL-safe token
    reset_code = f"{secrets.randbelow(900000) + 100000}"
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

    db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "reset_code": reset_code,
            "reset_token": reset_token,
            "reset_expires_at": expires_at.isoformat()
        }}
    )

    # Dispatch email
    user_name = user.get("name", "Chef")
    mail_result = send_password_reset_email(email, reset_code, user_name)

    response_payload = {
        "status": "success",
        "message": f"A 6-digit password reset code has been dispatched to {email}. Please check your email inbox and spam folder.",
        "reset_token": reset_token,
        "email": email,
        "email_sent": mail_result.get("success", False),
    }

    return jsonify(response_payload), 200
@auth_bp.post("/reset-password")
def reset_password():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    new_password = data.get("password") or data.get("new_password") or ""
    code = str(data.get("code") or data.get("reset_code") or "").strip()
    token = str(data.get("token") or data.get("reset_token") or "").strip()

    if not email or not new_password or len(new_password) < 8:
        return jsonify(message="Valid email and new password (min 8 characters) required."), 400

    db = current_app.extensions["mongo_db"]
    user = db.users.find_one({"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}})

    if not user:
        return jsonify(message="User account not found."), 404

    # Check expiration if stored
    reset_expires_at = user.get("reset_expires_at")
    if reset_expires_at:
        try:
            exp_dt = datetime.fromisoformat(reset_expires_at)
            if exp_dt.tzinfo is None:
                exp_dt = exp_dt.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) > exp_dt:
                return jsonify(message="Verification code has expired. Please request a new code."), 400
        except Exception:
            pass

    saved_code = str(user.get("reset_code") or "").strip()
    saved_token = str(user.get("reset_token") or "").strip()

    if saved_code or saved_token:
        candidates = [c for c in [code, token] if c]
        valid_targets = [t for t in [saved_code, saved_token] if t]

        matched = any(c in valid_targets for c in candidates)
        if not matched:
            return jsonify(message="Invalid or incorrect verification code. Please check your code and try again."), 400

    new_hash = bcrypt.hashpw(
        new_password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password_hash": new_hash}, "$unset": {
            "reset_code": "",
            "reset_token": "",
            "reset_expires_at": ""
        }}
    )

    return jsonify({
        "status": "success",
        "message": "Your password has been successfully reset! Please log in with your new password."
    }), 200


