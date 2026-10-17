import React, { useState, useMemo } from 'react';
import { Product, ProductCategory } from '../types';
import { ProductCard } from '../components/ProductCard';
import { AdBanner } from '../components/AdBanner';
import { Search, SlidersHorizontal, ArrowUpDown, X, Tag, Sparkles } from 'lucide-react';

interface CatalogViewProps {
  products: Product[];
  initialCategory?: string;
  initialSearch?: string;
  onSelectProduct: (slug: string) => void;
  onBuyNow: (product: Product) => void;
  onNavigate: (view: string, param?: string) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  initialCategory,
  initialSearch = '',
  onSelectProduct,
  onBuyNow,
  onNavigate
}) => {
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [onlyPromo, setOnlyPromo] = useState(false);
  const [onlyNew, setOnlyNew] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc' | 'popular'>('recent');
  const [maxPrice, setMaxPrice] = useState<number>(150);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'Toutes les catégories' },
    { id: 'ebooks', label: 'E-books' },
    { id: 'templates', label: 'Templates' },
    { id: 'graphisme', label: 'Ressources graphiques' },
    { id: 'documents', label: 'Documents pros' },
    { id: 'formations', label: 'Formations' }
  ];

  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Category
    if (selectedCategory !== 'all') {
      list = list.filter(p => p.category === selectedCategory);
    }

    // Promo filter
    if (onlyPromo) {
      list = list.filter(p => p.isPromo);
    }

    // New filter
    if (onlyNew) {
      list = list.filter(p => p.isNew);
    }

    // Price max
    list = list.filter(p => p.price <= maxPrice);

    // Sort
    switch (sortBy) {
      case 'price_asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        list.sort((a, b) => b.downloadsCount - a.downloadsCount);
        break;
      case 'recent':
      default:
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return list;
  }, [products, search, selectedCategory, onlyPromo, onlyNew, maxPrice, sortBy]);

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setOnlyPromo(false);
    setOnlyNew(false);
    setMaxPrice(150);
    setSortBy('recent');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header & Page Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold font-display text-slate-950 dark:text-white">
          Catalogue des Produits Digitaux
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Explorez et filtrez nos ressources téléchargeables immédiatement. Aucun délai, aucun frais de livraison.
        </p>
      </div>

      {/* Main Search & Interactive Filter Bar */}
      <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        
        {/* Top Search Input & Sort Selector */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par titre, mot-clé, compétence..."
              className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trier par :</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="recent">Plus récent</option>
              <option value="popular">Plus populaire (téléchargements)</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
            </select>
          </div>

        </div>

        {/* Interactive Segmented Filter Controls (Category buttons) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {categories.map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white shadow-sm font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Quick Toggles: Promo, Nouveaux, Max Price */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-slate-600 dark:text-slate-400">
          
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyPromo}
                onChange={(e) => setOnlyPromo(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-emerald-500" />
                Promotions uniquement
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyNew}
                onChange={(e) => setOnlyNew(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                Nouveautés
              </span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px]">Prix max : <strong className="font-mono text-slate-900 dark:text-white tabular-nums">{maxPrice} €</strong></span>
            <input
              type="range"
              min="10"
              max="150"
              step="5"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseFloat(e.target.value))}
              className="w-24 sm:w-32 accent-sky-500 cursor-pointer"
            />
            {(search || selectedCategory !== 'all' || onlyPromo || onlyNew || maxPrice < 150) && (
              <button
                onClick={resetFilters}
                className="text-[11px] text-rose-500 hover:underline ml-2"
              >
                Réinitialiser
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Main Grid & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Products Grid (3 cols on lg) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              <strong className="font-semibold text-slate-900 dark:text-white font-mono tabular-nums">{filteredProducts.length}</strong>{' '}
              produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                <SlidersHorizontal className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Aucun produit ne correspond à ces critères</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Essayez d'ajuster vos filtres de prix ou de chercher un autre mot-clé.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl transition-colors shadow-sm"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                  onBuyNow={onBuyNow}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar with Espace Publicitaire 2 & Trust Summary */}
        <div className="space-y-6">
          <AdBanner position="catalog_sidebar" onNavigate={onNavigate} />

          {/* Quick FAQ / Guarantee card */}
          <div className="rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 text-xs">
            <h4 className="font-bold font-display text-slate-900 dark:text-white">
              Garantie Digishop
            </h4>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Fichiers scannés et vérifiés sans virus ni malware.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Droits de réutilisation commerciale inclus selon la licence.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Support client dédié en cas de question technique.</span>
              </li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
};
