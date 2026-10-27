// src/lib/imageUtils.ts
// Utility for resolving, sanitizing and falling back product and brand images reliably across dev, build and Firebase Hosting.

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  ebooks: '/assets/images/product_ebook_marketing_1791461314730.jpg',
  templates: '/assets/images/product_template_business_1791461332483.jpg',
  graphisme: '/assets/images/product_graphics_3d_icons_1791461343514.jpg',
  formations: '/assets/images/product_course_ecommerce_1791461354436.jpg',
  documents: '/assets/images/hero_digishop_showcase_1791461301216.jpg',
  default: '/assets/images/hero_digishop_showcase_1791461301216.jpg',
};

/**
 * Resolves any product image path into a guaranteed accessible URL in both local and production Firebase Hosting builds.
 */
export function getProductImageUrl(rawUrl?: string | null, category?: string, title?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    const catKey = (category || '').toLowerCase();
    return CATEGORY_FALLBACK_IMAGES[catKey] || CATEGORY_FALLBACK_IMAGES.default;
  }

  const url = rawUrl.trim();

  // If already absolute HTTP/HTTPS or data URI, return as-is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  // Handle /src/assets/images/... -> normalize to /assets/images/...
  if (url.startsWith('/src/assets/images/')) {
    const filename = url.replace('/src/assets/images/', '');
    return `/assets/images/${filename}`;
  }

  // Handle uploaded images
  if (url.startsWith('/uploads/')) {
    // If it's the known logo product upload, return the guaranteed public asset
    if (url.includes('product_1792585262702') || (title && title.toLowerCase().includes('logo'))) {
      return '/assets/images/product_graphics_3d_icons_1791461343514.jpg';
    }
    return url;
  }

  // Return url as-is if it starts with /
  if (url.startsWith('/')) {
    return url;
  }

  return `/${url}`;
}

/**
 * Universal error handler for <img> tags.
 * Replaces the broken source with a guaranteed working category or showcase image.
 */
export function handleImageFallback(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  category?: string
): void {
  const target = event.currentTarget;
  // Prevent infinite loop if fallback also errors
  target.onerror = null;

  const catKey = (category || '').toLowerCase();
  const fallback = CATEGORY_FALLBACK_IMAGES[catKey] || CATEGORY_FALLBACK_IMAGES.default;

  // Only assign if current src is different from fallback
  if (!target.src.endsWith(fallback)) {
    target.src = fallback;
  }
}
