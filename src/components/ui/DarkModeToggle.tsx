import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

interface DarkModeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({
  className = '',
  size = 'md'
}) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const sizeClasses = {
    sm: 'w-12 h-6',
    md: 'w-14 h-7',
    lg: 'w-16 h-8',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      onClick={toggleDarkMode}
      className={`
        relative inline-flex items-center justify-center
        ${sizeClasses[size]}
        bg-neutral-200 dark:bg-dark-background-tertiary
        rounded-full transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        dark:focus:ring-offset-dark-background
        hover:bg-neutral-300 dark:hover:bg-dark-background-quaternary
        ${className}
      `}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      role="switch"
    >
      <motion.div
        className={`
          absolute flex items-center justify-center
          ${sizeClasses[size]}
          bg-white dark:bg-dark-foreground
          rounded-full shadow-medium
          transition-all duration-300
        `}
        animate={{
          x: isDark ? '50%' : '-50%',
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
      >
        <motion.div
          animate={{
            rotate: isDark ? 180 : 0,
            scale: isDark ? 0.8 : 1,
          }}
          transition={{
            duration: 0.3,
            ease: 'easeInOut',
          }}
        >
          {isDark ? (
            <MoonIcon className={`${iconSizeClasses[size]} text-dark-background`} />
          ) : (
            <SunIcon className={`${iconSizeClasses[size]} text-warning-500`} />
          )}
        </motion.div>
      </motion.div>
      
      {/* Background icons */}
      <div className="absolute inset-0 flex items-center justify-between px-1">
        <SunIcon 
          className={`${iconSizeClasses[size]} text-warning-500 transition-opacity duration-300 ${
            isDark ? 'opacity-30' : 'opacity-70'
          }`} 
        />
        <MoonIcon 
          className={`${iconSizeClasses[size]} text-primary-400 transition-opacity duration-300 ${
            isDark ? 'opacity-70' : 'opacity-30'
          }`} 
        />
      </div>
    </button>
  );
};
