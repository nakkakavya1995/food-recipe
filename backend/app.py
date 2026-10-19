
import os

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo.errors import PyMongoError

from config.db import connect_db
from config.settings import Config

from routes.auth_routes import auth_bp
from routes.recipe_routes import recipe_bp
from routes.favorite_routes import favorite_bp
from routes.review_routes import review_bp
from routes.shopping_list_routes import shopping_bp
from routes.admin_routes import admin_bp
from routes.upload_routes import upload_bp
from routes.recommendation_routes import recommendation_bp
from flask import send_from_directory


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Allow endpoints to match with or without trailing slashes
    app.url_map.strict_slashes = False

    if not app.config.get("JWT_SECRET_KEY"):
        raise RuntimeError("Set JWT_SECRET_KEY in backend/.env")

    # Universal CORS configuration for development & production
    CORS(
        app,
        resources={r"/*": {"origins": "*"}},
        supports_credentials=False,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    )

    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = app.make_default_options_response()
            origin = request.headers.get("Origin", "*")
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            return response

    @app.after_request
    def add_cors_headers(response):
        origin = request.headers.get("Origin", "*")
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        return response

    JWTManager(app)

    # Connect to MongoDB before accepting requests.
    database = connect_db()
    app.extensions["mongo_db"] = database

    # Ensure single admin account is initialized
    try:
        from init_admin import init_admin
        init_admin()
    except Exception as e:
        app.logger.warning(f"Could not auto-initialize admin: {e}")

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(recipe_bp, url_prefix="/api/recipes")
    app.register_blueprint(favorite_bp, url_prefix="/api/favorites")
    app.register_blueprint(review_bp, url_prefix="/api/reviews")
    app.register_blueprint(
        shopping_bp, url_prefix="/api/shopping-lists"
    )
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(upload_bp, url_prefix="/api/uploads")
    app.register_blueprint(recommendation_bp, url_prefix="/api/recommendations")

    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(Config.UPLOAD_FOLDER, filename)

    @app.get("/api/health")
    def health():
        return jsonify({
            "status": "success",
            "message": "Food Recipe API is running!"
        }), 200

    @app.errorhandler(404)
    def not_found(error):
        return jsonify(message="API endpoint not found."), 404

    @app.errorhandler(413)
    def too_large(error):
        return jsonify(message="Request body is too large."), 413

    return app


if __name__ == "__main__":
    application = create_app()
    application.run(host="0.0.0.0", port=5000, debug=True)
