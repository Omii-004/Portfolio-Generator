import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API } from '../api';
import {
  Mail, Phone, Link2, Briefcase, GraduationCap, FolderGit2,
  Award, Globe, Sparkles, Loader2,
  Layers, ArrowUpRight, CheckCircle2
} from 'lucide-react';

const THEME_OPTIONS = [
  { id: 'minimalist', name: 'MINIMALIST', tag: 'Monochrome', preview: 'bg-stone-900 border-stone-700' },
  { id: 'professional', name: 'PROFESSIONAL', tag: 'Executive Navy', preview: 'bg-blue-600 border-blue-400' },
  { id: 'creative', name: 'CREATIVE', tag: 'Neon Gradients', preview: 'bg-gradient-to-tr from-purple-500 to-pink-500 border-pink-400' },
  { id: 'core', name: 'NEURAL//CORE', tag: 'Violet Tech Lab', preview: 'bg-violet-700 border-violet-500' },
  { id: 'lotus', name: 'LOTUS//BLOOM', tag: 'Botanical Luxury', preview: 'bg-rose-400 border-rose-300' },
  { id: 'sakura', name: 'SAKURA//FLOW', tag: 'Japanese Minimal', preview: 'bg-pink-300 border-pink-200' },
  { id: 'latent', name: 'LATENT//SPACE', tag: 'AI Console / Slate', preview: 'bg-slate-900 border-slate-700' },
  { id: 'nova', name: 'NOVA//SPACE', tag: 'Cosmic Teal Dark', preview: 'bg-teal-600 border-teal-400' },
];

const STACK_OPTIONS = [
  { id: 'react', label: 'React + Tailwind' },
  { id: 'html', label: 'Single HTML' },
];

export default function ReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [stack, setStack] = useState('react');
  const [theme, setTheme] = useState('minimalist');
  const [activeTab, setActiveTab] = useState('work'); // 'work' | 'skills' | 'education'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!location.state?.resumeData) {
    return <Navigate to="/upload" replace />;
  }

  const r = location.state.resumeData;
  const initials = (r.name || 'U')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(
        `${API}/api/portfolio/generate`,
        { resume_data: r, selected_stack: stack, selected_theme: theme },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/preview', { state: { portfolioId: res.data.portfolio_id } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate portfolio. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedThemeMeta = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  return (
    <div className="flex-grow w-full bg-beige dark:bg-plum transition-colors duration-300 pb-12 sm:pb-16 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* ── 1. Candidate Dossier Header ── */}
        <section className="rounded-2xl sm:rounded-3xl border border-mauve/25 bg-coral/50 dark:bg-white/5 p-4 sm:p-6 md:p-8 backdrop-blur-sm shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">

            {/* Avatar & Name */}
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-rose text-coral font-display text-lg sm:text-xl font-bold flex items-center justify-center shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-tech text-[10px] tracking-[.18em] text-rose uppercase block">PARSED CANDIDATE</span>
                <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-plum dark:text-coral truncate">
                  {r.name || 'Candidate Name'}
                </h1>
                <p className="text-xs sm:text-sm font-medium text-mauve truncate mt-0.5">
                  {r.title || 'Professional Title'}
                </p>
              </div>
            </div>

            {/* Contact Pills */}
            {r.contact && (
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-mauve/15">
                {r.contact.email && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-beige/80 dark:bg-black/30 border border-mauve/20 px-2.5 py-1 text-[11px] sm:text-xs text-plum dark:text-coral max-w-full">
                    <Mail className="h-3 w-3 text-rose shrink-0" />
                    <span className="truncate max-w-[150px] sm:max-w-[180px]">{r.contact.email}</span>
                  </span>
                )}
                {r.contact.phone && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-beige/80 dark:bg-black/30 border border-mauve/20 px-2.5 py-1 text-[11px] sm:text-xs text-plum dark:text-coral">
                    <Phone className="h-3 w-3 text-rose shrink-0" />
                    <span>{r.contact.phone}</span>
                  </span>
                )}
                {r.contact.linkedin && (
                  <a
                    href={r.contact.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-beige/80 dark:bg-black/30 border border-mauve/20 px-2.5 py-1 text-[11px] sm:text-xs text-rose hover:text-plum dark:hover:text-coral transition-colors"
                  >
                    <Link2 className="h-3 w-3 shrink-0" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {r.contact.github && (
                  <a
                    href={r.contact.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-beige/80 dark:bg-black/30 border border-mauve/20 px-2.5 py-1 text-[11px] sm:text-xs text-rose hover:text-plum dark:hover:text-coral transition-colors"
                  >
                    <Link2 className="h-3 w-3 shrink-0" />
                    <span>GitHub</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Executive Summary */}
          {r.summary && (
            <p className="mt-4 pt-3.5 border-t border-mauve/15 text-xs sm:text-sm text-plum/85 dark:text-coral/85 leading-relaxed break-words">
              {r.summary}
            </p>
          )}
        </section>

        {/* ── 2. Visual Theme Deck ── */}
        <section className="mt-6 sm:mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-1">
            <div>
              <p className="font-tech text-[10px] sm:text-xs tracking-wider uppercase text-rose">STEP 1: SELECT PALETTE &amp; STYLE</p>
              <h2 className="font-display text-base sm:text-lg font-bold text-plum dark:text-coral">Choose Aesthetic</h2>
            </div>
            <span className="font-tech text-xs text-mauve">
              Active: <span className="font-semibold text-plum dark:text-coral">{selectedThemeMeta.name}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {THEME_OPTIONS.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`group relative text-left rounded-xl sm:rounded-2xl border p-3 sm:p-4 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-rose bg-coral/90 dark:bg-white/10 shadow-sm ring-2 ring-rose/25'
                      : 'border-mauve/20 bg-coral/30 dark:bg-white/5 hover:border-mauve/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                    <span className={`h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full border ${t.preview} shadow-2xs shrink-0`} />
                    {isSelected && (
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose shrink-0" />
                    )}
                  </div>
                  <h3 className="font-display text-[11px] sm:text-xs font-bold tracking-tight text-plum dark:text-coral truncate">
                    {t.name}
                  </h3>
                  <p className="font-tech text-[9px] sm:text-[10px] text-mauve truncate mt-0.5">
                    {t.tag}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 3. Content Inspector Tabs ── */}
        <section className="mt-8 sm:mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-mauve/20 pb-3 mb-5 sm:mb-6 gap-3">
            <div>
              <p className="font-tech text-[10px] sm:text-xs tracking-wider uppercase text-rose">STEP 2: INSPECT CONTENT</p>
              <h2 className="font-display text-base sm:text-lg font-bold text-plum dark:text-coral">Extracted Data</h2>
            </div>

            {/* Segmented Tab Switcher (Mobile Swipeable / Responsive) */}
            <div className="flex items-center gap-1 bg-coral/60 dark:bg-black/30 p-1 rounded-xl border border-mauve/20 overflow-x-auto max-w-full no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('work')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  activeTab === 'work'
                    ? 'bg-rose text-coral shadow-xs'
                    : 'text-mauve hover:text-plum dark:hover:text-coral'
                }`}
              >
                Work &amp; Projects ({ (r.experience?.length || 0) + (r.projects?.length || 0) })
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('skills')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  activeTab === 'skills'
                    ? 'bg-rose text-coral shadow-xs'
                    : 'text-mauve hover:text-plum dark:hover:text-coral'
                }`}
              >
                Skills ({ (r.skills?.length || 0) + (r.languages?.length || 0) })
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('education')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  activeTab === 'education'
                    ? 'bg-rose text-coral shadow-xs'
                    : 'text-mauve hover:text-plum dark:hover:text-coral'
                }`}
              >
                Education ({ (r.education?.length || 0) + (r.certifications?.length || 0) })
              </button>
            </div>
          </div>

          {/* TAB 1: WORK & PROJECTS */}
          {activeTab === 'work' && (
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 animate-fade-up">

              {/* Experience Column */}
              <div className="rounded-2xl border border-mauve/25 bg-coral/30 dark:bg-white/5 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Briefcase className="h-4 w-4 text-rose shrink-0" />
                  <h3 className="font-display text-xs sm:text-sm font-bold text-plum dark:text-coral uppercase">Experience</h3>
                  <span className="font-tech text-xs text-mauve ml-auto">{r.experience?.length || 0}</span>
                </div>

                <div className="space-y-2.5 sm:space-y-3">
                  {r.experience?.length > 0 ? (
                    r.experience.map((e, i) => (
                      <div key={i} className="rounded-xl border border-mauve/15 bg-beige/50 dark:bg-black/20 p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                          <p className="font-display text-xs sm:text-sm font-bold text-plum dark:text-coral">{e.role}</p>
                          {e.duration && <span className="font-tech text-[10px] text-mauve shrink-0">{e.duration}</span>}
                        </div>
                        {e.company && <p className="text-xs font-semibold text-rose mt-0.5">{e.company}</p>}
                        {e.description && <p className="text-xs text-mauve mt-2 leading-relaxed break-words">{e.description}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-mauve italic py-3 text-center">No experience entries found</p>
                  )}
                </div>
              </div>

              {/* Projects Column */}
              <div className="rounded-2xl border border-mauve/25 bg-coral/30 dark:bg-white/5 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <FolderGit2 className="h-4 w-4 text-rose shrink-0" />
                  <h3 className="font-display text-xs sm:text-sm font-bold text-plum dark:text-coral uppercase">Projects</h3>
                  <span className="font-tech text-xs text-mauve ml-auto">{r.projects?.length || 0}</span>
                </div>

                <div className="space-y-2.5 sm:space-y-3">
                  {r.projects?.length > 0 ? (
                    r.projects.map((p, i) => (
                      <div key={i} className="rounded-xl border border-mauve/15 bg-beige/50 dark:bg-black/20 p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-display text-xs sm:text-sm font-bold text-plum dark:text-coral truncate">{p.name}</p>
                            {(p.type || p.year) && (
                              <p className="font-tech text-[10px] text-mauve mt-0.5">
                                {[p.type, p.year].filter(Boolean).join(' · ')}
                              </p>
                            )}
                          </div>
                          {p.link && (
                            <a
                              href={p.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-rose hover:underline inline-flex items-center gap-0.5 shrink-0"
                            >
                              <span>View</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        {p.description && <p className="text-xs text-mauve mt-2 leading-relaxed break-words">{p.description}</p>}
                        {p.tech_stack?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            {p.tech_stack.map((t, idx) => (
                              <span key={idx} className="font-tech text-[9px] rounded bg-coral/60 dark:bg-white/10 px-2 py-0.5 text-plum dark:text-coral">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-mauve italic py-3 text-center">No projects listed</p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SKILLS & LANGUAGES */}
          {activeTab === 'skills' && (
            <div className="grid md:grid-cols-12 gap-4 sm:gap-6 animate-fade-up">

              {/* Skills Cloud */}
              <div className="md:col-span-8 rounded-2xl border border-mauve/25 bg-coral/30 dark:bg-white/5 p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Layers className="h-4 w-4 text-rose shrink-0" />
                  <h3 className="font-display text-xs sm:text-sm font-bold text-plum dark:text-coral uppercase">Skills &amp; Tools</h3>
                  <span className="font-tech text-xs text-mauve ml-auto">{r.skills?.length || 0}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {r.skills?.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-lg sm:rounded-xl border border-mauve/20 bg-beige/80 dark:bg-black/30 px-2.5 py-1 sm:px-3.5 sm:py-1.5 text-xs font-medium text-plum dark:text-coral"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div className="md:col-span-4 rounded-2xl border border-mauve/25 bg-coral/30 dark:bg-white/5 p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Globe className="h-4 w-4 text-rose shrink-0" />
                  <h3 className="font-display text-xs sm:text-sm font-bold text-plum dark:text-coral uppercase">Languages</h3>
                </div>
                <div className="space-y-2">
                  {r.languages?.map((l, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-mauve/15 pb-1.5 last:border-0 last:pb-0">
                      <span className="text-xs font-semibold text-plum dark:text-coral">{l.language}</span>
                      <span className="font-tech text-[10px] text-mauve">{l.proficiency || 'Fluent'}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: EDUCATION & AWARDS */}
          {activeTab === 'education' && (
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 animate-fade-up">

              {/* Education */}
              <div className="rounded-2xl border border-mauve/25 bg-coral/30 dark:bg-white/5 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <GraduationCap className="h-4 w-4 text-rose shrink-0" />
                  <h3 className="font-display text-xs sm:text-sm font-bold text-plum dark:text-coral uppercase">Academics</h3>
                </div>
                <div className="space-y-2.5 sm:space-y-3">
                  {r.education?.map((ed, idx) => (
                    <div key={idx} className="rounded-xl border border-mauve/15 bg-beige/50 dark:bg-black/20 p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                        <p className="font-display text-xs sm:text-sm font-bold text-plum dark:text-coral">{ed.degree}</p>
                        {ed.year && <span className="font-tech text-[10px] text-mauve shrink-0">{ed.year}</span>}
                      </div>
                      {ed.institution && <p className="text-xs font-semibold text-rose mt-0.5">{ed.institution}</p>}
                      {ed.description && <p className="text-xs text-mauve mt-2 leading-relaxed break-words">{ed.description}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="rounded-2xl border border-mauve/25 bg-coral/30 dark:bg-white/5 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Award className="h-4 w-4 text-rose shrink-0" />
                  <h3 className="font-display text-xs sm:text-sm font-bold text-plum dark:text-coral uppercase">Certifications</h3>
                </div>
                <div className="space-y-2.5 sm:space-y-3">
                  {r.certifications?.length > 0 ? (
                    r.certifications.map((c, idx) => (
                      <div key={idx} className="rounded-xl border border-mauve/15 bg-beige/50 dark:bg-black/20 p-3">
                        <p className="text-xs font-bold text-plum dark:text-coral">{c.name}</p>
                        <p className="font-tech text-[10px] text-mauve mt-0.5">
                          {[c.issuer, c.year].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-mauve italic py-3 text-center">No certifications specified</p>
                  )}
                </div>
              </div>

            </div>
          )}
        </section>

        {/* ── 4. Launch & Action Panel (Fully Mobile Responsive) ── */}
        <section aria-label="Build actions" className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-mauve/20">
          <div className="rounded-2xl sm:rounded-3xl border border-mauve/25 bg-coral/50 dark:bg-white/5 p-4 sm:p-6 backdrop-blur-sm shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 sm:gap-6">

            {/* Target Framework Stack Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <span className="font-tech text-[10px] sm:text-xs tracking-wider uppercase text-mauve shrink-0">Framework:</span>
              <div className="flex items-center gap-1 bg-beige/80 dark:bg-black/30 p-1 rounded-full border border-mauve/20 w-full sm:w-auto">
                {STACK_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStack(s.id)}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold transition-all cursor-pointer text-center ${
                      stack === s.id
                        ? 'bg-rose text-coral shadow-sm font-bold'
                        : 'text-mauve hover:text-plum dark:hover:text-coral'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Theme Summary & Compile CTA */}
            <div className="flex items-center gap-3 sm:gap-4 justify-between md:justify-end">
              <div className="text-left md:text-right hidden sm:block">
                <p className="font-tech text-[9px] sm:text-[10px] uppercase tracking-wider text-mauve">Selected Theme</p>
                <p className="font-display text-xs sm:text-sm font-bold text-plum dark:text-coral truncate max-w-[140px]">{selectedThemeMeta.name}</p>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-rose py-3 sm:py-3.5 px-6 sm:px-8 text-xs sm:text-sm font-bold text-coral shadow-md hover:bg-plum transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    <span>Compiling...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span>Compile &amp; Preview</span>
                    <ArrowUpRight className="h-4 w-4 shrink-0" />
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-3 rounded-xl border border-err/30 bg-coral text-err p-3 text-center text-xs font-semibold">
              {error}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}