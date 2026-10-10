import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type PublicRoute = '/' | '/features' | '/how-it-works' | '/pricing' | '/faq';
export type AuthRoute = '/login' | '/register' | '/signup' | '/forgot-password';
export type AppRoute = '/app' | '/app/dashboard' | '/app/sales' | '/app/expenses' | '/app/products' | '/app/customers' | '/app/reports' | '/app/settings' | '/app/plan';

export type AppPath = PublicRoute | AuthRoute | AppRoute | string;

export interface RouterContextType {
  path: string;
  search: string;
  navigate: (to: string, options?: { replace?: boolean }) => void;
  isPublicRoute: boolean;
  isAuthRoute: boolean;
  isAppRoute: boolean;
  getSafeReturnUrl: () => string;
}

const RouterContext = createContext<RouterContextType | null>(null);

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '') return '/';
  // Remove trailing slash unless it's just '/'
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function parseUrl(to: string): { pathname: string; search: string } {
  const [pathnameRaw, ...rest] = to.split('?');
  const searchRaw = rest.join('?');
  const normalizedPath = normalizePath(pathnameRaw);
  return {
    pathname: normalizedPath,
    search: searchRaw ? `?${searchRaw}` : '',
  };
}

export function getSafeReturnUrl(): string {
  if (typeof window === 'undefined') return '/app';
  try {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get('returnTo');
    // Enforce strict local /app prefix and block open redirect exploits
    if (
      returnTo &&
      returnTo.startsWith('/app') &&
      !returnTo.startsWith('//') &&
      !returnTo.includes('\\') &&
      !returnTo.includes('\r') &&
      !returnTo.includes('\n')
    ) {
      return returnTo;
    }
  } catch {
    // fallback
  }
  return '/app';
}

export const RouterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [path, setPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return normalizePath(window.location.pathname);
    }
    return '/';
  });

  const [search, setSearch] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.search || '';
    }
    return '';
  });

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    if (typeof window === 'undefined') return;

    // Handle hash links on the same page
    if (to.startsWith('#')) {
      const element = document.querySelector(to);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    const { pathname: normalized, search: newSearch } = parseUrl(to);
    const fullUrl = normalized + newSearch;

    if (options?.replace) {
      window.history.replaceState({}, '', fullUrl);
    } else {
      window.history.pushState({}, '', fullUrl);
    }
    setPath(normalized);
    setSearch(newSearch);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setPath(normalizePath(window.location.pathname));
      setSearch(window.location.search || '');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isPublicRoute = ['/', '/features', '/how-it-works', '/pricing', '/faq'].includes(path);
  const isAuthRoute = ['/login', '/register', '/signup', '/forgot-password'].includes(path);
  const isAppRoute = path === '/app' || path.startsWith('/app/');

  return (
    <RouterContext.Provider
      value={{
        path,
        search,
        navigate,
        isPublicRoute,
        isAuthRoute,
        isAppRoute,
        getSafeReturnUrl,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = (): RouterContextType => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};

// Safe link component that intercepts internal clicks without full reload
export const Link: React.FC<{
  to: string;
  children: ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
  id?: string;
  'aria-label'?: string;
}> = ({ to, children, className, title, onClick, id, 'aria-label': ariaLabel }) => {
  const { navigate } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If modifier keys pressed, let browser handle normal behavior (e.g. open in new tab)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    if (onClick) onClick();
    navigate(to);
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className={className}
      title={title}
      id={id}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
};
