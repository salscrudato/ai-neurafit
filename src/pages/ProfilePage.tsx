import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

import { useAuthStore } from '../store/authStore';
import { UserProfileService } from '../services/userProfileService';
import { AuthService } from '../services/authService';

import type {
  Equipment,
  FitnessGoal,
  FitnessLevel,
  WorkoutType,
} from '../types';

/* --------------------------------- Options --------------------------------- */

const fitnessLevels: { value: FitnessLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const fitnessGoals: { value: FitnessGoal; label: string }[] = [
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'build_muscle', label: 'Build Muscle' },
  { value: 'improve_cardio', label: 'Improve Cardio' },
  { value: 'improve_flexibility', label: 'Improve Flexibility' },
  { value: 'general_fitness', label: 'General Fitness' },
  { value: 'sport_specific', label: 'Sport Specific' },
];

const equipmentOptions: { value: Equipment; label: string }[] = [
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'kettlebells', label: 'Kettlebells' },
  { value: 'resistance_bands', label: 'Resistance Bands' },
  { value: 'pull_up_bar', label: 'Pull-up bar' },
  { value: 'yoga_mat', label: 'Yoga Mat' },
  { value: 'cardio_machine', label: 'Cardio Machine' },
  { value: 'gym_access', label: 'Gym Access' },
];

const workoutTypes: { value: WorkoutType; label: string }[] = [
  { value: 'strength_training', label: 'Strength Training' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'pilates', label: 'Pilates' },
  { value: 'stretching', label: 'Stretching' },
  { value: 'functional', label: 'Functional' },
  { value: 'circuit', label: 'Circuit' },
];

const preferredTimeOptions = ['Morning', 'Afternoon', 'Evening'] as const;
type PreferredTime = (typeof preferredTimeOptions)[number];

type Intensity = 'low' | 'moderate' | 'high';

/* --------------------------------- Helpers --------------------------------- */

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const toggleInArray = <T,>(arr: T[], value: T) =>
  arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

const sameArray = <T,>(a: T[], b: T[]) =>
  a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);

/** Quick chip control (keyboard accessible) */
const Chip: React.FC<{
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}> = ({ selected, onClick, children, ariaLabel }) => (
  <button
    type="button"
    aria-pressed={!!selected}
    aria-label={ariaLabel}
    onClick={onClick}
    className={[
      'inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition border',
      selected
        ? 'bg-primary-600 text-white border-primary-600 shadow-sm hover:bg-primary-700'
        : 'bg-neutral-100 text-neutral-800 border-neutral-200 hover:bg-neutral-200',
    ].join(' ')}
  >
    {children}
  </button>
);

/* --------------------------------- Types ---------------------------------- */

type FormState = {
  displayName: string;
  fitnessLevel: FitnessLevel | null;
  fitnessGoals: FitnessGoal[];
  availableEquipment: Equipment[];
  timeCommitment: {
    daysPerWeek: number;
    minutesPerSession: number;
    preferredTimes: PreferredTime[];
  };
  preferences: {
    workoutTypes: WorkoutType[];
    intensity: Intensity;
    restDayPreference: number; // 0..6 (Sun..Sat)
    injuriesOrLimitations: string[];
  };
};

/* --------------------------------- Page ----------------------------------- */

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, setProfile } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialForm: FormState = useMemo(
    () => ({
      displayName: user?.displayName || '',
      fitnessLevel: profile?.fitnessLevel ?? null,
      fitnessGoals: profile?.fitnessGoals ?? [],
      availableEquipment: profile?.availableEquipment ?? ['bodyweight'],
      timeCommitment: {
        daysPerWeek: profile?.timeCommitment?.daysPerWeek ?? 3,
        minutesPerSession: profile?.timeCommitment?.minutesPerSession ?? 30,
        preferredTimes:
          (profile?.timeCommitment?.preferredTimes as PreferredTime[] | undefined) ??
          ['Morning'],
      },
      preferences: {
        workoutTypes: profile?.preferences?.workoutTypes ?? ['strength_training'],
        intensity: (profile?.preferences?.intensity as Intensity) ?? 'moderate',
        restDayPreference: profile?.preferences?.restDayPreference ?? 1,
        injuriesOrLimitations: profile?.preferences?.injuriesOrLimitations ?? [],
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.displayName, profile?.updatedAt?.toString()]
  );

  const [form, setForm] = useState<FormState>(initialForm);

  // Load or hydrate on mount
  useEffect(() => {
    document.title = 'Profile • NeuraFit';
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        // If store doesn't have profile, fetch it
        if (!profile) {
          const p = await UserProfileService.getUserProfile();
          if (p) {
            setProfile(p);
          }
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rehydrate form when store profile changes
  useEffect(() => {
    setForm({
      displayName: user?.displayName || '',
      fitnessLevel: profile?.fitnessLevel ?? null,
      fitnessGoals: profile?.fitnessGoals ?? [],
      availableEquipment: profile?.availableEquipment ?? ['bodyweight'],
      timeCommitment: {
        daysPerWeek: profile?.timeCommitment?.daysPerWeek ?? 3,
        minutesPerSession: profile?.timeCommitment?.minutesPerSession ?? 30,
        preferredTimes:
          (profile?.timeCommitment?.preferredTimes as PreferredTime[] | undefined) ??
          ['Morning'],
      },
      preferences: {
        workoutTypes: profile?.preferences?.workoutTypes ?? ['strength_training'],
        intensity: (profile?.preferences?.intensity as Intensity) ?? 'moderate',
        restDayPreference: profile?.preferences?.restDayPreference ?? 1,
        injuriesOrLimitations: profile?.preferences?.injuriesOrLimitations ?? [],
      },
    });
  }, [profile, user?.displayName]);

  const hasChanges = useMemo(() => {
    if (!profile) return true;
    const sameDisplay = (form.displayName || '') === (user?.displayName || '');
    const same =
      form.fitnessLevel === profile.fitnessLevel &&
      sameArray(form.fitnessGoals, profile.fitnessGoals) &&
      sameArray(form.availableEquipment, profile.availableEquipment) &&
      form.timeCommitment.daysPerWeek === profile.timeCommitment.daysPerWeek &&
      form.timeCommitment.minutesPerSession === profile.timeCommitment.minutesPerSession &&
      sameArray(form.timeCommitment.preferredTimes, profile.timeCommitment.preferredTimes as PreferredTime[]) &&
      (form.preferences.intensity === profile.preferences.intensity) &&
      form.preferences.restDayPreference === profile.preferences.restDayPreference &&
      sameArray(form.preferences.injuriesOrLimitations, profile.preferences.injuriesOrLimitations) &&
      sameArray(form.preferences.workoutTypes, profile.preferences.workoutTypes);
    return !(same && sameDisplay);
  }, [form, profile, user?.displayName]);

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setStatus(null);

    try {
      // Update Firebase Auth displayName if changed
      if (form.displayName && form.displayName !== (user?.displayName || '')) {
        const { auth } = await import('../lib/firebase');
        const { updateProfile } = await import('firebase/auth');
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: form.displayName });
        }
      }

      // Update profile in backend
      await UserProfileService.updateUserProfile({
        fitnessLevel: form.fitnessLevel ?? 'beginner',
        fitnessGoals: form.fitnessGoals,
        availableEquipment: form.availableEquipment,
        timeCommitment: {
          daysPerWeek: clamp(form.timeCommitment.daysPerWeek, 1, 7),
          minutesPerSession: clamp(form.timeCommitment.minutesPerSession, 10, 180),
          preferredTimes: form.timeCommitment.preferredTimes,
        },
        preferences: {
          workoutTypes: form.preferences.workoutTypes,
          intensity: form.preferences.intensity,
          restDayPreference: clamp(form.preferences.restDayPreference, 0, 6),
          injuriesOrLimitations: form.preferences.injuriesOrLimitations,
        },
      });

      // Refresh store with latest profile
      const refreshed = await UserProfileService.getUserProfile();
      if (refreshed) setProfile(refreshed);

      setStatus('Profile updated successfully.');
    } catch (e: any) {
      setError(e?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const onResetPassword = async () => {
    if (!user?.email) return setError('No email found for this account.');
    setSaving(true);
    setStatus(null);
    setError(null);
    try {
      await AuthService.resetPassword(user.email);
      setStatus(`Password reset email sent to ${user.email}.`);
    } catch (e: any) {
      setError(e?.message || 'Could not send password reset email.');
    } finally {
      setSaving(false);
    }
  };

  const onSignOut = async () => {
    try {
      await AuthService.signOut();
      navigate('/');
    } catch (e: any) {
      setError(e?.message || 'Failed to sign out.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-neutral-700">Loading your profile…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="card p-8 text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Complete your profile</h1>
          <p className="text-neutral-600 mb-6">
            We couldn’t find your fitness profile. Complete onboarding to personalize your training.
          </p>
          <Link to="/onboarding">
            <Button variant="energy" size="lg">Start Onboarding</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onResetPassword} disabled={saving}>
            Reset Password
          </Button>
          <Button variant="error" onClick={onSignOut} disabled={saving}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Status + Errors */}
      {(status || error) && (
        <div
          className={[
            'mb-6 rounded-lg border px-4 py-3',
            status ? 'bg-green-50 border-green-200 text-green-700' : 'bg-rose-50 border-rose-200 text-rose-700',
          ].join(' ')}
          role="status"
          aria-live="polite"
        >
          {status ?? error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="card lg:col-span-1"
        >
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Account</h2>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-gradient-energy text-white grid place-items-center font-bold text-xl">
              {(form.displayName || user?.email || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-neutral-900">{form.displayName || '—'}</p>
              <p className="text-sm text-neutral-600">{user?.email ?? 'No email'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Display name"
              name="displayName"
              type="text"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              placeholder="Your name"
            />

            <div className="pt-2">
              <p className="text-sm font-medium text-neutral-700 mb-2">Fitness level</p>
              <div className="flex flex-wrap gap-2">
                {fitnessLevels.map((lvl) => (
                  <Chip
                    key={lvl.value}
                    selected={form.fitnessLevel === lvl.value}
                    onClick={() => setForm((f) => ({ ...f, fitnessLevel: lvl.value }))}
                    ariaLabel={`Fitness level ${lvl.label}`}
                  >
                    {lvl.label}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Goals & Equipment */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="card lg:col-span-2"
        >
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Goals & Equipment</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Goals */}
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-2">Primary goals</p>
              <div className="flex flex-wrap gap-2">
                {fitnessGoals.map((g) => (
                  <Chip
                    key={g.value}
                    selected={form.fitnessGoals.includes(g.value)}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        fitnessGoals: toggleInArray(f.fitnessGoals, g.value),
                      }))
                    }
                    ariaLabel={`Toggle goal ${g.label}`}
                  >
                    {g.label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-2">Available equipment</p>
              <div className="flex flex-wrap gap-2">
                {equipmentOptions.map((eq) => (
                  <Chip
                    key={eq.value}
                    selected={form.availableEquipment.includes(eq.value)}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        availableEquipment: toggleInArray(f.availableEquipment, eq.value),
                      }))
                    }
                    ariaLabel={`Toggle equipment ${eq.label}`}
                  >
                    {eq.label}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Time & Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="card lg:col-span-2"
        >
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Schedule & Preferences</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Input
                label="Days per week"
                name="daysPerWeek"
                type="number"
                min={1}
                max={7}
                value={form.timeCommitment.daysPerWeek}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    timeCommitment: {
                      ...f.timeCommitment,
                      daysPerWeek: clamp(Number(e.target.value || 0), 1, 7),
                    },
                  }))
                }
              />
            </div>
            <div>
              <Input
                label="Minutes per session"
                name="minutesPerSession"
                type="number"
                min={10}
                max={180}
                value={form.timeCommitment.minutesPerSession}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    timeCommitment: {
                      ...f.timeCommitment,
                      minutesPerSession: clamp(Number(e.target.value || 0), 10, 180),
                    },
                  }))
                }
              />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-2">Preferred time of day</p>
              <div className="flex flex-wrap gap-2">
                {preferredTimeOptions.map((t) => (
                  <Chip
                    key={t}
                    selected={form.timeCommitment.preferredTimes.includes(t)}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        timeCommitment: {
                          ...f.timeCommitment,
                          preferredTimes: toggleInArray(f.timeCommitment.preferredTimes, t),
                        },
                      }))
                    }
                    ariaLabel={`Toggle time ${t}`}
                  >
                    {t}
                  </Chip>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Workout types */}
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-2">Preferred workout types</p>
              <div className="flex flex-wrap gap-2">
                {workoutTypes.map((wt) => (
                  <Chip
                    key={wt.value}
                    selected={form.preferences.workoutTypes.includes(wt.value)}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        preferences: {
                          ...f.preferences,
                          workoutTypes: toggleInArray(f.preferences.workoutTypes, wt.value),
                        },
                      }))
                    }
                    ariaLabel={`Toggle ${wt.label}`}
                  >
                    {wt.label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Intensity */}
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-2">Typical intensity</p>
              <div className="flex flex-wrap gap-2">
                {(['low', 'moderate', 'high'] as Intensity[]).map((lvl) => (
                  <Chip
                    key={lvl}
                    selected={form.preferences.intensity === lvl}
                    onClick={() =>
                      setForm((f) => ({ ...f, preferences: { ...f.preferences, intensity: lvl } }))
                    }
                    ariaLabel={`Set intensity ${lvl}`}
                  >
                    {lvl[0].toUpperCase() + lvl.slice(1)}
                  </Chip>
                ))}
              </div>
            </div>
          </div>

          {/* Injuries / Limitations */}
          <div className="mt-6">
            <p className="text-sm font-medium text-neutral-700 mb-2">Injuries or limitations</p>
            <div className="bg-white border border-neutral-200 rounded-xl p-3">
              <textarea
                className="w-full resize-y min-h-[88px] outline-none"
                placeholder="List any injuries or movement restrictions (e.g., left shoulder impingement)"
                value={form.preferences.injuriesOrLimitations.join('\n')}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    preferences: {
                      ...f.preferences,
                      injuriesOrLimitations: e.target.value
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    },
                  }))
                }
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {form.preferences.injuriesOrLimitations.map((tag, i) => (
                <Badge key={`${tag}-${i}`} variant="secondary" size="sm" className="truncate max-w-[200px]">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="mt-8 flex items-center gap-3">
            <Button
              onClick={onSave}
              disabled={!hasChanges || saving || !form.fitnessLevel}
              loading={saving}
              size="lg"
              className="px-8"
            >
              Save changes
            </Button>
            {!form.fitnessLevel && (
              <span className="text-sm text-rose-600">Select your fitness level to save.</span>
            )}
            {!hasChanges && (
              <span className="text-sm text-neutral-500">No changes to save.</span>
            )}
          </div>
        </motion.div>

        {/* Tips / Info */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="card lg:col-span-1"
        >
          <h2 className="text-lg font-semibold text-neutral-900 mb-3">Quick tips</h2>
          <ul className="space-y-2 text-sm text-neutral-700">
            <li>• Keep “Injuries or limitations” up to date so workouts adapt safely.</li>
            <li>• Minutes/session drives workout block sizing and pacing.</li>
            <li>• Goals + equipment shape your AI workout recommendations.</li>
          </ul>
          <div className="mt-4">
            <Badge variant="gradient" animate>AI‑Powered</Badge>
          </div>
        </motion.div>
      </div>
    </div>
  );
};