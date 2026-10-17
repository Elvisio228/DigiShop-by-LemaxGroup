import React, { useEffect, useState } from 'react';
import { Advertisement } from '../types';
import { ArrowUpRight, X, Sparkles, ExternalLink } from 'lucide-react';

interface AdBannerProps {
  position: 'home_middle' | 'catalog_sidebar' | 'top_bar' | 'product_sidebar';
  onNavigate?: (view: string, param?: string) => void;
  className?: string;
}

// Built-in initial fallbacks for instant display
const DEFAULT_ADS: Record<string, Advertisement> = {
  top_bar: {
    id: 'ad-3',
    title: "Bannière d'Annonce Supérieure (Top Bar)",
    position: 'top_bar',
    badge: 'Offre Spéciale',
    heading: '🚀 Boostez vos projets digitaux : Packs Pro & Formations à prix réduit',
    subtext: 'Bénéficiez de remises exclusives et de ressources prêtes à l\'emploi.',
    ctaText: 'En profiter',
    ctaLink: '/boutique?cat=formations',
    bgColor: 'from-sky-700 via-indigo-700 to-purple-800',
    isEnabled: true
  },
  product_sidebar: {
    id: 'ad-4',
    title: 'Espace Publicitaire Fiche Produit (Sidebar)',
    position: 'product_sidebar',
    badge: 'Recommandé par Digishop',
    heading: 'Hébergement Web & Outils Cloud Partenaires',
    subtext: 'Déployez facilement vos templates, sites et projets avec nos partenaires certifiés haute disponibilité.',
    ctaText: 'Découvrir la sélection',
    ctaLink: '/boutique?cat=templates',
    bgColor: 'from-slate-900 via-indigo-950 to-slate-950',
    isEnabled: true
  },
  catalog_sidebar: {
    id: 'ad-2',
    title: 'Espace Publicitaire Catalogue (Sidebar)',
    position: 'catalog_sidebar',
    badge: 'Recommandation',
    heading: 'Besoin d\'un accompagnement sur-mesure ?',
    subtext: 'Nos experts vérifient votre tunnel de vente et vos documents légaux.',
    ctaText: 'Consulter nos packs',
    ctaLink: '/boutique?cat=documents',
    bgColor: 'from-slate-900 to-slate-950',
    isEnabled: true
  },
  home_middle: {
    id: 'ad-1',
    title: 'Espace Publicitaire Accueil (Bannière Milieu)',
    position: 'home_middle',
    badge: 'Offre Spéciale Partenaire',
    heading: 'Accélérez votre business en ligne avec notre suite d\'outils partenaires',
    subtext: 'Bénéficiez de remises immédiates sur les outils de productivité et templates recommandés par Digishop.',
    ctaText: 'Découvrir la sélection',
    ctaLink: '/boutique?cat=templates',
    bgColor: 'from-sky-900 to-indigo-950',
    isEnabled: true
  }
};

export const AdBanner: React.FC<AdBannerProps> = ({ position, onNavigate, className = '' }) => {
  const [ad, setAd] = useState<Advertisement | null>(DEFAULT_ADS[position] || null);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    // Check if dismissed in this session (mainly for top_bar)
    if (position === 'top_bar') {
      const isDismissed = sessionStorage.getItem(`digishop_dismiss_ad_${position}`);
      if (isDismissed === 'true') {
        setDismissed(true);
      }
    }

    let isMounted = true;
    import('../lib/apiClient').then(({ safeFetchJson }) => {
      safeFetchJson<Advertisement[]>('/api/ads').then(apiRes => {
        if (!isMounted || !apiRes.ok || !Array.isArray(apiRes.data)) return;
        const matching = apiRes.data.find(a => a.position === position);
        if (matching) {
          setAd(matching);
        }
      }).catch(() => {});
    });

    return () => {
      isMounted = false;
    };
  }, [position]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(`digishop_dismiss_ad_${position}`, 'true');
    } catch {
      // Ignore storage errors
    }
  };

  const handleCtaClick = () => {
    if (!ad) return;
    const link = ad.ctaLink || '/boutique';
    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else if (onNavigate) {
      if (link.startsWith('/')) {
        const clean = link.replace(/^\//, '');
        const [viewPath, queryString] = clean.split('?');
        const targetView = viewPath === 'boutique' ? 'catalog' : viewPath || 'catalog';
        onNavigate(targetView, queryString);
      } else {
        onNavigate('catalog');
      }
    }
  };

  if (!ad || !ad.isEnabled || dismissed) return null;

  // 1. TOP BAR ANNOUNCEMENT AD (Sits above Navbar)
  if (position === 'top_bar') {
    return (
      <aside
        aria-label="Annonce promotionnelle"
        className={`relative z-50 w-full bg-gradient-to-r ${ad.bgColor || 'from-sky-700 via-indigo-700 to-purple-800'} text-white border-b border-white/10 shadow-sm transition-all ${className}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-2 flex items-center justify-between gap-3 text-xs">
          <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold tracking-wide uppercase shrink-0">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>{ad.badge || 'Sponsor'}</span>
            </span>
            <span className="font-medium text-white/95 truncate text-xs sm:text-[13px]">
              {ad.heading}
            </span>
            {ad.subtext && (
              <span className="hidden md:inline text-white/80 text-xs">
                · {ad.subtext}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCtaClick}
              className="px-3 py-1 rounded-lg bg-white text-slate-900 hover:bg-slate-100 font-bold text-[11px] sm:text-xs transition-colors shadow-sm inline-flex items-center gap-1 group"
            >
              <span>{ad.ctaText || 'Découvrir'}</span>
              <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
            <button
              onClick={handleDismiss}
              aria-label="Fermer l'annonce"
              className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Masquer cette annonce"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // 2. PRODUCT DETAIL SIDEBAR AD
  if (position === 'product_sidebar') {
    return (
      <div className={`rounded-2xl p-5 bg-gradient-to-br ${ad.bgColor || 'from-slate-900 via-indigo-950 to-slate-950'} text-white border border-slate-700/60 shadow-lg space-y-3.5 ${className}`}>
        <div className="flex items-center justify-between text-[10px] text-sky-300 font-mono tracking-wider uppercase">
          <span className="inline-flex items-center gap-1 font-bold">
            <Sparkles className="w-3 h-3 text-amber-300" />
            {ad.badge || 'Partenaire Certifié'}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 text-[9px] font-sans">
            Sponsor
          </span>
        </div>
        <h4 className="text-sm font-bold font-display leading-snug text-white">
          {ad.heading}
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed">
          {ad.subtext}
        </p>
        <button
          onClick={handleCtaClick}
          className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center justify-center gap-1.5 hover:shadow group"
        >
          <span>{ad.ctaText || 'Consulter l\'offre'}</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  // 3. CATALOG SIDEBAR AD
  if (position === 'catalog_sidebar') {
    return (
      <div className={`rounded-2xl p-5 bg-gradient-to-br ${ad.bgColor || 'from-slate-900 to-slate-950'} text-white border border-slate-700/50 shadow-md space-y-3 ${className}`}>
        <div className="flex items-center justify-between text-[10px] text-sky-300 font-mono tracking-wider uppercase">
          <span>{ad.badge || 'Recommandation'}</span>
          <span className="text-slate-400 text-[9px]">Annonce</span>
        </div>
        <h4 className="text-sm font-bold font-display leading-snug">{ad.heading}</h4>
        <p className="text-xs text-slate-300 leading-relaxed">{ad.subtext}</p>
        <button
          onClick={handleCtaClick}
          className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center justify-center gap-1.5 group"
        >
          <span>{ad.ctaText || 'Consulter'}</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  // 4. HOME MIDDLE BANNER
  return (
    <section className={`py-6 sm:py-8 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-10 bg-gradient-to-r ${ad.bgColor || 'from-sky-900 to-indigo-950'} text-white border border-slate-700/60 shadow-xl`}>
          {/* Subtle background ambient light */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/10 border border-white/10 text-xs font-medium text-sky-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{ad.badge || 'Offre Partenaire'}</span>
              <span className="text-slate-400">·</span>
              <span className="text-[11px] text-slate-300">Espace Sponsorisé</span>
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold font-display leading-tight">
              {ad.heading}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {ad.subtext}
            </p>
            <div className="pt-2">
              <button
                onClick={handleCtaClick}
                className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-white text-slate-950 hover:bg-slate-100 transition-colors shadow-sm inline-flex items-center gap-2 group"
              >
                <span>{ad.ctaText || 'Découvrir'}</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
