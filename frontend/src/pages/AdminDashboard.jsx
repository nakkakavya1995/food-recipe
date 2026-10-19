import { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Menu,
  Search,
  Mail,
  Bell,
  Power,
  Grid,
  ChevronDown,
  CheckCircle2,
  TrendingUp,
  Bookmark,
  Diamond,
  Star,
  BookOpen,
  Users,
  MessageSquare,
  PlusCircle,
  Eye,
  Edit3,
  Trash2,
  X,
  RefreshCw,
  Sparkles,
  ChefHat,
  Filter,
  ArrowUpDown,
  Clock,
  Info,
  ExternalLink,
  CornerDownRight,
  Send,
  UserCheck,
  UserX,
  Lock,
  Layers,
  Activity,
  Award,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { deleteRecipe } from '../services/recipeService';

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Sidebar navigation tab state
  const initialTab = location.pathname.includes('/users')
    ? 'users'
    : location.pathname.includes('/reviews')
    ? 'reviews'
    : location.pathname.includes('/recipes')
    ? 'recipes'
    : 'dashboard';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [replyingReviewId, setReplyingReviewId] = useState(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Left sidebar messages box mini-filter
  const [sidebarBoxSearch, setSidebarBoxSearch] = useState('');

  // Main table filter & sorting states
  const [recipeFilter, setRecipeFilter] = useState('all'); // all, admin, user
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [recipeSort, setRecipeSort] = useState('newest'); // newest, oldest, time-asc, time-desc, title-asc

  const [userFilter, setUserFilter] = useState('all'); // all, active, restricted, admin
  const [reviewFilter, setReviewFilter] = useState('all'); // all, unreplied, 5star, lowrating

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleLogout = () => {
    if (window.confirm('Do you want to sign out from the Admin Control Center?')) {
      logout();
      navigate('/login');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes, recipesRes, reviewsRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: {} })),
        api.get('/admin/users').catch(() => ({ data: { users: [] } })),
        api.get('/admin/recipes').catch(async (err) => {
          console.warn('Admin recipe endpoint failed, attempting fallback to public recipes:', err);
          try {
            const fallback = await api.get('/recipes/');
            return fallback;
          } catch {
            return { data: { recipes: [] } };
          }
        }),
        api.get('/admin/reviews').catch(() => ({ data: { reviews: [] } })),
      ]);

      const rData = recipesRes.data;
      const loadedRecipes = Array.isArray(rData) ? rData : rData.recipes || [];
      setRecipes(loadedRecipes);

      const uData = usersRes.data;
      const loadedUsers = Array.isArray(uData) ? uData : uData.users || [];
      setUsers(loadedUsers);

      const revData = reviewsRes.data;
      const loadedReviews = Array.isArray(revData) ? revData : revData.reviews || [];
      setReviews(loadedReviews);

      const sData = statsRes.data || {};
      const calculatedAdminRecipes = loadedRecipes.filter((r) => r.creator_role === 'admin' || r.is_admin_recipe).length;
      const calculatedUserRecipes = Math.max(0, loadedRecipes.length - calculatedAdminRecipes);

      setStats({
        users: sData.users ?? loadedUsers.length,
        recipes: sData.recipes ?? loadedRecipes.length,
        recipes_by_admin: sData.recipes_by_admin ?? calculatedAdminRecipes,
        recipes_by_user: sData.recipes_by_user ?? calculatedUserRecipes,
        reviews: sData.reviews ?? loadedReviews.length,
      });

      if (loadedRecipes.length === 0 && loadedUsers.length === 0) {
        setError('Could not reach backend server to load administration data.');
      }
    } catch {
      setError('Could not load administration data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync tab with URL
  useEffect(() => {
    if (location.pathname.includes('/users')) setActiveTab('users');
    else if (location.pathname.includes('/reviews')) setActiveTab('reviews');
    else if (location.pathname.includes('/recipes')) setActiveTab('recipes');
  }, [location.pathname]);

  // Toggle user status
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'restricted' ? 'active' : 'restricted';
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: nextStatus });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, status: nextStatus } : u))
      );
      showToast(`User status set to ${nextStatus}.`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update user status.');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId, userName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete user "${userName || 'this user'}"? All their recipes and reviews will be removed.`
      )
    ) {
      return;
    }
    try {
      await api.delete(`/admin/users/${userId}`);
      showToast(`User ${userName || ''} deleted.`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setStats((prev) => ({ ...prev, users: Math.max(0, (prev?.users || 1) - 1) }));
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete user.');
    }
  };

  // Delete recipe
  const handleDeleteRecipe = async (recipeId, recipeName) => {
    if (!window.confirm(`Are you sure you want to delete recipe "${recipeName || 'this recipe'}"?`)) {
      return;
    }
    try {
      await deleteRecipe(recipeId);
      showToast(`Recipe "${recipeName}" deleted.`);
      setRecipes((prev) => prev.filter((r) => r._id !== recipeId));
      setStats((prev) => ({ ...prev, recipes: Math.max(0, (prev?.recipes || 1) - 1) }));
      if (selectedRecipe?._id === recipeId) {
        setSelectedRecipe(null);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete recipe.');
    }
  };

  // Delete review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this message/review?')) {
      return;
    }
    try {
      await api.delete(`/admin/reviews/${reviewId}`);
      showToast('Message deleted.');
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      setStats((prev) => ({ ...prev, reviews: Math.max(0, (prev?.reviews || 1) - 1) }));
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete message.');
    }
  };

  // Admin reply
  const handleAdminReply = async (reviewId, recipientName) => {
    if (!adminReplyText.trim()) {
      showToast('Please type your reply.');
      return;
    }
    setSubmittingReply(true);
    try {
      const res = await api.post(`/reviews/${reviewId}/reply`, {
        comment: adminReplyText.trim(),
        reply_to: recipientName || 'Author',
      });
      const newReply = res.data.reply;
      setReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId
            ? { ...r, replies: [...(r.replies || []), newReply] }
            : r
        )
      );
      setAdminReplyText('');
      setReplyingReviewId(null);
      showToast(`Reply sent to ${recipientName || 'user'}!`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not post reply.');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Delete admin reply
  const handleDeleteAdminReply = async (reviewId, replyId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;
    try {
      await api.delete(`/reviews/${reviewId}/reply/${replyId}`);
      setReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId
            ? { ...r, replies: (r.replies || []).filter((rep) => rep._id !== replyId) }
            : r
        )
      );
      showToast('Reply deleted.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete reply.');
    }
  };

  const formatCommentDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const dateFormatted = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const timeFormatted = d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).toLowerCase();
      return `${dateFormatted} • ${timeFormatted}`;
    } catch {
      return dateStr;
    }
  };

  // List of unique cuisines
  const uniqueCuisines = useMemo(() => {
    const set = new Set();
    recipes.forEach((r) => {
      if (r.cuisine && r.cuisine.trim()) set.add(r.cuisine.trim());
    });
    return Array.from(set).sort();
  }, [recipes]);

  // Filtered and sorted recipes
  const filteredRecipes = useMemo(() => {
    let result = [...recipes];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          (r.name && r.name.toLowerCase().includes(q)) ||
          (r.cuisine && r.cuisine.toLowerCase().includes(q)) ||
          (r.meal_type && r.meal_type.toLowerCase().includes(q)) ||
          (r.creator_name && r.creator_name.toLowerCase().includes(q)) ||
          (r.creator_email && r.creator_email.toLowerCase().includes(q))
      );
    }

    if (recipeFilter === 'admin') {
      result = result.filter((r) => r.creator_role === 'admin' || r.is_admin_recipe);
    } else if (recipeFilter === 'user') {
      result = result.filter((r) => r.creator_role !== 'admin' && !r.is_admin_recipe);
    }

    if (cuisineFilter !== 'all') {
      result = result.filter((r) => r.cuisine === cuisineFilter);
    }

    if (recipeSort === 'newest') {
      result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (recipeSort === 'oldest') {
      result.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    } else if (recipeSort === 'time-asc') {
      result.sort((a, b) => (Number(a.cooking_time) || 0) - (Number(b.cooking_time) || 0));
    } else if (recipeSort === 'time-desc') {
      result.sort((a, b) => (Number(b.cooking_time) || 0) - (Number(a.cooking_time) || 0));
    } else if (recipeSort === 'title-asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return result;
  }, [recipes, searchQuery, recipeFilter, cuisineFilter, recipeSort]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q))
      );
    }

    if (userFilter === 'active') {
      result = result.filter((u) => u.status !== 'restricted' && u.status !== 'deactivated');
    } else if (userFilter === 'restricted') {
      result = result.filter((u) => u.status === 'restricted' || u.status === 'deactivated');
    } else if (userFilter === 'admin') {
      result = result.filter((u) => u.role === 'admin');
    }

    return result;
  }, [users, searchQuery, userFilter]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    let result = [...reviews];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          (r.comment && r.comment.toLowerCase().includes(q)) ||
          (r.user_name && r.user_name.toLowerCase().includes(q)) ||
          (r.recipe_name && r.recipe_name.toLowerCase().includes(q))
      );
    }

    if (reviewFilter === 'unreplied') {
      result = result.filter((r) => !r.replies || r.replies.length === 0);
    } else if (reviewFilter === '5star') {
      result = result.filter((r) => Number(r.rating) === 5);
    } else if (reviewFilter === 'lowrating') {
      result = result.filter((r) => Number(r.rating) <= 3);
    }

    return result;
  }, [reviews, searchQuery, reviewFilter]);

  // Left sidebar box messages filter
  const sidebarBoxMessages = useMemo(() => {
    let list = [...reviews];
    if (sidebarBoxSearch.trim()) {
      const q = sidebarBoxSearch.toLowerCase();
      list = list.filter(
        (m) =>
          (m.comment && m.comment.toLowerCase().includes(q)) ||
          (m.user_name && m.user_name.toLowerCase().includes(q)) ||
          (m.recipe_name && m.recipe_name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [reviews, sidebarBoxSearch]);

  // Calculated metrics
  const totalUserCount = Number(stats?.users ?? users.length ?? 0);
  const totalRecipeCount = Number(stats?.recipes ?? recipes.length ?? 0);
  const adminRecipeCount = Number(stats?.recipes_by_admin ?? recipes.filter((r) => r.creator_role === 'admin' || r.is_admin_recipe).length ?? 0);
  const userRecipeCount = Number(stats?.recipes_by_user ?? Math.max(0, totalRecipeCount - adminRecipeCount) ?? 0);
  const totalReviewCount = Number(stats?.reviews ?? reviews.length ?? 0);
  const unrepliedCount = useMemo(() => reviews.filter((r) => !r.replies || r.replies.length === 0).length, [reviews]);

  const averageRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return 4.9;
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const activeUsersCount = useMemo(() => {
    return users.filter((u) => u.status !== 'restricted' && u.status !== 'deactivated').length;
  }, [users]);

  // Top cuisines stats
  const topCuisines = useMemo(() => {
    const counts = {};
    recipes.forEach((r) => {
      const c = r.cuisine || 'Homemade';
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [recipes]);

  return (
    <div className="purple-admin-container">
      {toastMessage && (
        <div className="pro-details-toast">
          <Sparkles size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
      <header className="purple-navbar">
        <div className="purple-navbar-brand-wrapper">
          <Link to="/admin" className="purple-navbar-brand">
            <div className="purple-brand-icon">
              <ChefHat size={22} />
            </div>
            <span className="purple-brand-name">RecipeNest</span>
          </Link>
          <button
            type="button"
            className="purple-navbar-toggler"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className="purple-navbar-search-wrapper">
          <Search size={16} className="purple-search-icon" />
          <input
            type="text"
            className="purple-search-input"
            placeholder="Search recipes, cooks, cuisines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="purple-search-clear-btn"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </header>
      <div className="purple-admin-body">
        <aside className={`purple-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          {/* Admin User Card on Top of Sidebar */}
          <div className="purple-sidebar-profile-card">
            <div className="purple-profile-img-wrap">
              <div className="purple-profile-avatar-circle">
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <span className="purple-profile-online-badge">
                <CheckCircle2 size={12} fill="#10b981" color="#ffffff" />
              </span>
            </div>
            <div className="purple-profile-details">
              <h4 className="purple-profile-name">{user?.name || 'Administrator'}</h4>
              <span className="purple-profile-role">
                {user?.role === 'admin' ? 'Super Administrator' : 'Recipe Manager'}
              </span>
            </div>
          </div>
          <nav className="purple-sidebar-nav">
            <button
              type="button"
              className={`purple-nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setActiveTab('dashboard'); setSearchQuery(''); }}
            >
              <span className="purple-nav-title">Dashboard</span>
            </button>

            <button
              type="button"
              className={`purple-nav-link ${activeTab === 'recipes' ? 'active' : ''}`}
              onClick={() => { setActiveTab('recipes'); setSearchQuery(''); }}
            >
              <span className="purple-nav-title">Recipe Catalog</span>
            </button>

            <button
              type="button"
              className={`purple-nav-link ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
            >
              <span className="purple-nav-title">User Accounts</span>
            </button>

            <button
              type="button"
              className={`purple-nav-link ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => { setActiveTab('reviews'); setSearchQuery(''); }}
            >
              <span className="purple-nav-title">Reviews & Feedback</span>
            </button>

            <Link to="/add-recipe" className="purple-nav-link">
              <span className="purple-nav-title">Add Recipe</span>
            </Link>
          </nav>
        </aside>
        <main className="purple-main-content">
          <div className="purple-page-header">
            <div className="purple-header-left">
              <div className="purple-page-title-badge">
                <ChefHat size={18} color="#ffffff" />
              </div>
              <h2 className="purple-page-heading">
                {activeTab === 'dashboard'
                  ? 'Admin Dashboard'
                  : activeTab === 'recipes'
                  ? 'Recipe Catalog'
                  : activeTab === 'users'
                  ? 'User Accounts'
                  : 'Reviews & Messages'}
              </h2>
            </div>

            <div className="purple-header-right">
              <span className="purple-overview-tag">
                Overview <Info size={14} className="purple-info-icon" />
              </span>
              <button
                type="button"
                className="purple-refresh-pill-btn"
                onClick={loadData}
                disabled={loading}
                title="Reload live stats"
              >
                <RefreshCw size={13} className={loading ? 'pro-spin' : ''} />
                <span>{loading ? 'Updating...' : 'Live'}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="purple-alert-banner">
              <Info size={16} />
              <span>{error}</span>
            </div>
          )}
          <div className="purple-stats-grid">
            <div
              className="purple-gradient-card card-orange"
              onClick={() => { setActiveTab('recipes'); setRecipeFilter('all'); }}
            >
              <div className="purple-card-content">
                <div className="purple-card-header">
                  <h4 className="purple-card-label">Total Recipes</h4>
                  <div className="purple-card-icon-wrap">
                    <BookOpen size={20} />
                  </div>
                </div>
                <h2 className="purple-card-value">
                  {loading ? (
                    <span className="purple-stat-skeleton">---</span>
                  ) : (
                    Number(totalRecipeCount || 0).toLocaleString()
                  )}
                </h2>
                <div className="purple-card-footer">
                  <span>{adminRecipeCount} Admin Curated • {userRecipeCount} Community</span>
                </div>
              </div>
            </div>
            <div
              className="purple-gradient-card card-blue"
              onClick={() => { setActiveTab('users'); setUserFilter('all'); }}
            >
              <div className="purple-card-content">
                <div className="purple-card-header">
                  <h4 className="purple-card-label">Registered Users</h4>
                  <div className="purple-card-icon-wrap">
                    <Users size={20} />
                  </div>
                </div>
                <h2 className="purple-card-value">
                  {loading ? (
                    <span className="purple-stat-skeleton">---</span>
                  ) : (
                    Number(totalUserCount || 0).toLocaleString()
                  )}
                </h2>
                <div className="purple-card-footer">
                  <span>{activeUsersCount} Active Accounts • Verified</span>
                </div>
              </div>
            </div>
            <div
              className="purple-gradient-card card-green"
              onClick={() => { setActiveTab('reviews'); setReviewFilter('all'); }}
            >
              <div className="purple-card-content">
                <div className="purple-card-header">
                  <h4 className="purple-card-label">Community Feedback</h4>
                  <div className="purple-card-icon-wrap">
                    <MessageSquare size={20} />
                  </div>
                </div>
                <h2 className="purple-card-value">
                  {loading ? (
                    <span className="purple-stat-skeleton">---</span>
                  ) : (
                    Number(totalReviewCount || 0).toLocaleString()
                  )}
                </h2>
                <div className="purple-card-footer">
                  <span>Average {averageRating}★ Rating • {unrepliedCount} awaiting reply</span>
                </div>
              </div>
            </div>
          </div>
          {activeTab === 'dashboard' && (
            <div className="purple-view-container">
              {/* Recent Recipes Showcase Table */}
              <div className="purple-card-white">
                <div className="purple-card-title-row">
                  <h3 className="purple-card-title">Recent Recipe Submissions</h3>
                  <button
                    type="button"
                    className="purple-link-action"
                    onClick={() => setActiveTab('recipes')}
                  >
                    View All Recipes ({recipes.length}) &rarr;
                  </button>
                </div>

                <div className="purple-table-responsive">
                  <table className="purple-table">
                    <thead>
                      <tr>
                        <th>Recipe</th>
                        <th>Creator</th>
                        <th>Category</th>
                        <th>Time</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipes.slice(0, 5).map((r) => (
                        <tr key={r._id}>
                          <td>
                            <div className="purple-recipe-cell">
                              {r.image_url ? (
                                <img src={r.image_url} alt="" className="purple-recipe-thumb" />
                              ) : (
                                <div className="purple-recipe-thumb fallback">
                                  <ChefHat size={16} />
                                </div>
                              )}
                              <div>
                                <strong>{r.name || r.title}</strong>
                                <span className="purple-cell-sub">{r.difficulty || 'Easy'}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="purple-creator-cell">
                              <span>{r.creator_name || 'Chef'}</span>
                              <span className={`purple-role-badge ${r.creator_role === 'admin' ? 'admin' : 'user'}`}>
                                {r.creator_role === 'admin' ? 'Admin' : 'User'}
                              </span>
                            </div>
                          </td>
                          <td>{r.cuisine || 'Homemade'}</td>
                          <td>{r.cooking_time || 30} mins</td>
                          <td>
                            <div className="purple-actions-group">
                              <button
                                type="button"
                                className="purple-btn-icon view"
                                onClick={() => setSelectedRecipe(r)}
                                title="Preview recipe"
                              >
                                <Eye size={15} />
                              </button>
                              <Link
                                to={`/edit-recipe/${r._id}`}
                                className="purple-btn-icon edit"
                                title="Edit recipe"
                              >
                                <Edit3 size={15} />
                              </Link>
                              <button
                                type="button"
                                className="purple-btn-icon delete"
                                onClick={() => handleDeleteRecipe(r._id, r.name)}
                                title="Delete recipe"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 1: RECIPES MANAGEMENT TABLE                      */}
          {/* ===================================================== */}
          {activeTab === 'recipes' && (
            <div className="purple-card-white">
              <div className="purple-card-title-row">
                <h3 className="purple-card-title">Manage Recipe Catalog</h3>
                <Link to="/add-recipe" className="purple-primary-btn">
                  <PlusCircle size={15} />
                  <span>Add Recipe</span>
                </Link>
              </div>

              {/* Subfilter Controls */}
              <div className="purple-filter-toolbar">
                <div className="purple-filter-pills">
                  <button
                    type="button"
                    className={`purple-filter-pill ${recipeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setRecipeFilter('all')}
                  >
                    All ({recipes.length})
                  </button>
                  <button
                    type="button"
                    className={`purple-filter-pill ${recipeFilter === 'admin' ? 'active' : ''}`}
                    onClick={() => setRecipeFilter('admin')}
                  >
                    Admin Official ({adminRecipeCount})
                  </button>
                  <button
                    type="button"
                    className={`purple-filter-pill ${recipeFilter === 'user' ? 'active' : ''}`}
                    onClick={() => setRecipeFilter('user')}
                  >
                    Community ({userRecipeCount})
                  </button>
                </div>

                <div className="purple-select-group">
                  <div className="purple-select-wrap">
                    <Filter size={13} />
                    <select
                      value={cuisineFilter}
                      onChange={(e) => setCuisineFilter(e.target.value)}
                    >
                      <option value="all">All Cuisines</option>
                      {uniqueCuisines.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="purple-select-wrap">
                    <ArrowUpDown size={13} />
                    <select
                      value={recipeSort}
                      onChange={(e) => setRecipeSort(e.target.value)}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="time-asc">Cooking Time (Low-High)</option>
                      <option value="time-desc">Cooking Time (High-Low)</option>
                      <option value="title-asc">Title (A-Z)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="purple-table-responsive">
                <table className="purple-table">
                  <thead>
                    <tr>
                      <th>Recipe Title</th>
                      <th>Added By</th>
                      <th>Category</th>
                      <th>Cooking Time</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecipes.length > 0 ? (
                      filteredRecipes.map((r) => (
                        <tr key={r._id}>
                          <td>
                            <div className="purple-recipe-cell">
                              {r.image_url ? (
                                <img src={r.image_url} alt="" className="purple-recipe-thumb" />
                              ) : (
                                <div className="purple-recipe-thumb fallback">
                                  <ChefHat size={16} />
                                </div>
                              )}
                              <div>
                                <strong>{r.name || r.title}</strong>
                                <span className="purple-cell-sub">Difficulty: {r.difficulty || 'Easy'}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="purple-creator-cell">
                              <span>{r.creator_name || 'Chef'}</span>
                              <span className={`purple-role-badge ${r.creator_role === 'admin' ? 'admin' : 'user'}`}>
                                {r.creator_role === 'admin' ? 'Admin' : 'User'}
                              </span>
                            </div>
                            {r.creator_email && <small className="purple-email-sub">{r.creator_email}</small>}
                          </td>
                          <td>
                            <strong>{r.cuisine || 'Homemade'}</strong>
                            <span className="purple-cell-sub">{r.meal_type || 'Main Course'}</span>
                          </td>
                          <td>{r.cooking_time || 30} mins</td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="purple-actions-group">
                              <button
                                type="button"
                                className="purple-btn-icon view"
                                onClick={() => setSelectedRecipe(r)}
                                title="Review recipe"
                              >
                                <Eye size={15} />
                              </button>
                              <Link
                                to={`/edit-recipe/${r._id}`}
                                className="purple-btn-icon edit"
                                title="Edit recipe"
                              >
                                <Edit3 size={15} />
                              </Link>
                              <button
                                type="button"
                                className="purple-btn-icon delete"
                                onClick={() => handleDeleteRecipe(r._id, r.name)}
                                title="Delete recipe"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="purple-empty-cell">
                          No recipes matching current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === 'users' && (
            <div className="purple-card-white">
              <div className="purple-card-title-row">
                <h3 className="purple-card-title">User Accounts Directory</h3>
              </div>
              <div className="purple-filter-toolbar">
                <div className="purple-filter-pills">
                  <button
                    type="button"
                    className={`purple-filter-pill ${userFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setUserFilter('all')}
                  >
                    All Users ({users.length})
                  </button>
                  <button
                    type="button"
                    className={`purple-filter-pill ${userFilter === 'active' ? 'active' : ''}`}
                    onClick={() => setUserFilter('active')}
                  >
                    Active ({activeUsersCount})
                  </button>
                  <button
                    type="button"
                    className={`purple-filter-pill ${userFilter === 'restricted' ? 'active' : ''}`}
                    onClick={() => setUserFilter('restricted')}
                  >
                    Restricted ({Math.max(0, users.length - activeUsersCount)})
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="purple-table-responsive">
                <table className="purple-table">
                  <thead>
                    <tr>
                      <th>Cook Profile</th>
                      <th>Email Address</th>
                      <th>Role</th>
                      <th>Recipes</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <tr key={u._id}>
                          <td>
                            <div className="purple-user-cell">
                              <div className="purple-user-avatar">
                                {(u.name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong>{u.name || 'Anonymous Cook'}</strong>
                                {u.created_at && (
                                  <span className="purple-cell-sub">
                                    Joined {new Date(u.created_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`purple-role-badge ${u.role === 'admin' ? 'admin' : 'user'}`}>
                              {u.role || 'user'}
                            </span>
                          </td>
                          <td>
                            <strong>{u.recipe_count || 0}</strong> recipes
                          </td>
                          <td>
                            <span className={`purple-status-pill ${u.status === 'restricted' ? 'restricted' : 'active'}`}>
                              {u.status || 'Active'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="purple-actions-group">
                              {u.role !== 'admin' ? (
                                <>
                                  <button
                                    type="button"
                                    className={`purple-btn-icon ${u.status === 'restricted' ? 'activate' : 'restrict'}`}
                                    onClick={() => handleToggleUserStatus(u._id, u.status || 'active')}
                                    title={u.status === 'restricted' ? 'Activate account' : 'Restrict account'}
                                  >
                                    {u.status === 'restricted' ? <UserCheck size={15} /> : <UserX size={15} />}
                                  </button>
                                  <button
                                    type="button"
                                    className="purple-btn-icon delete"
                                    onClick={() => handleDeleteUser(u._id, u.name)}
                                    title="Delete user"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </>
                              ) : (
                                <span className="purple-secured-label">Admin</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="purple-empty-cell">
                          No users found matching search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === 'reviews' && (
            <div className="purple-card-white">
              <div className="purple-card-title-row">
                <h3 className="purple-card-title">Reviews & Messages Moderation</h3>
              </div>
              <div className="purple-filter-toolbar">
                <div className="purple-filter-pills">
                  <button
                    type="button"
                    className={`purple-filter-pill ${reviewFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setReviewFilter('all')}
                  >
                    All Messages ({reviews.length})
                  </button>
                  <button
                    type="button"
                    className={`purple-filter-pill ${reviewFilter === 'unreplied' ? 'active' : ''}`}
                    onClick={() => setReviewFilter('unreplied')}
                  >
                    Needs Reply ({unrepliedCount})
                  </button>
                  <button
                    type="button"
                    className={`purple-filter-pill ${reviewFilter === '5star' ? 'active' : ''}`}
                    onClick={() => setReviewFilter('5star')}
                  >
                    5-Star Reviews
                  </button>
                </div>
              </div>
              <div className="purple-table-responsive">
                <table className="purple-table">
                  <thead>
                    <tr>
                      <th style={{ width: '180px' }}>Reviewer</th>
                      <th style={{ width: '200px' }}>Recipe</th>
                      <th style={{ width: '90px' }}>Rating</th>
                      <th>Comment & Threaded Replies</th>
                      <th style={{ width: '110px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReviews.length > 0 ? (
                      filteredReviews.map((rev) => {
                        const isReplying = replyingReviewId === rev._id;
                        const hasReplies = Array.isArray(rev.replies) && rev.replies.length > 0;

                        return (
                          <tr key={rev._id}>
                            <td style={{ verticalAlign: 'top' }}>
                              <strong className="purple-reviewer-title">{rev.user_name || 'Home Cook'}</strong>
                              <span className="purple-cell-sub">{formatCommentDate(rev.created_at)}</span>
                            </td>

                            <td style={{ verticalAlign: 'top' }}>
                              <Link to={`/recipes/${rev.recipe_id}`} className="purple-recipe-link">
                                <span>{rev.recipe_name || 'Recipe'}</span>
                                <ExternalLink size={11} />
                              </Link>
                            </td>

                            <td style={{ verticalAlign: 'top' }}>
                              <div className="purple-star-badge">
                                <Star size={12} fill="#f59e0b" color="#f59e0b" />
                                <span>{rev.rating || 5}/5</span>
                              </div>
                            </td>

                            <td style={{ verticalAlign: 'top' }}>
                              <p className="purple-comment-text">{rev.comment}</p>

                              {/* Threaded Admin Replies */}
                              {hasReplies && (
                                <div className="purple-replies-thread">
                                  {rev.replies.map((rep, rIdx) => (
                                    <div key={rep._id || rIdx} className="purple-reply-item">
                                      <div className="purple-reply-item-header">
                                        <strong>{rep.user_name || 'Admin'}</strong>
                                        <span className="purple-role-badge admin">Admin</span>
                                        <span className="purple-cell-sub">• {formatCommentDate(rep.created_at)}</span>
                                        <button
                                          type="button"
                                          className="purple-btn-delete-reply"
                                          onClick={() => handleDeleteAdminReply(rev._id, rep._id)}
                                          title="Delete reply"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                      <p className="purple-reply-body">{rep.comment}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {isReplying && (
                                <div className="purple-reply-box">
                                  <textarea
                                    rows={2}
                                    value={adminReplyText}
                                    onChange={(e) => setAdminReplyText(e.target.value)}
                                    placeholder={`Write your admin reply to ${rev.user_name || 'user'}...`}
                                    autoFocus
                                  />
                                  <div className="purple-reply-box-actions">
                                    <button
                                      type="button"
                                      className="purple-btn-cancel-mini"
                                      onClick={() => setReplyingReviewId(null)}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      className="purple-btn-send-mini"
                                      disabled={submittingReply}
                                      onClick={() => handleAdminReply(rev._id, rev.user_name)}
                                    >
                                      <Send size={11} />
                                      <span>{submittingReply ? '...' : 'Send Reply'}</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>

                            <td style={{ verticalAlign: 'top', textAlign: 'right' }}>
                              <div className="purple-actions-group">
                                <button
                                  type="button"
                                  className={`purple-btn-icon ${isReplying ? 'active-reply' : 'reply'}`}
                                  onClick={() => {
                                    if (isReplying) {
                                      setReplyingReviewId(null);
                                    } else {
                                      setReplyingReviewId(rev._id);
                                      setAdminReplyText('');
                                    }
                                  }}
                                  title="Reply to comment"
                                >
                                  <CornerDownRight size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="purple-btn-icon delete"
                                  onClick={() => handleDeleteReview(rev._id)}
                                  title="Delete comment"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="purple-empty-cell">
                          No reviews or messages found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
      {selectedRecipe && (
        <div className="pro-modal-backdrop" onClick={() => setSelectedRecipe(null)}>
          <div className="pro-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="pro-modal-close"
              onClick={() => setSelectedRecipe(null)}
            >
              <X size={18} />
            </button>

            {selectedRecipe.image_url ? (
              <div className="pro-modal-hero">
                <img src={selectedRecipe.image_url} alt="" className="pro-modal-cover" />
              </div>
            ) : (
              <div className="pro-modal-hero fallback">
                <ChefHat size={48} />
              </div>
            )}

            <div className="pro-modal-body">
              <div className="pro-modal-title-area">
                <h2>{selectedRecipe.name || selectedRecipe.title}</h2>
                <div className="pro-modal-author-row">
                  <span>By <strong>{selectedRecipe.creator_name || 'Chef'}</strong></span>
                  {selectedRecipe.creator_email && <span>({selectedRecipe.creator_email})</span>}
                </div>
              </div>

              <div className="pro-modal-specs-grid">
                <div><strong>Cuisine:</strong> {selectedRecipe.cuisine || 'Homemade'}</div>
                <div><strong>Meal:</strong> {selectedRecipe.meal_type || 'Main'}</div>
                <div><strong>Time:</strong> {selectedRecipe.cooking_time || 30} mins</div>
                <div><strong>Difficulty:</strong> {selectedRecipe.difficulty || 'Easy'}</div>
              </div>

              {selectedRecipe.description && (
                <div className="pro-modal-section">
                  <h4>Description</h4>
                  <p>{selectedRecipe.description}</p>
                </div>
              )}

              {Array.isArray(selectedRecipe.ingredients) && selectedRecipe.ingredients.length > 0 && (
                <div className="pro-modal-section">
                  <h4>Ingredients ({selectedRecipe.ingredients.length})</h4>
                  <div className="pro-modal-ingredients-grid">
                    {selectedRecipe.ingredients.map((ing, i) => (
                      <div key={i} className="pro-modal-ing-pill">
                        <CheckCircle2 size={13} color="#10b981" />
                        <span>{ing}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pro-modal-actions">
                <Link to={`/recipes/${selectedRecipe._id}`} className="pro-modal-btn view-live" target="_blank">
                  <ExternalLink size={14} /> View Page
                </Link>
                <div className="pro-modal-actions-right">
                  <Link to={`/edit-recipe/${selectedRecipe._id}`} className="pro-modal-btn edit">
                    <Edit3 size={14} /> Edit
                  </Link>
                  <button
                    type="button"
                    className="pro-modal-btn delete"
                    onClick={() => handleDeleteRecipe(selectedRecipe._id, selectedRecipe.name)}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
