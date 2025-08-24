import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { updateProfile } from 'firebase/auth';

import { PageContainer } from '../components/ui/Container';
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

import { useAuthStore } from '../store/authStore';
import { useWorkoutStore } from '../store/workoutStore';
import { AuthService } from '../services/authService';
import { UserProfileService } from '../services/userProfileService';
import { auth } from '../lib/firebase';

/* -----------------------------------------------------------------------------
 * Local Types & Constants
 * ---------------------------------------------------------------------------*/
type ThemeChoice = 'system' | 'light' | 'dark';
type NotificationSettings = {
  workoutReminders: boolean;
  coachingTips: boolean;
  productEmails: boolean;
};

const THEME_STORAGE_KEY = 'nf:theme';
const NOTIFY_STORAGE_KEY = 'nf:settings:notifications';

/* -----------------------------------------------------------------------------
 * Small, accessible Toggle (no external deps)
 * ---------------------------------------------------------------------------*/
const Toggle: React.FC<{
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  id?: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, description, id, disabled }) => {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1">
        <label htmlFor={id} className="block text-sm font-medium text-neutral-900">
          {label}
        </label>
        {description && <p className="mt-0.5 text-sm text-neutral-600">{description}</p>}
      </div>

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
          checked ? 'bg-primary-600' : 'bg-neutral-300',
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110',
        ].join(' ')}
      >
        <span
          aria-hidden="true"
          className={[
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200',
            checked ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
    </div>
  );
};

/* -----------------------------------------------------------------------------
 * Theme helpers
 * ---------------------------------------------------------------------------*/
function getStoredTheme(): ThemeChoice {
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  return (raw === 'light' || raw === 'dark' || raw === 'system') ? raw : 'system';
}

function applyTheme(choice: ThemeChoice) {
  // Ensure we respect OS preference when "system" is selected
  const prefersDark = typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  const html = typeof document !== 'undefined' ? document.documentElement : null;
  if (!html) return;

  const effective = choice === 'system' ? (prefersDark ? 'dark' : 'light') : choice;
  if (effective === 'dark') {
    html.setAttribute('data-theme', 'dark');
  } else {
    html.removeAttribute('data-theme');
  }
}

function listenToSystemTheme(cb: (isDark: boolean) => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => cb(e.matches);
  mq.addEventListener?.('change', handler);
  return () => {
    mq.removeEventListener?.('change', handler);
  };
}

/* -----------------------------------------------------------------------------
 * Page
 * ---------------------------------------------------------------------------*/
export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { user, profile, setUser, setProfile } = useAuthStore();
  const { workoutHistory } = useWorkoutStore();

  // Profile
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Theme
  const [theme, setTheme] = useState<ThemeChoice>(() => getStoredTheme());
  const [systemDark, setSystemDark] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );

  // Notifications (local-only for now)
  const [notify, setNotify] = useState<NotificationSettings>(() => {
    try {
      const raw = localStorage.getItem(NOTIFY_STORAGE_KEY);
      return raw ? JSON.parse(raw) as NotificationSettings : {
        workoutReminders: false,
        coachingTips: true,
        productEmails: false,
      };
    } catch {
      return { workoutReminders: false, coachingTips: true, productEmails: false };
    }
  });

  // Page title
  useEffect(() => { document.title = 'Settings • NeuraFit'; }, []);

  // Theme init + effects
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    let unlisten = () => {};
    if (theme === 'system') {
      unlisten = listenToSystemTheme((isDark) => {
        setSystemDark(isDark);
        applyTheme('system');
      });
    }
    return () => unlisten();
  }, [theme]);

  // Sync displayName when store updates
  useEffect(() => setDisplayName(user?.displayName ?? ''), [user?.displayName]);

  // Persist notification settings
  useEffect(() => {
    localStorage.setItem(NOTIFY_STORAGE_KEY, JSON.stringify(notify));
  }, [notify]);

  const effectiveTheme = useMemo(() => {
    return theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
  }, [theme, systemDark]);

  const saveProfile = async () => {
    if (!auth.currentUser) return;
    setSavingProfile(true);
    setProfileError(null);
    setProfileSaved(null);
    try {
      // Update Firebase displayName
      if (displayName && displayName !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName });
      }

      // Optionally refresh profile from backend (if needed later)
      try {
        const latest = await UserProfileService.getUserProfile();
        setProfile(latest);
      } catch {
        // non-blocking
      }

      // Update local store user
      if (user) {
        setUser({ ...user, displayName, updatedAt: new Date() });
      }

      setProfileSaved('Changes saved.');
    } catch (e: any) {
      setProfileError(e?.message || 'Failed to save changes.');
    } finally {
      setSavingProfile(false);
    }
  };

  const exportMyData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      user,
      profile,
      settings: { theme, effectiveTheme, notifications: notify },
      workoutHistory,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neurafit-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearLocalCaches = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    // Clear non-essential local storage keys (keep auth/session)
    try {
      localStorage.removeItem(NOTIFY_STORAGE_KEY);
    } catch {}
  };

  const signOut = async () => {
    try {
      await AuthService.signOut();
      // Navigation handled by auth listener → redirects to landing
    } catch (e) {
      // Non-blocking; UI can remain
      if (import.meta.env.DEV) console.error(e);
    }
  };

  if (!user) {
    return (
      <PageContainer>
        <div className="min-h-[40vh] grid place-items-center">
          <div className="text-center">
            <LoadingSpinner className="mx-auto mb-4" />
            <p className="text-neutral-600">Loading your settings…</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-neutral-900">Settings</h1>
        <p className="mt-1 text-neutral-600">Manage your account, appearance, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Column 1: Account */}
        <div className="xl:col-span-2 space-y-6">
          {/* Profile */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Profile</CardTitle>
                <CardSubtitle>Update your basic account information.</CardSubtitle>
              </div>
              <Badge variant="secondary" size="sm">Account</Badge>
            </CardHeader>
            <CardBody className="space-y-5">
              <Input
                label="Display name"
                name="displayName"
                type="text"
                value={displayName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
              <Input
                label="Email (read‑only)"
                name="email"
                type="email"
                value={user.email}
                disabled
              />
              {profileSaved && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {profileSaved}
                </div>
              )}
              {profileError && (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {profileError}
                </div>
              )}
            </CardBody>
            <CardFooter className="flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setDisplayName(user.displayName || '')}
                disabled={savingProfile}
              >
                Reset
              </Button>
              <Button onClick={saveProfile} loading={savingProfile}>
                Save changes
              </Button>
            </CardFooter>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Appearance</CardTitle>
                <CardSubtitle>Choose how NeuraFit looks on your device.</CardSubtitle>
              </div>
              <Badge variant="accent" size="sm">{theme === 'system' ? 'System' : effectiveTheme === 'dark' ? 'Dark' : 'Light'}</Badge>
            </CardHeader>
            <CardBody className="space-y-4">
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-neutral-900 mb-1">Theme</legend>

                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    className="h-4 w-4"
                    name="theme"
                    value="system"
                    checked={theme === 'system'}
                    onChange={() => setTheme('system')}
                  />
                  <span className="text-neutral-800">System</span>
                  <span className="ml-2 rounded-full px-2 py-0.5 text-xs bg-neutral-100 text-neutral-600">
                    {systemDark ? 'Currently dark' : 'Currently light'}
                  </span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    className="h-4 w-4"
                    name="theme"
                    value="light"
                    checked={theme === 'light'}
                    onChange={() => setTheme('light')}
                  />
                  <span className="text-neutral-800">Light</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    className="h-4 w-4"
                    name="theme"
                    value="dark"
                    checked={theme === 'dark'}
                    onChange={() => setTheme('dark')}
                  />
                  <span className="text-neutral-800">Dark</span>
                </label>
              </fieldset>
            </CardBody>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardSubtitle>Configure how and when you want to be notified.</CardSubtitle>
              </div>
            </CardHeader>
            <CardBody>
              <div className="divide-y divide-neutral-200">
                <Toggle
                  checked={notify.workoutReminders}
                  onChange={(v) => setNotify((n) => ({ ...n, workoutReminders: v }))}
                  label="Workout reminders"
                  description="Get reminders to stay consistent with your plan."
                  id="notify-workout"
                />
                <Toggle
                  checked={notify.coachingTips}
                  onChange={(v) => setNotify((n) => ({ ...n, coachingTips: v }))}
                  label="AI coaching tips"
                  description="Receive insights and form cues after sessions."
                  id="notify-tips"
                />
                <Toggle
                  checked={notify.productEmails}
                  onChange={(v) => setNotify((n) => ({ ...n, productEmails: v }))}
                  label="Product emails"
                  description="Occasional updates about new features."
                  id="notify-email"
                />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Column 2: Security/Data */}
        <div className="space-y-6">
          {/* Security & Password */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Security</CardTitle>
                <CardSubtitle>Manage session and password options.</CardSubtitle>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              <Button
                variant="secondary"
                className="w-full"
                onClick={async () => {
                  try {
                    await AuthService.resetPassword(user.email);
                    alert('If an account exists for your email, a reset link has been sent.');
                  } catch (e: any) {
                    alert(e?.message || 'Unable to start password reset.');
                  }
                }}
              >
                Send password reset email
              </Button>

              <Button variant="ghost" className="w-full" onClick={signOut}>
                Sign out
              </Button>
            </CardBody>
          </Card>

          {/* Data Controls */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Data & Storage</CardTitle>
                <CardSubtitle>Export your data or clear local caches.</CardSubtitle>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              <Button variant="outline" className="w-full" onClick={exportMyData}>
                Export my data (JSON)
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={clearLocalCaches}
                title="Clears local query cache and non-essential settings"
              >
                Clear local cache
              </Button>
            </CardBody>
          </Card>

          {/* Danger Zone (placeholder) */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Danger zone</CardTitle>
                <CardSubtitle>Permanent actions (coming soon).</CardSubtitle>
              </div>
              <Badge variant="error" size="sm">Caution</Badge>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-neutral-600">
                Account deletion will be available in a future update from account owners only.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};