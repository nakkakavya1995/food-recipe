import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import RecipeCard from '../components/RecipeCard';
import SearchBar from '../components/SearchBar';
import RecipeFilters from '../components/RecipeFilters';
import { getRecipes } from '../services/recipeService';
import { logSearchHistory } from '../services/recommendationService';
import { X, Film, BookOpen } from 'lucide-react';

export default function Recipes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [onlyVideos, setOnlyVideos] = useState(searchParams.get('video') === 'true');
  const [filters, setFilters] = useState({
    cuisine: searchParams.get('cuisine') || '',
    meal_type: searchParams.get('meal_type') || '',
    max_time: searchParams.get('max_time') || '',
  });
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    const queryObj = {
      search: search.trim(),
      ...filters,
    };

    const params = Object.fromEntries(
      Object.entries(queryObj).filter(([, value]) => value !== '')
    );

    getRecipes(params)
      .then(setRecipes)
      .catch(() => setError('Could not load recipes. Please check your connection.'))
      .finally(() => setLoading(false));
  }, [search, filters]);

  const submitSearch = () => {
    if (search.trim()) {
      logSearchHistory(search.trim());
    }
    const updated = {};
    if (search) updated.search = search;
    if (filters.cuisine) updated.cuisine = filters.cuisine;
    if (filters.meal_type) updated.meal_type = filters.meal_type;
    if (filters.max_time) updated.max_time = filters.max_time;
    setSearchParams(updated);
  };

  const clearAllFilters = () => {
    setSearch('');
    setOnlyVideos(false);
    setFilters({
      cuisine: '',
      meal_type: '',
      max_time: '',
    });
    setSearchParams({});
  };

  const activeBadges = [];
  if (search) activeBadges.push({ label: `"${search}"`, clear: () => setSearch('') });
  if (onlyVideos) activeBadges.push({ label: `Video only`, clear: () => setOnlyVideos(false) });
  if (filters.cuisine) activeBadges.push({ label: `${filters.cuisine}`, clear: () => setFilters((p) => ({ ...p, cuisine: '' })) });
  if (filters.meal_type) activeBadges.push({ label: `${filters.meal_type}`, clear: () => setFilters((p) => ({ ...p, meal_type: '' })) });
  if (filters.max_time) activeBadges.push({ label: `≤ ${filters.max_time} min`, clear: () => setFilters((p) => ({ ...p, max_time: '' })) });

  const displayedRecipes = onlyVideos
    ? recipes.filter((r) => Boolean(r.video_url && r.video_url.trim()))
    : recipes;

  return (
    <section className="container section-page">
      <div className="page-head-simple">
        <h1>All Recipes</h1>
        <p>Explore recipes by cuisine, meal course, preparation time, or ingredients.</p>
      </div>

      <div className="recipes-search-block">
        <SearchBar
          value={search}
          onChange={setSearch}
          onSubmit={submitSearch}
        />
      </div>

      <RecipeFilters filters={filters} setFilters={setFilters} />

      {/* Active filters bar */}
      {activeBadges.length > 0 && (
        <div className="active-filters-shelf">
          <span className="active-filters-title">Active:</span>
          <div className="active-badges-list">
            {activeBadges.map((badge, idx) => (
              <span key={idx} className="active-filter-badge">
                <span>{badge.label}</span>
                <button
                  type="button"
                  onClick={badge.clear}
                  className="active-badge-remove"
                  aria-label={`Remove ${badge.label}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearAllFilters}
              className="active-filters-clear-all"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Recipe count and video filter bar */}
      {!loading && !error && (
        <div className="recipes-meta-bar">
          <div className="results-count-pill">
            Showing <strong>{displayedRecipes.length}</strong> {displayedRecipes.length === 1 ? 'recipe' : 'recipes'}
          </div>

          <button
            type="button"
            onClick={() => setOnlyVideos(!onlyVideos)}
            className={`btn-video-toggle ${onlyVideos ? 'active' : ''}`}
          >
            <Film size={14} />
            <span>{onlyVideos ? 'Video Recipes Only' : 'Filter by Videos'}</span>
          </button>
        </div>
      )}

      {loading ? (
        <div className="simple-loader">
          <div className="spinner-simple" />
          <span>Loading recipes...</span>
        </div>
      ) : error ? (
        <div className="error-banner">
          <p>{error}</p>
        </div>
      ) : displayedRecipes.length ? (
        <div className="recipe-grid">
          {displayedRecipes.map((recipe) => (
            <RecipeCard
              key={recipe._id || recipe.id}
              recipe={recipe}
            />
          ))}
        </div>
      ) : (
        <div className="empty-simple">
          <BookOpen size={36} />
          <h3>No matching recipes found</h3>
          <p>Try searching for a different ingredient or clearing some of your filters.</p>
          <button
            className="btn btn-primary"
            onClick={clearAllFilters}
            style={{ marginTop: '14px' }}
          >
            Reset Filters
          </button>
        </div>
      )}
    </section>
  );
}


