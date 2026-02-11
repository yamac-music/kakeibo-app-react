function ensureLeadingSlash(path) {
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

function trimTrailingSlash(path) {
  if (path === '/') return '/';
  return path.endsWith('/') ? path.slice(0, -1) : path;
}

const defaultBasePath = import.meta.env.PROD ? '/kakeibo-app-react/' : '/';
const rawBasePath = import.meta.env.VITE_BASE_PATH || defaultBasePath;

const normalizedForRouter = trimTrailingSlash(ensureLeadingSlash(rawBasePath));

export const ROUTER_BASENAME = normalizedForRouter === '/' ? '' : normalizedForRouter;
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'dev';
export const APP_COMMIT_SHA = import.meta.env.VITE_APP_COMMIT_SHA || 'local';
