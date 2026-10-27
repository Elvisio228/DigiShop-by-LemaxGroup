import React from 'react';
import { ArrowRight, Sparkles, Zap, Shield, FileCheck } from 'lucide-react';

interface HeroProps {
  onExplore: () => void;
  onNewArrivals: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExplore, onNewArrivals }) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-xs font-medium text-sky-600 dark:text-sky-400">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Votre marketplace digitale sécurisée</span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-slate-500 dark:text-slate-400">Édition 2026</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white font-display leading-[1.15] text-balance">
              Découvrez les meilleurs produits digitaux, instantanément.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              E-books, modèles, ressources graphiques, formations et autres produits numériques, disponibles immédiatement après achat.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onExplore}
                className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 group whitespace-nowrap"
              >
                <span>Explorer la boutique</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onNewArrivals}
                className="px-6 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-800 transition-colors whitespace-nowrap"
              >
                Voir les nouveautés
              </button>
            </div>

            {/* Quick trust metrics */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-4 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Zéro délai</span>
                </div>
                <p className="text-[11px] text-slate-500">Téléchargement direct</p>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>100% Sécurisé</span>
                </div>
                <p className="text-[11px] text-slate-500">Liens signés & cryptés</p>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <FileCheck className="w-3.5 h-3.5 text-sky-500" />
                  <span>Licence Pro</span>
                </div>
                <p className="text-[11px] text-slate-500">Contrats & droits certifiés</p>
              </div>
            </div>

          </div>

          {/* Right Image Showcase */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-2xl bg-slate-100 dark:bg-slate-900 group">
              <img
                src="/assets/images/hero_digishop_showcase_1791461301216.jpg"
                alt="Vitrine des produits digitaux Digishop"
                referrerPolicy="no-referrer"
                className="w-full h-[340px] sm:h-[400px] object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  // Fallback container if local asset failed
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="hidden w-full h-[360px] bg-gradient-to-br from-slate-900 to-sky-950 p-8 flex-col justify-end text-white">
                <p className="text-xs uppercase tracking-wider text-sky-400 font-mono">Digishop Collection</p>
                <h3 className="text-xl font-bold font-display mt-1">Produits Numériques Certifiés</h3>
                <p className="text-xs text-slate-300 mt-2">Prêts au téléchargement immédiat après paiement sécurisé.</p>
              </div>

              {/* Discreet floating overlay banner */}
              <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border border-white/20 dark:border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-xs">Catalogue 2026 disponible</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">E-books, templates, kits 3D & formations</p>
                </div>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  -30% Actuel
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
