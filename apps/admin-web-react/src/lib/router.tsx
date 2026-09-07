/* oxlint-disable react/only-export-components -- Router, Link, Route, dan hook lokasi adalah satu kontrak modul. */
import {
  Children,
  createContext,
  isValidElement,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  useContext,
  useMemo,
  useState,
  useEffect,
} from 'react';

type RouterContextValue = {
  basename: string;
  pathname: string;
  navigate: (target: string) => void;
};

const RouterContext = createContext<RouterContextValue | null>(null);

const normalizeBase = (value?: string) => {
  const trimmed = (value || '').trim();
  if (!trimmed || trimmed === '/') return '';
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
};

const applicationPath = (basename: string) => {
  const pathname = window.location.pathname;
  if (basename && pathname.startsWith(basename)) {
    return pathname.slice(basename.length) || '/';
  }
  return pathname || '/';
};

export function BrowserRouter({ basename: rawBase, children }: { basename?: string; children: ReactNode }) {
  const basename = useMemo(() => normalizeBase(rawBase), [rawBase]);
  const [pathname, setPathname] = useState(() => applicationPath(basename));

  useEffect(() => {
    const synchronize = () => setPathname(applicationPath(basename));
    window.addEventListener('popstate', synchronize);
    return () => window.removeEventListener('popstate', synchronize);
  }, [basename]);

  const value = useMemo<RouterContextValue>(() => ({
    basename,
    pathname,
    navigate: (target) => {
      const normalizedTarget = target.startsWith('/') ? target : `/${target}`;
      const browserTarget = `${basename}${normalizedTarget}` || '/';
      window.history.pushState(null, '', browserTarget);
      setPathname(normalizedTarget);
      window.scrollTo({ top: 0, behavior: 'auto' });
    },
  }), [basename, pathname]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useLocation() {
  const router = useContext(RouterContext);
  if (!router) throw new Error('useLocation wajib digunakan di dalam BrowserRouter');
  return { pathname: router.pathname };
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string };

export function Link({ to, onClick, target, children, ...props }: LinkProps) {
  const router = useContext(RouterContext);
  if (!router) throw new Error('Link wajib digunakan di dalam BrowserRouter');
  const href = `${router.basename}${to.startsWith('/') ? to : `/${to}`}` || '/';

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || target === '_blank' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    router.navigate(to);
  };

  return <a {...props} href={href} target={target} onClick={handleClick}>{children}</a>;
}

type RouteProps = { path: string; element: ReactElement };

export function Route(_props: RouteProps) {
  return null;
}

export function Routes({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  let fallback: ReactElement | null = null;

  for (const child of Children.toArray(children)) {
    if (!isValidElement<RouteProps>(child)) continue;
    if (child.props.path === pathname) return child.props.element;
    if (child.props.path === '*') fallback = child.props.element;
  }

  return fallback;
}
