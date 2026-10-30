import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

// ─── Mock react-router-dom navigate ──────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as object),
    useNavigate: () => mockNavigate,
  };
});

// ─── Mock auth service ───────────────────────────────────────────────────────

const mockLogin = vi.fn();
const mockSignInWithGoogle = vi.fn();
vi.mock('../../src/services/auth.service', () => ({
  login: mockLogin,
  signInWithGoogle: mockSignInWithGoogle,
  getAuthErrorMessage: (code: string) => `Error: ${code}`,
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import { LoginPage } from '../../src/pages/LoginPage';

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors when form submitted empty', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('shows email format validation error', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'notanemail');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  it('calls login service with correct credentials', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({});
    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows auth error when login fails', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce({ code: 'auth/wrong-password' });
    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('has link to register page', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: /create account/i })).toBeInTheDocument();
  });

  it('has link to reset password page', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
  });
});
