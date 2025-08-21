import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';
import { SkipLink } from '../ui/AccessibilityProvider';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/20 relative overflow-hidden">
      {/* Modern Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-primary opacity-5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-accent opacity-5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%236366f1%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221.5%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
      </div>

      <div className="relative z-10">
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <Navigation />
        <main id="main-content" role="main" className="pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-0 md:pt-18">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
