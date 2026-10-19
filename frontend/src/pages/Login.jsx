import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ChefHat,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  KeyRound,
  X,
  Heart,
  User,
  Settings,
  ShieldCheck,
  Send,
  Search,
  BookOpen,
  PlusCircle,
  Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  auth,
  googleProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  isFirebaseLive,
  getFirebaseConfig,
  saveFirebaseConfig,
} from '../config/firebase';
import {
  requestFirebasePasswordReset,
  requestPasswordReset,
  completePasswordReset,
} from '../services/authService';
import woodTableBg from '../assets/woodTableBg.png';

export default function Login() {
  const { login, loginGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(
    location.state?.message || ''
  );
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState('request'); // 'request' | 'firebase_success' | 'reset'
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState({ type: '', text: '' });
  const [emailSent, setEmailSent] = useState(false);

  // Firebase configuration modal state
  const [showFirebaseConfig, setShowFirebaseConfig] = useState(false);
  const [fbConfigInput, setFbConfigInput] = useState(() => {
    const cfg = getFirebaseConfig();
    return {
      apiKey: cfg.apiKey || '',
      authDomain: cfg.authDomain || '',
      projectId: cfg.projectId || '',
      appId: cfg.appId || '',
    };
  });
  const [fbConfigStatus, setFbConfigStatus] = useState('');


  // Google Account Selector modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [googleCustomName, setGoogleCustomName] = useState('');

  const [toastMessage, setToastMessage] = useState('');
  useEffect(() => {
    const savedEmail = localStorage.getItem('recipe_nest_saved_email');
    if (savedEmail) {
      setForm((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleRememberMeChange = (e) => {
    const checked = e.target.checked;
    setRememberMe(checked);
    if (!checked) {
      localStorage.removeItem('recipe_nest_saved_email');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const loggedUser = await login(form);
      if (rememberMe && form.email) {
        localStorage.setItem('recipe_nest_saved_email', form.email);
      }
      if (loggedUser?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Google Login via Firebase
  const handleGoogleLogin = async () => {
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

        showToast('Signed in with Google successfully!');
        navigate('/');
      } else {
        const candidateEmail = form.email && form.email.includes('@')
          ? form.email
          : 'google.chef@recipenest.com';
        const candidateName = candidateEmail.split('@')[0].replace('.', ' ');

        setGoogleCustomEmail(candidateEmail);
        setGoogleCustomName(candidateName);
        setShowGoogleModal(true);
      }
    } catch (err) {
      console.error('Google Sign-In Error:', err);
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
      showToast(`Signed in with Google as ${emailToUse}!`);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
      setShowGoogleModal(false);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSaveFirebaseConfig = async (e) => {
    e?.preventDefault();
    if (!fbConfigInput.apiKey?.trim()) {
      setFbConfigStatus('Please enter a valid Firebase API Key.');
      return;
    }

    try {
      await saveFirebaseConfig({
        apiKey: fbConfigInput.apiKey.trim(),
        authDomain: fbConfigInput.authDomain?.trim() || '',
        projectId: fbConfigInput.projectId?.trim() || '',
        appId: fbConfigInput.appId?.trim() || '',
      });
      setFbConfigStatus('✅ Firebase credentials saved! Ready to send reset emails.');
      setTimeout(() => setFbConfigStatus(''), 4000);
    } catch (err) {
      setFbConfigStatus('Failed to save config: ' + err.message);
    }
  };

  // Password Reset handler exclusively using Firebase Authentication
  const handleForgotSubmit = async (e) => {
    e?.preventDefault();
    if (!forgotEmail || !forgotEmail.trim()) {
      setForgotMsg({ type: 'error', text: 'Please enter your email address.' });
      return;
    }

    const cleanEmail = forgotEmail.trim().toLowerCase();
    setForgotLoading(true);
    setForgotMsg({ type: '', text: '' });

    try {
      await requestFirebasePasswordReset(cleanEmail);

      setForgotMsg({
        type: 'success',
        text: `A secure password reset link has been sent to ${cleanEmail} via Firebase!`,
      });
      setForgotStep('firebase_success');
    } catch (fbErr) {
      console.error('Firebase password reset error:', fbErr.code, fbErr.message);

      let msg = fbErr.message || 'Could not send reset email via Firebase. Please try again.';
      if (fbErr.code === 'auth/user-not-found') {
        msg = `No account found for ${cleanEmail} in Firebase Authentication. Please check your email or create an account.`;
      } else if (fbErr.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (fbErr.code === 'auth/too-many-requests') {
        msg = 'Too many requests. Please wait a few moments before trying again.';
      } else if (fbErr.code === 'auth/network-request-failed') {
        msg = 'Network connection error. Please check your internet connection.';
      }

      setForgotMsg({
        type: 'error',
        text: msg,
      });
    } finally {
      setForgotLoading(false);
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
      {toastMessage && (
        <div className="table-toast">
          <Sparkles size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
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
            <p>Select or confirm your Google account to log in to RecipeNest.</p>

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
                {googleLoading ? 'Signing in...' : `Continue as ${googleCustomName || 'Google User'}`}
              </button>
            </form>
          </div>
        </div>
      )}
      {showForgotModal && (
        <div className="table-modal-backdrop" onClick={() => setShowForgotModal(false)}>
          <div className="table-modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              className="table-modal-close"
              onClick={() => {
                setShowForgotModal(false);
                setForgotStep('request');
                setForgotMsg({ type: '', text: '' });
              }}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div className="table-modal-icon">
              {forgotStep === 'firebase_success' ? (
                <ShieldCheck size={28} color="#16a34a" />
              ) : (
                <Mail size={26} />
              )}
            </div>

            <h3>
              {forgotStep === 'firebase_success'
                ? 'Check Your Email'
                : 'Reset Password via Firebase'}
            </h3>
            <p>
              {forgotStep === 'firebase_success'
                ? `A password reset link was sent via Firebase Authentication.`
                : 'Enter your registered email address to receive a password reset link in your mail.'}
            </p>

            {forgotMsg.text && (
              <div className={`table-modal-alert ${forgotMsg.type}`}>
                {forgotMsg.type === 'success' ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{forgotMsg.text}</span>
              </div>
            )}

            {forgotStep === 'firebase_success' ? (
              <div style={{ textAlign: 'center', paddingTop: '6px' }}>
                <p style={{
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  color: '#475569',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '18px',
                  textAlign: 'left'
                }}>
                  📧 <strong>What to do next:</strong>
                  <br />
                  1. Open your email inbox for <strong>{forgotEmail}</strong>.
                  <br />
                  2. Check your <strong>Spam</strong> or <strong>Promotions</strong> folder if not visible.
                  <br />
                  3. Click the secure link in the email to set your new password.
                </p>

                <button
                  type="button"
                  className="table-primary-btn"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotStep('request');
                    setForm((prev) => ({ ...prev, email: forgotEmail }));
                    showToast(`Check your inbox at ${forgotEmail}!`);
                  }}
                >
                  <span>Back to Login</span>
                  <ArrowRight size={18} />
                </button>

                <div style={{ marginTop: '12px' }}>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ea580c',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline'
                    }}
                    onClick={() => {
                      setForgotStep('request');
                      setForgotMsg({ type: '', text: '' });
                    }}
                  >
                    Send to a different email address
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="table-modal-form">
                <div className="table-input-group">
                  <Mail className="table-input-icon" size={18} />
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="table-primary-btn"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <span>Sending Reset Email...</span>
                  ) : (
                    <>
                      <span>Send Firebase Reset Link</span>
                      <Send size={16} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      <header className="table-top-header">
        <Link to="/" className="table-back-btn">
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
      </header>
      <div className="login-split-layout">
        <div className="login-unified-card">
          {/* Left Side: RecipeNest Project Title, Description, and How to Use */}
          <div className="login-intro-panel">
            <div>

              <div className="login-brand-header">
                <div className="login-brand-icon">
                  <ChefHat size={30} />
                </div>
                <div>
                  <h1 className="login-brand-title">RecipeNest</h1>
                  <p className="login-brand-subtitle">Smart Recipe Platform & Cooking Hub</p>
                </div>
              </div>

              <p className="login-project-description">
                RecipeNest is your modern digital cookbook and culinary community. Explore authentic global dishes, master recipes with video tutorials, scale ingredients, and share your favorite creations.
              </p>

              <div className="login-how-to-use-section">
                <div className="login-how-to-title">
                  <span>How to Use RecipeNest</span>
                  <span className="login-step-count">4 Simple Steps</span>
                </div>

                <div className="login-steps-list">
                  {/* Step 1 */}
                  <div className="login-step-card">
                    <div className="login-step-number">1</div>
                    <div className="login-step-content">
                      <h4>
                        <Search size={14} style={{ color: 'var(--primary, #10b981)' }} />
                        Explore & Filter Recipes
                      </h4>
                      <p>
                        Filter through recipes by cuisine, meal type, prep time, or ingredients with video guides.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="login-step-card">
                    <div className="login-step-number">2</div>
                    <div className="login-step-content">
                      <h4>
                        <BookOpen size={14} style={{ color: 'var(--primary, #10b981)' }} />
                        Interactive Cooking & Servings
                      </h4>
                      <p>
                        Follow step-by-step instructions with dynamic serving calculators.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="login-step-card">
                    <div className="login-step-number">3</div>
                    <div className="login-step-content">
                      <h4>
                        <Heart size={14} style={{ color: 'var(--primary, #10b981)' }} />
                        Save Favorites & Review Dishes
                      </h4>
                      <p>
                        Bookmark dishes to your personal cookbook and exchange reviews with home cooks.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="login-step-card">
                    <div className="login-step-number">4</div>
                    <div className="login-step-content">
                      <h4>
                        <PlusCircle size={14} style={{ color: 'var(--primary, #10b981)' }} />
                        Create & Share Your Recipes
                      </h4>
                      <p>
                        Publish your signature recipes with ingredients, preparation steps, and food photos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right side form card: Sign In Section attached at the same level */}
          <div className="login-signin-panel">
            <div className="table-card-top-line" />

            <div className="table-card-header">
              <div className="table-chef-badge">
                <ChefHat size={28} />
              </div>
              <h2>Sign in to your account</h2>
              <p>Welcome back! Enter your details to continue cooking.</p>
            </div>

            {error && (
              <div className="table-alert error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="table-alert success">
                <CheckCircle2 size={16} />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="table-form-stack">
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
                <div className="table-field-top">
                  <label htmlFor="password">Password</label>
                  <button
                    type="button"
                    className="table-forgot-link"
                    onClick={() => {
                      setForgotEmail(form.email || '');
                      setShowForgotModal(true);
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="table-input-group">
                  <Lock className="table-input-icon" size={18} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
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
              </div>

              <div className="table-extras-row">
                <label className="table-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={handleRememberMeChange}
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                className="table-primary-btn"
                disabled={loading}
              >
                {loading ? (
                  <span>Logging in...</span>
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="table-divider">
              <span>or sign in with</span>
            </div>

            {/* Google Authentication with Firebase */}
            <button
              type="button"
              className="table-google-btn"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
            >
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
              <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>

            <div className="table-card-footer">
              <span>Don't have an account?</span>{' '}
              <Link to="/register" className="table-switch-link">
                Register
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
