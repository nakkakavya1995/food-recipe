import { useEffect, useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  Heart,
  ArrowLeft,
  Share2,
  Edit3,
  Trash2,
  Star,
  MessageSquare,
  ChefHat,
  X,
  Sparkles,
  Send,
  AlertTriangle,
  Utensils,
  ExternalLink,
  Copy,
  Check,
  Film,
  CornerDownRight,
} from 'lucide-react';
import { getRecipe, deleteRecipe } from '../services/recipeService';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import VideoPlayer from '../components/VideoPlayer';
import api from '../services/api';

export default function RecipeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [recipe, setRecipe] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // { reviewId, replyToName }
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals & toast state
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRecipe, setDeletingRecipe] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [imageError, setImageError] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadReviews = async () => {
    try {
      const response = await api.get(`/reviews/${id}`);
      const data = response.data;
      setReviews(Array.isArray(data) ? data : data.reviews || []);
    } catch {
      // Non-fatal if reviews fail to load
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    getRecipe(id)
      .then((data) => {
        setRecipe(data);
        setImageError(false);
      })
      .catch(() => setError('Could not load this recipe. It may have been removed.'))
      .finally(() => setLoading(false));

    loadReviews();
  }, [id]);

  // Only the creator can edit or delete their recipe; Admin can edit or delete any recipe
  const currentUserId = user?.id || user?._id;
  const isCreator = Boolean(
    recipe?.created_by &&
    currentUserId &&
    String(recipe.created_by) === String(currentUserId)
  );
  const isAdmin = user?.role === 'admin';
  const canEditOrDelete = isAdmin || isCreator;

  // Accessible URL for WhatsApp and local network sharing
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return window.location.href.replace(host, '192.168.1.3');
    }
    return window.location.href;
  }, []);

  // Copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    showToast('Recipe link copied to clipboard! 🔗');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Native share or social share
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.name || 'RecipeNest Recipe',
          text: `Check out this delicious recipe for ${recipe.name} on RecipeNest:\n\n${shareUrl}`,
          url: shareUrl,
        });
      } catch {
        // Ignored if cancelled
      }
    } else {
      setShowShareModal(true);
    }
  };

  // Confirm delete recipe
  const handleDeleteRecipe = async () => {
    setDeletingRecipe(true);
    try {
      await deleteRecipe(id);
      showToast('Recipe deleted successfully.');
      setTimeout(() => {
        navigate('/recipes');
      }, 700);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete recipe.');
      setDeletingRecipe(false);
      setShowDeleteModal(false);
    }
  };

  // Submit comment & review
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!reviewForm.comment.trim()) {
      showToast('Please enter your review or comment.');
      return;
    }

    setSubmittingReview(true);
    try {
      await api.post(`/reviews/${id}`, {
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment.trim(),
      });
      setReviewForm({ rating: 5, comment: '' });
      await loadReviews();
      showToast('Thank you! Your comment was posted. ⭐');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not post review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Delete individual review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      showToast('Comment removed.');
      await loadReviews();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete comment.');
    }
  };

  // Submit reply to a comment
  const handleReplySubmit = async (e, reviewId, replyToName) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!replyText.trim()) {
      showToast('Please enter your reply.');
      return;
    }

    setSubmittingReply(true);
    try {
      await api.post(`/reviews/${reviewId}/reply`, {
        comment: replyText.trim(),
        reply_to: replyToName || 'Author',
      });
      setReplyText('');
      setReplyingTo(null);
      await loadReviews();
      showToast('Reply posted successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not post reply. Please try again.');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Delete a reply
  const handleDeleteReply = async (reviewId, replyId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;
    try {
      await api.delete(`/reviews/${reviewId}/reply/${replyId}`);
      showToast('Reply deleted.');
      await loadReviews();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete reply.');
    }
  };

  // Format date like: "October 9, 2026 3:06 pm"
  const formatCommentDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const dateFormatted = d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      const timeFormatted = d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).toLowerCase();
      return `${dateFormatted} ${timeFormatted}`;
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="pro-details-loading">
        <div className="pro-loading-spinner" />
        <p>Loading recipe...</p>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <section className="container section">
        <div className="pro-error-card">
          <AlertTriangle size={42} color="#ea580c" />
          <h2>Recipe Not Found</h2>
          <p>{error || 'The requested recipe could not be loaded.'}</p>
          <Link to="/recipes" className="btn btn-primary">
            <ArrowLeft size={16} /> Explore All Recipes
          </Link>
        </div>
      </section>
    );
  }

  const name = recipe.name || recipe.title || 'Untitled Recipe';
  const ingredients = recipe.ingredients || [];
  const instructions = recipe.instructions || [];
  const image = recipe.image_url || recipe.image;
  const isFav = isFavorite(id);

  // Compute average rating from reviews list
  const averageRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : '5.0';

  // WhatsApp formatted share link with double newline for clean clickable link preview
  const whatsappShareText = `Check out this delicious recipe for *${name}* on RecipeNest!\n\n${shareUrl}`;
  const whatsappHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappShareText)}`;

  return (
    <article className="pro-details-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="pro-details-toast">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
      {showShareModal && (
        <div className="pro-modal-backdrop" onClick={() => setShowShareModal(false)}>
          <div className="pro-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="pro-modal-close"
              onClick={() => setShowShareModal(false)}
              aria-label="Close share dialog"
            >
              <X size={20} />
            </button>
            <div className="pro-modal-header">
              <div className="pro-modal-icon-badge">
                <Share2 size={22} />
              </div>
              <h3>Share this Recipe</h3>
              <p>Share with friends & family on WhatsApp or other apps</p>
            </div>

            <div className="pro-share-preview">
              {image && !imageError ? (
                <img src={image} alt={name} className="pro-share-thumb" />
              ) : (
                <div className="pro-share-placeholder">
                  <Utensils size={24} />
                </div>
              )}
              <div className="pro-share-meta">
                <h4>{name}</h4>
                <span>{recipe.cuisine || 'Homemade'} • {recipe.cooking_time || 30} mins</span>
              </div>
            </div>

            <div className="pro-share-link-box">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="pro-share-input"
              />
              <button
                className={`pro-copy-btn ${copiedLink ? 'copied' : ''}`}
                onClick={handleCopyLink}
              >
                {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                {copiedLink ? 'Copied' : 'Copy'}
              </button>
            </div>

            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '-12px', marginBottom: '18px' }}>
              📱 Accessible link for mobile phones and computers on your Wi-Fi network!
            </p>

            <div className="pro-social-grid">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="pro-social-btn whatsapp"
              >
                <span>💬</span> WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${name} on RecipeNest:\n\n${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pro-social-btn twitter"
              >
                <span>🐦</span> X / Twitter
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pro-social-btn facebook"
              >
                <span>📘</span> Facebook
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(`Recipe: ${name}`)}&body=${encodeURIComponent(`Check out this recipe for ${name}:\n\n${shareUrl}`)}`}
                className="pro-social-btn email"
              >
                <span>✉️</span> Email
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="pro-modal-backdrop" onClick={() => !deletingRecipe && setShowDeleteModal(false)}>
          <div className="pro-modal-card pro-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pro-modal-icon-badge danger">
              <Trash2 size={24} />
            </div>
            <h3>Delete Recipe?</h3>
            <p>
              Are you sure you want to permanently delete <strong>{name}</strong>? This action cannot be undone.
            </p>
            <div className="pro-modal-actions">
              <button
                className="btn btn-outline"
                disabled={deletingRecipe}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                disabled={deletingRecipe}
                onClick={handleDeleteRecipe}
              >
                {deletingRecipe ? 'Deleting...' : 'Yes, Delete Recipe'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pro-container">
        {/* Navigation & Actions Top Bar */}
        <header className="pro-top-bar">
          <Link to="/recipes" className="pro-back-link">
            <ArrowLeft size={18} />
            <span>All Recipes</span>
          </Link>

          <div className="pro-actions-group">
            {/* Favorite Button */}
            <button
              className={`pro-action-btn ${isFav ? 'active-fav' : ''}`}
              onClick={() => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                toggleFavorite(recipe)
                  .then(() => showToast(isFav ? 'Removed from favorites' : 'Added to favorites! ❤️'))
                  .catch(() => showToast('Could not update favorites.'));
              }}
              title={isFav ? 'Saved in favorites' : 'Save to favorites'}
              aria-label="Save recipe"
            >
              <Heart
                size={18}
                fill={isFav ? '#ef4444' : 'none'}
                color={isFav ? '#ef4444' : 'currentColor'}
              />
              <span className="pro-action-btn-text">{isFav ? 'Saved' : 'Save'}</span>
            </button>

            {/* Share Button */}
            <button
              className="pro-action-btn"
              onClick={handleNativeShare}
              title="Share recipe"
              aria-label="Share recipe"
            >
              <Share2 size={18} />
              <span className="pro-action-btn-text">Share</span>
            </button>

            {/* Edit Button (Available to logged in users) */}
            {canEditOrDelete && (
              <Link
                to={`/edit-recipe/${id}`}
                className="pro-action-btn edit-btn"
                title="Edit this recipe"
                aria-label="Edit recipe"
              >
                <Edit3 size={18} />
                <span className="pro-action-btn-text">Edit</span>
              </Link>
            )}

            {/* Delete Button (Available to logged in users) */}
            {canEditOrDelete && (
              <button
                className="pro-action-btn delete-btn"
                onClick={() => setShowDeleteModal(true)}
                title="Delete this recipe"
                aria-label="Delete recipe"
              >
                <Trash2 size={18} />
                <span className="pro-action-btn-text">Delete</span>
              </button>
            )}
          </div>
        </header>

        {/* Hero Section: Reduced & Framed Image Layout */}
        <section className="pro-hero-section">
          {/* Magazine-Framed Recipe Image (Reduced size, stylish aspect ratio) */}
          <div className="pro-image-wrapper">
            {image && !imageError ? (
              <img
                src={image}
                alt={name}
                className="pro-recipe-image"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="pro-image-fallback">
                <Utensils size={48} />
                <span>No photo provided</span>
              </div>
            )}
            <div className="pro-image-badges">
              <span className="pro-badge cuisine">{recipe.cuisine || 'Homemade'}</span>
              <span className="pro-badge meal">{recipe.meal_type || 'Main Dish'}</span>
            </div>
          </div>

          {/* Hero Content & Culinary Overview */}
          <div className="pro-hero-info">
            <div className="pro-hero-meta-top">
              <span className="pro-eyebrow">
                {recipe.cuisine || 'Recipe'}
              </span>
              <a href="#comments-section" className="pro-rating-chip">
                <Star size={15} fill="#f59e0b" color="#f59e0b" />
                <strong>{averageRating}</strong>
                <span>({reviews.length} reviews)</span>
              </a>
            </div>

            <h1 className="pro-recipe-title">{name}</h1>

            <p className="pro-recipe-desc">
              {recipe.description || 'A mouth-watering delicacy crafted with fresh ingredients and authentic cooking techniques.'}
            </p>

            {/* Quick Metrics Grid */}
            <div className="pro-metrics-grid">
              <div className="pro-metric-card">
                <div className="pro-metric-icon">
                  <Clock size={20} />
                </div>
                <div>
                  <small>Cook Time</small>
                  <strong>{recipe.cooking_time || 30} mins</strong>
                </div>
              </div>

              <div className="pro-metric-card">
                <div className="pro-metric-icon">
                  <ChefHat size={20} />
                </div>
                <div>
                  <small>Difficulty</small>
                  <strong>{recipe.difficulty || 'Easy'}</strong>
                </div>
              </div>

              <div className="pro-metric-card">
                <div className="pro-metric-icon">
                  <Utensils size={20} />
                </div>
                <div>
                  <small>Meal Type</small>
                  <strong>{recipe.meal_type || 'Lunch'}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Layout: Clean Ingredients (Left) & Instructions (Right) */}
        <section className="pro-recipe-body">
          {/* Left Column: Ingredients (Clean list, no checkboxes) */}
          <div className="pro-card pro-ingredients-card">
            <div className="pro-card-header">
              <h2>Ingredients</h2>
              <small>{ingredients.length} items</small>
            </div>

            {ingredients.length > 0 ? (
              <ul className="pro-clean-ingredient-list">
                {ingredients.map((item, idx) => {
                  const displayText = typeof item === 'string'
                    ? item
                    : `${item.quantity || ''} ${item.name || item.ingredient || ''}`.trim();
                  return (
                    <li key={idx} className="pro-clean-ingredient-item">
                      <span className="pro-ingredient-dot" />
                      <span className="pro-clean-ingredient-text">{displayText}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="pro-empty-note">No specific ingredients listed for this recipe.</p>
            )}
          </div>

          {/* Right Column: Preparation Steps & Video */}
          <div className="pro-card pro-instructions-card">
            <div className="pro-card-header">
              <div>
                <h2>Preparation Steps</h2>
                <small>{instructions.length} step{instructions.length === 1 ? '' : 's'}</small>
              </div>
            </div>

            {instructions.length > 0 ? (
              <div className="pro-clean-instruction-list">
                {instructions.map((step, idx) => {
                  const stepNum = typeof step === 'object' && step.step ? step.step : idx + 1;
                  const stepText = typeof step === 'string'
                    ? step
                    : step.instruction || step.step_text || step.text || JSON.stringify(step);
                  const stepImage = typeof step === 'object'
                    ? (step.image_url || step.image || '')
                    : '';

                  return (
                    <article key={idx} className="pro-step-article">
                      <div className="pro-step-header">
                        <span className="pro-step-badge">{stepNum}</span>
                        <h3 className="pro-step-heading">Step {stepNum}</h3>
                      </div>

                      <p className="pro-step-text">{stepText}</p>

                      {stepImage && (
                        <div className="pro-step-image-wrap">
                          <img
                            src={stepImage}
                            alt={`Step ${stepNum} preparation instruction`}
                            className="pro-step-image"
                            loading="lazy"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="pro-empty-note">No preparation steps listed for this recipe.</p>
            )}
            {recipe.video_url && (
              <div className="pro-video-section" id="watch-cooking-video">
                <div className="pro-video-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#ea580c', color: '#fff', borderRadius: '10px', padding: '8px', display: 'flex' }}>
                      <Film size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>Watch Cooking Video</h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                        Follow along with the step-by-step video guide
                      </p>
                    </div>
                  </div>
                  <a
                    href={recipe.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pro-video-link"
                    style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#ea580c', fontWeight: 600 }}
                  >
                    <ExternalLink size={14} /> Watch on YouTube
                  </a>
                </div>
                <VideoPlayer url={recipe.video_url} title={`${name} Cooking Video`} />
              </div>
            )}
          </div>
        </section>

        {/* Comments & Community Reviews Section */}
        <section id="comments-section" className="pro-card pro-reviews-section">
          <div className="pro-card-header">
            <div>
              <h2>Comments & Reviews</h2>
              <small>{reviews.length} review{reviews.length === 1 ? '' : 's'}</small>
            </div>
            <div className="pro-rating-summary">
              <span className="pro-big-rating">{averageRating}</span>
              <div className="pro-stars-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    fill={star <= Math.round(Number(averageRating)) ? '#f59e0b' : '#e2e8f0'}
                    color={star <= Math.round(Number(averageRating)) ? '#f59e0b' : '#cbd5e1'}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Add Review / Comment Form */}
          <form className="pro-comment-form" onSubmit={handleReviewSubmit}>
            <div className="pro-comment-form-header">
              <div className="pro-user-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : <ChefHat size={18} />}
              </div>
              <div className="pro-form-intro">
                <strong>{user ? `Review as ${user.name}` : 'Leave a Review'}</strong>
                <span>Have you made this recipe? Share your notes or tweaks below.</span>
              </div>
            </div>

            {/* Star Rating Picker */}
            <div className="pro-star-selector-wrap">
              <label>Your Rating:</label>
              <div className="pro-interactive-stars">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || reviewForm.rating) >= star;
                  return (
                    <button
                      type="button"
                      key={star}
                      className="pro-star-btn"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        size={22}
                        fill={active ? '#f59e0b' : 'none'}
                        color={active ? '#f59e0b' : '#94a3b8'}
                      />
                    </button>
                  );
                })}
                <span className="pro-rating-label">
                  {(hoverRating || reviewForm.rating)} / 5 Stars
                </span>
              </div>
            </div>

            {/* Comment Text Area */}
            <div className="pro-comment-input-wrap">
              <textarea
                required
                rows={3}
                placeholder={
                  user
                    ? 'Write your feedback, flavor notes, or cooking tips here...'
                    : 'Log in to write a review and join the conversation...'
                }
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                disabled={!user}
              />
            </div>

            <div className="pro-comment-submit-row">
              {user ? (
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingReview}
                >
                  <Send size={16} />
                  <span>{submittingReview ? 'Posting...' : 'Post Comment'}</span>
                </button>
              ) : (
                <Link to="/login" className="btn btn-primary">
                  Sign In to Leave a Comment
                </Link>
              )}
            </div>
          </form>

          {/* Reviews & Comments List */}
          <div className="pro-reviews-list" style={{ marginTop: '2rem' }}>
            {reviews.length > 0 ? (
              reviews.map((item, index) => {
                const authorName = item.user_name || item.name || 'Home Cook';
                const canDeleteThisReview = user && (user.role === 'admin' || user.id === item.user_id);
                const isReplyingToThisReview = replyingTo?.reviewId === item._id;

                return (
                  <div
                    key={item._id || index}
                    style={{
                      paddingTop: index === 0 ? 0 : '1.5rem',
                      paddingBottom: '1.5rem',
                      borderBottom: '1px solid var(--border-color, #f1f5f9)',
                    }}
                  >
                    {/* Top Row: Author Name & Delete Action */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: '#15803d',
                            fontFamily: 'inherit',
                          }}
                        >
                          {authorName}
                        </span>
                        {item.user_role === 'admin' && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: '#16a34a',
                              color: '#ffffff',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            Admin
                          </span>
                        )}
                      </div>

                      {canDeleteThisReview && (
                        <button
                          type="button"
                          className="pro-delete-review-btn"
                          onClick={() => handleDeleteReview(item._id)}
                          title="Delete comment"
                          aria-label="Delete comment"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* Date and Time (e.g. October 9, 2026 3:06 pm) */}
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px', marginBottom: '8px' }}>
                      {formatCommentDate(item.created_at)}
                    </div>

                    {/* Solid Dark Stars */}
                    <div style={{ display: 'flex', gap: '3px', marginBottom: '10px' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={18}
                          fill={s <= (item.rating || 5) ? '#18181b' : '#e4e4e7'}
                          color={s <= (item.rating || 5) ? '#18181b' : '#d4d4d8'}
                        />
                      ))}
                    </div>

                    {/* Comment Body */}
                    <p
                      style={{
                        margin: '0 0 10px 0',
                        fontSize: '1rem',
                        color: 'var(--ink, #1e293b)',
                        lineHeight: '1.6',
                      }}
                    >
                      {item.comment}
                    </p>

                    {/* Reply Action Link */}
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!user) {
                            navigate('/login');
                            return;
                          }
                          if (isReplyingToThisReview && replyingTo?.replyToName === authorName) {
                            setReplyingTo(null);
                          } else {
                            setReplyingTo({ reviewId: item._id, replyToName: authorName });
                            setReplyText('');
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: '#991b1b',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                        }}
                      >
                        <CornerDownRight size={15} color="#991b1b" strokeWidth={2.5} />
                        <span>Reply</span>
                      </button>
                    </div>

                    {/* Nested Replies (Matches Reference Image with Green Left Border) */}
                    {Array.isArray(item.replies) && item.replies.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
                        {item.replies.map((rep, rIdx) => {
                          const canDeleteReply = user && (user.role === 'admin' || user.id === rep.user_id);
                          const replierName = rep.user_name || 'Admin';

                          return (
                            <div
                              key={rep._id || rIdx}
                              style={{
                                marginLeft: '1.75rem',
                                backgroundColor: '#f8fafc',
                                borderLeft: '3.5px solid #16a34a',
                                padding: '16px 20px',
                                borderRadius: '2px 8px 8px 2px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#15803d' }}>
                                    {replierName}
                                  </span>
                                  {rep.user_role === 'admin' && (
                                    <span
                                      style={{
                                        fontSize: '0.675rem',
                                        fontWeight: 700,
                                        background: '#16a34a',
                                        color: '#ffffff',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                      }}
                                    >
                                      Admin
                                    </span>
                                  )}
                                </div>

                                {canDeleteReply && (
                                  <button
                                    type="button"
                                    className="pro-delete-review-btn"
                                    onClick={() => handleDeleteReply(item._id, rep._id)}
                                    title="Delete reply"
                                    aria-label="Delete reply"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>

                              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px', marginBottom: '8px' }}>
                                Reply to <strong style={{ color: '#334155' }}>{rep.reply_to || authorName}</strong> &nbsp;
                                <span>{formatCommentDate(rep.created_at)}</span>
                              </div>

                              <p
                                style={{
                                  margin: '0 0 10px 0',
                                  fontSize: '0.975rem',
                                  color: 'var(--ink, #1e293b)',
                                  lineHeight: '1.6',
                                }}
                              >
                                {rep.comment}
                              </p>

                              <button
                                type="button"
                                onClick={() => {
                                  if (!user) {
                                    navigate('/login');
                                    return;
                                  }
                                  setReplyingTo({ reviewId: item._id, replyToName: replierName });
                                  setReplyText('');
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  color: '#991b1b',
                                  fontWeight: 600,
                                  fontSize: '0.85rem',
                                  cursor: 'pointer',
                                }}
                              >
                                <CornerDownRight size={14} color="#991b1b" strokeWidth={2.5} />
                                <span>Reply</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Inline Reply Composer Form */}
                    {isReplyingToThisReview && (
                      <form
                        onSubmit={(e) => handleReplySubmit(e, item._id, replyingTo.replyToName)}
                        style={{
                          marginLeft: '1.75rem',
                          marginTop: '14px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '16px',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                            Replying to <strong style={{ color: '#15803d' }}>{replyingTo.replyToName}</strong>
                            {user?.role === 'admin' && (
                              <span style={{ marginLeft: 6, fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
                                (as Admin)
                              </span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => setReplyingTo(null)}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
                          >
                            Cancel
                          </button>
                        </div>

                        <textarea
                          required
                          rows={3}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={`Write your reply to ${replyingTo.replyToName}...`}
                          style={{
                            width: '100%',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            fontSize: '0.925rem',
                            fontFamily: 'inherit',
                            outline: 'none',
                            marginBottom: '10px',
                            resize: 'vertical',
                          }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setReplyingTo(null)}
                            className="btn btn-outline"
                            style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={submittingReply}
                            className="btn btn-primary"
                            style={{
                              padding: '0.4rem 1rem',
                              fontSize: '0.85rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <Send size={14} />
                            <span>{submittingReply ? 'Sending...' : 'Submit Reply'}</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="pro-no-reviews">
                <MessageSquare size={32} color="#94a3b8" />
                <h4>No reviews yet</h4>
                <p>Be the first to leave a review for this recipe.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </article>
  );
}
