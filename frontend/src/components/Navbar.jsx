import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? 'text-emerald-400 bg-emerald-500/10'
        : 'text-slate-300 hover:text-emerald-400 hover:bg-slate-700/50'
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🍃</span>
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent group-hover:from-emerald-300 group-hover:to-amber-300 transition-all">
              LeafScan
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className={navLinkClass('/')}>Home</Link>

            {isAuthenticated && (
              <>
                <Link to="/upload" className={navLinkClass('/upload')}>Upload</Link>
                <Link to="/history" className={navLinkClass('/history')}>History</Link>
                <Link to="/settings" className={navLinkClass('/settings')}>Settings</Link>
              </>
            )}

            {isAdmin && (
              <Link to="/admin" className={navLinkClass('/admin')}>
                <span className="flex items-center gap-1">
                  ⚙️ Admin
                </span>
              </Link>
            )}
          </div>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 mr-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-700/50 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {isAuthenticated ? (
              <>
                <Link to="/settings" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
                  Hi, <span className="text-emerald-400 font-medium">{user?.username}</span>
                </Link>
                <button onClick={handleLogout} className="btn btn-secondary text-sm py-1.5 px-4">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary text-sm py-1.5 px-4">
                  Login
                </Link>
                <Link to="/signup" className="btn btn-primary text-sm py-1.5 px-4">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-xl animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className={`block ${navLinkClass('/')}`}>Home</Link>

            {isAuthenticated && (
              <>
                <Link to="/upload" onClick={() => setMobileMenuOpen(false)} className={`block ${navLinkClass('/upload')}`}>Upload</Link>
                <Link to="/history" onClick={() => setMobileMenuOpen(false)} className={`block ${navLinkClass('/history')}`}>History</Link>
                <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className={`block ${navLinkClass('/settings')}`}>⚙️ Settings</Link>
              </>
            )}

            {isAdmin && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className={`block ${navLinkClass('/admin')}`}>⚙️ Admin</Link>
            )}

            <hr className="border-slate-700/50 my-2" />

            <button 
              onClick={() => {
                setTheme(theme === 'dark' ? 'light' : 'dark');
                setMobileMenuOpen(false);
              }} 
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 transition-colors flex justify-between items-center"
            >
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
            </button>

            {isAuthenticated ? (
              <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50">Login</Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-emerald-400 hover:bg-emerald-500/10">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
