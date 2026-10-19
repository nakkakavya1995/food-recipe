import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Filter,
  Trash2,
  Edit3,
  ExternalLink,
  PlusCircle,
  Eye,
  ChefHat,
  ShieldCheck,
  User,
  Clock,
  Sparkles,
  X,
  RefreshCw,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';
import api from '../services/api';
import { deleteRecipe } from '../services/recipeService';

export default function AdminRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [authorFilter, setAuthorFilter] = useState('all'); // 'all' | 'admin' | 'user'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedRecipe, setSelectedRecipe] = useState(null); // For Review Modal
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchRecipes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/recipes');
      const data = res.data;
      const list = Array.isArray(data) ? data : data.recipes || [];
      setRecipes(list);
    } catch (adminErr) {
      console.warn('Admin recipe endpoint failed, attempting fallback to public recipe endpoint:', adminErr);
      try {
        const fbRes = await api.get('/recipes/');
        const fbData = fbRes.data;
        const list = Array.isArray(fbData) ? fbData : fbData.recipes || [];
        setRecipes(list);
      } catch (err) {
        const errorMsg =
          adminErr.response?.data?.message ||
          err.response?.data?.message ||
          'Unable to load recipes. Please check your connection or restart the server.';
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleDelete = async (recipeId, recipeName) => {
    if (!window.confirm(`Are you sure you want to remove recipe "${recipeName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteRecipe(recipeId);
      showToast(`Recipe "${recipeName}" removed.`);
      setRecipes((prev) => prev.filter((r) => r._id !== recipeId));
      if (selectedRecipe?._id === recipeId) {
        setSelectedRecipe(null);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete recipe.');
    }
  };

  // Extract unique categories (cuisines / meal types)
  const categories = useMemo(() => {
    const set = new Set();
    recipes.forEach((r) => {
      if (r.cuisine) set.add(r.cuisine);
      if (r.meal_type) set.add(r.meal_type);
    });
    return Array.from(set);
  }, [recipes]);

  // Filtered dataset
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.cuisine && r.cuisine.toLowerCase().includes(q)) ||
        (r.creator_name && r.creator_name.toLowerCase().includes(q)) ||
        (r.creator_email && r.creator_email.toLowerCase().includes(q));

      // Author role filter
      const matchAuthor =
        authorFilter === 'all' ||
        (authorFilter === 'admin' && r.creator_role === 'admin') ||
        (authorFilter === 'user' && r.creator_role !== 'admin');

      // Category filter
      const matchCategory =
        categoryFilter === 'all' ||
        r.cuisine === categoryFilter ||
        r.meal_type === categoryFilter;

      return matchSearch && matchAuthor && matchCategory;
    });
  }, [recipes, searchQuery, authorFilter, categoryFilter]);

  const adminCount = recipes.filter((r) => r.creator_role === 'admin').length;
  const userCount = recipes.length - adminCount;

  return (
    <div className="pro-admin-page">
      {/* Toast */}
      {toastMessage && (
        <div className="pro-details-toast">
          <Sparkles size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="pro-container">
        {/* Header */}
        <header className="pro-admin-header" style={{ marginBottom: '1.5rem' }}>
          <div className="pro-admin-title-area">
            <span className="pro-eyebrow">
              <ShieldCheck size={16} /> RECIPE MANAGEMENT & AUDIT
            </span>
            <h1>All Recipes Review Hub</h1>
            <p>
              Inspect every recipe submitted across the platform, verify who created it, and moderate content.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="pro-action-btn"
              onClick={fetchRecipes}
              title="Refresh recipes"
            >
              <RefreshCw size={16} className={loading ? 'pro-spin' : ''} />
              <span>Refresh</span>
            </button>

            <Link
              to="/add-recipe"
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <PlusCircle size={18} />
              <span>Add New Recipe</span>
            </Link>
          </div>
        </header>

        {error && <div className="pro-edit-alert">{error}</div>}

        {/* Breakdown Stats Cards */}
        <section className="pro-admin-stats-grid" style={{ marginBottom: '1.75rem' }}>
          <div className="pro-admin-stat-card">
            <div className="pro-stat-icon recipes">
              <BookOpen size={24} />
            </div>
            <div className="pro-stat-info">
              <small>Total Recipes Catalog</small>
              <strong>{recipes.length}</strong>
            </div>
          </div>

          <div className="pro-admin-stat-card">
            <div className="pro-stat-icon users">
              <ShieldCheck size={24} />
            </div>
            <div className="pro-stat-info">
              <small>Added by Admins</small>
              <strong>{adminCount}</strong>
            </div>
          </div>

          <div className="pro-admin-stat-card">
            <div className="pro-stat-icon users">
              <User size={24} />
            </div>
            <div className="pro-stat-info">
              <small>Added by Users</small>
              <strong>{userCount}</strong>
            </div>
          </div>
        </section>

        {/* Toolbar: Search & Filters */}
        <div
          style={{
            background: 'var(--card-bg, #ffffff)',
            borderRadius: '14px',
            padding: '1.25rem',
            border: '1px solid var(--border-color, #e2e8f0)',
            marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Search */}
            <div className="pro-admin-search-wrap" style={{ flex: '1 1 280px', margin: 0 }}>
              <Search size={16} className="pro-search-icon" />
              <input
                type="text"
                placeholder="Search by recipe, cuisine, or creator name/email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Author filter */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Creator:</label>
              <select
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'var(--input-bg, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All Creators ({recipes.length})</option>
                <option value="admin">Added by Admins ({adminCount})</option>
                <option value="user">Added by Users ({userCount})</option>
              </select>
            </div>

            {/* Category filter */}
            {categories.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Category:</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--input-bg, #ffffff)',
                    color: 'var(--text-main, #0f172a)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Recipes Table with Creator Details */}
        <div className="pro-admin-table-container">
          <div className="pro-admin-table-wrap">
            <table className="pro-admin-table">
              <thead>
                <tr>
                  <th>Recipe</th>
                  <th>Created By / Author</th>
                  <th>Category</th>
                  <th>Prep / Cook</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecipes.length > 0 ? (
                  filteredRecipes.map((r) => (
                    <tr key={r._id}>
                      {/* Recipe Info */}
                      <td>
                        <div className="pro-recipe-cell">
                          {r.image_url ? (
                            <img src={r.image_url} alt="" className="pro-recipe-thumb" />
                          ) : (
                            <div className="pro-recipe-thumb-fallback">
                              <ChefHat size={16} />
                            </div>
                          )}
                          <div>
                            <strong>{r.name || r.title}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Difficulty: {r.difficulty || 'Easy'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Creator Details */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ fontSize: '0.9rem' }}>{r.creator_name || 'Chef'}</strong>
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: r.creator_role === 'admin' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.12)',
                                color: r.creator_role === 'admin' ? '#047857' : '#475569',
                                border: `1px solid ${r.creator_role === 'admin' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(100, 116, 139, 0.25)'}`,
                              }}
                            >
                              {r.creator_role === 'admin' ? 'Admin' : 'User'}
                            </span>
                          </div>
                          {r.creator_email && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {r.creator_email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span style={{ fontWeight: 600 }}>{r.cuisine || 'Homemade'}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {r.meal_type || 'Main Course'}
                        </div>
                      </td>

                      {/* Time */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                          <Clock size={14} color="var(--text-muted)" />
                          <span>{r.cooking_time || 30} mins</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="pro-table-actions-row">
                          <button
                            type="button"
                            className="pro-table-action-btn view"
                            onClick={() => setSelectedRecipe(r)}
                            title="Review full recipe details & instructions"
                            style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}
                          >
                            <Eye size={16} />
                          </button>
                          <Link
                            to={`/edit-recipe/${r._id}`}
                            className="pro-table-action-btn edit"
                            title="Edit recipe"
                          >
                            <Edit3 size={16} />
                          </Link>
                          <button
                            type="button"
                            className="pro-table-action-btn danger"
                            onClick={() => handleDelete(r._id, r.name)}
                            title="Delete inappropriate recipe"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="pro-empty-table-cell">
                      No recipes found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DETAILED RECIPE REVIEW MODAL */}
      {selectedRecipe && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setSelectedRecipe(null)}
        >
          <div
            style={{
              background: 'var(--card-bg, #ffffff)',
              borderRadius: '20px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
              border: '1px solid var(--border-color, #e2e8f0)',
              padding: '2rem',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedRecipe(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'rgba(0,0,0,0.06)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-main, #0f172a)',
              }}
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div style={{ marginBottom: '1.5rem', paddingRight: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: selectedRecipe.creator_role === 'admin' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.12)',
                    color: selectedRecipe.creator_role === 'admin' ? '#047857' : '#475569',
                  }}
                >
                  {selectedRecipe.creator_role === 'admin' ? 'Admin Curated' : 'Community Submission'}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  By <strong>{selectedRecipe.creator_name}</strong> ({selectedRecipe.creator_email || 'No email'})
                </span>
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                {selectedRecipe.name}
              </h2>
            </div>

            {/* Recipe Image & Meta */}
            {selectedRecipe.image_url && (
              <img
                src={selectedRecipe.image_url}
                alt=""
                style={{
                  width: '100%',
                  height: '240px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  marginBottom: '1.25rem',
                }}
              />
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px',
                background: 'rgba(0,0,0,0.03)',
                padding: '12px',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
              }}
            >
              <div><strong>Cuisine:</strong> {selectedRecipe.cuisine || 'Homemade'}</div>
              <div><strong>Meal Type:</strong> {selectedRecipe.meal_type || 'Main'}</div>
              <div><strong>Cook Time:</strong> {selectedRecipe.cooking_time || 30} mins</div>
              <div><strong>Difficulty:</strong> {selectedRecipe.difficulty || 'Easy'}</div>
            </div>

            {/* Description */}
            {selectedRecipe.description && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>Description</h4>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                  {selectedRecipe.description}
                </p>
              </div>
            )}

            {/* Ingredients */}
            {Array.isArray(selectedRecipe.ingredients) && selectedRecipe.ingredients.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Ingredients ({selectedRecipe.ingredients.length})</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                  {selectedRecipe.ingredients.map((ing, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
                      <CheckCircle2 size={14} color="#10b981" />
                      <span>{ing}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            {Array.isArray(selectedRecipe.instructions) && selectedRecipe.instructions.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Cooking Instructions</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedRecipe.instructions.map((inst, i) => {
                    const text = typeof inst === 'string' ? inst : inst.instruction || inst.text || '';
                    const stepNum = typeof inst === 'object' && inst.step ? inst.step : i + 1;
                    return (
                      <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '0.875rem' }}>
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'var(--primary-color, #10b981)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {stepNum}
                        </span>
                        <p style={{ margin: 0, lineHeight: '1.5' }}>{text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions Footer inside modal */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                borderTop: '1px solid var(--border-color, #e2e8f0)',
                paddingTop: '1.25rem',
                marginTop: '1.5rem',
              }}
            >
              <Link
                to={`/edit-recipe/${selectedRecipe._id}`}
                className="btn btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.55rem 1rem', textDecoration: 'none' }}
              >
                <Edit3 size={15} /> Edit Recipe
              </Link>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleDelete(selectedRecipe._id, selectedRecipe.name)}
                style={{ background: '#ef4444', borderColor: '#ef4444', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 size={15} /> Delete Recipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
