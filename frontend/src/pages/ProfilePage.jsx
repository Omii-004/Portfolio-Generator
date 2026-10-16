import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API } from '../api';
import {
  AtSign, Mail, KeyRound, ShieldAlert, LogOut, LayoutTemplate,
  CalendarDays, Loader2, Plus, Trash2, X
} from 'lucide-react';

const THEME_LABEL = {
  minimalist: 'Minimalist',
  professional: 'Professional',
  creative: 'Creative',
  core: 'NEURAL//CORE',
  lotus: 'LOTUS//BLOOM',
  sakura: 'SAKURA//FLOW',
  latent: 'LATENT//SPACE',
  nova: 'NOVA//SPACE',
};

const THEME_COVER = {
  minimalist: 'from-slate-600 to-slate-900',
  professional: 'from-blue-600 to-indigo-800',
  creative: 'from-orange-400 via-pink-500 to-rose-600',
  core: 'from-violet-700 to-fuchsia-900',
  lotus: 'from-rose-200 via-rose-300 to-rose-500',
  sakura: 'from-rose-100 via-pink-200 to-rose-300',
  latent: 'from-violet-900 via-slate-900 to-slate-950',
  nova: 'from-teal-700 via-slate-900 to-slate-950',
};

const inputClass = (invalid) =>
  `w-full p-3 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
    invalid ? 'border-red-400 dark:border-red-500/60' : 'border-slate-300 dark:border-white/15'
  }`;

const formatDate = (s) => {
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
};

function SheetRow({ id, label, error, children }) {
  return (
    <div className="grid gap-3 py-6 first:pt-0 last:pb-0">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <div>
        {children}
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600 dark:text-red-400 min-h-[1.25rem]" aria-live="polite">
          {error || ''}
        </p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('portfolios');
  const [profile, setProfile] = useState({ email: '', full_name: '', username: '', bio: '' });
  const [portfolios, setPortfolios] = useState([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingPw, setUpdatingPw] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile({
        email: res.data.email || '',
        full_name: res.data.full_name || '',
        username: res.data.username || '',
        bio: res.data.bio || '',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolios = async () => {
    try {
      const res = await axios.get(`${API}/api/portfolio/my-portfolios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPortfolios(res.data.portfolios || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile();
    fetchPortfolios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!deleteOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setDeleteOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [deleteOpen]);

  // Reset the inline "Confirm delete?" state if the user walks away.
  useEffect(() => {
    if (!confirmDeleteId) return;
    const timer = setTimeout(() => setConfirmDeleteId(null), 4000);
    return () => clearTimeout(timer);
  }, [confirmDeleteId]);

  const clearFeedback = () => {
    setFormError('');
    setFormSuccess('');
  };

  const validateProfile = () => {
    const errors = {};
    if (!profile.full_name.trim()) errors.full_name = 'Enter your full name.';
    if (!profile.username.trim()) errors.username = 'Enter a username.';
    else if (/\s/.test(profile.username)) errors.username = 'Usernames can’t contain spaces.';
    return errors;
  };

  const validatePassword = () => {
    const errors = {};
    if (!currentPassword) errors.currentPassword = 'Enter your current password.';
    if (!newPassword) errors.newPassword = 'Enter a new password.';
    else if (newPassword.length < 8) errors.newPassword = 'Use at least 8 characters.';
    return errors;
  };

  const focusFirstError = (errors) => {
    const first = ['full_name', 'username', 'currentPassword', 'newPassword'].find((k) => errors[k]);
    if (first) document.getElementById(first)?.focus();
  };

  const handleFieldBlur = (field) => {
    const errors = field === 'currentPassword' || field === 'newPassword' ? validatePassword() : validateProfile();
    setFieldErrors((prev) => ({ ...prev, [field]: errors[field] }));
  };

  const handleSaveProfile = async () => {
    clearFeedback();
    const errors = validateProfile();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      focusFirstError(errors);
      return;
    }
    setSaving(true);
    try {
      await axios.put(`${API}/api/users/me`, profile, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFieldErrors({});
      setFormSuccess('Changes saved.');
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Couldn’t save changes. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    clearFeedback();
    const errors = validatePassword();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      focusFirstError(errors);
      return;
    }
    setUpdatingPw(true);
    try {
      await axios.put(
        `${API}/api/users/password`,
        { current_password: currentPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setFieldErrors({});
      setCurrentPassword('');
      setNewPassword('');
      setFormSuccess('Password updated.');
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Couldn’t update your password.');
    } finally {
      setUpdatingPw(false);
    }
  };

  const handleDeletePortfolio = async (id) => {
  setDeletingId(id);
  try {
    await axios.delete(`${API}/api/portfolio/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setPortfolios((prev) => prev.filter((p) => p.id !== id));
    setConfirmDeleteId(null);
    clearFeedback();
    setFormSuccess('Portfolio deleted.');
  } catch (err) {
    setFormError(err.response?.data?.detail || 'Couldn’t delete this portfolio.');
    setConfirmDeleteId(null);
  } finally {
    setDeletingId(null);
  }
};

const handlePortfolioDeleteClick = (id) => {
  if (confirmDeleteId !== id) {
    setConfirmDeleteId(id);
    return;
  }
  handleDeletePortfolio(id);
};

const handleDeleteAccount = async () => {
  clearFeedback();
  setDeleting(true);
    try {
      await axios.delete(`${API}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      logout();
      navigate('/');
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Couldn’t delete your account.');
      setDeleting(false);
    }
  };

  const handleTabKeyDown = (e) => {
    const ids = tabs.map((t) => t.id);
    const idx = ids.indexOf(activeTab);
    let next;
    if (e.key === 'ArrowRight') next = (idx + 1) % ids.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + ids.length) % ids.length;
    if (next === undefined) return;
    e.preventDefault();
    clearFeedback();
    setActiveTab(ids[next]);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full animate-pulse">
        <div className="h-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="mt-6 h-10 w-72 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="h-64 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-64 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  const initial = (profile.full_name || profile.email || '?').charAt(0).toUpperCase();
  const name = profile.full_name || 'Anonymous';
  const themeCount = new Set(portfolios.map((p) => p.theme).filter(Boolean)).size;

  const tabs = [
    { id: 'portfolios', label: 'Portfolios', icon: LayoutTemplate },
    { id: 'profile', label: 'Profile', icon: AtSign },
    { id: 'security', label: 'Security', icon: KeyRound },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">

      {/* Studio banner */}
      <header className="animate-fade-up rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div
            aria-hidden="true"
            className="h-16 w-16 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-display text-3xl font-bold shadow-lg shadow-indigo-600/25"
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white break-words">
              {name}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 break-all">
              <span>{profile.email}</span>
              {profile.username && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300">@{profile.username}</span>
                </>
              )}
            </p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-500" aria-hidden="true" />
              Active today
            </p>
          </div>
          <div className="flex items-center gap-3 sm:flex-col sm:items-end">
            <div className="flex gap-2">
              <span className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 text-sm font-semibold text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                {portfolios.length} {portfolios.length === 1 ? 'portfolio' : 'portfolios'}
              </span>
              {themeCount > 0 && (
                <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {themeCount} {themeCount === 1 ? 'theme' : 'themes'}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-white/15 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-500/50 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors cursor-pointer touch-manipulation focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
            </button>
          </div>
        </div>

        {/* Segmented tab control */}
        <div
          role="tablist"
          aria-label="Profile sections"
          className="mt-7 flex flex-wrap gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 w-fit max-w-full"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={active}
                aria-controls={`panel-${tab.id}`}
                onClick={() => {
                  clearFeedback();
                  setActiveTab(tab.id);
                }}
                onKeyDown={handleTabKeyDown}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  active
                    ? 'bg-white dark:bg-gray-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      <div
        key={activeTab}
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="mt-6 animate-scale-in"
      >
        {(formError || formSuccess) && (
          <div
            role={formError ? 'alert' : 'status'}
            className={`mb-6 px-4 py-3 rounded-lg border text-sm font-semibold ${
              formError
                ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400'
                : 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400'
            }`}
          >
            {formError || formSuccess}
          </div>
        )}

        {activeTab === 'portfolios' && (
          <section className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Generated portfolios
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Every site built from your resume. Open one to see it live.
                </p>
              </div>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 shrink-0 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Plus className="h-4 w-4" aria-hidden="true" /> New portfolio
              </Link>
            </div>

            {portfolios.length === 0 ? (
              <div className="py-16 border border-dashed border-indigo-300 dark:border-white/20 rounded-2xl text-center">
                <LayoutTemplate className="h-9 w-9 mx-auto text-indigo-300 dark:text-slate-600" aria-hidden="true" />
                <p className="mt-4 font-semibold text-slate-900 dark:text-white">No portfolios yet</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Upload your resume and the first one will land here.
                </p>
                <Link
                  to="/upload"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Generate a portfolio
                </Link>
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {portfolios.map((p, i) => (
                  <li
                    key={p.id}
                    className="relative animate-fade-up group overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <Link
                      to={`/preview/${p.id}`}
                      className="block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset"
                    >
                      <div
                        className={`relative h-28 bg-gradient-to-br ${THEME_COVER[p.theme] || THEME_COVER.minimalist} overflow-hidden`}
                      >
                        <span
                          className="absolute inset-0 grid place-items-center font-display text-6xl font-bold text-white/25 transition-transform duration-500 group-hover:scale-110"
                          aria-hidden="true"
                        >
                          {(p.name || 'P').charAt(0).toUpperCase()}
                        </span>
                        <span className="absolute top-3 right-3 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                          {THEME_LABEL[p.theme] || p.theme || 'Custom'}
                        </span>
                      </div>
                      <div className="p-4">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{p.name || 'My portfolio'}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2">
                          {p.stack && (
                            <>
                              <span>{p.stack} stack</span>
                              <span aria-hidden="true">·</span>
                            </>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> {formatDate(p.date)}
                          </span>
                        </p>
                        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-800 dark:group-hover:text-indigo-300 transition-colors">
                          View preview
                        </span>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handlePortfolioDeleteClick(p.id)}
                      disabled={deletingId === p.id}
                      aria-label={confirmDeleteId === p.id ? `Confirm delete of ${p.name || 'this portfolio'}` : `Delete ${p.name || 'this portfolio'}`}
                      title={confirmDeleteId === p.id ? 'Click again to confirm' : 'Delete portfolio'}
                      className={`absolute top-3 left-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 ${
                        confirmDeleteId === p.id
                          ? 'bg-red-600 text-white'
                          : 'bg-white/20 text-white hover:bg-red-600'
                      }`}
                    >
                      {deletingId === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {activeTab === 'profile' && (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-start">
            <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900 p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white">Your details</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">How your name appears across the studio.</p>

              <div className="mt-4 divide-y divide-slate-100 dark:divide-white/10">
                <SheetRow id="full_name" label="Full name" error={fieldErrors.full_name}>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="e.g. Jane Doe"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    onBlur={() => handleFieldBlur('full_name')}
                    aria-describedby={fieldErrors.full_name ? 'full_name-error' : undefined}
                    aria-invalid={!!fieldErrors.full_name}
                    autoComplete="name"
                    className={inputClass(fieldErrors.full_name)}
                  />
                </SheetRow>

                <SheetRow id="username" label="Username" error={fieldErrors.username}>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                    <input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="janedoe"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      onBlur={() => handleFieldBlur('username')}
                      aria-describedby={fieldErrors.username ? 'username-error' : undefined}
                      aria-invalid={!!fieldErrors.username}
                      autoComplete="username"
                      className={`${inputClass(fieldErrors.username)} pl-9`}
                    />
                  </div>
                </SheetRow>

                <SheetRow id="email" label="Email">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={profile.email}
                      readOnly
                      className={`${inputClass(false)} pl-9 bg-slate-50 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 cursor-not-allowed`}
                    />
                  </div>
                </SheetRow>

                <SheetRow id="bio" label="Bio">
                  <textarea
                    id="bio"
                    rows={3}
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="A short line about what you do, e.g. “Designer building calm software”"
                    className={`${inputClass(false)} resize-none`}
                  />
                </SheetRow>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/10 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Loader2 className={saving ? 'h-4 w-4 animate-spin' : 'hidden'} aria-hidden="true" />
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </section>

            <aside className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-gray-900/60 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Profile preview
              </p>
              <div className="mt-5 text-center">
                <div
                  aria-hidden="true"
                  className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 grid place-items-center text-white font-display text-4xl font-bold shadow-lg shadow-indigo-600/20"
                >
                  {initial}
                </div>
                <p className="mt-4 font-display text-lg font-bold text-slate-900 dark:text-white break-words">{name}</p>
                {profile.username && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">@{profile.username}</p>
                )}
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 break-words">
                  {profile.bio || 'Add a short bio to introduce yourself.'}
                </p>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-2 text-center">
                <span className="rounded-lg bg-white dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-2 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {portfolios.length}
                  <span className="block text-[11px] font-medium text-slate-400 dark:text-slate-500">portfolios</span>
                </span>
                <span className="rounded-lg bg-white dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-2 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {themeCount}
                  <span className="block text-[11px] font-medium text-slate-400 dark:text-slate-500">themes used</span>
                </span>
              </div>
            </aside>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-start">
            <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900 p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white">Change password</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Use at least 8 characters.</p>

              <div className="mt-4 max-w-xl divide-y divide-slate-100 dark:divide-white/10">
                <SheetRow id="currentPassword" label="Current password" error={fieldErrors.currentPassword}>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      placeholder="Enter your current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      onBlur={() => handleFieldBlur('currentPassword')}
                      aria-describedby={fieldErrors.currentPassword ? 'currentPassword-error' : undefined}
                      aria-invalid={!!fieldErrors.currentPassword}
                      autoComplete="current-password"
                      className={`${inputClass(fieldErrors.currentPassword)} pl-9`}
                    />
                  </div>
                </SheetRow>

                <SheetRow id="newPassword" label="New password" error={fieldErrors.newPassword}>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onBlur={() => handleFieldBlur('newPassword')}
                      aria-describedby={fieldErrors.newPassword ? 'newPassword-error' : undefined}
                      aria-invalid={!!fieldErrors.newPassword}
                      autoComplete="new-password"
                      className={`${inputClass(fieldErrors.newPassword)} pl-9`}
                    />
                  </div>
                </SheetRow>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/10 flex justify-end max-w-xl">
                <button
                  type="button"
                  onClick={handleUpdatePassword}
                  disabled={updatingPw}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Loader2 className={updatingPw ? 'h-4 w-4 animate-spin' : 'hidden'} aria-hidden="true" />
                  {updatingPw ? 'Updating…' : 'Update password'}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20 p-6">
              <h2 className="font-display text-lg font-bold tracking-tight text-red-700 dark:text-red-400">
                Danger zone
              </h2>
              <p className="text-sm text-red-700/80 dark:text-red-400/80 mt-1">
                Deleting your account removes every generated portfolio. This can’t be undone.
              </p>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                disabled={deleting}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/60 bg-white dark:bg-red-950/40 px-4 py-2.5 text-sm font-semibold text-red-700 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                Delete account
              </button>
            </section>
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-heading">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteOpen(false)}
            aria-hidden="true"
          />
          <div className="animate-pop-in relative w-full max-w-md rounded-2xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="delete-heading" className="font-display text-xl font-bold tracking-tight text-red-700 dark:text-red-400">
                  Delete your account?
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  This permanently removes your account and every portfolio you’ve generated. There’s no going back.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                aria-label="Close"
                className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="rounded-lg border border-slate-300 dark:border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Keep account
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <Loader2 className={deleting ? 'h-4 w-4 animate-spin' : 'hidden'} aria-hidden="true" />
                {deleting ? 'Deleting…' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
