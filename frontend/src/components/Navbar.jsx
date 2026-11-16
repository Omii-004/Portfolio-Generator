import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Briefcase, User, Settings, LogOut, Sun, Moon, LogIn, ChevronRight, PlusCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { API } from '../api';

const STEPS = [
  { path: '/upload', label: 'Upload' },
  { path: '/review', label: 'Review' },
  { path: '/preview', label: 'Preview' },
];

export default function Navbar() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { isAuthenticated, token, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isLanding = location.pathname === '/';

  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const menuRef = useRef(null);

  // Load account details
  useEffect(() => {
    if (!isAuthenticated) {
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

  // Close menu on route change, click outside, or Escape
  useEffect(() => {
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

  // Determine current active workflow step
  const isWorkflow = ['/upload', '/review', '/preview'].some((p) => location.pathname.startsWith(p));
  const activeStepIdx = STEPS.findIndex((s) => location.pathname.startsWith(s.path));

  return (
    <nav className="fixed inset-x-0 top-3 z-50 px-4">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-4 rounded-full border border-mauve/25 bg-beige/95 px-4 shadow-[0_8px_24px_-8px_rgba(93,73,84,0.25)] backdrop-blur-xl transition-colors duration-300 dark:border-mauve/35 dark:bg-plum/95 dark:shadow-black/40 sm:px-5">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <Briefcase className="h-5 w-5 text-rose transition-transform duration-300 group-hover:-translate-y-0.5" aria-hidden="true" />
          <span className="font-display text-base sm:text-lg font-bold tracking-tight text-plum dark:text-coral">
            PortfoliAI
          </span>
        </Link>

        {/* Dynamic Process Stepper (Updates as user navigates through workflow) */}
        {isAuthenticated && !isLanding && (
          <div className="flex items-center justify-center">
            {isWorkflow ? (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-coral/50 dark:bg-black/20 py-1 px-3 rounded-full border border-mauve/15">
                {STEPS.map((step, idx) => {
                  const isActive = idx === activeStepIdx;
                  const isDone = activeStepIdx > idx;

                  return (
                    <div key={step.path} className="flex items-center gap-1.5 sm:gap-2">
                      <span
                        className={`text-xs font-semibold tracking-wide transition-colors ${
                          isActive
                            ? 'text-rose font-bold'
                            : isDone
                            ? 'text-plum/80 dark:text-coral/80'
                            : 'text-mauve/50 dark:text-mauve/50'
                        }`}
                      >
                        <span className="opacity-70 mr-0.5">{idx + 1}.</span> {step.label}
                      </span>
                      {idx < STEPS.length - 1 && (
                        <ChevronRight className="h-3 w-3 text-mauve/40" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* When on Profile or other pages, show quick Create action */
              <Link
                to="/upload"
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose hover:text-plum dark:hover:text-coral transition-colors py-1.5 px-3 rounded-full hover:bg-coral/40"
              >
                <PlusCircle className="h-4 w-4" />
                <span>New Portfolio</span>
              </Link>
            )}
          </div>
        )}

        {/* Right side: Theme toggle and User menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="p-2 rounded-full text-mauve dark:text-mauve hover:bg-coral/70 dark:hover:bg-white/10 hover:text-plum dark:hover:text-coral transition-colors cursor-pointer"
          >
            {isDarkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="Account menu"
                className="p-2 rounded-full text-mauve dark:text-mauve hover:bg-coral/70 dark:hover:bg-white/10 hover:text-plum dark:hover:text-coral transition-colors cursor-pointer"
              >
                <User className="h-5 w-5" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="animate-pop-in absolute right-0 mt-3 w-64 origin-top-right rounded-2xl border border-coral/70 dark:border-mauve/30 bg-coral/95 dark:bg-plum/95 backdrop-blur-2xl shadow-xl p-2 z-50"
                >
                  <div className="px-3.5 py-2.5 border-b border-mauve/15 dark:border-mauve/30">
                    <p className="font-display text-sm font-semibold text-plum dark:text-coral truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-mauve truncate">
                      {profile?.email || 'Signed in'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-plum dark:text-coral hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-mauve" />
                    My Portfolios &amp; Settings
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-rose hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4 text-rose/80" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 rounded-full bg-rose px-3.5 py-1.5 text-xs font-semibold text-coral hover:bg-plum transition-colors shadow-sm"
            >
              <LogIn className="h-3.5 w-3.5" />
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}