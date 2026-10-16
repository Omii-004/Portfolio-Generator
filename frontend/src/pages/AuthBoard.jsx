import { Logo } from '../components/AuthUI';

/* Design comparison board — 6 minimal auth directions, each in Login + Sign Up state.
   Static mockups: no state, no network. Layout is the only variable between concepts.
   Colors come from tailwind.config.js: beige / coral / plum / mauve / rose. */

const SUB = {
  login: 'Sign in to continue building your portfolio.',
  signup: 'Start turning your resume into a portfolio.',
};
const CTA = { login: 'Sign in', signup: 'Create account' };
const TAIL = {
  login: ["Don't have an account?", 'Sign up'],
  signup: ['Already have an account?', 'Sign in'],
};
const PALETTE = [
  ['#E6DBD0', 'Background', 'bg-beige'],
  ['#F9E0D9', 'Surface', 'bg-coral'],
  ['#5D4954', 'Text', 'text-plum'],
  ['#7D6167', 'Muted', 'text-mauve'],
  ['#754F5B', 'Accent', 'bg-rose'],
  ['#A63D40', 'Error', 'text-err'],
];

/* ---------- mock primitives ---------- */

function Frame({ children, dark = false, tall = false }) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[10px] border ${
        dark ? 'border-plum bg-plum' : 'border-mauve/20 bg-beige'
      } ${tall ? 'h-[720px]' : 'h-[620px]'}`}
    >
      {children}
    </div>
  );
}

const Lab = ({ dark, children, right }) => (
  <div className="mb-1.5 flex items-baseline justify-between gap-2">
    <span className={`text-[13px] font-medium ${dark ? 'text-coral/90' : 'text-plum'}`}>
      {children}
    </span>
    {right}
  </div>
);

const In = ({ dark }) => (
  <div
    className={`h-11 w-full rounded-[8px] border ${
      dark ? 'border-coral/20 bg-white/5' : 'border-mauve/25 bg-coral'
    }`}
  />
);

const Fields = ({ dark, mode, gap = 'space-y-4' }) => (
  <div className={gap}>
    {mode === 'login' ? (
      <>
        <div>
          <Lab dark={dark}>Email</Lab>
          <In dark={dark} />
        </div>
        <div>
          <Lab
            dark={dark}
            right={
              <span className={`text-[13px] font-medium ${dark ? 'text-coral/70' : 'text-rose'}`}>
                Forgot?
              </span>
            }
          >
            Password
          </Lab>
          <In dark={dark} />
        </div>
      </>
    ) : (
      <>
        {['Full name', 'Email', 'Password'].map((l) => (
          <div key={l}>
            <Lab dark={dark}>{l}</Lab>
            <In dark={dark} />
          </div>
        ))}
        <div>
          <Lab dark={dark}>Confirm password</Lab>
          <In dark={dark} />
        </div>
      </>
    )}
  </div>
);

const Foot = ({ dark, mode }) => (
  <p className={`text-center text-[12.5px] ${dark ? 'text-coral/55' : 'text-mauve'}`}>
    {TAIL[mode][0]}{' '}
    <span className={`font-medium ${dark ? 'text-coral' : 'text-plum'}`}>{TAIL[mode][1]}</span>
  </p>
);

const Head = ({ dark, mode, className = '' }) => (
  <h2
    className={`font-semibold tracking-[-0.02em] ${dark ? 'text-coral' : 'text-plum'} ${className}`}
  >
    {mode === 'login' ? 'Welcome back' : 'Create your account'}
  </h2>
);

const Sub = ({ dark, mode }) => (
  <p
    className={`mt-1.5 text-[13.5px] leading-[1.6] ${
      dark ? 'text-coral/60' : 'text-mauve'
    }`}
  >
    {SUB[mode]}
  </p>
);

const Actions = ({ dark, mode, square = false }) => (
  <div
    className={`flex h-11 w-full items-center justify-center text-[14.5px] font-semibold ${
      square ? 'rounded-none' : dark ? 'rounded-[6px]' : 'rounded-[8px]'
    } ${dark ? 'bg-coral text-plum' : 'bg-rose text-coral'}`}
  >
    {CTA[mode]}
  </div>
);

/* ---------- 1. centered minimal ---------- */

const Centered = ({ mode }) => (
  <Frame tall={mode === 'signup'}>
    <div className="flex flex-1 items-center justify-center px-8">
      <div className="w-full max-w-[340px]">
        <div className="mb-9 flex justify-center">
          <Logo />
        </div>
        <Head mode={mode} className="text-[26px] leading-[1.15]" />
        <Sub mode={mode} />
        <div className="mt-7">
          <Fields mode={mode} />
        </div>
        <div className="mt-6">
          <Actions mode={mode} />
        </div>
        <div className="mt-6">
          <Foot mode={mode} />
        </div>
      </div>
    </div>
  </Frame>
);

/* ---------- 2. split layout ---------- */

function ResumePreview() {
  return (
    <div className="w-full max-w-[290px] rounded-[4px] border border-mauve/20 bg-coral p-7 shadow-[0_1px_3px_rgba(93,73,84,0.08)]">
      <p className="text-[13px] font-semibold tracking-[-0.01em] text-plum">Ada Lovelace</p>
      <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-rose">
        Product Engineer
      </p>
      <div className="mt-6 space-y-5">
        {['Experience', 'Projects', 'Education'].map((s) => (
          <div key={s}>
            <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-mauve/70">
              {s}
            </p>
            <div className="mt-2 space-y-1.5">
              <div className="h-[5px] w-2/3 rounded-full bg-plum/15" />
              <div className="h-[5px] w-full rounded-full bg-plum/8" />
              <div className="h-[5px] w-4/5 rounded-full bg-plum/8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const Split = ({ mode }) => (
  <Frame tall={mode === 'signup'}>
    <div className="grid flex-1 grid-cols-2 divide-x divide-mauve/20">
      <div className="flex flex-col justify-between bg-beige p-8">
        <Logo />
        <div className="flex justify-center">
          <ResumePreview />
        </div>
        <p className="text-[12px] leading-[1.6] text-mauve">
          Your resume becomes a portfolio in about two minutes.
        </p>
      </div>
      <div className="flex flex-col justify-center bg-coral px-10">
        <Head mode={mode} className="text-[24px] leading-[1.2]" />
        <Sub mode={mode} />
        <div className="mt-7">
          <Fields mode={mode} />
        </div>
        <div className="mt-6">
          <Actions mode={mode} />
        </div>
        <div className="mt-6">
          <Foot mode={mode} />
        </div>
      </div>
    </div>
  </Frame>
);

/* ---------- 3. editorial ---------- */

const Editorial = ({ mode }) => (
  <Frame tall={mode === 'signup'}>
    <div className="flex flex-1 flex-col px-10 pt-9">
      <div className="flex items-center justify-between border-b border-mauve/20 pb-3">
        <Logo />
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-mauve/70">
          01 — Account
        </span>
      </div>
      <div className="grid flex-1 grid-cols-[1fr_320px] items-center gap-12">
        <div>
          <Head
            mode={mode}
            className="max-w-[300px] text-[38px] leading-[1.03] tracking-[-0.035em]"
          />
          <p className="mt-4 max-w-[260px] text-[13.5px] leading-[1.7] text-mauve">{SUB[mode]}</p>
          <div className="mt-9 flex items-center gap-3">
            <span className="h-px w-10 bg-rose" />
            <span className="text-[11px] font-medium text-plum">{CTA[mode]}</span>
          </div>
        </div>
        <div>
          <Fields mode={mode} gap="space-y-3.5" />
          <div className="mt-6">
            <Actions mode={mode} />
          </div>
          <div className="mt-6">
            <Foot mode={mode} />
          </div>
        </div>
      </div>
    </div>
  </Frame>
);

/* ---------- 4. compact saas ---------- */

const Compact = ({ mode }) => (
  <Frame tall={mode === 'signup'}>
    <div className="flex flex-1 flex-col items-center justify-center px-8">
      <div className="mb-6">
        <Logo />
      </div>
      <div className="w-full max-w-[344px] rounded-[12px] border border-mauve/20 bg-coral p-7">
        <Head mode={mode} className="text-[19px]" />
        <p className="mt-1 text-[13px] leading-[1.55] text-mauve">{SUB[mode]}</p>
        <div className="mt-5">
          <Fields mode={mode} gap="space-y-3" />
        </div>
        <div className="mt-5 space-y-2.5">
          <Actions mode={mode} />
        </div>
      </div>
      <div className="mt-5">
        <Foot mode={mode} />
      </div>
    </div>
  </Frame>
);

/* ---------- 5. developer ---------- */

const Dev = ({ mode }) => (
  <Frame dark tall={mode === 'signup'}>
    <div className="flex flex-1 flex-col px-9 pt-8">
      <div className="flex items-center justify-between border-b border-coral/15 pb-3">
        <span className="font-mono text-[12px] text-coral/90">
          portfoliai<span className="text-coral/45"> auth</span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-coral/40">
          {mode === 'login' ? 'signin' : 'register'}
        </span>
      </div>
      <div className="flex flex-1 items-center">
        <div className="w-full max-w-[380px]">
          <h2 className="font-mono text-[17px] font-medium text-coral">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-1.5 text-[13px] leading-[1.6] text-coral/55">{SUB[mode]}</p>
          <div className="mt-7 space-y-3.5">
            {mode === 'login' ? (
              <>
                <div>
                  <Lab dark>Email</Lab>
                  <In dark />
                </div>
                <div>
                  <Lab
                    dark
                    right={
                      <span className="font-mono text-[11px] text-coral/60">forgot?</span>
                    }
                  >
                    Password
                  </Lab>
                  <In dark />
                </div>
              </>
            ) : (
              ['Full name', 'Email', 'Password', 'Confirm password'].map((l) => (
                <div key={l}>
                  <Lab dark>{l}</Lab>
                  <In dark />
                </div>
              ))
            )}
          </div>
          <div className="mt-6">
            <Actions dark mode={mode} />
          </div>
          <div className="mt-6">
            <Foot dark mode={mode} />
          </div>
        </div>
      </div>
      <p className="pb-6 font-mono text-[10px] uppercase tracking-[0.14em] text-coral/30">
        POST /api/auth/{mode === 'login' ? 'login' : 'register'}
      </p>
    </div>
  </Frame>
);

/* ---------- 6. swiss ---------- */

const Swiss = ({ mode }) => (
  <Frame tall={mode === 'signup'}>
    <div className="grid flex-1 grid-cols-[92px_1fr] border-t border-plum">
      <div className="flex flex-col justify-between border-r border-mauve/20 px-5 py-7">
        <span className="text-[10px] font-semibold tracking-[0.1em] text-plum">PAI</span>
        <span className="text-[10px] uppercase tracking-[0.14em] text-mauve/70">2026</span>
      </div>
      <div className="flex flex-col px-10 pt-7">
        <div className="flex items-baseline justify-between border-b border-plum pb-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-plum">
            {mode === 'login' ? '01 Sign in' : '01 Register'}
          </span>
          <span className="text-[10px] uppercase tracking-[0.16em] text-mauve/70">
            Resume to Portfolio
          </span>
        </div>
        <div className="grid flex-1 grid-cols-[1fr_300px] gap-10 pt-8">
          <div>
            <Head mode={mode} className="text-[30px] leading-[1.02] tracking-[-0.04em]" />
            <p className="mt-3 max-w-[220px] text-[13px] leading-[1.65] text-mauve">
              {SUB[mode]}
            </p>
            <div className="mt-8 h-px w-full bg-mauve/20" />
            <p className="mt-3 text-[11px] leading-[1.7] text-mauve/80">
              Upload a resume. Review the extracted content. Publish a portfolio you own.
            </p>
          </div>
          <div>
            <div className="divide-y divide-mauve/20 border-y border-mauve/20 py-1">
              {(mode === 'login'
                ? ['Email', 'Password']
                : ['Full name', 'Email', 'Password', 'Confirm password']
              ).map((l) => (
                <div key={l} className="flex items-center justify-between py-3">
                  <span className="text-[13px] font-medium text-plum">{l}</span>
                  <span className="text-[10px] uppercase tracking-[0.14em] text-rose">
                    {l === 'Password' ? '8+ · A-Z · 1' : 'req'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Actions mode={mode} square />
            </div>
            <div className="mt-6">
              <Foot mode={mode} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Frame>
);

/* ---------- board ---------- */

const CONCEPTS = [
  { n: '01', name: 'Centered Minimal', note: 'Single centered column, maximum whitespace. The default safe choice.', render: Centered },
  { n: '02', name: 'Split Layout', note: 'Document preview left, form right. Sells the product before you type.', render: Split },
  { n: '03', name: 'Editorial', note: 'Oversized type, asymmetric columns, quiet accent rule.', render: Editorial },
  { n: '04', name: 'Compact SaaS', note: 'Tight bordered card. Highest form density per pixel.', render: Compact },
  { n: '05', name: 'Developer', note: 'Deep plum + coral, mono labels, sharp radii.', render: Dev },
  { n: '06', name: 'Swiss', note: 'Grid rules, hairline dividers, no radius anywhere.', render: Swiss },
];

export default function AuthBoard() {
  return (
    <div className="min-h-screen bg-beige text-plum">
      <header className="border-b border-mauve/20 px-10 py-8">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-6">
          <div>
            <Logo />
            <h1 className="mt-5 text-[26px] font-semibold tracking-[-0.02em]">
              Authentication — design directions
            </h1>
            <p className="mt-1.5 text-[14px] text-mauve">
              Six minimal directions, each shown in Login and Sign Up state.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            {PALETTE.map(([hex, name, swatch]) => (
              <div key={hex} className="flex items-center gap-2">
                <span
                  className={`h-6 w-6 rounded-[4px] border border-mauve/25 ${swatch}`}
                  style={{ background: hex }}
                />
                <span className="text-[11px] leading-tight text-mauve">
                  {name}
                  <br />
                  <span className="text-mauve/70">{hex}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-14 px-10 py-12">
        {CONCEPTS.map(({ n, name, note, render: Screen }) => (
          <section key={n}>
            <div className="mb-5 flex items-baseline gap-4">
              <span className="font-mono text-[12px] text-mauve/70">{n}</span>
              <h2 className="text-[17px] font-semibold tracking-[-0.01em]">{name}</h2>
              <span className="text-[13px] text-mauve">{note}</span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {['login', 'signup'].map((mode) => (
                <div key={mode}>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-mauve/70">
                    {mode === 'login' ? 'Login' : 'Sign Up'}
                  </p>
                  <Screen mode={mode} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}