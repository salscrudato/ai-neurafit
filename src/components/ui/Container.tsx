// src/components/ui/Container.tsx
import React from 'react';

type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
type ContainerPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface ContainerProps {
  children: React.ReactNode;
  /** Max width */
  size?: ContainerSize;
  /** Internal padding */
  padding?: ContainerPadding;
  /** Extra classes */
  className?: string;
  /** Render as a different element */
  as?: React.ElementType;
  /** Center container horizontally (mx-auto) */
  center?: boolean;
  /** Bleed the container horizontally (negative margins that mirror padding) */
  bleedX?: boolean;
  /** Bleed the container vertically (negative margins that mirror padding) */
  bleedY?: boolean;
  /** Apply iOS safe-area padding at the top */
  safeTop?: boolean;
  /** Apply iOS safe-area padding at the bottom */
  safeBottom?: boolean;
  /** Enable CSS container queries (container-type: inline-size) */
  cq?: boolean;
  /** Optional named container for container queries */
  containerName?: string;
  /** Pass-through DOM props */
  id?: string;
  role?: string;
  tabIndex?: number;
  'aria-label'?: string;
}

/**
 * Base Container
 * - Responsive max-width
 * - Responsive padding
 * - Optional bleeds/safe areas
 * - Container-queries ready
 */
export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'xl',
  padding = 'md',
  className = '',
  as: As = 'div',
  center = true,
  bleedX = false,
  bleedY = false,
  safeTop = false,
  safeBottom = false,
  cq = false,
  containerName,
  ...rest
}) => {
  const sizeClasses: Record<ContainerSize, string> = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    // Tailwind has screen-2xl which is slightly wider than 7xl on many setups
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  const paddingClasses: Record<ContainerPadding, string> = {
    none: '',
    sm: 'px-4 py-4 sm:px-6 sm:py-6',
    md: 'px-4 py-6 sm:px-6 sm:py-8 lg:px-8',
    lg: 'px-4 py-8 sm:px-6 sm:py-12 lg:px-8',
    xl: 'px-4 py-10 sm:px-8 sm:py-16 lg:px-12',
  };

  // Bleed mirrors the padding scale so content can go edge-to-edge within a padded page
  const bleedXClasses =
    bleedX &&
    (padding === 'sm'
      ? '-mx-4 sm:-mx-6'
      : padding === 'md'
      ? '-mx-4 sm:-mx-6 lg:-mx-8'
      : padding === 'lg'
      ? '-mx-4 sm:-mx-6 lg:-mx-8'
      : padding === 'xl'
      ? '-mx-4 sm:-mx-8 lg:-mx-12'
      : '');

  const bleedYClasses =
    bleedY &&
    (padding === 'sm'
      ? '-my-4 sm:-my-6'
      : padding === 'md'
      ? '-my-6 sm:-my-8'
      : padding === 'lg'
      ? '-my-8 sm:-my-12'
      : padding === 'xl'
      ? '-my-10 sm:-my-16'
      : '');

  const safeAreaClasses = [
    safeTop ? 'safe-area-top' : '',
    safeBottom ? 'safe-area-bottom' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const base = [
    sizeClasses[size],
    center ? 'mx-auto' : '',
    paddingClasses[padding],
    bleedXClasses || '',
    bleedYClasses || '',
    safeAreaClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Container queries (style prop supports modern CSS fields in most TS setups; cast if needed)
  const styleCQ = cq
    ? ({ containerType: 'inline-size', containerName } as React.CSSProperties & Record<string, any>)
    : undefined;

  return (
    <As className={base} style={styleCQ} {...rest}>
      {children}
    </As>
  );
};

/* ----------------------------------------------------------------------------
 * Specialized Containers (friendly defaults)
 * --------------------------------------------------------------------------*/

/**
 * PageContainer
 * Recommended for top-level screens (inside your <main>).
 * Defaults to wide and comfy padding.
 */
export const PageContainer: React.FC<
  Omit<ContainerProps, 'size' | 'padding'>
> = ({ children, className = '', ...rest }) => {
  return (
    <Container
      size="xl"
      padding="lg"
      className={className}
      {...rest}
    >
      {children}
    </Container>
  );
};

/**
 * SectionContainer
 * For sections within a page (slightly narrower + medium padding).
 */
export const SectionContainer: React.FC<
  Omit<ContainerProps, 'size' | 'padding'>
> = ({ children, className = '', ...rest }) => {
  return (
    <Container
      size="lg"
      padding="md"
      className={className}
      {...rest}
    >
      {children}
    </Container>
  );
};

/**
 * NarrowContainer
 * Useful for forms and focused content.
 */
export const NarrowContainer: React.FC<
  Omit<ContainerProps, 'size'>
> = ({ children, className = '', ...rest }) => {
  return (
    <Container size="sm" className={className} {...rest}>
      {children}
    </Container>
  );
};

/**
 * ProseContainer
 * Typography-optimized wrapper using @tailwindcss/typography.
 */
export const ProseContainer: React.FC<
  Omit<ContainerProps, 'size' | 'padding'>
> = ({ children, className = '', ...rest }) => {
  return (
    <Container
      size="md"
      padding="lg"
      className={['prose prose-neutral', className].join(' ')}
      {...rest}
    >
      {children}
    </Container>
  );
};