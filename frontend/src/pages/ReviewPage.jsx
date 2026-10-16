import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API } from '../api';
import {
  CheckCircle, Mail, Phone, Link2, Briefcase,
  GraduationCap, FolderGit2, Award, Globe, Sparkles, Loader2, ChevronDown, Check,
} from 'lucide-react';

const THEME_OPTIONS = [
  { id: 'minimalist', label: 'Minimalist', desc: 'Clean & simple', gradient: 'from-slate-700 to-slate-900' },
  { id: 'professional', label: 'Professional', desc: 'Polished & corporate', gradient: 'from-blue-600 to-indigo-700' },
  { id: 'creative', label: 'Creative', desc: 'Bold & vibrant', gradient: 'from-orange-400 via-pink-500 to-purple-600' },
  { id: 'core', label: 'NEURAL//CORE', desc: 'Dark tech aesthetic', gradient: 'from-violet-700 via-purple-600 to-fuchsia-500' },
  { id: 'lotus', label: 'LOTUS//BLOOM', desc: 'Soft & botanical', gradient: 'from-rose-300 via-pink-400 to-fuchsia-400' },
  { id: 'sakura', label: 'SAKURA//FLOW', desc: 'Japanese editorial', gradient: 'from-rose-200 via-pink-300 to-rose-400' },
  { id: 'latent', label: 'LATENT//SPACE', desc: 'AI research lab', gradient: 'from-violet-800 via-slate-900 to-slate-950' },
  { id: 'nova', label: 'NOVA//SPACE', desc: 'Future AI world', gradient: 'from-teal-600 via-slate-900 to-slate-950' },
];

const STACK_OPTIONS = [
  { id: 'react', label: 'React + Tailwind' },
  { id: 'html', label: 'Vanilla HTML' },
];

const sectionMeta = {
  summary:   { icon: CheckCircle, color: 'from-emerald-500 to-emerald-600',  label: 'Summary' },
  contact:   { icon: Mail,        color: 'from-sky-500 to-blue-600',         label: 'Contact' },
  skills:    { icon: CheckCircle, color: 'from-pink-500 to-rose-600',        label: 'Skills' },
  experience:{ icon: Briefcase,   color: 'from-indigo-500 to-indigo-600',    label: 'Experience' },
  education: { icon: GraduationCap,color: 'from-violet-500 to-violet-600',   label: 'Education' },
  projects:  { icon: FolderGit2,  color: 'from-amber-500 to-orange-600',     label: 'Projects' },
  certs:     { icon: Award,       color: 'from-rose-500 to-rose-600',        label: 'Certifications' },
  languages: { icon: Globe,       color: 'from-teal-500 to-teal-600',        label: 'Languages' },
};

function SectionCard({ id, delay = 0, hasContent = true, children }) {
  if (!hasContent) return null;
  const meta = sectionMeta[id];
  const Icon = meta.icon;

  return (
    <div
      className="animate-fade-up border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-900/80 p-5 sm:p-6"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${meta.color} shadow-sm`}>
          <Icon className="h-4.5 w-4.5 text-white" aria-hidden="true" />
        </div>
        <h3 className="font-display text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">
          {meta.label}
        </h3>
      </div>
      {children}
    </div>
  );
}

export default function ReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [stack, setStack] = useState('react');
  const [theme, setTheme] = useState('minimalist');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [themeOpen, setThemeOpen] = useState(false);
  const themeRef = useRef(null);

  // Close theme dropdown on outside click
  useEffect(() => {
    if (!themeOpen) return;
    const onDown = (e) => {
      if (themeRef.current && !themeRef.current.contains(e.target)) setThemeOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [themeOpen]);

  if (!location.state?.resumeData) {
    return <Navigate to="/upload" replace />;
  }

  const r = location.state.resumeData;
  const initials = (r.name || 'U').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(
        `${API}/api/portfolio/generate`,
        { resume_data: r, selected_stack: stack, selected_theme: theme },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      navigate('/preview', { state: { portfolioId: res.data.portfolio_id } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate. Make sure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  const hasExp   = r.experience?.length > 0;
  const hasEdu   = r.education?.length > 0;
  const hasProj  = r.projects?.length > 0;
  const hasCerts = r.certifications?.length > 0;
  const hasLang  = r.languages?.length > 0;

  return (
    <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12">

      {/* Header */}
      <div className="mb-8 sm:mb-10 animate-fade-up">
        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Resume parsed</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Review &amp; configure
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          AI extracted your resume data below. Pick a theme and stack, then generate.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

        {/* ── Left: Resume data ── */}
        <div className="flex-1 min-w-0 w-full space-y-4">

          {/* Name hero */}
          <div
            className="animate-fade-up flex items-center gap-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/80 p-5 sm:p-6"
            style={{ animationDelay: '60ms' }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white shadow-md flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">{r.name || 'Untitled'}</p>
              {r.title && <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{r.title}</p>}
            </div>
          </div>

          {/* Summary */}
          <SectionCard id="summary" delay={120} hasContent={!!r.summary}>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{r.summary}</p>
          </SectionCard>

          {/* Contact */}
          <SectionCard id="contact" delay={180} hasContent={!!(r.contact?.email || r.contact?.phone || r.contact?.linkedin || r.contact?.github)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {r.contact?.email && (
                <span className="inline-flex items-center gap-2.5 rounded-lg bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
                  <Mail className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  <span className="truncate">{r.contact.email}</span>
                </span>
              )}
              {r.contact?.phone && (
                <span className="inline-flex items-center gap-2.5 rounded-lg bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
                  <Phone className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  <span className="truncate">{r.contact.phone}</span>
                </span>
              )}
              {r.contact?.linkedin && (
                <a
                  href={r.contact.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-lg bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <Link2 className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  <span className="truncate">LinkedIn profile</span>
                </a>
              )}
              {r.contact?.github && (
                <a
                  href={r.contact.github}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-lg bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <Link2 className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  <span className="truncate">GitHub profile</span>
                </a>
              )}
            </div>
          </SectionCard>

          {/* Skills */}
          <SectionCard id="skills" delay={240} hasContent={r.skills?.length > 0}>
            <div className="flex flex-wrap gap-2">
              {r.skills.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-150"
                >
                  {s}
                </span>
              ))}
            </div>
          </SectionCard>

          {/* Experience */}
          <SectionCard id="experience" delay={300} hasContent={hasExp}>
            <div className="space-y-3">
              {r.experience.map((e, i) => (
                <div key={i} className="rounded-lg border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">{e.role}</p>
                      {e.company && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{e.company}</p>}
                    </div>
                    {e.duration && (
                      <span className="flex-shrink-0 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-2.5 py-0.5">
                        {e.duration}
                      </span>
                    )}
                  </div>
                  {e.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{e.description}</p>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Education */}
          <SectionCard id="education" delay={360} hasContent={hasEdu}>
            <div className="space-y-3">
              {r.education.map((ed, i) => (
                <div key={i} className="rounded-lg border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">{ed.degree}</p>
                      {ed.institution && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{ed.institution}</p>}
                    </div>
                    {ed.year && (
                      <span className="flex-shrink-0 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-2.5 py-0.5">
                        {ed.year}
                      </span>
                    )}
                  </div>
                  {ed.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{ed.description}</p>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Projects */}
          <SectionCard id="projects" delay={420} hasContent={hasProj}>
            <div className="space-y-3">
              {r.projects.map((p, i) => (
                <div key={i} className="rounded-lg border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{p.name}</p>
                        {p.link && (
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            View
                          </a>
                        )}
                      </div>
                      {(p.type || p.status || p.year) && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {[p.type, p.status, p.year].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>
                  {p.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{p.description}</p>
                  )}
                  {p.tech_stack?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {p.tech_stack.map((t, j) => (
                        <span key={j} className="inline-flex items-center rounded bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Certifications */}
          <SectionCard id="certs" delay={480} hasContent={hasCerts}>
            <div className="space-y-2">
              {r.certifications.map((c, i) => (
                <div key={i} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] p-3.5">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{c.name}</p>
                    {c.issuer && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.issuer}</p>}
                  </div>
                  {c.year && (
                    <span className="flex-shrink-0 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-2.5 py-0.5">
                      {c.year}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Languages */}
          <SectionCard id="languages" delay={540} hasContent={hasLang}>
            <div className="flex flex-wrap gap-2">
              {r.languages.map((l, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  {l.language}
                  {l.proficiency && (
                    <span className="text-slate-400 dark:text-slate-500">· {l.proficiency}</span>
                  )}
                </span>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* ── Right: Config rail ── */}
        <div className="w-full lg:w-[340px] lg:sticky lg:top-24 space-y-4 flex-shrink-0 animate-fade-up" style={{ animationDelay: '120ms' }}>

          {/* Theme selector — glassmorphic dropdown */}
          <div className="relative" ref={themeRef}>
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/80 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
                  <span className="h-4 w-4 rounded-full bg-white/80" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Theme</p>
              </div>

              {/* Trigger */}
              <button
                type="button"
                onClick={() => setThemeOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={themeOpen}
                className="group flex w-full items-center gap-3 rounded-xl border border-white/40 bg-white/60 backdrop-blur-xl px-4 py-3 text-left transition-all duration-200 hover:bg-white/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15 dark:focus-visible:ring-offset-gray-900 shadow-sm"
              >
                <span className={`h-5 w-5 flex-shrink-0 rounded-full bg-gradient-to-br ${THEME_OPTIONS.find((t) => t.id === theme)?.gradient} ring-2 ring-white/60 dark:ring-white/20 shadow`} />
                <span className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white block leading-tight">
                    {THEME_OPTIONS.find((t) => t.id === theme)?.label}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 block leading-tight mt-0.5">
                    {THEME_OPTIONS.find((t) => t.id === theme)?.desc}
                  </span>
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${themeOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
            </div>

            {/* Dropdown panel */}
            {themeOpen && (
              <div
                role="listbox"
                aria-label="Theme options"
                className="absolute left-0 right-0 z-50 mt-2 rounded-xl border border-white/40 bg-white/70 backdrop-blur-2xl shadow-2xl shadow-black/10 dark:border-white/15 dark:bg-gray-900/80 dark:shadow-black/40 overflow-hidden animate-scale-in origin-top"
              >
                <div className="p-1.5">
                  {THEME_OPTIONS.map((t) => {
                    const selected = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => { setTheme(t.id); setThemeOpen(false); }}
                        className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150 outline-none ${
                          selected
                            ? 'bg-indigo-50/80 dark:bg-indigo-500/15'
                            : 'hover:bg-white/60 dark:hover:bg-white/10'
                        }`}
                      >
                        <span className={`h-6 w-6 flex-shrink-0 rounded-full bg-gradient-to-br ${t.gradient} ring-2 ring-white/70 dark:ring-white/20 shadow-sm transition-shadow group-hover:shadow-md`} />
                        <span className="flex-1 min-w-0">
                          <span className={`text-sm font-medium block leading-tight ${
                            selected
                              ? 'text-indigo-700 dark:text-indigo-300'
                              : 'text-slate-700 dark:text-slate-200'
                          }`}>
                            {t.label}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 block leading-tight mt-0.5">
                            {t.desc}
                          </span>
                        </span>
                        {selected && (
                          <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Stack selector */}
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/80 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 shadow-sm">
                <span className="text-[11px] font-bold text-white" aria-hidden="true">&lt;/&gt;</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Stack</p>
            </div>

            <div className="flex gap-2" role="radiogroup" aria-label="Tech stack selection">
              {STACK_OPTIONS.map((s) => {
                const selected = stack === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStack(s.id)}
                    role="radio"
                    aria-checked={selected}
                    className={`flex-1 rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition-all duration-200 outline-none ${
                      selected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400/50 dark:bg-indigo-500/10 dark:text-indigo-300 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:border-white/20 dark:hover:bg-white/10'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
            >
              {error}
            </div>
          )}

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="relative w-full rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 px-6 py-4 text-[15px] font-bold text-white shadow-md transition-colors duration-200 hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2.5">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Building your portfolio…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
                Generate portfolio
              </span>
            )}
          </button>

          {/* Footer note */}
          {loading ? (
            <div
              className="animate-fade-up flex items-start gap-2.5 rounded-lg border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/5 px-4 py-3"
              role="status"
            >
              <Sparkles className="h-4 w-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                Your resume, theme, and stack are being knit into code. This usually takes a few seconds.
              </p>
            </div>
          ) : (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              AI builds your portfolio from the data above.
              <br />
              You can re-upload a different resume anytime.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
