import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';

export default function RecipeCard({ recipe }) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const navigate = useNavigate();

  const id = recipe._id || recipe.id;
  const name = recipe.name || recipe.title || 'Untitled Recipe';
  const time = recipe.cooking_time ?? recipe.cookingTime ?? 30;
  const image = recipe.image_url || recipe.image || '';
  const mealType = recipe.meal_type || '';
  const cuisine = recipe.cuisine || '';
  const favoriteActive = isFavorite(id);

  const handleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      if (window.confirm('Please log in to save your favorite recipes. Go to login?')) {
        navigate('/login');
      }
      return;
    }

    try {
      await toggleFavorite(recipe);
    } catch {
      alert('Could not update favorites. Please try again.');
    }
  };

  return (
    <article className="recipe-card-clean">
      <Link to={`/recipes/${id}`} className="card-thumb-link">
        {image ? (
          <img
            src={image}
            alt={name}
            className="card-thumb-img"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="card-thumb-placeholder" style={{ display: image ? 'none' : 'flex' }}>
          <span>{name.charAt(0)}</span>
        </div>

        {/* Favorite button */}
        <button
          type="button"
          className={`card-heart-btn ${favoriteActive ? 'is-fav' : ''}`}
          onClick={handleFavorite}
          aria-label={favoriteActive ? 'Remove from favorites' : 'Save recipe'}
        >
          <Heart
            size={16}
            fill={favoriteActive ? '#ef4444' : 'none'}
            color={favoriteActive ? '#ef4444' : '#ffffff'}
            strokeWidth={2}
          />
        </button>
      </Link>

      <div className="card-info">
        <div className="card-meta-line">
          {cuisine && <span>{cuisine}</span>}
          {cuisine && mealType && <span className="meta-sep">&bull;</span>}
          {mealType && <span>{mealType}</span>}
          <span className="card-meta-time">
            <Clock size={12} /> {time} mins
          </span>
        </div>

        <h3 className="card-title">
          <Link to={`/recipes/${id}`}>{name}</Link>
        </h3>

        {recipe.description && (
          <p className="card-excerpt">
            {recipe.description}
          </p>
        )}
      </div>
    </article>
  );
}


