import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type PublicRoute = '/' | '/features' | '/how-it-works' | '/pricing' | '/faq';
export type AuthRoute = '/login' | '/register' | '/signup' | '/forgot-password';
export type AppRoute = '/app' | '/app/dashboard' | '/app/sales' | '/app/expenses' | '/app/products' | '/app/customers' | '/app/reports' | '/app/settings';

export type AppPath = PublicRoute | AuthRoute | AppRoute | string;

interface RouterContextType {
  path: string;
  navigate: (to: string, options?: { replace?: boolean }) => void;
  isPublicRoute: boolean;
  isAuthRoute: boolean;
  isAppRoute: boolean;
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

export const RouterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [path, setPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return normalizePath(window.location.pathname);
    }
    return '/';
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

    const normalized = normalizePath(to);
    if (options?.replace) {
      window.history.replaceState({}, '', normalized);
    } else {
      window.history.pushState({}, '', normalized);
    }
    setPath(normalized);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setPath(normalizePath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isPublicRoute = ['/', '/features', '/how-it-works', '/pricing', '/faq'].includes(path);
  const isAuthRoute = ['/login', '/register', '/signup', '/forgot-password'].includes(path);
  const isAppRoute = path.startsWith('/app');

  return (
    <RouterContext.Provider value={{ path, navigate, isPublicRoute, isAuthRoute, isAppRoute }}>
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
