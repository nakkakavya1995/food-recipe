import { Link } from 'react-router-dom';
import RecipeCard from '../components/RecipeCard';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { Heart, BookOpen } from 'lucide-react';

export default function Favorites() {
  const { user } = useAuth();
  const { favorites } = useFavorites();

  const formattedRecipes = favorites.map((item) => item.recipe || item).filter(Boolean);

  return (
    <section className="container section-page">
      <div className="page-head-simple">
        <h1>Saved Recipes</h1>
        <p>Your personal collection of recipes you've bookmarked.</p>
      </div>

      {!user ? (
        <div className="empty-simple">
          <BookOpen size={36} />
          <h3>Log in to view your saved recipes</h3>
          <p>Sign in to your account to save recipes and access them from anywhere.</p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: '12px' }}>
            Log In
          </Link>
        </div>
      ) : formattedRecipes.length > 0 ? (
        <div className="recipe-grid">
          {formattedRecipes.map((recipe, index) => (
            <RecipeCard
              key={recipe._id || recipe.id || index}
              recipe={recipe}
            />
          ))}
        </div>
      ) : (
        <div className="empty-simple">
          <Heart size={36} />
          <h3>No saved recipes yet</h3>
          <p>Click the heart icon on any recipe to save it here for quick access later.</p>
          <Link to="/recipes" className="btn btn-primary" style={{ marginTop: '12px' }}>
            Browse Recipes
          </Link>
        </div>
      )}
    </section>
  );
}


