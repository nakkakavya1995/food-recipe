import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, BookOpen } from 'lucide-react';
import RecipeCard from '../components/RecipeCard';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import recommendationService from '../services/recommendationService';

export default function Recommendations() {
  const { user } = useAuth();
  const { favorites } = useFavorites();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [reason, setReason] = useState('');

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await recommendationService.getPersonalizedRecommendations();
      const list = data.recommendations || data.recipes || [];
      setRecommendations(list);
      setReason(data.reason || '');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Could not load recommendations. Please verify your connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [favorites.length]);

  return (
    <section className="container section-page">
      <div className="page-head-simple">
        <h1>Recommended for You</h1>
        <p>
          {reason || 'Recipes chosen based on dishes you have favorited and searched.'}
        </p>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="simple-loader">
          <div className="spinner-simple" />
          <span>Finding recommendations...</span>
        </div>
      ) : recommendations.length > 0 ? (
        <div className="recipe-grid">
          {recommendations.map((rec) => (
            <RecipeCard key={rec._id || rec.id} recipe={rec} />
          ))}
        </div>
      ) : (
        <div className="empty-simple">
          <BookOpen size={36} />
          <h3>No recommendations available yet</h3>
          <p>
            Browse recipes and tap the heart icon on dishes you like to see personalized suggestions here.
          </p>
          <Link to="/recipes" className="btn btn-primary" style={{ marginTop: '14px' }}>
            Browse Recipes
          </Link>
        </div>
      )}
    </section>
  );
}


