import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Briefcase, User, Settings, LogOut, Sun, Moon, LogIn } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { API } from '../api';

export default function Navbar() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { isAuthenticated, token, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isLanding = location.pathname === '/';

  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const menuRef = useRef(null);

  // Load the real account details so the avatar + dropdown aren't anonymous.
  useEffect(() => {
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile(null);
      return;
    }
    axios
      .get(`${API}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null));
  }, [isAuthenticated, token]);

  // Close the menu on route change, click outside, or Escape.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/');
  };

  if (['/login', '/signup'].includes(location.pathname)) return null;

  const displayName = profile?.full_name || 'My account';

  return (
    <nav className="fixed inset-x-0 top-4 z-50 px-4">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-4 rounded-[999px] border border-mauve/20 bg-beige/85 px-4 shadow-[0_10px_30px_-10px_rgba(93,73,84,0.35)] backdrop-blur-xl transition-colors duration-300 dark:border-mauve/30 dark:bg-plum/85 dark:shadow-black/40 sm:px-5">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <Briefcase className="h-5 w-5 text-rose transition-transform duration-300 group-hover:-translate-y-0.5" aria-hidden="true" />
            <span className="font-display text-lg font-bold tracking-tight text-plum dark:text-coral">
              PortfoliAI
            </span>
          </Link>

          {/* Primary destination for logged-in users */}
          {isAuthenticated && !isLanding && (
            <div className="flex items-center lg:absolute lg:left-1/2 lg:-translate-x-1/2">
              <Link
                to="/upload"
                className={`relative text-sm font-medium transition-colors py-2 cursor-pointer ${
                  location.pathname === '/upload'
                    ? 'text-rose'
                    : 'text-mauve dark:text-mauve hover:text-plum dark:hover:text-coral'
                }`}
              >
                Create
                <span
                  aria-hidden="true"
                  className={`absolute left-0 -bottom-px h-0.5 rounded-full bg-rose transition-all duration-300 ${
                    location.pathname === '/upload' ? 'w-full' : 'w-0'
                  }`}
                />
              </Link>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="p-2.5 rounded-[999px] text-mauve dark:text-mauve hover:bg-coral/70 dark:hover:bg-white/10 hover:text-plum dark:hover:text-coral transition-colors cursor-pointer touch-manipulation focus-visible:ring-2 focus-visible:ring-rose"
            >
              {isDarkMode ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
            </button>

            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  aria-label="Account menu"
                  className="p-2.5 rounded-[999px] text-mauve dark:text-mauve hover:bg-coral/70 dark:hover:bg-white/10 hover:text-plum dark:hover:text-coral transition-colors cursor-pointer touch-manipulation focus-visible:ring-2 focus-visible:ring-rose"
                >
                  <User className="h-5 w-5" aria-hidden="true" />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    aria-label="Account"
                    className="animate-pop-in absolute right-0 mt-3 w-72 origin-top-right rounded-2xl border border-coral/70 dark:border-mauve/30 bg-coral/90 dark:bg-plum/90 backdrop-blur-2xl shadow-2xl shadow-plum/15 dark:shadow-black/40 p-2"
                  >
                    <div className="px-4 py-3 border-b border-mauve/15 dark:border-mauve/40">
                      <p className="font-display text-sm font-semibold text-plum dark:text-coral truncate">
                        {displayName}
                      </p>
                      <p className="mt-0.5 text-sm text-mauve dark:text-mauve truncate">
                        {profile?.email || 'Signed in'}
                      </p>
                    </div>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full flex items-center gap-3 rounded-[999px] px-4 py-2.5 text-sm font-medium text-plum dark:text-coral hover:bg-white/70 dark:hover:bg-white/10 transition-colors cursor-pointer touch-manipulation"
                    >
                      <Settings className="h-4 w-4 text-mauve" aria-hidden="true" />
                      Settings
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-rose dark:text-rose hover:bg-white/70 dark:hover:bg-white/10 transition-colors cursor-pointer touch-manipulation"
                    >
                      <LogOut className="h-4 w-4 text-rose/80" aria-hidden="true" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-[999px] bg-rose px-4 py-2 text-sm font-semibold text-coral hover:bg-plum transition-colors shadow-lg shadow-rose/25 cursor-pointer touch-manipulation"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Login
              </Link>
            )}
        </div>
      </div>
    </nav>
  );
}
