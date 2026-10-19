import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChefHat,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import RecipeCard from '../components/RecipeCard';
import SearchBar from '../components/SearchBar';
import { getRecipes } from '../services/recipeService';
import { getPersonalizedRecommendations, logSearchHistory } from '../services/recommendationService';

export default function Home() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recReason, setRecReason] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(true);

  const categories = [
    { label: 'All Recipes', query: '' },
    { label: 'Breakfast', query: 'meal_type=Breakfast' },
    { label: 'Lunch', query: 'meal_type=Lunch' },
    { label: 'Dinner', query: 'meal_type=Dinner' },
    { label: 'Desserts', query: 'meal_type=Dessert' },
    { label: 'Under 20 Mins', query: 'max_time=20' },
    { label: 'With Video', query: 'video=true' },
  ];

  useEffect(() => {
    getRecipes()
      .then((data) => setRecipes(data.slice(0, 8)))
      .catch(() => setError('Could not load recipes. Please check your connection.'))
      .finally(() => setLoading(false));

    getPersonalizedRecommendations()
      .then((data) => {
        const list = data.recommendations || data.recipes || [];
        setRecommendations(list.slice(0, 4));
        setRecReason(data.reason || '');
      })
      .catch(() => {})
      .finally(() => setRecLoading(false));
  }, []);

  const handleSearchSubmit = () => {
    if (search.trim()) {
      logSearchHistory(search.trim());
      navigate(`/recipes?search=${encodeURIComponent(search.trim())}`);
    } else {
      navigate('/recipes');
    }
  };

  return (
    <div className="home-container">
      <section className="home-hero">
        <div className="container hero-simple-layout">
          <div className="hero-simple-content">
            <h1 className="hero-simple-title">
              Simple, delicious recipes for everyday cooking.
            </h1>
            <p className="hero-simple-desc">
              Explore easy-to-follow recipes, step-by-step instructions, and cooking videos shared by home cooks.
            </p>

            <div className="hero-search-box">
              <SearchBar
                value={search}
                onChange={setSearch}
                onSubmit={handleSearchSubmit}
              />
            </div>
            <div className="hero-category-row">
              {categories.map((cat, i) => (
                <button
                  key={i}
                  type="button"
                  className="hero-cat-chip"
                  onClick={() => navigate(cat.query ? `/recipes?${cat.query}` : '/recipes')}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      {recommendations.length > 0 && (
        <section className="section container">
          <div className="section-head-simple">
            <div>
              <h2>Recommended for You</h2>
              <p>{recReason || 'Recipes picked based on your saved favorites and recent searches.'}</p>
            </div>
            <Link to="/recommendations" className="section-link-simple">
              See all recommendations <ArrowRight size={15} />
            </Link>
          </div>

          <div className="recipe-grid">
            {recommendations.map((recipe) => (
              <RecipeCard key={recipe._id || recipe.id} recipe={recipe} />
            ))}
          </div>
        </section>
      )}
      <section className="section container">
        <div className="section-head-simple">
          <div>
            <h2>Explore Recipes</h2>
            <p>Browse our collection of home-tested recipes.</p>
          </div>
          <Link to="/recipes" className="section-link-simple">
            View all recipes <ArrowRight size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="simple-loader">
            <div className="spinner-simple" />
            <span>Loading recipes...</span>
          </div>
        ) : error ? (
          <div className="error-banner">
            <p>{error}</p>
          </div>
        ) : recipes.length ? (
          <div className="recipe-grid">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe._id || recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="empty-simple">
            <BookOpen size={36} />
            <h3>No recipes yet</h3>
            <p>Start your collection by adding your first recipe.</p>
            <Link to="/add-recipe" className="btn btn-primary" style={{ marginTop: '12px' }}>
              Add Recipe
            </Link>
          </div>
        )}
      </section>
      <section className="container" style={{ paddingBottom: '60px' }}>
        <div className="simple-cta-card">
          <div className="simple-cta-text">
            <h3>Have a recipe to share?</h3>
            <p>Contribute your favorite dishes with ingredients, instructions, and photos.</p>
          </div>
          <Link to="/add-recipe" className="btn btn-primary">
            Submit a Recipe
          </Link>
        </div>
      </section>
    </div>
  );
}


