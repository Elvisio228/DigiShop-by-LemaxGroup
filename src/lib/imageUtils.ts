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
 * Generates a self-contained, guaranteed SVG data URI that requires zero network requests.
 * Renders beautifully across all screen resolutions and prevents any broken image icon.
 */
export function generateSvgPlaceholder(category?: string, title?: string): string {
  const cat = (category || '').toLowerCase();
  const displayTitle = (title || 'DigiShop Digital').substring(0, 32);

  let gradStart = '#1e293b';
  let gradEnd = '#0f172a';
  let accentColor = '#38bdf8';
  let iconPath = '';
  let categoryLabel = 'PRODUIT DIGITAL';

  if (cat.includes('ebook') || cat.includes('livre')) {
    gradStart = '#0284c7';
    gradEnd = '#0369a1';
    accentColor = '#bae6fd';
    categoryLabel = 'E-BOOK & GUIDE';
    iconPath = '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" fill="none" stroke="white" stroke-width="2"/><path d="M6 6h10M6 10h10M6 14h6" stroke="white" stroke-width="2" stroke-linecap="round"/>';
  } else if (cat.includes('template') || cat.includes('modele')) {
    gradStart = '#059669';
    gradEnd = '#047857';
    accentColor = '#a7f3d0';
    categoryLabel = 'TEMPLATE & OUTIL';
    iconPath = '<rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="white" stroke-width="2"/><path d="M3 9h18M9 21V9" stroke="white" stroke-width="2"/>';
  } else if (cat.includes('format') || cat.includes('cours')) {
    gradStart = '#d97706';
    gradEnd = '#b45309';
    accentColor = '#fde68a';
    categoryLabel = 'FORMATION VIDÉO';
    iconPath = '<polygon points="5 3 19 12 5 21 5 3" fill="none" stroke="white" stroke-width="2"/>';
  } else if (cat.includes('graph') || cat.includes('logo') || cat.includes('design') || displayTitle.toLowerCase().includes('logo')) {
    gradStart = '#6366f1';
    gradEnd = '#4338ca';
    accentColor = '#c7d2fe';
    categoryLabel = 'PACK GRAPHIQUE & LOGO';
    iconPath = '<circle cx="12" cy="12" r="9" fill="none" stroke="white" stroke-width="2"/><path d="m14 8-4 8M10 8h4M10 16h4" stroke="white" stroke-width="2" stroke-linecap="round"/>';
  } else {
    gradStart = '#0f172a';
    gradEnd = '#1e1b4b';
    accentColor = '#38bdf8';
    categoryLabel = 'RESSOURCE DIGITALE';
    iconPath = '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill="none" stroke="white" stroke-width="2"/><polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="white" stroke-width="2"/><line x1="12" y1="22.08" x2="12" y2="12" stroke="white" stroke-width="2"/>';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${gradStart}"/>
        <stop offset="100%" stop-color="${gradEnd}"/>
      </linearGradient>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="400" height="300" fill="url(#g)"/>
    <rect width="400" height="300" fill="url(#grid)"/>
    <g transform="translate(176, 80) scale(2)">
      ${iconPath}
    </g>
    <text x="200" y="195" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="${accentColor}" letter-spacing="1.5" text-anchor="middle" text-transform="uppercase">
      ${categoryLabel}
    </text>
    <text x="200" y="225" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="800" fill="#ffffff" text-anchor="middle">
      ${displayTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
    </text>
    <text x="200" y="250" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="500" fill="rgba(255,255,255,0.6)" text-anchor="middle">
      DigiShop by Lemax Group
    </text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Resolves any product image path into an accessible URL or self-contained fallback.
 */
export function getProductImageUrl(rawUrl?: string | null, category?: string, title?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return generateSvgPlaceholder(category, title);
  }

  const url = rawUrl.trim();

  // If already absolute HTTP/HTTPS or data URI, return as-is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  // Handle bare title as image or invalid image string (no dot / extension)
  if (!url.includes('.') && !url.includes('/')) {
    return generateSvgPlaceholder(category, title || url);
  }

  // Handle uploaded images
  if (url.startsWith('/uploads/')) {
    if (url.includes('product_1792585262702') || (title && title.toLowerCase().includes('logo'))) {
      return '/assets/images/product_graphics_3d_icons_1791461343514.jpg';
    }
    return url;
  }

  // Handle /src/assets/images/... -> normalize to /assets/images/...
  if (url.startsWith('/src/assets/images/')) {
    const filename = url.replace('/src/assets/images/', '');
    return `/assets/images/${filename}`;
  }

  // Return url as-is if it starts with /
  if (url.startsWith('/')) {
    return url;
  }

  return `/${url}`;
}

/**
 * Universal error handler for <img> tags.
 * Replaces any broken source with a guaranteed working SVG vector.
 */
export function handleImageFallback(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  category?: string,
  title?: string
): void {
  const target = event.currentTarget;
  // Prevent infinite loop
  target.onerror = null;

  const fallbackDataUri = generateSvgPlaceholder(category, title || target.alt || 'DigiShop');
  target.src = fallbackDataUri;
}
