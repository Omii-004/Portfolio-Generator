import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Check, Code2, Download, FileText, Palette, Sparkles, Upload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  { num: '01', label: 'INPUT', title: 'Upload', detail: 'PDF / DOCX', copy: 'Drop your resume in. No sign-up tricks, no template hunting.', icon: Upload },
  { num: '02', label: 'PROCESS', title: 'Extract', detail: 'AI ENGINE', copy: 'The AI parses and structures your experience into clean data.', icon: Sparkles },
  { num: '03', label: 'DESIGN', title: 'Customize', detail: '8 THEMES', copy: 'Pick a theme, tune the details and preview it live.', icon: Palette },
  { num: '04', label: 'OUTPUT', title: 'Export', detail: 'ZIP · HTML', copy: 'Download clean, editable source code ready to deploy anywhere.', icon: Code2 },
];

const THEMES = [
  { num: '01', name: 'MINIMALIST', tag: 'Clean black & white', color: 'bg-gray-800' },
  { num: '02', name: 'PROFESSIONAL', tag: 'Polished & corporate', color: 'bg-blue-600' },
  { num: '03', name: 'CREATIVE', tag: 'Bold & vibrant', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { num: '04', name: 'NEURAL//CORE', tag: 'Dark tech lab', color: 'bg-gradient-to-r from-violet-700 to-fuchsia-500' },
  { num: '05', name: 'LOTUS//BLOOM', tag: 'Soft & botanical', color: 'bg-gradient-to-r from-rose-300 to-fuchsia-400' },
  { num: '06', name: 'SAKURA//FLOW', tag: 'Japanese editorial', color: 'bg-gradient-to-r from-rose-200 to-rose-400' },
  { num: '07', name: 'LATENT//SPACE', tag: 'AI research lab', color: 'bg-gradient-to-r from-violet-800 to-slate-950' },
  { num: '08', name: 'NOVA//SPACE', tag: 'Future AI world', color: 'bg-gradient-to-r from-teal-600 to-slate-950' },
];

const FIELDS = ['Name', 'Skills', 'Experience', 'Projects', 'Education', 'Certifications'];

const FILE_TREE = [
  { indent: 0, text: 'index.html' },
  { indent: 0, text: 'README.md' },
  { indent: 0, text: 'styles/' },
  { indent: 1, text: 'main.css' },
  { indent: 0, text: 'assets/' },
  { indent: 0, text: 'favicon.ico' },
];

const HERO_PHASES = [
  '// INITIALIZING READER ...',
  'PARSING resume.pdf ...',
  'AI EXTRACTION RUNNING ...',
  'STATUS: COMPLETE',
];

function HeroDemo() {
  const [step, setStep] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? HERO_PHASES.length - 1 : 0,
  );

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }
    const id = setInterval(() => setStep((s) => (s + 1) % HERO_PHASES.length), 1700);
    return () => clearInterval(id);
  }, []);

  const scanning = step < 2;
  const progress = step === 0 ? 8 : step === 1 ? 40 : step === 2 ? 82 : 100;
  const chips = step === 0 ? 0 : step === 1 ? 2 : step === 2 ? 5 : FIELDS.length;

  return (
    <div className="relative rounded-2xl border border-mauve/25 bg-coral p-5 sm:p-7 shadow-[0_28px_70px_-28px_rgba(93,73,84,0.45)]">
      <p className="font-tech text-[10px] tracking-[.2em] text-rose uppercase">Resume &rarr; AI &rarr; Portfolio</p>

      <div className="relative mt-4 rounded-xl border border-mauve/20 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose/10">
              <FileText className="h-4 w-4 text-rose" />
            </span>
            <div>
              <p className="text-sm font-semibold text-plum">resume.pdf</p>
              <p className="font-tech text-[10px] text-mauve">PDF · 1 PAGE · 2026</p>
            </div>
          </div>
          <span className="font-tech text-[10px] text-rose">● {scanning ? 'ANALYZING' : 'READ'}</span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-2 w-4/5 rounded bg-mauve/15" />
          <div className="h-2 w-3/5 rounded bg-mauve/15" />
          <div className="h-2 w-2/3 rounded bg-mauve/15" />
        </div>
        <div aria-hidden="true" className="scan-line absolute left-2 right-2 h-5 rounded bg-rose/15" style={{ display: scanning ? 'block' : 'none' }} />
      </div>

      <div className="my-4 flex items-center gap-3">
        <div className="ml-4 flex flex-col items-center">
          <span className="h-8 w-px bg-mauve/30" />
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose text-coral">
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {FIELDS.slice(0, chips).map((f) => (
              <span key={f} className="flex items-center gap-1 rounded-full border border-rose/25 bg-white px-2.5 py-1 font-tech text-[9px] text-plum">
                {f}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-mauve/15">
              <div
                className="h-full rounded-full bg-rose transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-tech text-[10px] text-rose">{progress}%</span>
          </div>
        </div>
      </div>

      <div
        className="rounded-xl border border-rose/30 bg-white p-5 shadow-sm transition-all duration-700"
        style={{
          opacity: step >= 2 ? 1 : 0.4,
          transform: step >= 2 ? 'translateY(0)' : 'translateY(10px)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose/25" />
          <span className="h-2.5 w-2.5 rounded-full bg-rose/25" />
          <span className="ml-1 w-1/3 rounded bg-mauve/15" style={{ height: 8 }} />
        </div>
        <p className="mt-3 font-display text-lg font-bold tracking-tight text-plum">John Doe</p>
        <p className="text-[11px] text-mauve">AI / ML Developer</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {['Hero', 'Projects', 'Skills', 'Contact'].map((c) => (
            <span key={c} className="rounded-md bg-coral px-2 py-1.5 text-center text-[9px] font-medium text-plum">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-mauve/15 bg-beige px-4 py-3 font-tech text-[10px] tracking-[.08em] text-mauve">
        <span>{HERO_PHASES[step]}</span>
        {step === 3 && <span className="text-rose">FIELDS: 42</span>}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const start = isAuthenticated ? '/upload' : '/login';
  const ctaClasses = 'inline-flex items-center justify-center gap-2 rounded-lg bg-rose px-6 py-3 font-tech text-xs font-medium tracking-[.14em] text-coral transition-colors hover:bg-plum';

  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach((el) => el.classList.add('revealed'));
      return undefined;
    }
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('revealed'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          io.unobserve(entry.target);
        }
      }),
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-screen scroll-smooth bg-beige font-sans text-plum antialiased">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-mauve/15 bg-beige/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-plum font-tech text-sm text-coral">◈</span>
            <span className="font-display text-lg font-bold tracking-tight">PORTFOLIO<span className="text-rose">.</span>AI</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-mauve md:flex">
            <a href="#templates" className="transition-colors hover:text-plum">Templates</a>
            <a href="#how" className="transition-colors hover:text-plum">How it works</a>
            <a href="#code" className="transition-colors hover:text-plum">Source code</a>
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <Link to="/profile" className="hidden font-tech text-[10px] tracking-[.14em] text-mauve hover:text-rose sm:block">
                SESSION: ONLINE
              </Link>
            )}
            <Link to={start} className={`${ctaClasses} px-5 py-2.5`}>
              CREATE PORTFOLIO
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-20 pt-14 md:pb-28 md:pt-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-10 h-96 w-96 rounded-full bg-coral/80 blur-3xl"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div className="reveal">
            <p className="font-tech text-[11px] uppercase tracking-[.22em] text-rose">
              PortfoliAI // Resume Extraction Engine
            </p>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[0.98] tracking-[-0.02em] md:text-7xl">
              Your resume.
              <br />
              Your portfolio.
              <br />
              <span className="text-rose">Automatically.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-mauve">
              Upload your resume. The AI extracts your experience, projects, skills and
              education — then builds a professional portfolio around it. Download the
              source code and deploy it anywhere.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link to={start} className={ctaClasses}>
                CREATE PORTFOLIO
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#templates"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose px-6 py-3 font-tech text-xs font-medium tracking-[.14em] text-plum transition-colors hover:bg-coral"
              >
                EXPLORE TEMPLATES
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 font-tech text-[11px] tracking-[.12em] text-mauve/80">
              <span className="text-plum">RESUME.PDF</span>
              <ArrowRight className="h-3.5 w-3.5 text-rose" />
              <span className="text-plum">AI</span>
              <ArrowRight className="h-3.5 w-3.5 text-rose" />
              <span className="text-plum">PORTFOLIO</span>
              <ArrowRight className="h-3.5 w-3.5 text-rose" />
              <span className="text-plum">SOURCE CODE</span>
            </div>
          </div>

          <div className="reveal relative">
            <HeroDemo />
          </div>
        </div>
      </section>

      {/* ── Transformation ─────────────────────────────────── */}
      <section className="scroll-mt-24 bg-coral px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="reveal max-w-2xl">
            <p className="font-tech text-[11px] uppercase tracking-[.22em] text-rose">The transformation</p>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-[-0.02em] md:text-5xl">
              From document to digital identity.
            </h2>
            <p className="mt-4 text-mauve">
              One file in. One website out. Nothing hand-coded, nothing re-typed.
            </p>
          </div>

          <div className="reveal mt-12 grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
            <div className="rounded-xl border border-mauve/20 bg-beige p-6">
              <p className="font-tech text-[10px] tracking-[.2em] text-mauve">BEFORE // RESUME.PDF</p>
              <ul className="mt-4 space-y-2.5 font-tech text-sm text-plum">
                {['Name', 'Experience', 'Skills', 'Projects', 'Education', 'Certifications'].map((l) => (
                  <li key={l} className="flex items-center gap-2.5">
                    <span className="h-1 w-1 rounded-full bg-rose" />
                    {l}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-center">
              <div className="rounded-full bg-rose px-5 py-2.5 font-tech text-[10px] tracking-[.16em] text-coral">
                AI EXTRACTION
              </div>
            </div>

            <div className="rounded-xl border border-rose/30 bg-white p-6">
              <p className="font-tech text-[10px] tracking-[.2em] text-mauve">AFTER // YOUR WEBSITE</p>
              <ul className="mt-4 space-y-2.5 font-tech text-sm text-plum">
                {['Hero', 'About', 'Experience', 'Projects', 'Skills', 'Contact'].map((l) => (
                  <li key={l} className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-rose" />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section id="how" className="scroll-mt-24 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="reveal max-w-2xl">
            <p className="font-tech text-[11px] uppercase tracking-[.22em] text-rose">How it works</p>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-[-0.02em] md:text-5xl">
              Your resume, end to end.
            </h2>
          </div>

          <div className="reveal mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ num, label, title, detail, copy, icon: Icon }) => (
              <div key={num} className="relative border-t-2 border-mauve/20 pt-7">
                <span className="absolute -top-[9px] left-0 h-4 w-4 rounded-full border-2 border-mauve/40 bg-beige" />
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-5xl font-bold text-plum/20">{num}</span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-mauve/20 text-rose">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-3 font-tech text-[10px] tracking-[.2em] text-rose">{label}</p>
                <h3 className="mt-1 font-display text-2xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mauve">{copy}</p>
                <p className="mt-4 font-tech text-[10px] tracking-[.14em] text-mauve/70">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Template showcase ──────────────────────────────── */}
      <section id="templates" className="scroll-mt-24 bg-coral px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="reveal flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="font-tech text-[11px] uppercase tracking-[.22em] text-rose">Template showcase</p>
              <h2 className="mt-4 font-display text-4xl font-bold tracking-[-0.02em] md:text-5xl">
                Eight styles. One upload.
              </h2>
            </div>
            <Link to={start} className="group inline-flex items-center gap-2 font-tech text-xs tracking-[.16em] text-plum hover:text-rose">
              EXPLORE ALL TEMPLATES
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="reveal mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {THEMES.map(({ num, name, tag, color }, i) => (
              <div
                key={name}
                className="group rounded-xl border border-mauve/20 bg-white p-4 transition-colors hover:border-rose/60 hover:shadow-[0_16px_40px_-20px_rgba(117,79,91,0.4)]"
                style={{ transitionDelay: `${(i % 4) * 70}ms` }}
              >
                <div className="overflow-hidden rounded-lg">
                  <div className={`h-1.5 ${color}`} />
                  <div className="space-y-2 bg-beige p-4">
                    <div className="h-2 w-3/4 rounded bg-mauve/25" />
                    <div className="h-2 w-1/2 rounded bg-mauve/15" />
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="col-span-2 h-12 rounded bg-mauve/10" />
                      <div className="h-12 rounded bg-mauve/10" />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="font-tech text-[9px] tracking-[.2em] text-rose">{num} //</p>
                    <p className="font-display text-base font-semibold tracking-tight">{name}</p>
                  </div>
                  <span className="font-tech text-[9px] text-mauve/70">{tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Built for ──────────────────────────────────────── */}
      <section className="border-y border-mauve/10 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 font-tech text-[11px] uppercase tracking-[.18em] text-mauve/70">
          <span className="text-rose">Built for</span>
          <span>Students</span><span className="text-mauve/30">·</span>
          <span>Developers</span><span className="text-mauve/30">·</span>
          <span>Designers</span><span className="text-mauve/30">·</span>
          <span>Freelancers</span><span className="text-mauve/30">·</span>
          <span>Researchers</span><span className="text-mauve/30">·</span>
          <span>Job seekers</span>
        </div>
      </section>

      {/* ── AI extraction ──────────────────────────────────── */}
      <section id="extraction" className="scroll-mt-24 px-6 py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div className="reveal">
            <p className="font-tech text-[11px] uppercase tracking-[.22em] text-rose">What the AI extracts</p>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-[-0.02em] md:text-5xl">
              Your resume already contains the data.
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-mauve">
              The AI reads your document as a structured system — not just text. Everything
              meaningful is mapped into portfolio data, ready to be designed.
            </p>
            <ul className="mt-8 space-y-2 font-tech text-xs text-mauve">
              {['RESUME PARSING', 'STRUCTURED EXTRACTION', 'CONTENT MAPPING', 'LAYOUT GENERATION', 'CODE GENERATION'].map((l) => (
                <li key={l} className="flex items-center gap-3">
                  <ArrowRight className="h-3.5 w-3.5 text-rose" />
                  {l}
                </li>
              ))}
            </ul>
          </div>

          <div className="reveal rounded-xl border border-mauve/20 bg-coral p-6">
            <div className="flex items-center justify-between">
              <p className="font-tech text-[10px] tracking-[.2em] text-rose">// resume_analysis.txt</p>
              <p className="font-tech text-[10px] text-mauve">status</p>
            </div>
            <div className="mt-4 divide-y divide-rose/10 border-t border-rose/10">
              {FIELDS.map((f, i) => (
                <div
                  key={f}
                  className="code-line flex items-center justify-between py-2.5 font-tech text-[12px]"
                  style={{ transitionDelay: `${i * 70}ms` }}
                >
                  <span className="text-plum">{f}</span>
                  <span className="flex items-center gap-2 text-mauve">
                    detected <Check className="h-3.5 w-3.5 text-rose" />
                  </span>
                </div>
              ))}
            </div>
            <div className="code-line mt-4 flex items-center gap-3" style={{ transitionDelay: '500ms' }}>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-mauve/15">
                <div className="h-full rounded-full bg-rose" style={{ width: '92%' }} />
              </div>
              <span className="font-tech text-[10px] text-rose">92%</span>
            </div>
            <p className="code-line mt-3 font-tech text-[10px] tracking-[.1em] text-mauve" style={{ transitionDelay: '600ms' }}>
              RESUME.PDF &rarr; 42 FIELDS &rarr; PORTFOLIO DATA
            </p>
          </div>
        </div>
      </section>

      {/* ── Source code ────────────────────────────────────── */}
      <section id="code" className="scroll-mt-24 bg-plum px-6 py-20 text-coral md:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div className="reveal">
            <p className="font-tech text-[11px] uppercase tracking-[.22em] text-coral/70">Built for developers</p>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-[-0.02em] md:text-5xl">
              Your portfolio.
              <br />
              Your code.
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-coral/75">
              Not just a website. A clean, dependency-free HTML + CSS file you own
              completely. Read it, edit it, redeploy it.
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-tech text-[10px] uppercase tracking-[.16em] text-coral/70">
              <li>Responsive</li>
              <li>SEO ready</li>
              <li>Customizable</li>
              <li>Deployable</li>
            </ul>
            <a
              href={start}
              className="mt-10 inline-flex items-center justify-center gap-2 rounded-lg bg-coral px-6 py-3 font-tech text-xs font-medium tracking-[.14em] text-plum transition-colors hover:bg-white"
            >
              <Download className="h-4 w-4" />
              EXPORT SOURCE CODE
            </a>
          </div>

          <div className="reveal rounded-xl border border-coral/15 bg-[#4A3845] p-6 shadow-2xl">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-coral/30" />
              <span className="h-2.5 w-2.5 rounded-full bg-coral/30" />
              <span className="h-2.5 w-2.5 rounded-full bg-coral/60" />
              <span className="ml-2 font-tech text-[10px] tracking-[.14em] text-coral/60">portfolio /</span>
            </div>
            <div className="mt-5 space-y-2.5 font-tech text-[12px] text-coral/85">
              {FILE_TREE.map(({ indent, text }, i) => (
                <p key={text} className="code-line" style={{ transitionDelay: `${i * 60}ms`, paddingLeft: `${indent * 1.25}rem` }}>
                  {indent === 0 ? '▸' : '└'} {text}
                </p>
              ))}
            </div>
            <div className="mt-6 space-y-1.5 border-t border-coral/15 pt-4 font-tech text-[11px] text-coral/60">
              <p className="code-line" style={{ transitionDelay: '360ms' }}>$ npm run build</p>
              <p className="code-line text-coral/80" style={{ transitionDelay: '420ms' }}>&nbsp;&nbsp;✓ index.html ready</p>
              <p className="code-line text-coral/80" style={{ transitionDelay: '480ms' }}>&nbsp;&nbsp;✓ single file · zero lock-in</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] md:text-6xl">
            Your resume
            <br />
            already has your story.
            <br />
            <span className="text-rose">Now give it a website.</span>
          </h2>
          <div className="reveal mt-10 flex justify-center">
            <Link to={start} className={`${ctaClasses} px-8 py-4`}>
              CREATE MY PORTFOLIO
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-8 font-tech text-[11px] uppercase tracking-[.18em] text-mauve/70">
            Upload &rarr; Generate &rarr; Customize &rarr; Export
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="bg-plum px-6 pt-16 text-coral">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-coral font-tech text-sm text-plum">◈</span>
                <span className="font-display text-lg font-bold tracking-tight">PORTFOLIO<span className="text-rose">.</span>AI</span>
              </div>
              <p className="mt-4 max-w-sm font-tech text-[11px] leading-relaxed tracking-[.1em] text-coral/60 uppercase">
                Turn your resume into a professional, deployable portfolio — code included.
              </p>
            </div>

            <div>
              <p className="font-tech text-[10px] uppercase tracking-[.2em] text-coral/50">Product</p>
              <ul className="mt-4 space-y-2.5 text-sm text-coral/85">
                <li><a href="#templates" className="transition-colors hover:text-white">Templates</a></li>
                <li><a href="#how" className="transition-colors hover:text-white">How it works</a></li>
                <li><a href="#code" className="transition-colors hover:text-white">Source code</a></li>
              </ul>
            </div>

            <div>
              <p className="font-tech text-[10px] uppercase tracking-[.2em] text-coral/50">Project</p>
              <ul className="mt-4 space-y-2.5 text-sm text-coral/85">
                <li><Link to="/feedback" className="transition-colors hover:text-white">Feedback</Link></li>
                <li><Link to={start} className="transition-colors hover:text-white">Start building</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-coral/15 py-6 font-tech text-[10px] uppercase tracking-[.16em] text-coral/50 sm:flex-row">
            <span>© 2026 Portfolio.AI</span>
            <span>Resume &rarr; Portfolio &rarr; Code</span>
          </div>
        </div>
      </footer>

    </div>
  );
}