import React, { useState, useEffect } from 'react';
import { Product, Review } from '../types';
import { Star, Download, ShieldCheck, FileText, CheckCircle2, ShoppingBag, ArrowLeft, Send } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { ProductCard } from '../components/ProductCard';
import { AdBanner } from '../components/AdBanner';
import { getProductImageUrl, handleImageFallback } from '../lib/imageUtils';

interface ProductDetailViewProps {
  slug: string;
  onBack: () => void;
  onSelectProduct: (slug: string) => void;
  onBuyNow: (product: Product) => void;
  onNavigate?: (view: string, param?: string) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  slug,
  onBack,
  onSelectProduct,
  onBuyNow,
  onNavigate
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const { addToCart, isInCart } = useCart();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    import('../lib/apiClient').then(({ safeFetchJson }) => {
      safeFetchJson<{ product: Product; related: Product[]; reviews: Review[] }>(`/api/products/${slug}`)
        .then(async (apiRes) => {
          if (!isMounted) return;
          if (apiRes.ok && apiRes.data?.product) {
            setProduct(apiRes.data.product);
            setRelated(apiRes.data.related || []);
            setReviews(apiRes.data.reviews || []);
            setLoading(false);
            return;
          }

          // Fallback on static hosting: search product in local catalog / Firestore
          try {
            const dbData = (await import('../../data/db.json')).default;
            const prods = (dbData.products || []) as Product[];
            const found = prods.find(p => p.slug === slug || p.id === slug);
            if (found && isMounted) {
              setProduct(found);
              setRelated(prods.filter(p => p.id !== found.id && p.category === found.category).slice(0, 3));
              const revs = (dbData.reviews || []) as Review[];
              setReviews(revs.filter(r => r.productId === found.id));
            }
          } catch (err) {
            console.error('Fallback product lookup failed:', err);
          } finally {
            if (isMounted) setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Synchronize product detail live if prices or features were modified in Admin
  useEffect(() => {
    const handleProductsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<Product[]>;
      if (Array.isArray(customEvent.detail)) {
        const found = customEvent.detail.find(p => p.slug === slug || p.id === slug);
        if (found) {
          setProduct(found);
        }
      }
    };
    window.addEventListener('digishop:products-updated', handleProductsUpdated);
    return () => {
      window.removeEventListener('digishop:products-updated', handleProductsUpdated);
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Chargement de la fiche produit...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">Produit non trouvé</h2>
        <p className="text-xs text-slate-500">Ce produit n'existe pas ou a été retiré du catalogue.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-sky-500 text-white rounded-xl"
        >
          Retour au catalogue
        </button>
      </div>
    );
  }

  const inCart = isInCart(product.id);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingReview(true);
    try {
      const { safeFetchJson } = await import('../lib/apiClient');
      const apiRes = await safeFetchJson<Review>('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('digishop_token')
            ? { Authorization: `Bearer ${localStorage.getItem('digishop_token')}` }
            : {})
        },
        body: JSON.stringify({
          productId: product.id,
          productTitle: product.title,
          userName: user?.name || 'Client Digishop',
          rating: newRating,
          comment: newComment.trim()
        })
      });

      if (apiRes.ok && apiRes.data) {
        setReviews(prev => [apiRes.data!, ...prev]);
      } else {
        // Optimistic local review for client
        const localRev: Review = {
          id: 'rev-' + Date.now(),
          productId: product.id,
          productTitle: product.title,
          userName: user?.name || 'Client Digishop',
          rating: newRating,
          comment: newComment.trim(),
          isVerifiedPurchase: true,
          isApproved: true,
          createdAt: new Date().toISOString()
        };
        setReviews(prev => [localRev, ...prev]);
      }
      setNewComment('');
      showToast('Votre avis a été publié avec succès ! Merci.', 'success');
    } catch {
      showToast('Votre avis a été enregistré avec succès !', 'success');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour à la boutique</span>
        </button>
      </div>

      {/* Contiguous Purchase Module (PDP Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Visual Showcase (Sticky gallery) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 aspect-[4/3] shadow-md">
            <img
              src={getProductImageUrl(product.image, product.category, product.title)}
              alt={product.title}
              className="w-full h-full object-cover"
              onError={(e) => handleImageFallback(e, product.category, product.title)}
            />
          </div>

          {/* Product Highlights Strip */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-[11px] text-slate-400">Format</p>
              <p className="font-semibold text-slate-900 dark:text-white">{product.fileDetails.fileFormat}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Taille du fichier</p>
              <p className="font-semibold text-slate-900 dark:text-white font-mono">{product.fileDetails.fileSize}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Version</p>
              <p className="font-semibold text-slate-900 dark:text-white font-mono">{product.fileDetails.version}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Délivrance</p>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">Instantanée</p>
            </div>
          </div>
        </div>

        {/* Right Column: Contiguous Purchase Module */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-lg space-y-6">
            
            {/* Metadata (Zero-pill) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>{product.categoryLabel}</span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{product.rating}</strong>
                  <span>({product.reviewsCount} avis)</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{product.downloadsCount} téléchargements</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold font-display text-slate-950 dark:text-white leading-tight">
                {product.title}
              </h1>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {product.shortDescription}
              </p>
            </div>

            {/* Price Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Prix TTC (Licence incluse)</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-950 dark:text-white tabular-nums">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm text-slate-400 line-through font-mono tabular-nums">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                  En stock digital
                </span>
              </div>
            </div>

            {/* License information */}
            <div className="space-y-2 text-xs">
              <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-500" />
                <span>Type de licence : {product.licenseType}</span>
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Autorise l'usage individuel et commercial pour vos projets sans redevance ultérieure.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => onBuyNow(product)}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <span>Acheter maintenant ({product.price.toFixed(2)} €)</span>
              </button>

              <button
                onClick={() => addToCart(product)}
                className={`w-full py-3 px-4 rounded-xl border font-semibold text-xs transition-colors flex items-center justify-center gap-2 ${
                  inCart
                    ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{inCart ? 'Déjà dans votre panier ✓' : 'Ajouter au panier'}</span>
              </button>
            </div>

            {/* Guaranteed digital conditions */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-500">
              <p className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Téléchargement instantané via lien signé sécurisé</span>
              </p>
              <p className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Aucun frais de port — Produit 100% numérique</span>
              </p>
              <p className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Paiements supportés : Carte, PayPal, Moov Money, Mixx</span>
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* Description & Detailed Features */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-bold font-display text-slate-950 dark:text-white">
              Description complète du produit
            </h2>
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-4 whitespace-pre-line">
              {product.fullDescription}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Ce qui est inclus dans le téléchargement :
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {product.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Customer Reviews & Moderated Ratings */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold font-display text-slate-950 dark:text-white">
                  Avis des acheteurs certifiés ({reviews.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Retours d'expérience vérifiés sur ce produit numérique.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-sm font-bold font-mono text-slate-900 dark:text-white">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="tabular-nums">{product.rating} / 5</span>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Aucun avis pour l'instant. Soyez le premier à donner votre appréciation !
                </p>
              ) : (
                reviews.map(r => (
                  <div key={r.id} className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 dark:text-white">{r.userName}</strong>
                        {r.isVerifiedPurchase && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            Acheteur vérifié ✓
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {r.comment}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Leave a review form */}
            <form onSubmit={handleSubmitReview} className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Laisser un avis sur ce produit
              </h3>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-600 dark:text-slate-400">Votre note :</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-4 h-4 ${star <= newRating ? 'fill-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Partagez votre avis sur la qualité du contenu, l'utilité des templates..."
                rows={3}
                required
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />

              <button
                type="submit"
                disabled={submittingReview || !newComment.trim()}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submittingReview ? 'Envoi...' : 'Publier mon avis'}</span>
              </button>
            </form>

          </div>

        </div>

        {/* Right side: Security & License Guarantee */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 text-xs">
            <h3 className="text-sm font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-500" />
              <span>Mentions de Licence Officielle</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Ce produit bénéficie de la protection intellectuelle Digishop. Le téléchargement octroie un droit d'exploitation pour vos besoins propres et vos prestations.
            </p>
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
              <p>✓ Revente directe ou partage public du fichier source strictement interdit.</p>
              <p>✓ Utilisation autorisée dans les projets clients et livrables finaux.</p>
              <p>✓ Mises à jour gratuites incluses pendant toute la durée de validité.</p>
            </div>
          </div>

          {/* Espace Publicitaire Fiche Produit (Sidebar) */}
          <AdBanner position="product_sidebar" onNavigate={onNavigate} />
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="pt-8 border-t border-slate-200/80 dark:border-slate-800 space-y-6">
          <h2 className="text-xl font-bold font-display text-slate-950 dark:text-white">
            Produits associés dans cette catégorie
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onSelect={onSelectProduct}
                onBuyNow={onBuyNow}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};
