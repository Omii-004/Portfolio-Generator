// Shared primitives for the /login and /signup screens.
// One visual system, two pages. Colors come from tailwind.config.js:
//   bg-beige #E6DBD0 page · bg-coral #F9E0D9 surface · text-plum #5D4954
//   text-mauve #7D6167 muted · accent-rose #754F5B · text-err #A63D40
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export function Logo({ onDark = false, sub = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`grid h-7 w-7 place-items-center rounded-[7px] text-[13px] font-semibold leading-none ${
          onDark ? 'bg-coral text-plum' : 'bg-rose text-coral'
        }`}
      >
        P
      </span>
      <span
        className={`text-[15px] font-semibold tracking-[-0.01em] ${
          onDark ? 'text-coral' : 'text-plum'
        }`}
      >
        PortfoliAI
        {sub && (
          <span
            className={`ml-2 font-normal ${onDark ? 'text-coral/50' : 'text-mauve/70'}`}
          >
            Resume to portfolio
          </span>
        )}
      </span>
    </span>
  );
}

export const inputBase =
  'h-11 w-full rounded-[8px] border border-mauve/30 bg-coral px-3.5 text-[14.5px] text-plum outline-none transition placeholder:text-mauve/55 focus:border-rose focus:ring-4 focus:ring-rose/15';

export function Field({ id, label, right, error, adornment, className = '', ...props }) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-plum">
          {label}
        </label>
        {right}
      </div>
      <div className="relative">
        <input
          id={id}
          className={`${inputBase} ${adornment ? 'pr-11' : ''} ${error ? 'border-err' : ''}`}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        />
        {adornment}
      </div>
      {error && <p className="mt-1.5 text-[12.5px] text-err">{error}</p>}
    </div>
  );
}

export function EyeToggle({ shown, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="absolute right-1 top-1/2 -translate-y-1/2 rounded-[6px] p-2 text-mauve/70 transition-colors hover:text-plum"
    >
      {shown ? <EyeOff className="h-[17px] w-[17px]" /> : <Eye className="h-[17px] w-[17px]" />}
    </button>
  );
}

export function PrimaryButton({ busy, busyLabel, children, className = '' }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className={`flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-rose text-[14.5px] font-semibold text-coral transition-colors hover:bg-plum disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {busy ? busyLabel : children}
    </button>
  );
}

export function Banner({ tone = 'error', children }) {
  const tones = {
    error: 'border-err/30 bg-coral text-err',
    notice: 'border-rose/30 bg-coral text-plum',
  };
  return (
    <div
      role="status"
      className={`mb-5 rounded-[8px] border px-3.5 py-2.5 text-[13px] font-medium ${tones[tone]}`}
    >
      {children}
    </div>
  );
}

export function SwitchPrompt({ children, className = '' }) {
  return <p className={`text-center text-[13.5px] text-mauve ${className}`}>{children}</p>;
}