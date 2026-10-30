import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, MessageSquare, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { resetPassword, getAuthErrorMessage } from '../services/auth.service';

export function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = (): boolean => {
    if (!email) { setEmailError('Email is required.'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Enter a valid email address.');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      setAuthError(getAuthErrorMessage(err.code ?? ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg mb-4">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">CloudTalk</h1>
          <p className="text-sm text-text-muted mt-1">Reset your password</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
          {sent ? (
            <div className="flex flex-col items-center text-center py-4">
              <CheckCircle className="w-12 h-12 text-success mb-3" />
              <h2 className="text-lg font-semibold text-text-primary mb-2">Check your email</h2>
              <p className="text-sm text-text-muted mb-6">
                We sent a password reset link to <strong className="text-text-primary">{email}</strong>.
                Check your inbox and follow the instructions.
              </p>
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors focus:outline-none focus-visible:underline"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              {authError && (
                <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm" role="alert">
                  {authError}
                </div>
              )}

              <p className="text-sm text-text-muted mb-4">
                Enter the email address for your account. We'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <Input
                  id="reset-email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={emailError ?? undefined}
                  leftIcon={<Mail className="w-4 h-4" />}
                  placeholder="you@example.com"
                />
                <Button type="submit" fullWidth loading={loading} id="reset-submit">
                  Send Reset Link
                </Button>
              </form>

              <div className="mt-5 flex justify-center">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors focus:outline-none focus-visible:underline"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
