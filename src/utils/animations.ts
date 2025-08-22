import type { Variants, Transition } from 'framer-motion';

// Standard easing curves
export const easings = {
  easeOut: [0.4, 0, 0.2, 1] as const,
  easeIn: [0.4, 0, 1, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
} as const;

// Standard transitions
export const transitions = {
  fast: { duration: 0.2 } as Transition,
  normal: { duration: 0.3 } as Transition,
  slow: { duration: 0.5 } as Transition,
} as const;

// Common animation variants
export const fadeUp = (delay = 0): Variants => ({
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay }
  },
});

export const fadeIn = (delay = 0): Variants => ({
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3, delay }
  },
});

export const slideInUp = (delay = 0): Variants => ({
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay }
  },
});

export const slideInDown = (delay = 0): Variants => ({
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay }
  },
});

export const slideInLeft = (delay = 0): Variants => ({
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, delay }
  },
});

export const slideInRight = (delay = 0): Variants => ({
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, delay }
  },
});

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  },
};

// Page transition variants
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const pageTransition: Transition = {
  duration: 0.25,
};
