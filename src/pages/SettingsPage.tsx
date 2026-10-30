import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, BellOff, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuthContext } from '../app/providers/AuthContext';
import { registerFCMToken, removeFCMToken } from '../services/notifications.service';
import toast from 'react-hot-toast';

export function SettingsPage() {
  const { user } = useAuthContext();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    if (!('Notification' in window)) {
      setPermission('unsupported');
    } else {
      setPermission(Notification.permission);
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleEnableNotifications = async () => {
    if (!user) return;
    if (!('Notification' in window)) {
      toast.error('Push notifications are not supported in this browser.');
      return;
    }

    const perm = await Notification.requestPermission();
    setPermission(perm);

    if (perm !== 'granted') {
      toast.error('Notification permission was denied. Enable it in your browser settings.');
      setNotificationsEnabled(false);
      return;
    }

    const token = await registerFCMToken(user.uid);
    if (token) {
      setCurrentToken(token);
      setNotificationsEnabled(true);
      toast.success('Push notifications enabled!');
    } else {
      toast.error('Failed to enable notifications. Check VAPID key configuration.');
    }
  };

  const handleDisableNotifications = async () => {
    if (!user || !currentToken) {
      setNotificationsEnabled(false);
      return;
    }
    try {
      await removeFCMToken(user.uid, currentToken);
      setCurrentToken(null);
      setNotificationsEnabled(false);
      toast.success('Notifications disabled.');
    } catch {
      toast.error('Failed to disable notifications.');
    }
  };

  return (
    <div className="min-h-screen bg-app-bg p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/chat"
            className="p-2 rounded-xl hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Back to chat"
          >
            <ArrowLeft className="w-5 h-5 text-text-muted" />
          </Link>
          <h1 className="text-xl font-bold text-text-primary">Settings</h1>
        </div>

        <div className="space-y-4">
          {/* Notifications */}
          <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
            <h2 className="text-base font-semibold text-text-primary mb-1">Push Notifications</h2>
            <p className="text-sm text-text-muted mb-4">
              Get notified when you receive new messages. Requires browser permission and FCM configuration.
            </p>

            {permission === 'unsupported' && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-4">
                Push notifications are not supported in this browser.
              </div>
            )}

            {permission === 'denied' && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm mb-4">
                Notification permission was denied. Please enable it in your browser settings.
              </div>
            )}

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                {notificationsEnabled ? (
                  <Bell className="w-4 h-4 text-success" />
                ) : (
                  <BellOff className="w-4 h-4 text-text-muted" />
                )}
                <span className="text-sm text-text-primary">
                  {notificationsEnabled ? 'Notifications enabled' : 'Notifications disabled'}
                </span>
              </div>
              <Button
                variant={notificationsEnabled ? 'secondary' : 'primary'}
                size="sm"
                onClick={notificationsEnabled ? handleDisableNotifications : handleEnableNotifications}
                disabled={permission === 'unsupported' || permission === 'denied'}
                id="toggle-notifications"
              >
                {notificationsEnabled ? 'Disable' : 'Enable'}
              </Button>
            </div>

            {notificationsEnabled && (
              <div className="flex items-center justify-between py-2 border-t border-border mt-2">
                <div className="flex items-center gap-2">
                  {showPreview ? (
                    <Eye className="w-4 h-4 text-text-muted" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-text-muted" />
                  )}
                  <div>
                    <span className="text-sm text-text-primary">Message preview</span>
                    <p className="text-xs text-text-muted">Show message text in notification</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreview((p) => !p)}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  style={{ backgroundColor: showPreview ? '#4F46E5' : '#d1d5db' }}
                  role="switch"
                  aria-checked={showPreview}
                  aria-label="Toggle message preview in notifications"
                >
                  <span
                    className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    style={{ transform: showPreview ? 'translateX(24px)' : 'translateX(4px)' }}
                  />
                </button>
              </div>
            )}

            <p className="text-xs text-text-muted mt-3 border-t border-border pt-3">
              ⚠️ Notifications require a valid VAPID key and Cloud Functions deployment.
              See the README for setup instructions.
            </p>
          </div>

          {/* Account info */}
          <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
            <h2 className="text-base font-semibold text-text-primary mb-3">Account</h2>
            <div className="text-sm text-text-muted space-y-1">
              <p><span className="font-medium text-text-primary">Email:</span> {user?.email}</p>
              <p><span className="font-medium text-text-primary">UID:</span> <span className="font-mono text-xs">{user?.uid}</span></p>
            </div>
            <div className="mt-3">
              <Link
                to="/profile"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Edit Profile →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
