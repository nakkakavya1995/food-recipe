import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Utensils,
  Image as ImageIcon,
  Check,
  X,
  Plus,
  Trash2,
  Loader2,
  Film,
  UploadCloud,
} from 'lucide-react';
import recipeService from '../services/recipeService';
import VideoPlayer from '../components/VideoPlayer';

const initialForm = {
  title: '',
  description: '',
  cuisine: 'Indian',
  meal_type: 'Lunch',
  cooking_time: 30,
  servings: 4,
  image_url: '',
  video_url: '',
  ingredients: '',
};

const initialSteps = [
  { instruction: '', image_url: '' },
  { instruction: '', image_url: '' },
];

export default function AddRecipe() {
  const [form, setForm] = useState(initialForm);
  const [steps, setSteps] = useState(initialSteps);
  const [stepUploadingIdx, setStepUploadingIdx] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [error, setError] = useState('');

  // Image upload states
  const [imageUploading, setImageUploading] = useState(false);

  // Video upload states
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoSuccess, setVideoSuccess] = useState('');
  const [videoError, setVideoError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const navigate = useNavigate();

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  // Dynamic Preparation Steps controls
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

    if (file.size > 10 * 1024 * 1024) {
      setError('Step image file size should not exceed 10MB.');
      return;
    }

    setStepUploadingIdx(index);
    setError('');

    try {
      const res = await recipeService.uploadRecipeImage(file);
      const updated = [...steps];
      updated[index].image_url = res.image_url || res.relative_url;
      setSteps(updated);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not upload step image.');
    } finally {
      setStepUploadingIdx(null);
    }
  };

  // Handle Cover Image Upload
  async function handleImageFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const res = await recipeService.uploadRecipeImage(file);
      setForm((prev) => ({ ...prev, image_url: res.image_url || res.relative_url }));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not upload image file.');
    } finally {
      setImageUploading(false);
    }
  }

  // Handle Cooking Video Upload
  async function handleVideoFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      setVideoError('Video file size exceeds the 100MB limit. Please choose a smaller video.');
      return;
    }

    setVideoUploading(true);
    setVideoError('');
    setVideoSuccess('');
    setUploadProgress(0);

    try {
      const res = await recipeService.uploadCookingVideo(file, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });
      const uploadedUrl = res.video_url || res.relative_url;
      setForm((prev) => ({ ...prev, video_url: uploadedUrl }));
      setVideoSuccess(`Cooking video "${file.name}" uploaded successfully!`);
    } catch (err) {
      setVideoError(err.response?.data?.message || err.message || 'Could not upload cooking video.');
    } finally {
      setVideoUploading(false);
    }
  }

  // Manual Form Submission
  async function submit(event) {
    event.preventDefault();
    setError('');

    // Validate preparation steps
    const validSteps = steps
      .map((s, idx) => ({
        step: idx + 1,
        instruction: s.instruction.trim(),
        image_url: (s.image_url || '').trim(),
      }))
      .filter((s) => s.instruction.length > 0);

    if (validSteps.length === 0) {
      setError('Please provide at least one preparation step with instructions.');
      return;
    }

    const ingredientsList = form.ingredients
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean);

    if (ingredientsList.length === 0) {
      setError('Please provide at least one ingredient.');
      return;
    }

    setManualLoading(true);

    const payload = {
      ...form,
      name: form.title,
      cooking_time: Number(form.cooking_time),
      servings: Number(form.servings),
      video_url: (form.video_url || '').trim(),
      ingredients: ingredientsList,
      instructions: validSteps,
    };

    try {
      const res = await recipeService.createRecipe(payload);
      const newId = res.recipe?._id || res.recipe?.id;
      if (newId) {
        navigate(`/recipes/${newId}`);
      } else {
        navigate('/recipes');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Could not add recipe.');
    } finally {
      setManualLoading(false);
    }
  }

  return (
    <section className="container section">
      <div className="page-heading">
        <span className="eyebrow">SHARE YOUR CREATION</span>
        <h1>Add a Recipe with Illustrated Steps</h1>
        <p>Publish your dish with photos for every preparation step and ingredients.</p>
      </div>

      {error && (
        <div className="table-alert error" style={{ maxWidth: '820px', margin: '0 auto 1.5rem auto' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* RECIPE FORM */}
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        <form onSubmit={submit} className="panel form-stack">
          <label>
            Recipe Title *
            <input
              name="title"
              value={form.title}
              onChange={update}
              required
              placeholder="e.g. Crispy Vegetable Samosas"
            />
          </label>

          <label>
            Description *
            <textarea
              name="description"
              value={form.description}
              onChange={update}
              required
              rows="3"
              placeholder="Share what makes this dish delightful..."
            />
          </label>

          <div className="form-two-columns">
            <label>
              Cuisine
              <select name="cuisine" value={form.cuisine} onChange={update}>
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
            </label>

            <label>
              Meal Type
              <select name="meal_type" value={form.meal_type} onChange={update}>
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snack">Snack</option>
                <option value="Dessert">Dessert</option>
              </select>
            </label>

            <label>
              Cooking Time (minutes) *
              <input
                name="cooking_time"
                type="number"
                min="1"
                max="1440"
                value={form.cooking_time}
                onChange={update}
                required
              />
            </label>

            <label>
              Servings *
              <input
                name="servings"
                type="number"
                min="1"
                value={form.servings}
                onChange={update}
                required
              />
            </label>
          </div>

          {/* COVER IMAGE */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px' }}>Recipe Main Cover Image</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'center' }}>
              <input
                name="image_url"
                type="url"
                value={form.image_url}
                onChange={update}
                placeholder="https://images.unsplash.com/... or paste image URL"
              />
              <label
                className="btn btn-outline"
                style={{
                  cursor: imageUploading ? 'not-allowed' : 'pointer',
                  margin: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                {imageUploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                <span>{imageUploading ? 'Uploading...' : 'Upload Cover'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  disabled={imageUploading}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {form.image_url && (
            <div className="recipe-image-preview" style={{ marginBottom: '1rem', borderRadius: '8px', overflow: 'hidden', maxHeight: '200px' }}>
              <img
                src={form.image_url}
                alt="Recipe preview"
                style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}

          {/* COOKING VIDEO UPLOAD SECTION */}
          <div className="add-video-card" style={{
            background: 'var(--card-subtle, rgba(234, 88, 12, 0.04))',
            border: '2px dashed var(--theme-primary, #ea580c)',
            borderRadius: '14px',
            padding: '1.25rem',
            margin: '0.5rem 0 1.25rem 0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.85rem' }}>
              <div style={{
                background: 'var(--theme-primary, #ea580c)',
                color: '#fff',
                padding: '9px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Film size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--ink)' }}>Cooking Video (Optional)</h4>
                <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--muted)' }}>
                  Upload a cooking video file (.mp4, .webm, .mov) or paste a YouTube / Vimeo URL.
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'center' }}>
              <input
                name="video_url"
                type="url"
                value={form.video_url || ''}
                onChange={update}
                placeholder="https://www.youtube.com/watch?v=... or upload video file"
              />

              <label
                className="btn btn-outline"
                style={{
                  cursor: videoUploading ? 'not-allowed' : 'pointer',
                  margin: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  fontWeight: 600
                }}
              >
                {videoUploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                <span>{videoUploading ? `Uploading ${uploadProgress}%...` : 'Upload Video'}</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/m4v,video/ogg,video/avi,video/*"
                  onChange={handleVideoFileUpload}
                  disabled={videoUploading}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {videoUploading && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ height: '7px', background: 'rgba(0,0,0,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${uploadProgress}%`,
                      background: 'var(--theme-primary, var(--green))',
                      transition: 'width 0.25s ease',
                      borderRadius: '10px'
                    }}
                  />
                </div>
                <small style={{ color: 'var(--muted)', fontSize: '0.78rem', display: 'block', marginTop: '5px' }}>
                  Uploading your cooking video... {uploadProgress}%
                </small>
              </div>
            )}

            {form.video_url && (
              <div style={{ marginTop: '1rem', background: 'var(--white)', borderRadius: '12px', padding: '12px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <small style={{ fontWeight: 700, color: 'var(--theme-primary, var(--green))', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Film size={14} /> Active Video Preview
                  </small>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, video_url: '' }));
                      setVideoSuccess('');
                      setVideoError('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  >
                    <X size={14} /> Remove Video
                  </button>
                </div>
                <VideoPlayer url={form.video_url} title={form.title || 'Cooking Video'} />
              </div>
            )}
          </div>

          {/* INGREDIENTS */}
          <label>
            Ingredients (one per line) *
            <textarea
              name="ingredients"
              value={form.ingredients}
              onChange={update}
              rows="5"
              required
              placeholder={'2 cups all-purpose flour\n4 medium potatoes boiled\n1 tsp cumin seeds\nSalt to taste'}
            />
          </label>

          {/* DYNAMIC PREPARATION STEPS WITH IMAGES */}
          <div className="preparation-steps-builder" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>
                  Preparation Steps &amp; Step Images *
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  Add step-by-step instructions with an illustrative photo for each step.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-outline"
                onClick={handleAddStep}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '8px 14px' }}
              >
                <Plus size={16} /> Add Step
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '16px 18px',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        background: '#ea580c',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center'
                      }}>
                        {idx + 1}
                      </span>
                      <strong style={{ color: '#1e293b', fontSize: '0.98rem' }}>
                        Step {idx + 1}
                      </strong>
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
                          fontSize: '0.82rem'
                        }}
                        title={`Remove Step ${idx + 1}`}
                      >
                        <Trash2 size={15} /> Remove Step
                      </button>
                    )}
                  </div>

                  {/* Step Instruction Field */}
                  <label style={{ display: 'block', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                      Instruction *
                    </span>
                    <textarea
                      rows={2}
                      required
                      value={step.instruction}
                      onChange={(e) => handleStepInstructionChange(idx, e.target.value)}
                      placeholder={`e.g. Boil and crumble the potatoes. Sauté spices in a pan...`}
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </label>

                  {/* Step Image Field */}
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Step Image (Optional)
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="url"
                        value={step.image_url}
                        onChange={(e) => handleStepImageUrlChange(idx, e.target.value)}
                        placeholder="https://... or paste image URL or upload below"
                      />

                      <label
                        className="btn btn-outline"
                        style={{
                          cursor: stepUploadingIdx === idx ? 'not-allowed' : 'pointer',
                          margin: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.82rem',
                          padding: '8px 12px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {stepUploadingIdx === idx ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <ImageIcon size={15} />
                        )}
                        <span>{stepUploadingIdx === idx ? 'Uploading...' : 'Upload Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleStepImageUpload(idx, e.target.files?.[0])}
                          disabled={stepUploadingIdx === idx}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>

                    {/* Step Image Live Preview */}
                    {step.image_url && (
                      <div style={{
                        marginTop: '10px',
                        position: 'relative',
                        display: 'inline-block',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: '1px solid #cbd5e1',
                        maxWidth: '240px'
                      }}>
                        <img
                          src={step.image_url}
                          alt={`Step ${idx + 1} preview`}
                          style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <button
                          type="button"
                          onClick={() => handleStepImageUrlChange(idx, '')}
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            background: 'rgba(0,0,0,0.65)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'grid',
                            placeItems: 'center',
                            cursor: 'pointer'
                          }}
                          title="Remove image"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={handleAddStep}
              style={{
                marginTop: '12px',
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderStyle: 'dashed'
              }}
            >
              <Plus size={16} /> Add Preparation Step {steps.length + 1}
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={manualLoading || imageUploading || videoUploading || stepUploadingIdx !== null}
            style={{ marginTop: '1.5rem', padding: '14px' }}
          >
            {manualLoading ? 'Publishing Recipe...' : 'Publish Recipe'}
          </button>
        </form>
      </div>
    </section>
  );
}
