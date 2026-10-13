import { API_BASE_URL } from '../services/api';

/**
 * Resolves avatar URLs to ensure relative backend static paths
 * (such as /api/uploads/avatars/...) render properly in the browser.
 */
export function resolveAvatarUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  // Full URLs or legacy data URIs can be used directly
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Prepend backend origin for relative paths
  const backendOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${backendOrigin}${cleanPath}`;
}
