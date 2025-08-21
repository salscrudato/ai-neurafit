import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { signOut } from 'firebase/auth';
import {
  HomeIcon,
  PlayIcon,
  ClockIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,

  ChartBarIcon,
  TrophyIcon,
  Cog6ToothIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  PlayIcon as PlayIconSolid,
  ClockIcon as ClockIconSolid,
  UserIcon as UserIconSolid,

  ChartBarIcon as ChartBarIconSolid,
  TrophyIcon as TrophyIconSolid
} from '@heroicons/react/24/solid';
import { auth } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { Badge } from '../ui/Badge';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/app',
    icon: HomeIcon,
    iconSolid: HomeIconSolid,
    description: 'Your fitness overview',
    color: 'primary'
  },
  {
    name: 'Workout',
    href: '/app/workout',
    icon: PlayIcon,
    iconSolid: PlayIconSolid,
    description: 'Start your training',
    color: 'energy',
    badge: 'New'
  },
  {
    name: 'Progress',
    href: '/app/progress',
    icon: ChartBarIcon,
    iconSolid: ChartBarIconSolid,
    description: 'Track your gains',
    color: 'success'
  },
  {
    name: 'History',
    href: '/app/history',
    icon: ClockIcon,
    iconSolid: ClockIconSolid,
    description: 'Past workouts',
    color: 'secondary'
  },
  {
    name: 'Achievements',
    href: '/app/achievements',
    icon: TrophyIcon,
    iconSolid: TrophyIconSolid,
    description: 'Your milestones',
    color: 'achievement'
  },
  {
    name: 'Profile',
    href: '/app/profile',
    icon: UserIcon,
    iconSolid: UserIconSolid,
    description: 'Settings & preferences',
    color: 'accent'
  },
];

export const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // removed getActiveItem (unused)

  // const activeItem = getActiveItem();
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      {/* Desktop Navigation */}
      <motion.nav
        role="navigation"
        aria-label="Primary"
        className="hidden md:flex md:fixed md:top-0 md:left-0 md:right-0 md:z-50 bg-white/95 backdrop-blur-xl border-b border-neutral-200/50 shadow-elevated"
        initial={{ y: shouldReduceMotion ? 0 : -100 }}
        animate={{ y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <motion.div
                className="flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <h1 className="text-3xl font-display font-bold bg-gradient-energy bg-clip-text text-transparent cursor-pointer"
                    onClick={() => navigate('/app')}>
                  NeuraFit
                </h1>
              </motion.div>

              <div className="ml-12 flex items-center space-x-1">
                {navigationItems.slice(0, 4).map((item) => {
                  const isActive = item.href === location.pathname ||
                    (item.href !== '/app' && location.pathname.startsWith(item.href));
                  const IconComponent = isActive ? item.iconSolid : item.icon;

                  return (
                    <motion.div key={item.name} className="relative">
                      <NavLink
                        to={item.href}
                        className={`relative px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center group ${
                          isActive
                            ? 'bg-gradient-primary text-white shadow-glow-primary'
                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                        }`}
                      >
                        <IconComponent aria-hidden className={`w-5 h-5 mr-3 transition-transform duration-300 ${
                          isActive ? 'scale-110' : 'group-hover:scale-110'
                        }`} />
                        <span>{item.name}</span>

                        {item.badge && !isActive && (
                          <Badge
                            variant="accent"
                            size="xs"
                            className="ml-2 animate-pulse"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </NavLink>

                      {/* Active indicator */}
                      {isActive && (
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
              <div className="flex items-center space-x-2">
                {/* Notifications */}
                <motion.button
                  className="relative p-3 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all duration-200"
                  onClick={() => setShowNotifications(!showNotifications)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <BellIcon className="w-5 h-5" />
                  <Badge
                    variant="error"
                    size="xs"
                    className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center"
                  >
                    3
                  </Badge>
                </motion.button>

                {/* Settings */}
                <motion.button
                  className="p-3 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all duration-200"
                  onClick={() => navigate('/app/settings')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                </motion.button>
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-neutral-900">
                    {user?.displayName || 'Fitness Enthusiast'}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="achievement-gold" size="xs">
                      🔥 7 day streak
                    </Badge>
                  </div>
                </div>

                <motion.button
                  onClick={handleSignOut}
                  className="text-neutral-600 hover:text-error-600 p-3 rounded-xl hover:bg-error-50 transition-all duration-200 group"
                  title="Sign out"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowRightOnRectangleIcon aria-hidden className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
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
            const isActive = item.href === location.pathname ||
              (item.href !== '/app' && location.pathname.startsWith(item.href));
            const IconComponent = isActive ? item.iconSolid : item.icon;

            return (
              <motion.div key={item.name} className="relative">
                <NavLink
                  to={item.href}
                  className={`flex flex-col items-center py-3 px-2 text-xs font-semibold transition-all duration-300 rounded-2xl min-h-[68px] justify-center relative ${
                    isActive
                      ? 'text-white bg-gradient-primary shadow-glow-primary'
                      : 'text-neutral-600 active:text-neutral-900 active:bg-neutral-100'
                  }`}
                >
                  <motion.div
                    animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <IconComponent aria-hidden className="w-6 h-6 mb-1" />
                  </motion.div>
                  <span className="text-center leading-tight">{item.name}</span>

                  {item.badge && !isActive && (
                    <div className="absolute -top-1 -right-1">
                      <Badge variant="error" size="xs" className="min-w-[16px] h-4 text-[10px]">
                        !
                      </Badge>
                    </div>
                  )}
                </NavLink>

                {/* Active indicator */}
                {isActive && (
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

      {/* Desktop top padding */}
      <div className="hidden md:block h-20" />

      {/* Mobile bottom padding */}
      <div className="md:hidden h-20" />
    </>
  );
};
