import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { register, getAuthErrorMessage } from '../services/auth.service';
import type { RegisterFormValues } from '../types';

export function RegisterPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<RegisterFormValues>({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<RegisterFormValues>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validate = (): boolean => {
    const errs: Partial<RegisterFormValues> = {};
    if (!values.displayName.trim()) errs.displayName = 'Display name is required.';
    else if (values.displayName.trim().length > 50) errs.displayName = 'Display name must be 50 characters or less.';
    if (!values.email) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errs.email = 'Enter a valid email.';
    if (!values.password) errs.password = 'Password is required.';
    else if (values.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (!values.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
    else if (values.password !== values.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await register(values.email, values.password, values.displayName.trim());
      navigate('/chat');
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
          <p className="text-sm text-text-muted mt-1">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm" role="alert">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              id="register-name"
              label="Display Name"
              type="text"
              autoComplete="name"
              value={values.displayName}
              onChange={(e) => setValues((v) => ({ ...v, displayName: e.target.value }))}
              error={errors.displayName}
              leftIcon={<User className="w-4 h-4" />}
              placeholder="Your name"
              maxLength={50}
            />

            <Input
              id="register-email"
              label="Email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
              error={errors.email}
              leftIcon={<Mail className="w-4 h-4" />}
              placeholder="you@example.com"
            />

            <Input
              id="register-password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={values.password}
              onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
              error={errors.password}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              placeholder="Min 6 characters"
              helperText="Must be at least 6 characters"
            />

            <Input
              id="register-confirm"
              label="Confirm Password"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={(e) => setValues((v) => ({ ...v, confirmPassword: e.target.value }))}
              error={errors.confirmPassword}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              placeholder="Repeat password"
            />

            <Button type="submit" fullWidth loading={loading} id="register-submit">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-text-muted mt-5">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors focus:outline-none focus-visible:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
