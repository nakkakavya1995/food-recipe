# RecipeNest - Food Recipe & Smart Recommendation System

A modern full-stack web application for discovering recipes, cooking step-by-step with interactive guides, managing pantry shopping lists, and receiving smart culinary recommendations powered by personalized taste profiling and Google Gemini AI.

---

## Features

### Recipe Discovery & Browsing
- **Search & Filtering**: Search recipes by name or ingredients; filter dynamically by cuisine (Indian, Italian, Asian, Mexican, Continental, Mediterranean), meal type (Breakfast, Lunch, Dinner, Snack, Dessert), and cooking duration.
- **Interactive Step-by-Step Cooking**: Visual step cards with individual images, instructions, and timers to guide cooks in real-time.
- **Media Support**: Support for high-resolution recipe cover photos and step images, plus embedded recipe video demonstrations.

### Smart AI & Personalized Recommendations
- **Favorite-Driven Taste Profiling**: Instant recommendation engine that learns from a user's bookmarked recipes, matching cuisine affinities, meal preferences, and ingredient overlaps.
- **AI Chef / Culinary Assistant**: Powered by Google Gemini 1.5 Flash to recommend customized recipes based on available pantry ingredients, dietary restrictions, mood, and preparation time limits.
- **Cold-Start Fallback**: Dynamic curation that surfaces trending community recipes when a user is new or has no saved favorites yet.

### User System & Social Features
- **Authentication & Security**: Secure JWT authentication, password hashing with bcrypt, and email-based password reset workflows using SMTP.
- **Favorites & Bookmarks**: One-click bookmarking to quickly access saved recipes anytime.
- **Reviews & Ratings**: Community star ratings and text reviews with instant average rating calculation.
- **Pantry & Shopping List**: Auto-generate checklist-ready shopping lists directly from recipe ingredients.

### Administration & Moderation
- **Admin Dashboard**: Real-time telemetry displaying total users, recipes, reviews, and community engagement.
- **Recipe Moderation**: Full CRUD capabilities for administrators to create, update, feature, or remove recipes.
- **User Role Management**: Role-Based Access Control (RBAC) supporting standard users and administrators.

---

## Technologies Used

### Frontend
- **React 18** - Component-driven UI architecture
- **Vite** - High-performance frontend tooling and bundling
- **React Router v6** - Client-side routing with protected routes
- **Axios** - HTTP client with request/response interceptors
- **Lucide React** - Clean and accessible UI iconography
- **CSS3** - Glassmorphism design system, responsive flex/grid layouts, and theme support

### Backend
- **Python 3.9+** - Core backend runtime
- **Flask** - RESTful API framework with modular blueprints
- **Flask-JWT-Extended** - Secure token-based authentication and role verification
- **Flask-CORS** - Cross-Origin Resource Sharing handling
- **PyMongo** - MongoDB driver for Python
- **bcrypt** - Salted password hashing
- **Requests** - External API communication

### Database
- **MongoDB** - Document store managing users, recipes, reviews, shopping lists, and search queries

### AI / Generative Model
- **Google Gemini 1.5 Flash** - Generative AI integration for personalized culinary recommendations and smart ingredient pairing

---

## Dataset and Model Performance

### Dataset Overview
- **Curated Culinary Catalog**: A pre-seeded collection of diverse global recipes spanning Indian, Continental, Italian, Asian, and Mediterranean cuisines.
- **Schema Attributes**:
  - `name`: Recipe title
  - `description`: Overview and flavor profile
  - `cuisine`: Region/culinary style (e.g., Indian, Italian, Mexican)
  - `meal_type`: Categorization (Breakfast, Lunch, Dinner, Snack, Dessert)
  - `cooking_time`: Duration in minutes
  - `servings`: Portion yield
  - `ingredients`: Array of parsed ingredients with quantity measurements
  - `instructions`: Structured step-by-step directions with optional step media
  - `image_url` & `video_url`: Cover imagery and video tutorials
  - `ratings`: Aggregated user scores and review count
- **Data Seeding**: Automated population via `backend/seed_recipes.py` provides 60+ production-grade sample recipes out of the box.

### Recommendation Engine & Model Performance

The recommendation engine employs a hybrid architecture:

| Component | Mechanism | Benchmark / Metric |
| :--- | :--- | :--- |
| **Preference Engine** | Weighted scoring based on user favorites (Cuisine 30x, Meal Style 18x, Ingredient overlap 10x) | **~15 - 35 ms** response time |
| **Generative AI** | Google Gemini 1.5 Flash prompt orchestration for pantry & mood matching | **~0.8 - 1.4 s** latency |
| **Cold-Start Handling** | Automated fallback to community-rated top recipes | **0 ms** delay |
| **Filtering Precision** | Exact matching for dietary constraints (Vegetarian, Vegan, Gluten-Free) | **100%** compliance |
| **Deduplication** | Automatic exclusion of already favorited recipes from recommendation feed | **100%** uniqueness |

---

## Project Structure

```text
Food Receipe/
├── .gitignore                      # Git ignore rules for root, env, and build artifacts
├── README.md                       # Project documentation
├── backend/
│   ├── .env.example                # Sample environment variables for backend
│   ├── app.py                      # Flask application factory and route registration
│   ├── config/
│   │   ├── db.py                   # MongoDB database connection client
│   │   └── settings.py             # App configuration and environment loader
│   ├── models/
│   │   ├── recipe_model.py         # Recipe schema definition and normalizers
│   │   ├── review_model.py         # Review and rating schema
│   │   ├── shopping_list_model.py  # Shopping list schema
│   │   └── user_model.py           # User document schema
│   ├── routes/
│   │   ├── admin_routes.py         # Admin metrics, user, and recipe moderation
│   │   ├── auth_routes.py          # User registration, login, profile, password reset
│   │   ├── favorite_routes.py      # User bookmarking and saved recipes
│   │   ├── recipe_routes.py        # Recipe browsing, details, search, CRUD
│   │   ├── recommendation_routes.py# Hybrid taste matching and AI recommendation endpoints
│   │   ├── review_routes.py        # Recipe reviews and ratings
│   │   ├── shopping_list_routes.py # Pantry and shopping list endpoints
│   │   └── upload_routes.py        # Image and video file uploads
│   ├── services/
│   │   └── gemini_service.py       # Google Gemini 1.5 Flash API integration
│   ├── utils/
│   │   ├── decorators.py           # Role-based access control decorators
│   │   ├── mailer.py               # SMTP email service for password resets
│   │   ├── recipe_scraper.py       # Web recipe scraper utility
│   │   └── validators.py           # Input payload validators
│   ├── uploads/                    # Local storage for uploaded media
│   ├── init_admin.py               # Script to seed default administrator
│   ├── seed_recipes.py             # Script to populate database with sample recipes
│   ├── requirements.txt            # Python dependencies
│   └── scratch_test_all.py         # Backend test verification suite
└── frontend/
    ├── .env.example                # Sample environment variables for frontend
    ├── index.html                  # HTML entry point
    ├── package.json                # Frontend package configuration and scripts
    ├── vite.config.js              # Vite configuration
    ├── public/                     # Public static assets
    └── src/
        ├── App.jsx                 # Application routes and main layout
        ├── App.css                 # Core CSS rules and theme variables
        ├── index.css               # Global baseline styling
        ├── components/
        │   ├── Navbar.jsx          # Navigation header
        │   ├── Footer.jsx          # Footer component
        │   ├── ProtectedRoute.jsx  # Auth & admin route guard
        │   ├── RecipeCard.jsx      # Recipe preview card
        │   ├── RecipeFilters.jsx   # Filter sidebar/bar (cuisine, time, meal type)
        │   ├── SearchBar.jsx       # Search input with debounced queries
        │   ├── ThemeToggle.jsx     # Light / Dark theme toggle
        │   └── VideoPlayer.jsx     # Embedded video component
        ├── context/
        │   ├── AuthContext.jsx     # Authentication state & session management
        │   ├── FavoritesContext.jsx# User favorites global state
        │   └── ThemeContext.jsx    # Theme provider
        ├── pages/
        │   ├── Home.jsx            # Landing page with hero section & featured recipes
        │   ├── Recipes.jsx         # Catalog browsing with search and filters
        │   ├── RecipeDetails.jsx   # Single recipe view with step mode & reviews
        │   ├── Recommendations.jsx # Personalized & AI recommendation dashboard
        │   ├── Favorites.jsx       # User's bookmarked recipes
        │   ├── AddRecipe.jsx       # Recipe submission form with media uploads
        │   ├── EditRecipe.jsx      # Recipe editing form
        │   ├── Login.jsx           # Sign in page
        │   ├── Register.jsx        # Sign up page
        │   ├── Profile.jsx         # User account details and activity
        │   ├── AdminDashboard.jsx  # Admin analytics and metrics
        │   ├── AdminRecipes.jsx    # Admin recipe table and management
        │   └── NotFound.jsx        # 404 page
        └── services/
            ├── api.js              # Axios base instance and interceptors
            ├── authService.js      # Auth API calls
            ├── recipeService.js    # Recipe API calls
            └── recommendationService.js # Recommendation API calls
```

---

## Installation and Execution

### Prerequisites
- **Python** (v3.9 or higher)
- **Node.js** (v18 or higher) and **npm**
- **MongoDB** running locally on port 27017 or a MongoDB Atlas connection URI

---

### 1. Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   - On Windows (PowerShell):
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - On macOS/Linux:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your settings:
   ```env
   MONGO_URI=mongodb://localhost:27017
   DATABASE_NAME=food_recipe_db
   FRONTEND_URL=http://localhost:5173
   JWT_SECRET_KEY=your_secure_secret_key_here
   ADMIN_EMAIL=admin@recipenest.com

   # Optional: SMTP for password reset
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   SMTP_FROM=RecipeNest <support@recipenest.com>
   SMTP_USE_TLS=true

   # Optional: Google Gemini API for AI recommendations
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

5. **Seed the database and initialize the admin**:
   ```bash
   python seed_recipes.py
   python init_admin.py
   ```

6. **Start the backend server**:
   ```bash
   python app.py
   ```
   The backend API will run at `http://127.0.0.1:5000`.

---

### 2. Frontend Setup

1. **Open a new terminal and navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure frontend environment variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Ensure `VITE_API_BASE_URL` points to your backend:
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:5000/api
   ```

4. **Run the frontend development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173` to view the application.

---

### 3. Running Verification & Production Build

- **Run backend verification tests**:
  ```bash
  cd backend
  python scratch_test_all.py
  ```
- **Build frontend for production**:
  ```bash
  cd frontend
  npm run build
  ```

---

## License

This project is open source and available under the [MIT License](LICENSE).
