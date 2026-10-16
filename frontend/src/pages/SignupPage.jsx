import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API as BASE } from '../api';
import {
  Banner, EyeToggle, Field, Logo, PrimaryButton, SwitchPrompt,
} from '../components/AuthUI';

const API = `${BASE}/api/auth`;

const RULES = [
  { label: '8+ characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
];

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hints, setHints] = useState(false);
  const [agree, setAgree] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const mismatch = confirm.length > 0 && confirm !== password;
  const done = RULES.filter((r) => r.test(password)).length;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!fullName.trim()) return setError('Please enter your full name.');
    if (done < RULES.length) return setError('Password does not meet the requirements.');
    if (mismatch) return setError('Passwords do not match.');
    if (!agree) return setError('Please accept the Terms of Service to continue.');

    setBusy(true);
    try {
      const res = await axios.post(`${API}/register`, {
        full_name: fullName,
        email,
        password,
      });
      login(res.data.access_token);
      navigate('/upload');
    } catch (err) {
      setBusy(false);
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-beige text-plum">
      <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-7 sm:px-10">
        <Link to="/" aria-label="PortfoliAI home">
          <Logo />
        </Link>
        <Link
          to="/login"
          className="text-[13.5px] font-medium text-mauve transition-colors hover:text-plum"
        >
          Sign in
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-[400px]">
          <h1 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.02em]">
            Create your account
          </h1>
          <p className="mt-2 text-[14.5px] leading-[1.6] text-mauve">
            Start turning your resume into a portfolio.
          </p>

          {error && <Banner>{error}</Banner>}
          {notice && <Banner tone="notice">{notice}</Banner>}

          <form onSubmit={submit} className="mt-8 space-y-[18px]">
            <Field
              id="signup-name"
              label="Full name"
              required
              autoComplete="name"
              autoFocus
              placeholder="Ada Lovelace"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <Field
              id="signup-email"
              label="Email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Field
              id="signup-password"
              label="Password"
              type={show ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setHints(true)}
              onBlur={() => setHints(false)}
              right={
                <span className="text-[12px] text-mauve/75">
                  {done}/{RULES.length}
                </span>
              }
              adornment={
                <EyeToggle shown={show} onClick={() => setShow((v) => !v)} label="Show password" />
              }
            />

            {hints && (
              <ul className="-mt-2 space-y-1">
                {RULES.map((r) => {
                  const ok = r.test(password);
                  return (
                    <li
                      key={r.label}
                      className={`flex items-center gap-1.5 text-[12.5px] ${
                        ok ? 'text-rose' : 'text-mauve/75'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      {r.label}
                    </li>
                  );
                })}
              </ul>
            )}

            <Field
              id="signup-confirm"
              label="Confirm password"
              type={showConfirm ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={mismatch ? 'Passwords do not match.' : ''}
              adornment={
                <EyeToggle
                  shown={showConfirm}
                  onClick={() => setShowConfirm((v) => !v)}
                  label="Show password"
                />
              }
            />

            <label className="flex items-start gap-2.5 text-[12.5px] leading-[1.5] text-mauve">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-rose"
              />
              <span>
                I agree to the{' '}
                <a href="#terms" className="font-medium text-plum hover:text-rose">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#privacy" className="font-medium text-plum hover:text-rose">
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            <PrimaryButton busy={busy} busyLabel="Creating account…" className="mt-1">
              Create account
            </PrimaryButton>
          </form>

          <SwitchPrompt className="mt-7">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-plum hover:text-rose">
              Sign in
            </Link>
          </SwitchPrompt>
        </div>
      </main>

      <footer className="pb-8 text-center text-[12px] text-mauve/80">
        © {new Date().getFullYear()} PortfoliAI
      </footer>
    </div>
  );
}
