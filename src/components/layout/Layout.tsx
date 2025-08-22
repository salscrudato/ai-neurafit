import React, { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navigation } from './Navigation';
import { SkipLink } from '../ui/AccessibilityProvider';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { pageVariants, pageTransition } from '../../utils/animations';

export const Layout: React.FC = () => {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const mainRef = useRef<HTMLElement>(null);

  // Move focus to main on route change (pairs with SkipLink)
  useEffect(() => {
    mainRef.current?.focus();
  }, [location.pathname]);

  const variants = reduceMotion
    ? {
        initial: { opacity: 1, y: 0 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 1, y: 0 },
      }
    : pageVariants;

  const transition = reduceMotion ? undefined : pageTransition;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/20 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-primary opacity-10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-accent opacity-10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%236366f1%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221.5%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
      </div>

      <div className="relative z-10">
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <Navigation />

        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          role="main"
          className="focus:outline-none pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-0 md:pt-18"
        >
          <div className="px-4 sm:px-6 lg:px-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transition}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};