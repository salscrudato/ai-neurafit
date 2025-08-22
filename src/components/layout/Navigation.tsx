import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { signOut } from 'firebase/auth';
import {
  HomeIcon,
  PlayIcon,
  ClockIcon,
  UserIcon,
  ArrowRightStartOnRectangleIcon,
  Cog6ToothIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  PlayIcon as PlayIconSolid,
  ClockIcon as ClockIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid';
import { auth } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { Badge } from '../ui/Badge';

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
  iconSolid: React.ComponentType<React.ComponentProps<'svg'>>;
  description: string;
  color:
    | 'primary'
    | 'energy'
    | 'success'
    | 'secondary'
    | 'achievement'
    | 'accent';
  badge?: string;
};

const navigationItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/app',
    icon: HomeIcon,
    iconSolid: HomeIconSolid,
    description: 'Your fitness overview',
    color: 'primary',
  },
  {
    name: 'Workout',
    href: '/app/workout',
    icon: PlayIcon,
    iconSolid: PlayIconSolid,
    description: 'Start your training',
    color: 'energy',
    badge: 'New',
  },
  {
    name: 'History',
    href: '/app/history',
    icon: ClockIcon,
    iconSolid: ClockIconSolid,
    description: 'Past workouts',
    color: 'secondary',
  },
  {
    name: 'Profile',
    href: '/app/profile',
    icon: UserIcon,
    iconSolid: UserIconSolid,
    description: 'Settings & preferences',
    color: 'accent',
  },
];

/** Prefetch likely‑next route chunk on hover/focus. */
const prefetchRoute = (to: string) => {
  // Keep this in sync with your lazy imports in App.tsx
  if (to.startsWith('/app/workout')) import('../../pages/WorkoutPage').catch(() => {});
  else if (to.startsWith('/app/history')) import('../../pages/HistoryPage').catch(() => {});
  else if (to.startsWith('/app/profile')) import('../../pages/ProfilePage').catch(() => {});
  else if (to === '/app') import('../../pages/DashboardPage').catch(() => {});
};

export const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Close notifications on outside click / route change
  useEffect(() => {
    const onDocClick = (e: MouseEvent | TouchEvent) => {
      if (!notificationsRef.current) return;
      if (!notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('touchstart', onDocClick);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('touchstart', onDocClick);
    };
  }, []);
  useEffect(() => setShowNotifications(false), [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      // Keep a console error in dev; avoid UI flash
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Error signing out:', error);
      }
    }
  };

  // Utility to compute active state compatible with nested routes
  const isActiveHref = (href: string) =>
    href === location.pathname ||
    (href !== '/app' && location.pathname.startsWith(href));

  return (
    <>
      {/* Desktop Navigation */}
      <motion.nav
        role="navigation"
        aria-label="Primary"
        className="hidden md:flex md:fixed md:top-0 md:left-0 md:right-0 md:z-50 bg-white/95 backdrop-blur-xl border-b border-neutral-200/50 shadow-sm"
        initial={{ y: shouldReduceMotion ? 0 : -100 }}
        animate={{ y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <motion.button
                type="button"
                className="flex-shrink-0"
                whileHover={{ scale: shouldReduceMotion ? 1 : 1.05 }}
                whileTap={{ scale: shouldReduceMotion ? 1 : 0.95 }}
                onClick={() => navigate('/app')}
                aria-label="Go to dashboard"
              >
                <h1 className="text-3xl font-display font-bold bg-gradient-energy bg-clip-text text-transparent cursor-pointer">
                  NeuraFit
                </h1>
              </motion.button>

              <div className="ml-12 flex items-center space-x-1">
                {navigationItems.slice(0, 4).map((item) => {
                  const active = isActiveHref(item.href);
                  const Icon = active ? item.iconSolid : item.icon;
                  return (
                    <motion.div key={item.name} className="relative">
                      <NavLink
                        to={item.href}
                        aria-current={active ? 'page' : undefined}
                        onMouseEnter={() => prefetchRoute(item.href)}
                        onFocus={() => prefetchRoute(item.href)}
                        onPointerEnter={() => prefetchRoute(item.href)}
                        className={`relative px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center group ${
                          active
                            ? 'bg-energy-500 text-white shadow-sm'
                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                        }`}
                        title={item.description}
                      >
                        <Icon
                          aria-hidden
                          className={`w-5 h-5 mr-3 transition-transform duration-300 ${
                            active ? 'scale-110' : 'group-hover:scale-110'
                          }`}
                        />
                        <span>{item.name}</span>

                        {item.badge && !active && (
                          <Badge variant="accent" size="xs" className="ml-2 animate-pulse">
                            {item.badge}
                          </Badge>
                        )}
                      </NavLink>

                      {/* Active indicator */}
                      {active && (
                        <motion.div
                          className="absolute -bottom-1 left-1/2 w-2 h-2 bg-primary-500 rounded-full"
                          layoutId="activeIndicator"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          style={{ x: '-50%' }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Quick Actions */}
              <div className="relative flex items-center space-x-2" ref={notificationsRef}>
                {/* Notifications */}
                <motion.button
                  className="relative p-3 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all duration-200"
                  aria-haspopup="dialog"
                  aria-expanded={showNotifications}
                  aria-controls="notifications-popover"
                  onClick={() => setShowNotifications((s) => !s)}
                  whileHover={{ scale: shouldReduceMotion ? 1 : 1.05 }}
                  whileTap={{ scale: shouldReduceMotion ? 1 : 0.95 }}
                >
                  <BellIcon className="w-5 h-5" aria-hidden />
                  <Badge
                    variant="error"
                    size="xs"
                    className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center"
                  >
                    3
                  </Badge>
                </motion.button>

                {/* Popover */}
                {showNotifications && (
                  <motion.div
                    id="notifications-popover"
                    role="dialog"
                    aria-label="Notifications"
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-black/5 bg-white/95 backdrop-blur-md shadow-lg p-4"
                  >
                    <h3 className="text-sm font-semibold text-neutral-900">
                      Notifications
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm">
                      <li className="rounded-lg p-3 bg-neutral-50">
                        <span className="font-medium">New PR unlocked!</span>
                        <div className="text-neutral-600">
                          1‑rep max squat improved to 265 lb.
                        </div>
                      </li>
                      <li className="rounded-lg p-3 bg-neutral-50">
                        <span className="font-medium">Streak day 7 🔥</span>
                        <div className="text-neutral-600">
                          Keep it going—recovery looks solid.
                        </div>
                      </li>
                      <li className="rounded-lg p-3 bg-neutral-50">
                        <span className="font-medium">Coach tip</span>
                        <div className="text-neutral-600">
                          Add tempo to your push‑ups for more time under tension.
                        </div>
                      </li>
                    </ul>
                  </motion.div>
                )}

                {/* Settings */}
                <motion.button
                  className="p-3 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all duration-200"
                  onClick={() => {
                    prefetchRoute('/app/settings');
                    navigate('/app/settings');
                  }}
                  whileHover={{ scale: shouldReduceMotion ? 1 : 1.05 }}
                  whileTap={{ scale: shouldReduceMotion ? 1 : 0.95 }}
                  aria-label="Open settings"
                  title="Settings"
                >
                  <Cog6ToothIcon className="w-5 h-5" aria-hidden />
                </motion.button>
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-neutral-900">
                    {user?.displayName || 'Fitness Enthusiast'}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="achievement-gold" size="xs">🔥 7 day streak</Badge>
                  </div>
                </div>

                <motion.button
                  onClick={handleSignOut}
                  className="text-neutral-600 hover:text-error-600 p-3 rounded-xl hover:bg-error-50 transition-all duration-200 group"
                  title="Sign out"
                  aria-label="Sign out"
                  whileHover={{ scale: shouldReduceMotion ? 1 : 1.05 }}
                  whileTap={{ scale: shouldReduceMotion ? 1 : 0.95 }}
                >
                  <ArrowRightStartOnRectangleIcon
                    aria-hidden
                    className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
                  />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation */}
      <motion.nav
        role="navigation"
        aria-label="Bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-neutral-200/50 shadow-elevated-lg safe-area-bottom"
        initial={{ y: shouldReduceMotion ? 0 : 100 }}
        animate={{ y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: shouldReduceMotion ? 0 : 0.1 }}
      >
        <div className="grid grid-cols-4 py-2 px-2">
          {navigationItems.slice(0, 4).map((item) => {
            const active = isActiveHref(item.href);
            const Icon = active ? item.iconSolid : item.icon;
            return (
              <motion.div key={item.name} className="relative">
                <NavLink
                  to={item.href}
                  aria-current={active ? 'page' : undefined}
                  onMouseEnter={() => prefetchRoute(item.href)}
                  onFocus={() => prefetchRoute(item.href)}
                  onPointerEnter={() => prefetchRoute(item.href)}
                  onTouchStart={() => prefetchRoute(item.href)}
                  className={`flex flex-col items-center py-3 px-2 text-xs font-semibold transition-all duration-300 rounded-2xl min-h-[68px] justify-center relative ${
                    active
                      ? 'text-white bg-energy-500 shadow-sm'
                      : 'text-neutral-600 active:text-neutral-900 active:bg-neutral-100'
                  }`}
                  title={item.description}
                >
                  <motion.div
                    animate={active ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon aria-hidden className="w-6 h-6 mb-1" />
                  </motion.div>
                  <span className="text-center leading-tight">{item.name}</span>

                  {item.badge && !active && (
                    <div className="absolute -top-1 -right-1">
                      <Badge variant="error" size="xs" className="min-w-[16px] h-4 text-[10px]">
                        !
                      </Badge>
                    </div>
                  )}
                </NavLink>

                {/* Active indicator */}
                {active && (
                  <motion.div
                    className="absolute top-1 left-1/2 w-1 h-1 bg-white rounded-full"
                    layoutId="mobileActiveIndicator"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{ x: '-50%' }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Safe area padding for devices with home indicator */}
        <div className="h-safe-bottom" />
      </motion.nav>

      {/* Mobile Profile FAB (keeps Profile reachable without crowding the tab bar) */}
      <motion.button
        type="button"
        onClick={() => {
          prefetchRoute('/app/profile');
          navigate('/app/profile');
        }}
        aria-label="Open profile"
        className="md:hidden fixed right-4 bottom-[calc(76px+env(safe-area-inset-bottom))] z-[51] rounded-full p-3 shadow-glow-primary bg-white border border-black/5"
        initial={{ scale: shouldReduceMotion ? 1 : 0.9, opacity: shouldReduceMotion ? 1 : 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
        title="Profile"
      >
        <UserIcon className="w-6 h-6 text-neutral-800" aria-hidden />
      </motion.button>

      {/* Desktop top padding */}
      <div className="hidden md:block h-20" />

      {/* Mobile bottom padding */}
      <div className="md:hidden h-20" />
    </>
  );
};