import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API as BASE } from '../api';
import {
  Banner, EyeToggle, Field, Logo, PrimaryButton, SwitchPrompt,
} from '../components/AuthUI';

const API = `${BASE}/api/auth`;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const res = await axios.post(`${API}/login`, { email, password });
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
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-[400px]">
          <h1 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.02em]">
            Welcome back
          </h1>
          <p className="mt-2 text-[14.5px] leading-[1.6] text-mauve">
            Sign in to continue building your portfolio.
          </p>

          {error && <Banner>{error}</Banner>}
          {notice && <Banner tone="notice">{notice}</Banner>}

          <form onSubmit={submit} className="mt-8 space-y-[18px]">
            <Field
              id="login-email"
              label="Email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Field
              id="login-password"
              label="Password"
              type={show ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              right={
                <button
                  type="button"
                  onClick={() =>
                    setNotice(
                      notice
                        ? ''
                        : 'Password reset is not available yet — contact support for help.',
                    )
                  }
                  className="text-[13px] font-medium text-rose transition-colors hover:text-plum"
                >
                  Forgot password?
                </button>
              }
              adornment={
                <EyeToggle shown={show} onClick={() => setShow((v) => !v)} label="Show password" />
              }
            />

            <PrimaryButton busy={busy} busyLabel="Signing in…" className="mt-2">
              Sign in
            </PrimaryButton>
          </form>

          <SwitchPrompt className="mt-7">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-plum hover:text-rose">
              Sign up
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
