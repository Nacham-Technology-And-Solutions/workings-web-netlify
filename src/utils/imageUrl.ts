/**
 * Utility to resolve full image URLs.
 * Converts relative upload paths like `/uploads/...` to full URLs if needed,
 * while leaving absolute URLs (http://, https://, data:, blob:) unchanged.
 */
export const resolveImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL || '';
  if (url.startsWith('/')) {
    if (apiBase) {
      const cleanBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
      try {
        const parsed = new URL(cleanBase);
        return `${parsed.origin}${url}`;
      } catch {
        return `${cleanBase}${url}`;
      }
    }
  }
  return url;
};
