import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChefHat,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Heart,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  auth,
  googleProvider,
  signInWithPopup,
  isFirebaseLive,
} from '../config/firebase';
import woodTableBg from '../assets/woodTableBg.png';

export default function Register() {
  const { register, loginGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Google modal for development if custom Firebase keys aren't in .env
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [googleCustomName, setGoogleCustomName] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      await register(form);
      navigate('/login', {
        state: { message: '🎉 Account created! Please log in to start exploring.' },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Registration failed. Please check your information.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Google Signup/Login via Firebase (or streamlined account selection)
  const handleGoogleSignup = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      if (isFirebaseLive()) {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        await loginGoogle({
          email: user.email,
          name: user.displayName || 'Google User',
          google_id: user.uid,
        });

        showToast('Signed up with Google successfully!');
        navigate('/');
      } else {
        // Open Google account selector modal pre-filled with whatever they entered
        const candidateEmail = form.email && form.email.includes('@')
          ? form.email
          : 'google.chef@recipenest.com';
        const candidateName = form.name.trim() || candidateEmail.split('@')[0].replace('.', ' ');

        setGoogleCustomEmail(candidateEmail);
        setGoogleCustomName(candidateName);
        setShowGoogleModal(true);
      }
    } catch (err) {
      console.error('Google auth error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed.');
      } else {
        setError(
          err.response?.data?.message ||
          err.message ||
          'Google authentication could not be completed.'
        );
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleConfirmGoogleAuth = async (e) => {
    e?.preventDefault();
    setGoogleLoading(true);
    try {
      const emailToUse = googleCustomEmail.trim() || 'google.user@recipenest.com';
      const nameToUse = googleCustomName.trim() || 'Google User';

      await loginGoogle({
        email: emailToUse,
        name: nameToUse,
        google_id: 'google_account_' + Date.now(),
      });

      setShowGoogleModal(false);
      showToast(`Signed up with Google as ${emailToUse}!`);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Google signup failed. Please try again.');
      setShowGoogleModal(false);
    } finally {
      setGoogleLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  return (
    <div
      className="table-layout-wrapper"
      style={{
        backgroundImage: `url(${woodTableBg})`,
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="table-toast">
          <Sparkles size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Google Account Selector Modal (active in local dev) */}
      {showGoogleModal && (
        <div className="table-modal-backdrop" onClick={() => setShowGoogleModal(false)}>
          <div className="table-modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              className="table-modal-close"
              onClick={() => setShowGoogleModal(false)}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div className="table-modal-icon">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>

            <h3>Continue with Google</h3>
            <p>Select or confirm your Google account to create your account.</p>

            <form onSubmit={handleConfirmGoogleAuth} className="table-modal-form">
              <div className="table-input-group">
                <User className="table-input-icon" size={18} />
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={googleCustomName}
                  onChange={(e) => setGoogleCustomName(e.target.value)}
                />
              </div>

              <div className="table-input-group">
                <Mail className="table-input-icon" size={18} />
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={googleCustomEmail}
                  onChange={(e) => setGoogleCustomEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="table-primary-btn"
                disabled={googleLoading}
              >
                {googleLoading ? 'Creating account...' : `Continue as ${googleCustomName || 'Google User'}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="table-top-header">
        <Link to="/" className="table-back-btn">
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Content Area: Left side showcases food platter, Right side houses the form */}
      <div className="table-content-split">
        {/* Transparent left spacing area to showcase the wooden food platter */}
        <div className="table-showcase-spacer" />

        {/* Right side form card filling the empty wood table space */}
        <div className="table-form-container">
          <div className="table-auth-card">
            <div className="table-card-top-line" />

            <div className="table-card-header">
              <div className="table-chef-badge">
                <ChefHat size={28} />
              </div>
              <h2>Create an account</h2>
              <p>Join RecipeNest to save and share your favorite recipes.</p>
            </div>

            {error && (
              <div className="table-alert error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="table-form-stack">
              <div className="table-field">
                <label htmlFor="name">Full Name</label>
                <div className="table-input-group">
                  <User className="table-input-icon" size={18} />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Kavya Nakka"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="table-field">
                <label htmlFor="email">Email Address</label>
                <div className="table-input-group">
                  <Mail className="table-input-icon" size={18} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="table-field">
                <label htmlFor="password">Password</label>
                <div className="table-input-group">
                  <Lock className="table-input-icon" size={18} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={form.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="table-eye-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="table-password-hint">
                  <CheckCircle2 size={13} /> Minimum 8 characters
                </div>
              </div>

              <div className="table-terms-note">
                By joining, you agree to our{' '}
                <a
                  href="#terms"
                  onClick={(e) => {
                    e.preventDefault();
                    showToast('Terms of Service: Respectful community cooking!');
                  }}
                >
                  Terms
                </a>{' '}
                and{' '}
                <a
                  href="#privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    showToast('Privacy Policy: Your data is always secure.');
                  }}
                >
                  Privacy Policy
                </a>.
              </div>

              <button
                type="submit"
                className="table-primary-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="table-spinner-wrap">
                    <span className="table-spinner" />
                    <span>Creating account...</span>
                  </span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={18} className="btn-arrow" />
                  </>
                )}
              </button>
            </form>

            <div className="table-divider">
              <span>or continue with</span>
            </div>

            <button
              type="button"
              className="table-social-btn table-google-btn"
              onClick={handleGoogleSignup}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <span className="table-spinner" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            <div className="table-card-footer">
              <span>Already have an account?</span>{' '}
              <Link to="/login" className="table-footer-link">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>

      <footer className="table-bottom-tagline">
        <Heart size={14} className="heart-icon" />
        <span>Crafted with love for home cooks • RecipeNest 2026</span>
      </footer>
    </div>
  );
}
