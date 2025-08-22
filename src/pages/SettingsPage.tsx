import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { UserProfileService } from '../services/userProfileService';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  label: string;
  description?: string;
  type: 'toggle' | 'select' | 'button' | 'input';
  value?: any;
  options?: { label: string; value: any }[];
  action?: () => void;
  variant?: 'default' | 'danger';
}

export const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const { profile, loading: profileLoading } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      workoutReminders: true,
      achievementAlerts: true,
      weeklyReports: true,
      emailUpdates: false,
    },
    appearance: {
      language: 'en',
    },
    privacy: {
      profileVisibility: 'private',
      dataSharing: false,
      analytics: true,
    },
    workout: {
      autoStartTimer: true,
      restTimerSound: true,
      metricUnits: true, // true for metric, false for imperial
    }
  });

  const handleSettingChange = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const settingsSections: SettingsSection[] = [
    {
      id: 'profile',
      title: 'Profile',
      description: 'Manage your account information',
      icon: UserCircleIcon,
      items: [
        {
          id: 'edit-profile',
          label: 'Edit Profile',
          description: 'Update your personal information and fitness goals',
          type: 'button',
          action: () => {/* TODO: Navigate to profile edit */}
        },
        {
          id: 'change-password',
          label: 'Change Password',
          description: 'Update your account password',
          type: 'button',
          action: () => {/* TODO: Open password change modal */}
        }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Control how and when you receive notifications',
      icon: BellIcon,
      items: [
        {
          id: 'workout-reminders',
          label: 'Workout Reminders',
          description: 'Get notified when it\'s time for your scheduled workouts',
          type: 'toggle',
          value: settings.notifications.workoutReminders
        },
        {
          id: 'achievement-alerts',
          label: 'Achievement Alerts',
          description: 'Celebrate when you unlock new achievements',
          type: 'toggle',
          value: settings.notifications.achievementAlerts
        },
        {
          id: 'weekly-reports',
          label: 'Weekly Progress Reports',
          description: 'Receive weekly summaries of your fitness progress',
          type: 'toggle',
          value: settings.notifications.weeklyReports
        },
        {
          id: 'email-updates',
          label: 'Email Updates',
          description: 'Get fitness tips and app updates via email',
          type: 'toggle',
          value: settings.notifications.emailUpdates
        }
      ]
    },
    {
      id: 'appearance',
      title: 'Appearance',
      description: 'Customize the look and feel of the app',
      icon: PaintBrushIcon,
      items: [
        {
          id: 'language',
          label: 'Language',
          description: 'Select your preferred language',
          type: 'select',
          value: settings.appearance.language,
          options: [
            { label: 'English', value: 'en' },
            { label: 'Spanish', value: 'es' },
            { label: 'French', value: 'fr' },
            { label: 'German', value: 'de' }
          ]
        }
      ]
    },
    {
      id: 'workout',
      title: 'Workout Preferences',
      description: 'Customize your workout experience',
      icon: CogIcon,
      items: [
        {
          id: 'auto-start-timer',
          label: 'Auto-start Rest Timer',
          description: 'Automatically start rest timer after completing a set',
          type: 'toggle',
          value: settings.workout.autoStartTimer
        },
        {
          id: 'rest-timer-sound',
          label: 'Rest Timer Sound',
          description: 'Play sound when rest timer completes',
          type: 'toggle',
          value: settings.workout.restTimerSound
        },
        {
          id: 'metric-units',
          label: 'Use Metric Units',
          description: 'Display weights in kg instead of lbs',
          type: 'toggle',
          value: settings.workout.metricUnits
        }
      ]
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      description: 'Control your data and privacy settings',
      icon: ShieldCheckIcon,
      items: [
        {
          id: 'profile-visibility',
          label: 'Profile Visibility',
          description: 'Control who can see your profile',
          type: 'select',
          value: settings.privacy.profileVisibility,
          options: [
            { label: 'Private', value: 'private' },
            { label: 'Friends Only', value: 'friends' },
            { label: 'Public', value: 'public' }
          ]
        },
        {
          id: 'data-sharing',
          label: 'Data Sharing',
          description: 'Share anonymized data to help improve the app',
          type: 'toggle',
          value: settings.privacy.dataSharing
        },
        {
          id: 'analytics',
          label: 'Analytics',
          description: 'Help us improve by sharing usage analytics',
          type: 'toggle',
          value: settings.privacy.analytics
        }
      ]
    },
    {
      id: 'account',
      title: 'Account',
      description: 'Manage your account and data',
      icon: UserCircleIcon,
      items: [
        {
          id: 'export-data',
          label: 'Export Data',
          description: 'Download a copy of your workout data',
          type: 'button',
          action: () => {/* TODO: Implement data export */}
        },
        {
          id: 'delete-account',
          label: 'Delete Account',
          description: 'Permanently delete your account and all data',
          type: 'button',
          variant: 'danger',
          action: () => {/* TODO: Implement account deletion */}
        },
        {
          id: 'sign-out',
          label: 'Sign Out',
          description: 'Sign out of your account',
          type: 'button',
          action: handleSignOut
        }
      ]
    }
  ];

  const renderSettingItem = (item: SettingsItem, sectionId: string) => {
    switch (item.type) {
      case 'toggle':
        return (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-neutral-900">{item.label}</p>
              {item.description && (
                <p className="text-sm text-neutral-600">{item.description}</p>
              )}
            </div>
            <button
              onClick={() => handleSettingChange(sectionId, item.id.replace('-', ''), !item.value)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                item.value ? 'bg-primary-600' : 'bg-neutral-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  item.value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        );

      case 'select':
        return (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-neutral-900">{item.label}</p>
                {item.description && (
                  <p className="text-sm text-neutral-600">{item.description}</p>
                )}
              </div>
            </div>
            <select
              value={item.value}
              onChange={(e) => handleSettingChange(sectionId, item.id, e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {item.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'button':
        return (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-neutral-900">{item.label}</p>
              {item.description && (
                <p className="text-sm text-neutral-600">{item.description}</p>
              )}
            </div>
            <Button
              variant={item.variant === 'danger' ? 'danger' : 'outline'}
              size="sm"
              onClick={item.action}
              loading={loading && item.id === 'sign-out'}
            >
              {item.id === 'sign-out' ? 'Sign Out' : 'Configure'}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-neutral-900 mb-4">Settings</h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Customize your NeuraFit experience and manage your account preferences
        </p>
      </motion.div>

      {/* User Info Card */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="w-8 h-8 text-primary-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-neutral-900">
                  {user.displayName || 'User'}
                </h3>
                <p className="text-neutral-600">{user.email}</p>
                {profile && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="primary" size="sm">
                      {profile.fitnessLevel}
                    </Badge>
                    <Badge variant="accent" size="sm">
                      {profile.fitnessGoals.length} goals
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Settings Sections */}
      <div className="space-y-6">
        {settingsSections.map((section, sectionIndex) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + sectionIndex * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {section.title}
                    </h3>
                    <p className="text-sm text-neutral-600">{section.description}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {section.items.map((item) => (
                    <div key={item.id} className="border-b border-neutral-200 last:border-b-0 pb-6 last:pb-0">
                      {renderSettingItem(item, section.id)}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
