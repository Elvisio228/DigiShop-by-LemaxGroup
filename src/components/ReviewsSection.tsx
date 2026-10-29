import React, { useState } from 'react';
import { Star, ShieldCheck, MessageSquare, ThumbsUp, ArrowRight, CheckCircle2, User } from 'lucide-react';
import { Review, Product } from '../types';

interface ReviewsSectionProps {
  reviews: Review[];
  products: Product[];
  onOpenReviewModal: () => void;
  onSelectProduct?: (slug: string) => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  reviews,
  products,
  onOpenReviewModal,
  onSelectProduct
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Filter approved reviews only
  const approvedReviews = reviews.filter(r => r.isApproved !== false);

  // Compute average rating
  const averageRating = approvedReviews.length > 0
    ? (approvedReviews.reduce((sum, r) => sum + (r.rating || 5), 0) / approvedReviews.length).toFixed(1)
    : '4.9';

  // Compute counts per category
  const filteredReviews = approvedReviews.filter(r => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'general') return r.productId === 'general';
    const prod = products.find(p => p.id === r.productId);
    return prod?.category === selectedFilter;
  });

  const getProductSlug = (productId: string): string | undefined => {
    return products.find(p => p.id === productId)?.slug;
  };

  return (
    <section id="customer-reviews" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 sm:p-10 space-y-8">
        
        {/* Section Top Header & CTA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Transparence & Confiance</span>
              <span aria-hidden="true">·</span>
              <span>Retours 100% Authentiques</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-950 dark:text-white">
              Ce que disent nos clients
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
              Retours d'expérience vérifiés d'entrepreneurs, créateurs, agences et freelances ayant acquis nos ressources.
            </p>
          </div>

          {/* Action Button: Give Review */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-bold font-mono text-slate-900 dark:text-white tabular-nums">{averageRating} / 5</span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">({approvedReviews.length} avis)</span>
            </div>

            <button
              type="button"
              onClick={onOpenReviewModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Laisser un avis client</span>
            </button>
          </div>
        </div>

        {/* Global Key Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 dark:text-white">{averageRating} / 5</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Note de satisfaction</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">99.4%</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Avis positifs (4 & 5 ★)</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xl sm:text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400">Instantané</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Délivrance par lien signé</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xl sm:text-2xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">100%</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Licences commerciales vérifiées</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: `Tous les avis (${approvedReviews.length})` },
            { id: 'ebooks', label: 'E-books' },
            { id: 'templates', label: 'Templates Pro' },
            { id: 'graphisme', label: 'Graphisme & 3D' },
            { id: 'formations', label: 'Formations' },
            { id: 'documents', label: 'Documents & Juridique' },
            { id: 'general', label: 'Expérience Boutique' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                selectedFilter === tab.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Reviews Cards Grid */}
        {filteredReviews.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Aucun avis dans cette catégorie pour le moment.
            </p>
            <button
              type="button"
              onClick={onOpenReviewModal}
              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              Soyez le premier à donner votre avis →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReviews.map(r => {
              const slug = getProductSlug(r.productId);
              return (
                <div
                  key={r.id}
                  className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div className="space-y-3">
                    {/* Stars & Date */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(r.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    {/* Comment text */}
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                      « {r.comment} »
                    </p>
                  </div>

                  {/* Reviewer Details & Product Badge */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {r.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            {r.userName}
                          </p>
                          {r.isVerifiedPurchase && (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Achat vérifié</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Product referenced */}
                    {r.productTitle && (
                      <div className="pt-1">
                        {slug && onSelectProduct ? (
                          <button
                            type="button"
                            onClick={() => onSelectProduct(slug)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 truncate max-w-full group"
                          >
                            <span className="truncate">Produit : {r.productTitle}</span>
                            <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 truncate block">
                            {r.productTitle}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};
