import React from 'react';
import { Product } from '../types';
import { Star, Download, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

interface ProductCardProps {
  product: Product;
  onSelect: (slug: string) => void;
  onBuyNow: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect, onBuyNow }) => {
  const { addToCart, isInCart } = useCart();
  const { formatPrice } = useCurrency();
  const inCart = isInCart(product.id);

  return (
    <div className="group flex flex-col h-full rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
      
      {/* Product Image Box (65-70% visual prominence) */}
      <div 
        onClick={() => onSelect(product.slug)}
        className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer"
      >
        <img
          src={product.image}
          alt={product.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        {/* Fallback container */}
        <div className="hidden w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 items-center justify-center p-4 text-center text-white">
          <p className="text-xs font-semibold">{product.title}</p>
        </div>

        {/* Max 1 subtle badge if applicable */}
        {product.isNew ? (
          <span className="absolute top-3 left-3 px-2.5 py-1 text-[11px] font-semibold text-sky-950 bg-sky-200/90 dark:bg-sky-400 dark:text-slate-950 rounded-md backdrop-blur-sm shadow-sm">
            Nouveau
          </span>
        ) : product.isPromo ? (
          <span className="absolute top-3 left-3 px-2.5 py-1 text-[11px] font-semibold text-emerald-950 bg-emerald-200/90 dark:bg-emerald-400 dark:text-slate-950 rounded-md backdrop-blur-sm shadow-sm">
            Promo
          </span>
        ) : null}

        {/* Quick view indicator on hover */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white p-1.5 rounded-lg shadow-sm">
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>

      {/* Card Content & Metadata */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
        
        <div className="space-y-2">
          {/* Zero-Pill Unboxed Metadata */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>{product.categoryLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{product.fileDetails.fileFormat.split(' ')[0]}</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              <span className="tabular-nums">{product.downloadsCount}</span>
            </span>
          </div>

          {/* Product Title */}
          <h3
            onClick={() => onSelect(product.slug)}
            className="text-base font-bold text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer transition-colors line-clamp-2 leading-snug"
          >
            {product.title}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        {/* Price & Rating Row */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-950 dark:text-white font-mono tabular-nums">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-slate-400 line-through font-mono tabular-nums">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-slate-700 dark:text-slate-300 tabular-nums">{product.rating}</span>
            <span className="text-slate-400 text-[10px]">({product.reviewsCount})</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => addToCart(product)}
            className={`w-full py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              inCart
                ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{inCart ? 'Au panier ✓' : 'Ajouter'}</span>
          </button>

          <button
            type="button"
            onClick={() => onBuyNow(product)}
            className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition-all shadow-sm flex items-center justify-center whitespace-nowrap"
          >
            Acheter
          </button>
        </div>

      </div>

    </div>
  );
};
