import { useMemo, useState } from 'react';
import { supabase } from '../../utils/supabase';

interface LoginPageProps {
  recoveryMode?: boolean;
  onRecoveryComplete?: () => void;
}

type AuthMode = 'signIn' | 'forgotPassword' | 'resetPassword';

export function LoginPage({ recoveryMode = false, onRecoveryComplete }: LoginPageProps) {
  const mode: AuthMode = useMemo(() => (recoveryMode ? 'resetPassword' : 'signIn'), [recoveryMode]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNextPassword, setShowNextPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    if (mode === 'resetPassword') {
      if (!nextPassword || nextPassword !== confirmPassword) {
        setMessage('Passwords must match before saving the new password.');
        setSubmitting(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({
        password: nextPassword,
      });
      if (error) {
        setMessage(error.message);
      } else {
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
        }
        onRecoveryComplete?.();
        setForgotPasswordMode(false);
        setNextPassword('');
        setConfirmPassword('');
        setMessage('Password updated. You can continue into the dashboard.');
      }
      setSubmitting(false);
      return;
    }

    if (forgotPasswordMode) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Reset link sent. Check your email and open the link on this app URL.');
      }
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setMessage(error.message);
    }
    setSubmitting(false);
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <p className="eyebrow">JomoPak Internal Access</p>
        <h1>{mode === 'resetPassword' ? 'Set new password' : forgotPasswordMode ? 'Forgot password' : 'Sign in'}</h1>
        <p className="muted">
          {mode === 'resetPassword'
            ? 'Set a new password for your account to complete recovery.'
            : forgotPasswordMode
              ? 'Enter your email and the app will send you a reset link.'
              : 'Use your Supabase-authenticated account to access the dashboard.'}
        </p>
        {message ? <div className="message-strip">{message}</div> : null}
        {mode !== 'resetPassword' ? (
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
        ) : null}
        {mode === 'signIn' && !forgotPasswordMode ? (
          <label>
            Password
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button className="password-toggle" type="button" onClick={() => setShowPassword((current) => !current)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
        ) : null}
        {mode === 'resetPassword' ? (
          <>
            <label>
              New password
              <div className="password-field">
                <input
                  type={showNextPassword ? 'text' : 'password'}
                  value={nextPassword}
                  onChange={(event) => setNextPassword(event.target.value)}
                  required
                />
                <button className="password-toggle" type="button" onClick={() => setShowNextPassword((current) => !current)}>
                  {showNextPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>
            <label>
              Confirm password
              <div className="password-field">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
                <button className="password-toggle" type="button" onClick={() => setShowConfirmPassword((current) => !current)}>
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>
          </>
        ) : null}
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting
            ? mode === 'resetPassword'
              ? 'Saving...'
              : forgotPasswordMode
                ? 'Sending...'
                : 'Signing In...'
            : mode === 'resetPassword'
              ? 'Save new password'
              : forgotPasswordMode
                ? 'Send reset link'
                : 'Sign In'}
        </button>
        {mode !== 'resetPassword' ? (
          <button
            className="ghost-button"
            type="button"
            onClick={() => {
              setForgotPasswordMode((current) => !current);
              setMessage('');
            }}
          >
            {forgotPasswordMode ? 'Back to sign in' : 'Forgot password?'}
          </button>
        ) : null}
      </form>
    </div>
  );
}
