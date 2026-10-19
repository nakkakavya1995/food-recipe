import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import {
  Heart,
  Plus,
  ShieldCheck,
  ChefHat,
  Trash2,
} from 'lucide-react';
import api from '../services/api';
import { deleteRecipe } from '../services/recipeService';

export default function Profile() {
  const { user } = useAuth();
  const { favorites } = useFavorites();

  const [userRecipes, setUserRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const favCount = favorites?.length || 0;
  const username = user?.name || user?.username || 'User';
  const email = user?.email || '';
  const role = user?.role || 'user';
  const userId = user?.id || user?._id || '';

  useEffect(() => {
    const fetchUserRecipes = async () => {
      setLoading(true);
      try {
        const res = await api.get('/recipes/').catch(() => ({ data: [] }));
        const allRecipes = Array.isArray(res.data)
          ? res.data
          : res.data?.recipes || [];
        const myRecipes = allRecipes.filter(
          (r) => String(r.created_by) === String(userId) || (user?.email && r.creator_email === user.email)
        );
        setUserRecipes(myRecipes);
      } catch (err) {
        console.error('Failed to load user recipes', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRecipes();
  }, [userId, user?.email]);

  const handleDeleteRecipe = async (recipeId, recipeName) => {
    if (!window.confirm(`Are you sure you want to delete your recipe "${recipeName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteRecipe(recipeId);
      setUserRecipes((prev) => prev.filter((r) => r._id !== recipeId));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete recipe.');
    }
  };

  return (
    <section className="container section-page" style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Profile Overview Card */}
      <div className="profile-simple-wrap" style={{ maxWidth: '100%', marginBottom: '2.5rem' }}>
        <div className="profile-simple-card" style={{ padding: '32px' }}>
          <div className="profile-simple-head" style={{ marginBottom: '24px' }}>
            <div className="profile-avatar-circle" style={{ width: '68px', height: '68px', fontSize: '1.75rem' }}>
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="profile-simple-name" style={{ fontSize: '1.6rem', marginBottom: '4px' }}>{username}</h1>
              {email && <p className="profile-simple-email" style={{ fontSize: '0.95rem' }}>{email}</p>}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                <span className="profile-simple-role">{role}</span>
                {role === 'admin' && (
                  <Link
                    to="/admin"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--primary)',
                      textDecoration: 'none',
                      background: 'rgba(225, 29, 72, 0.1)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    <ShieldCheck size={12} /> Go to Admin Console
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="profile-simple-stats" style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div className="profile-stat-item">
              <span className="stat-count">{favCount}</span>
              <span className="stat-desc">Saved Recipes</span>
            </div>
            <div className="profile-stat-item">
              <span className="stat-count">{userRecipes.length}</span>
              <span className="stat-desc">Submitted Recipes</span>
            </div>
          </div>

          <div className="profile-simple-links" style={{ marginTop: '20px', flexWrap: 'wrap' }}>
            <Link to="/favorites" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Heart size={16} /> View Saved Recipes
            </Link>
            <Link to="/add-recipe" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} /> Submit New Recipe
            </Link>
          </div>
        </div>
      </div>

      {/* Submitted Recipes Section */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ChefHat size={22} color="var(--primary)" />
          <span>My Submitted Recipes</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 500 }}>({userRecipes.length})</span>
        </h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          Loading your recipes...
        </div>
      ) : userRecipes.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
          {userRecipes.map((r) => (
            <div
              key={r._id}
              style={{
                background: 'var(--bg-surface, #ffffff)',
                border: '1px solid var(--line, #e2e8f0)',
                borderRadius: '14px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}
            >
              {r.image_url ? (
                <img
                  src={r.image_url}
                  alt={r.name}
                  style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '150px',
                    background: 'rgba(0,0,0,0.04)',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'var(--muted)',
                  }}
                >
                  <ChefHat size={32} opacity={0.4} />
                </div>
              )}
              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700 }}>{r.name}</h4>
                <p style={{ margin: '0 0 14px', fontSize: '0.825rem', color: 'var(--muted)' }}>
                  {r.cuisine || 'Homemade'} • {r.meal_type || 'Main'}
                </p>
                <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                  <Link
                    to={`/recipe/${r._id}`}
                    className="btn btn-outline"
                    style={{ flex: 1, padding: '0.45rem', fontSize: '0.85rem', textAlign: 'center', textDecoration: 'none' }}
                  >
                    View
                  </Link>
                  <Link
                    to={`/edit-recipe/${r._id}`}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '0.45rem', fontSize: '0.85rem', textAlign: 'center', textDecoration: 'none' }}
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDeleteRecipe(r._id, r.name)}
                    className="btn btn-outline"
                    style={{ padding: '0.45rem 0.75rem', borderColor: '#ef4444', color: '#ef4444' }}
                    title="Delete your recipe"
                    aria-label="Delete recipe"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            background: 'var(--bg-surface, #ffffff)',
            border: '1px dashed var(--line, #e2e8f0)',
            borderRadius: '16px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <ChefHat size={26} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>No Submitted Recipes Yet</h3>
          <p style={{ color: 'var(--muted)', maxWidth: '420px', margin: '0 auto 1.25rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Share your favorite homemade dishes, family secrets, and culinary creations with the community!
          </p>
          <Link to="/add-recipe" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Submit Your First Recipe
          </Link>
        </div>
      )}
    </section>
  );
}
