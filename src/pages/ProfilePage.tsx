import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Info, ArrowLeft, Save, LogOut } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { Spinner } from '../components/ui/Spinner';
import { useAuthContext } from '../app/providers/AuthContext';
import { getUserProfile, updateUserProfile } from '../services/users.service';
import { logout } from '../services/auth.service';
import type { UserProfile } from '../types';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [about, setAbout] = useState('');
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid)
      .then((p) => {
        setProfile(p);
        setDisplayName(p?.displayName ?? '');
        setAbout(p?.about ?? '');
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!displayName.trim()) {
      setDisplayNameError('Display name is required.');
      return;
    }
    if (displayName.trim().length > 50) {
      setDisplayNameError('Display name must be 50 characters or less.');
      return;
    }
    setDisplayNameError(null);
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        about: about.trim(),
      });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      toast.error('Failed to sign out. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <Spinner size="lg" label="Loading profile…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/chat"
            className="p-2 rounded-xl hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Back to chat"
          >
            <ArrowLeft className="w-5 h-5 text-text-muted" />
          </Link>
          <h1 className="text-xl font-bold text-text-primary">Profile Settings</h1>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
          {/* Avatar section */}
          <div className="flex flex-col items-center mb-6 pb-6 border-b border-border">
            <Avatar
              name={displayName || user?.displayName || 'You'}
              photoURL={user?.photoURL}
              size="xl"
              className="mb-3"
            />
            <h2 className="text-lg font-semibold text-text-primary">{displayName || 'Your Name'}</h2>
            <p className="text-sm text-text-muted">{user?.email}</p>
            <p className="text-xs text-text-muted mt-1">
              Profile photo: Update via Google account or future photo upload feature.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} noValidate className="space-y-4">
            <Input
              id="profile-displayname"
              label="Display Name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              error={displayNameError ?? undefined}
              leftIcon={<User className="w-4 h-4" />}
              maxLength={50}
              helperText={`${displayName.length}/50 characters`}
            />

            <div>
              <label htmlFor="profile-about" className="block text-sm font-medium text-text-primary mb-1.5">
                About
              </label>
              <textarea
                id="profile-about"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                rows={3}
                maxLength={200}
                placeholder="Tell people a little about yourself…"
                className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all hover:border-border-hover"
              />
              <p className="text-xs text-text-muted mt-1">{about.length}/200</p>
            </div>

            <div className="bg-muted/40 rounded-xl p-3 flex items-start gap-2">
              <Mail className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-text-primary">Email</p>
                <p className="text-xs text-text-muted">{user?.email}</p>
                <p className="text-[10px] text-text-muted mt-0.5">
                  Email cannot be changed here. Use Firebase Authentication to update it.
                </p>
              </div>
            </div>

            <Button type="submit" fullWidth loading={saving} id="profile-save">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </form>

          {/* Sign out */}
          <div className="mt-6 pt-6 border-t border-border">
            <Button
              variant="danger"
              fullWidth
              onClick={handleLogout}
              id="profile-signout"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
