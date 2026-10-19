import sys
import os

backend_path = r"c:\Users\nakka\Downloads\Food Receipe\backend"
sys.path.insert(0, backend_path)

results = []

def test(name, fn):
    try:
        fn()
        results.append((name, "PASS", "Success"))
        print(f"[PASS] {name}")
    except Exception as e:
        results.append((name, "FAIL", str(e)))
        print(f"[FAIL] {name}: {e}")

# 1. Config & Settings Check
def test_config():
    from config.settings import Config
    assert hasattr(Config, "UPLOAD_FOLDER")
    assert hasattr(Config, "JWT_SECRET_KEY")
    assert hasattr(Config, "GEMINI_API_KEY")

# 2. Database Connection Module
def test_db_module():
    import config.db
    assert hasattr(config.db, "connect_db")

# 3. Recipe Document Factory & Instruction Normalizer
def test_recipe_model():
    from models.recipe_model import create_recipe_document, normalize_instructions
    norm = normalize_instructions(["Chop vegetables", "Boil water"])
    assert len(norm) == 2
    assert norm[0]["step"] == 1
    doc = create_recipe_document({
        "name": "Paneer Butter Masala",
        "ingredients": ["Paneer", "Butter", "Tomato"],
        "instructions": ["Cook sauce", "Add paneer"],
        "cooking_time": 25
    }, "user123")
    assert doc["name"] == "Paneer Butter Masala"
    assert doc["cooking_time"] == 25

# 4. User Model Document Factory
def test_user_model():
    from models.user_model import create_user_document
    u = create_user_document("Chef John", "john@example.com", "hashed_pw", "admin")
    assert u["email"] == "john@example.com"
    assert u["role"] == "admin"

# 5. Review Model Document Factory
def test_review_model():
    from models.review_model import create_review_document
    r = create_review_document("user1", "rec1", 5, "Delicious!")
    assert r["rating"] == 5
    assert r["comment"] == "Delicious!"

# 6. Shopping List Model Factory
def test_shopping_model():
    from models.shopping_list_model import create_shopping_list_document
    s = create_shopping_list_document("user1", "rec1", ["Milk", "Eggs"])
    assert len(s["ingredients"]) == 2

# 7. Auth Blueprint
def test_auth_routes():
    from routes.auth_routes import auth_bp
    assert auth_bp.name == "auth"

# 8. Recipe Catalog Blueprint
def test_recipe_routes():
    from routes.recipe_routes import recipe_bp
    assert recipe_bp.name == "recipes"

# 9. User Favorites Blueprint
def test_favorite_routes():
    from routes.favorite_routes import favorite_bp
    assert favorite_bp.name == "favorites"

# 10. Community Reviews & Moderation Blueprint
def test_review_routes():
    from routes.review_routes import review_bp
    assert review_bp.name == "reviews"

# 11. Shopping List Blueprint
def test_shopping_routes():
    from routes.shopping_list_routes import shopping_bp
    assert shopping_bp.name == "shopping"

# 12. Admin Telemetry & User Ops Blueprint
def test_admin_routes():
    from routes.admin_routes import admin_bp
    assert admin_bp.name == "admin"

# 13. AI Recommendation Blueprint
def test_recommendation_routes():
    from routes.recommendation_routes import recommendation_bp
    assert recommendation_bp.name == "recommendations"

# 14. Media Upload Blueprint
def test_upload_routes():
    from routes.upload_routes import upload_bp
    assert upload_bp.name == "uploads"

# 15. Gemini Generative Culinary AI Service
def test_gemini_service():
    from services.gemini_service import get_gemini_api_key, generate_personalized_recommendations
    assert callable(get_gemini_api_key)
    assert callable(generate_personalized_recommendations)

# 16. Automated Mailer Service
def test_mailer():
    from utils.mailer import send_password_reset_email, send_recipe_contact_email
    assert callable(send_password_reset_email)
    assert callable(send_recipe_contact_email)

# 17. Admin Authorization Decorator
def test_decorators():
    from utils.decorators import admin_required
    assert callable(admin_required)

# 18. Flask Application Factory
def test_app_factory():
    from app import create_app
    assert callable(create_app)

test("Config & Environment Settings (config/settings.py)", test_config)
test("Database Connector Engine (config/db.py)", test_db_module)
test("Recipe Schema & Normalizer (models/recipe_model.py)", test_recipe_model)
test("User Schema & Document Model (models/user_model.py)", test_user_model)
test("Review & Feedback Schema (models/review_model.py)", test_review_model)
test("Shopping List Schema (models/shopping_list_model.py)", test_shopping_model)
test("Authentication & JWT Endpoints (routes/auth_routes.py)", test_auth_routes)
test("Recipe CRUD & Search Endpoints (routes/recipe_routes.py)", test_recipe_routes)
test("User Bookmark / Favorites API (routes/favorite_routes.py)", test_favorite_routes)
test("Community Reviews & Moderation API (routes/review_routes.py)", test_review_routes)
test("Pantry Shopping List API (routes/shopping_list_routes.py)", test_shopping_routes)
test("Executive Admin Telemetry API (routes/admin_routes.py)", test_admin_routes)
test("Gemini Culinary Recommendation API (routes/recommendation_routes.py)", test_recommendation_routes)
test("Multipart Image & Video Upload API (routes/upload_routes.py)", test_upload_routes)
test("Gemini 1.5 Flash AI Service (services/gemini_service.py)", test_gemini_service)
test("SMTP Mailer Notification Service (utils/mailer.py)", test_mailer)
test("Role-Based Security Decorator (utils/decorators.py)", test_decorators)
test("Flask Application Factory & CORS Lifecycle (app.py)", test_app_factory)

print(f"\n==========================================")
print(f"Backend Test Suite: {sum(1 for r in results if r[1] == 'PASS')}/{len(results)} PASSED")
print(f"==========================================")
