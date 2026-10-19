
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ChefHat, LogOut, PlusCircle, ShieldCheck, Heart, Sparkles, Menu, X, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { favorites } = useFavorites();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const favCount = favorites?.length || 0;

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="navbar-wrapper">
      <div className="navbar container">
        <Link to={user?.role === 'admin' ? '/admin' : '/'} className="brand" onClick={closeMenu}>
          <ChefHat size={24} className="brand-chef-icon" />
          <span className="brand-title">RecipeNest</span>
        </Link>

        {/* Mobile menu button */}
        <button
          className="mobile-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Nav links */}
        <nav className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {user && user.role === 'admin' ? (
            <>
              <NavLink to="/admin" onClick={closeMenu} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                <ShieldCheck size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: '-2px' }} />
                Admin Dashboard
              </NavLink>
              <NavLink to="/add-recipe" onClick={closeMenu} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                <PlusCircle size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: '-2px' }} />
                Add Recipe
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/" onClick={closeMenu} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} end>
                Home
              </NavLink>
              <NavLink to="/recipes" onClick={closeMenu} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                Recipes
              </NavLink>
              <NavLink to="/recommendations" onClick={closeMenu} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                Recommended
              </NavLink>

              {user && (
                <>
                  <NavLink to="/favorites" onClick={closeMenu} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                    Favorites {favCount > 0 && <span className="nav-badge-pill">{favCount}</span>}
                  </NavLink>
                  <NavLink to="/add-recipe" onClick={closeMenu} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                    Add Recipe
                  </NavLink>
                  <NavLink to="/profile" onClick={closeMenu} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                    Profile
                  </NavLink>
                </>
              )}
            </>
          )}

          {/* Right actions */}
          <div className="nav-actions-right">
            <ThemeToggle initialOpen={false} />

            {!user ? (
              <div className="nav-auth-btns">
                <NavLink to="/login" onClick={closeMenu} className="btn btn-ghost btn-sm">
                  Log in
                </NavLink>
                <Link to="/register" onClick={closeMenu} className="btn btn-primary btn-sm">
                  Sign up
                </Link>
              </div>
            ) : (
              <button
                className="btn btn-outline btn-sm"
                onClick={handleLogout}
              >
                Log out
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}


