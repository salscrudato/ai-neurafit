/**
 * Authentication utilities for handling various auth scenarios
 */

export const isPopupBlocked = (error: any): boolean => {
  return (
    error.code === 'auth/popup-blocked' ||
    error.code === 'auth/popup-closed-by-user' ||
    error.code === 'auth/cancelled-popup-request' ||
    error.message?.includes('Cross-Origin-Opener-Policy') ||
    error.message?.includes('popup')
  );
};

export const shouldUseRedirect = (): boolean => {
  // Check if we're on mobile or if popups are likely to be blocked
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  // Check if we're in an iframe or embedded context
  const isEmbedded = window.self !== window.top;
  
  // Check if we're on a browser that commonly blocks popups
  const isPopupUnfriendly = /Safari|Chrome/i.test(navigator.userAgent) && isMobile;
  
  return isMobile || isEmbedded || isPopupUnfriendly;
};

export const getAuthErrorMessage = (error: any): string => {
  if (isPopupBlocked(error)) {
    return 'Sign-in popup was blocked. We\'ll redirect you to Google to complete sign-in.';
  }
  
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/internal-error':
      return 'An internal error occurred. Please try again.';
    default:
      return error.message || 'An error occurred during authentication.';
  }
};

export const detectBrowserCapabilities = () => {
  const capabilities = {
    supportsPopups: true,
    supportsRedirect: true,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isEmbedded: window.self !== window.top,
    userAgent: navigator.userAgent,
  };

  // Test popup support
  try {
    const testPopup = window.open('', '_blank', 'width=1,height=1');
    if (testPopup) {
      testPopup.close();
    } else {
      capabilities.supportsPopups = false;
    }
  } catch (e) {
    capabilities.supportsPopups = false;
  }

  return capabilities;
};

export const getRecommendedAuthMethod = (): 'popup' | 'redirect' => {
  const capabilities = detectBrowserCapabilities();
  
  if (!capabilities.supportsPopups || capabilities.isMobile || capabilities.isEmbedded) {
    return 'redirect';
  }
  
  return 'popup';
};

/**
 * Enhanced error handling for authentication
 */
export class AuthErrorHandler {
  static handle(error: any, _context: 'signin' | 'signup' = 'signin'): {
    message: string;
    shouldRetry: boolean;
    suggestedAction?: string;
  } {
    const message = getAuthErrorMessage(error);
    let shouldRetry = true;
    let suggestedAction: string | undefined;

    if (isPopupBlocked(error)) {
      shouldRetry = false;
      suggestedAction = 'redirect';
    }

    if (error.code === 'auth/too-many-requests') {
      shouldRetry = false;
      suggestedAction = 'wait';
    }

    if (error.code === 'auth/network-request-failed') {
      suggestedAction = 'check-connection';
    }

    return {
      message,
      shouldRetry,
      suggestedAction,
    };
  }

  static getActionMessage(action: string): string {
    switch (action) {
      case 'redirect':
        return 'We\'ll redirect you to complete sign-in.';
      case 'wait':
        return 'Please wait a few minutes before trying again.';
      case 'check-connection':
        return 'Please check your internet connection.';
      default:
        return '';
    }
  }
}

/**
 * Utility to handle auth state persistence
 */
export const AuthStateManager = {
  setAuthIntent(intent: 'signin' | 'signup', redirectUrl?: string) {
    sessionStorage.setItem('auth_intent', intent);
    if (redirectUrl) {
      sessionStorage.setItem('auth_redirect_url', redirectUrl);
    }
  },

  getAuthIntent(): { intent: 'signin' | 'signup' | null; redirectUrl: string | null } {
    const intent = sessionStorage.getItem('auth_intent') as 'signin' | 'signup' | null;
    const redirectUrl = sessionStorage.getItem('auth_redirect_url');
    return { intent, redirectUrl };
  },

  clearAuthIntent() {
    sessionStorage.removeItem('auth_intent');
    sessionStorage.removeItem('auth_redirect_url');
  },

  setReturnUrl(url: string) {
    sessionStorage.setItem('auth_return_url', url);
  },

  getReturnUrl(): string {
    return sessionStorage.getItem('auth_return_url') || '/app';
  },

  clearReturnUrl() {
    sessionStorage.removeItem('auth_return_url');
  }
};
