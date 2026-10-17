import React from 'react';
import { Hero } from '../components/Hero';
import { ProductCard } from '../components/ProductCard';
import { AdBanner } from '../components/AdBanner';
import { NewsletterSection } from '../components/NewsletterSection';
import { Product } from '../types';
import { ArrowRight, BookOpen, LayoutTemplate, Palette, FileText, GraduationCap, ShieldCheck, Download, Award } from 'lucide-react';

interface HomeViewProps {
  products: Product[];
  onSelectProduct: (slug: string) => void;
  onBuyNow: (product: Product) => void;
  onNavigate: (view: string, param?: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  onSelectProduct,
  onBuyNow,
  onNavigate
}) => {
  const featuredProducts = products.filter(p => p.isFeatured || p.isPromo).slice(0, 6);

  const categories = [
    {
      id: 'ebooks',
      name: 'E-books & Guides',
      desc: 'Manuels stratégiques et guides pratiques haute valeur',
      icon: BookOpen,
      count: products.filter(p => p.category === 'ebooks').length
    },
    {
      id: 'templates',
      name: 'Templates Pro',
      desc: 'Business plans, pitch decks, tableurs financiers et CV',
      icon: LayoutTemplate,
      count: products.filter(p => p.category === 'templates').length
    },
    {
      id: 'graphisme',
      name: 'Ressources Graphiques',
      desc: 'Icônes 3D, mockups studio et packs UI prêts pour Figma',
      icon: Palette,
      count: products.filter(p => p.category === 'graphisme').length
    },
    {
      id: 'documents',
      name: 'Documents Juridiques',
      desc: 'Contrats de prestation, CGV, devis et accords NDA',
      icon: FileText,
      count: products.filter(p => p.category === 'documents').length
    },
    {
      id: 'formations',
      name: 'Formations & Cours',
      desc: 'Masterclasses vidéo, workbooks et plans de scaling',
      icon: GraduationCap,
      count: products.filter(p => p.category === 'formations').length
    }
  ];

  return (
    <div className="space-y-12 sm:space-y-16">
      
      {/* 1. Hero Section */}
      <Hero
        onExplore={() => onNavigate('catalog')}
        onNewArrivals={() => onNavigate('catalog', 'sort=recent')}
      />

      {/* 2. Featured Digital Products Collection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              <span>Sélection Officielle</span>
              <span aria-hidden="true">·</span>
              <span>Téléchargement Direct</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-950 dark:text-white mt-1">
              Produits Numériques Populaires
            </h2>
          </div>

          <button
            onClick={() => onNavigate('catalog')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 group"
          >
            <span>Voir tout le catalogue ({products.length})</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 3-column / 2-column Product Grid with anti-slop spacing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featuredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              onBuyNow={onBuyNow}
            />
          ))}
        </div>
      </section>

      {/* 3. Espace Publicitaire 1 (Home Middle) */}
      <AdBanner position="home_middle" onNavigate={onNavigate} />

      {/* 4. Explorer par Catégorie */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-950 dark:text-white">
            Explorez par Catégories
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Trouvez les ressources digitales exactes adaptées à vos besoins professionnels.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => onNavigate('catalog', `cat=${cat.id}`)}
                className="group p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-500/50 hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 group-hover:bg-sky-500 group-hover:text-white transition-colors flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300">
                  <span className="font-mono text-[11px]">{cat.count} ressources</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Pourquoi Digishop / Engagement Qualité & Sécurité */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-8 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                Livraison Immédiate & Liens Signés
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Aucun temps d'attente. Dès validation de votre commande, vous recevez un jeton de téléchargement crypté et personnalisé avec accès direct à vos fichiers.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                Licences Légales & Zéro Piratage
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tous les produits présents sur Digishop sont créés en interne ou vérifiés avec des licences de distribution authentiques. Vous travaillez en totale conformité légale.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                Moyens de Paiement Adaptés
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Réglez en toute sérénité par Carte Bancaire, PayPal, ou via nos passerelles régionales Moov Money et Mixx avec validation sécurisée.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Newsletter */}
      <NewsletterSection />

    </div>
  );
};
