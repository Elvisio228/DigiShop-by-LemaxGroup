import React, { useState } from 'react';
import { X, Trash2, ArrowRight, ShoppingBag, Tag, Check, Download } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { getProductImageUrl, handleImageFallback } from '../lib/imageUtils';

interface CartDrawerProps {
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckout }) => {
  const {
    cart,
    isCartOpen,
    closeCart,
    removeFromCart,
    subtotal,
    discountAmount,
    total,
    couponCode,
    applyCoupon,
    removeCoupon
  } = useCart();
  const { formatPrice } = useCurrency();

  const [inputCode, setInputCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) closeCart();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    setApplying(true);
    setError(null);
    try {
      await applyCoupon(inputCode);
      setInputCode('');
    } catch (err: any) {
      setError(err.message || 'Code promo invalide');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-sky-500" />
              <h2 className="text-base font-bold text-slate-950 dark:text-white font-display">
                Votre Panier Digital ({cart.length})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
              aria-label="Fermer le panier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Notice: Digital delivery 0 delivery fees */}
          <div className="bg-sky-50 dark:bg-sky-950/40 px-5 py-2.5 border-b border-sky-100 dark:border-sky-900/50 flex items-center gap-2 text-xs text-sky-800 dark:text-sky-300">
            <Download className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
            <span className="font-medium">Produit numérique — aucun frais de livraison.</span>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Votre panier est vide</h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  Explorez nos e-books, templates et ressources graphiques pour démarrer vos projets.
                </p>
                <button
                  type="button"
                  onClick={closeCart}
                  className="mt-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl transition-colors shadow-sm"
                >
                  Découvrir les produits
                </button>
              </div>
            ) : (
              cart.map(item => (
                <div
                  key={item.id}
                  className="flex gap-3.5 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <img
                    src={getProductImageUrl(item.image, item.category, item.title)}
                    alt={item.title}
                    className="w-16 h-16 rounded-lg object-cover bg-slate-200 shrink-0"
                    onError={(e) => handleImageFallback(e, item.category, item.title)}
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-0.5"
                          title="Supprimer du panier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.categoryLabel} · {item.fileDetails.fileName}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Téléchargement immédiat
                      </span>
                      <span className="text-xs font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Area */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 space-y-4">
              
              {/* Coupon input */}
              <div>
                {couponCode ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-medium">
                      <Check className="w-3.5 h-3.5" />
                      <span>Code promo appliqué : <strong className="font-mono">{couponCode}</strong> (-{formatPrice(discountAmount)})</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-slate-400 hover:text-rose-600 text-[11px] underline ml-2"
                    >
                      Retirer
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-1">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={inputCode}
                          onChange={(e) => setInputCode(e.target.value)}
                          placeholder="Code promo (ex: BIENVENUE10)"
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={applying || !inputCode.trim()}
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {applying ? '...' : 'Appliquer'}
                      </button>
                    </div>
                    {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
                  </form>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Sous-total</span>
                  <span className="font-mono tabular-nums">{formatPrice(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Réduction promo</span>
                    <span className="font-mono tabular-nums">-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                  <span>Frais de livraison</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Gratuit (Digital)</span>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-sm font-bold text-slate-950 dark:text-white">
                  <span>Total à régler</span>
                  <span className="text-base font-mono tabular-nums">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    closeCart();
                    onCheckout();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <span>Passer au paiement</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={closeCart}
                  className="w-full py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Continuer les achats
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
