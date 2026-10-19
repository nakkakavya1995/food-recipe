import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Utensils,
  Clock,
  ChefHat,
  Sparkles,
  AlertCircle,
  Image as ImageIcon,
  Film,
  UploadCloud,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { getRecipe, updateRecipe, uploadCookingVideo, uploadRecipeImage } from '../services/recipeService';
import VideoPlayer from '../components/VideoPlayer';
import { useAuth } from '../context/AuthContext';

export default function EditRecipe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState(null);
  const [steps, setSteps] = useState([]);
  const [stepUploadingIdx, setStepUploadingIdx] = useState(null);

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [imagePreviewError, setImagePreviewError] = useState(false);

  const [videoUploading, setVideoUploading] = useState(false);
  const [videoSuccess, setVideoSuccess] = useState('');
  const [videoError, setVideoError] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    getRecipe(id)
      .then((recipe) => {
        const currentUserId = user?.id || user?._id;
        const isCreator = Boolean(
          recipe?.created_by &&
          currentUserId &&
          String(recipe.created_by) === String(currentUserId)
        );
        const isAdmin = user?.role === 'admin';

        if (!isAdmin && !isCreator) {
          setError("Access Denied: You can only edit recipes that you created. Another user's recipe cannot be modified.");
          return;
        }

        setForm({
          name: recipe.name || recipe.title || '',
          description: recipe.description || '',
          cuisine: recipe.cuisine || 'Indian',
          meal_type: recipe.meal_type || 'Lunch',
          cooking_time: recipe.cooking_time || 30,
          difficulty: recipe.difficulty || 'Easy',
          image_url: recipe.image_url || recipe.image || '',
          video_url: recipe.video_url || '',
          ingredients: (recipe.ingredients || [])
            .map((x) => (typeof x === 'string' ? x : x.name || x.ingredient || ''))
            .filter(Boolean)
            .join('\n'),
        });

        // Parse instructions into steps
        const loadedSteps = (recipe.instructions || []).map((x, idx) => {
          if (typeof x === 'object' && x !== null) {
            return {
              instruction: x.instruction || x.text || '',
              image_url: x.image_url || x.image || '',
            };
          }
          return {
            instruction: typeof x === 'string' ? x : '',
            image_url: '',
          };
        });

        setSteps(loadedSteps.length > 0 ? loadedSteps : [{ instruction: '', image_url: '' }]);
      })
      .catch(() => setError('Could not load recipe details.'));
  }, [id]);

  const updateField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'image_url') {
      setImagePreviewError(false);
    }
  };

  // Step controls
  const handleAddStep = () => {
    setSteps([...steps, { instruction: '', image_url: '' }]);
  };

  const handleRemoveStep = (index) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleStepInstructionChange = (index, value) => {
    const updated = [...steps];
    updated[index].instruction = value;
    setSteps(updated);
  };

  const handleStepImageUrlChange = (index, value) => {
    const updated = [...steps];
    updated[index].image_url = value;
    setSteps(updated);
  };

  const handleStepImageUpload = async (index, file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    setStepUploadingIdx(index);
    setError('');

    try {
      const res = await uploadRecipeImage(file);
      const updated = [...steps];
      updated[index].image_url = res.image_url || res.relative_url;
      setSteps(updated);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not upload step image.');
    } finally {
      setStepUploadingIdx(null);
    }
  };

  // Cover image upload
  const handleCoverUpload = async (file) => {
    if (!file) return;
    setCoverUploading(true);
    try {
      const res = await uploadRecipeImage(file);
      setForm((prev) => ({ ...prev, image_url: res.image_url || res.relative_url }));
      setImagePreviewError(false);
    } catch (err) {
      setError('Could not upload cover image.');
    } finally {
      setCoverUploading(false);
    }
  };

  // Video upload
  const handleVideoFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoError('');
    setVideoSuccess('');
    setVideoUploading(true);

    try {
      const res = await uploadCookingVideo(file);
      const uploadedUrl = res.video_url || res.relative_url;
      setForm((prev) => ({ ...prev, video_url: uploadedUrl }));
      setVideoSuccess('Cooking video uploaded successfully!');
    } catch (err) {
      setVideoError(
        err.response?.data?.message ||
        'Could not upload video. Max size is 100MB. Supported formats: MP4, WebM, MOV.'
      );
    } finally {
      setVideoUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const ingredientsList = form.ingredients
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean);

    if (!ingredientsList.length) {
      setError('Please provide at least one ingredient.');
      return;
    }

    const validSteps = steps
      .map((s, idx) => ({
        step: idx + 1,
        instruction: s.instruction.trim(),
        image_url: (s.image_url || '').trim(),
      }))
      .filter((s) => s.instruction.length > 0);

    if (!validSteps.length) {
      setError('Please provide at least one cooking instruction step.');
      return;
    }

    setSaving(true);
    try {
      await updateRecipe(id, {
        ...form,
        cooking_time: Number(form.cooking_time) || 30,
        ingredients: ingredientsList,
        instructions: validSteps,
      });

      navigate(`/recipes/${id}`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Could not update recipe. Please check your permissions or required fields.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (error && !form) {
    return (
      <div className="container section">
        <div
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            maxWidth: '540px',
            margin: '2rem auto',
          }}
        >
          <AlertCircle size={44} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>Permission Denied</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            {error}
          </p>
          <Link to="/recipes" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={16} /> Back to Recipes
          </Link>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="container section">
        <p className="loading">Loading recipe editor...</p>
      </div>
    );
  }

  return (
    <div className="pro-edit-page">
      <div className="pro-container">
        {/* Navigation & Header */}
        <div className="pro-edit-header-bar">
          <Link to={`/recipes/${id}`} className="pro-back-link">
            <ArrowLeft size={18} />
            <span>Cancel and View Recipe</span>
          </Link>
          <div className="pro-edit-badge">Edit Recipe</div>
        </div>

        <div className="pro-edit-title-area">
          <h1>Edit "{form.name || 'Recipe'}"</h1>
          <p>Update ingredients, step-by-step preparation photos, and cooking videos.</p>
        </div>

        {error && (
          <div className="table-alert error" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="pro-edit-form">
          <div className="pro-edit-grid">
            {/* Left Column: Metadata, Cover, & Video */}
            <div className="pro-edit-panel">
              <h3>Basic Information</h3>

              <div className="pro-input-group">
                <label htmlFor="name">Recipe Title *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={updateField}
                />
              </div>

              <div className="pro-input-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={form.description}
                  onChange={updateField}
                />
              </div>

              <div className="pro-form-row">
                <div className="pro-input-group">
                  <label htmlFor="cuisine">Cuisine</label>
                  <select
                    id="cuisine"
                    name="cuisine"
                    value={form.cuisine}
                    onChange={updateField}
                  >
                    <option value="Indian">Indian</option>
                    <option value="Italian">Italian</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Mexican">Mexican</option>
                    <option value="Continental">Continental</option>
                    <option value="American">American</option>
                    <option value="Mediterranean">Mediterranean</option>
                    <option value="Thai">Thai</option>
                    <option value="Japanese">Japanese</option>
                  </select>
                </div>

                <div className="pro-input-group">
                  <label htmlFor="meal_type">Meal Type</label>
                  <select
                    id="meal_type"
                    name="meal_type"
                    value={form.meal_type}
                    onChange={updateField}
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snack">Snack</option>
                    <option value="Dessert">Dessert</option>
                  </select>
                </div>
              </div>

              <div className="pro-form-row">
                <div className="pro-input-group">
                  <label htmlFor="cooking_time">Cook Time (Minutes) *</label>
                  <input
                    id="cooking_time"
                    name="cooking_time"
                    type="number"
                    min="1"
                    max="1440"
                    required
                    value={form.cooking_time}
                    onChange={updateField}
                  />
                </div>

                <div className="pro-input-group">
                  <label htmlFor="difficulty">Difficulty</label>
                  <select
                    id="difficulty"
                    name="difficulty"
                    value={form.difficulty}
                    onChange={updateField}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="pro-input-group">
                <label htmlFor="image_url">Recipe Cover Image URL</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                  <input
                    id="image_url"
                    name="image_url"
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={form.image_url}
                    onChange={updateField}
                  />
                  <label
                    className="btn btn-outline"
                    style={{
                      cursor: coverUploading ? 'not-allowed' : 'pointer',
                      margin: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.82rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {coverUploading ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
                    <span>{coverUploading ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleCoverUpload(e.target.files?.[0])}
                      disabled={coverUploading}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {/* Cover Image Preview */}
              <div className="pro-edit-preview-card">
                <small className="pro-preview-label">Live Cover Preview</small>
                {form.image_url && !imagePreviewError ? (
                  <img
                    src={form.image_url}
                    alt="Recipe preview"
                    className="pro-edit-preview-img"
                    onError={() => setImagePreviewError(true)}
                  />
                ) : (
                  <div className="pro-edit-preview-placeholder">
                    <ImageIcon size={32} />
                    <span>No cover image preview available</span>
                  </div>
                )}
              </div>

              {/* Cooking Video Section */}
              <div className="video-upload-card" style={{
                background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.05), rgba(249, 115, 22, 0.02))',
                border: '2px dashed #f97316',
                borderRadius: '12px',
                padding: '1.25rem',
                marginTop: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
                  <div style={{
                    background: '#ea580c',
                    color: '#fff',
                    padding: '8px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Film size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Watch Cooking Video</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                      Paste a YouTube / Vimeo URL or upload an MP4 video file.
                    </p>
                  </div>
                </div>

                {videoSuccess && (
                  <div className="table-alert success" style={{ marginBottom: '0.75rem', padding: '8px 12px' }}>
                    <CheckCircle2 size={16} />
                    <span>{videoSuccess}</span>
                  </div>
                )}

                {videoError && (
                  <div className="table-alert error" style={{ marginBottom: '0.75rem', padding: '8px 12px' }}>
                    <AlertCircle size={16} />
                    <span>{videoError}</span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center' }}>
                  <input
                    name="video_url"
                    type="url"
                    value={form.video_url || ''}
                    onChange={updateField}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />

                  <label
                    className="btn btn-outline"
                    style={{
                      cursor: videoUploading ? 'not-allowed' : 'pointer',
                      margin: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {videoUploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                    <span>{videoUploading ? 'Uploading...' : 'Upload Video'}</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/m4v"
                      onChange={handleVideoFileUpload}
                      disabled={videoUploading}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {form.video_url && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <small style={{ fontWeight: 600, color: '#ea580c' }}>Active Video Preview:</small>
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, video_url: '' }));
                          setVideoSuccess('');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <X size={14} /> Remove
                      </button>
                    </div>
                    <VideoPlayer url={form.video_url} title="Cooking Video Preview" />
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Ingredients & Dynamic Preparation Steps */}
            <div className="pro-edit-panel">
              <h3>Ingredients &amp; Preparation Steps</h3>

              <div className="pro-input-group">
                <div className="pro-label-meta">
                  <label htmlFor="ingredients">Ingredients (one per line) *</label>
                  <small>
                    {form.ingredients.split('\n').filter((x) => x.trim()).length} ingredients
                  </small>
                </div>
                <textarea
                  id="ingredients"
                  name="ingredients"
                  rows={6}
                  required
                  placeholder="2 cups Basmati Rice&#10;500g Chicken cut into pieces&#10;1 tbsp Garam Masala&#10;2 tbsp Ghee"
                  value={form.ingredients}
                  onChange={updateField}
                />
              </div>

              {/* Dynamic Steps Section */}
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b' }}>
                      Preparation Steps &amp; Step Images *
                    </h4>
                    <small style={{ color: '#64748b' }}>
                      Each step has its own instruction and optional step image.
                    </small>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline btn-small"
                    onClick={handleAddStep}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={15} /> Add Step
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {steps.map((step, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '14px 16px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            background: '#ea580c',
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'grid',
                            placeItems: 'center'
                          }}>
                            {idx + 1}
                          </span>
                          <strong style={{ fontSize: '0.92rem', color: '#1e293b' }}>Step {idx + 1}</strong>
                        </div>

                        {steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8rem'
                            }}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        )}
                      </div>

                      <textarea
                        rows={2}
                        required
                        value={step.instruction}
                        onChange={(e) => handleStepInstructionChange(idx, e.target.value)}
                        placeholder={`Describe step ${idx + 1}...`}
                        style={{ width: '100%', marginBottom: '8px' }}
                      />

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="url"
                          value={step.image_url}
                          onChange={(e) => handleStepImageUrlChange(idx, e.target.value)}
                          placeholder="Step image URL or upload image"
                          style={{ fontSize: '0.85rem' }}
                        />

                        <label
                          className="btn btn-outline"
                          style={{
                            cursor: stepUploadingIdx === idx ? 'not-allowed' : 'pointer',
                            margin: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.8rem',
                            padding: '6px 10px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {stepUploadingIdx === idx ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                          <span>{stepUploadingIdx === idx ? 'Uploading...' : 'Upload'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleStepImageUpload(idx, e.target.files?.[0])}
                            disabled={stepUploadingIdx === idx}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>

                      {step.image_url && (
                        <div style={{ marginTop: '8px', position: 'relative', display: 'inline-block' }}>
                          <img
                            src={step.image_url}
                            alt={`Step ${idx + 1} preview`}
                            style={{ width: '180px', height: '110px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <button
                            type="button"
                            onClick={() => handleStepImageUrlChange(idx, '')}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              background: 'rgba(0,0,0,0.6)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              display: 'grid',
                              placeItems: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleAddStep}
                  style={{
                    marginTop: '10px',
                    width: '100%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px',
                    borderStyle: 'dashed'
                  }}
                >
                  <Plus size={15} /> Add Preparation Step {steps.length + 1}
                </button>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="pro-edit-footer">
            <Link to={`/recipes/${id}`} className="btn btn-outline">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || videoUploading}
            >
              <Save size={18} />
              <span>{saving ? 'Saving Changes...' : 'Save Recipe Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
