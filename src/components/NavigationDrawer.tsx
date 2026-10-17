import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Home,
  ShoppingBag,
  LayoutGrid,
  Info,
  HelpCircle,
  Mail,
  ShieldCheck,
  UploadCloud,
  User as UserIcon,
  Settings,
  LogOut,
  Sun,
  Moon,
  Search,
  Download,
  BookOpen,
  FileCode,
  Palette,
  GraduationCap,
  ChevronRight,
  CreditCard,
  Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenGitHubExport?: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenGitHubExport,
}) => {
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency, currencyConfig, currencies } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchCurrentXRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Touch swipe-to-close gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current !== null && touchCurrentXRef.current !== null) {
      const diffX = touchStartXRef.current - touchCurrentXRef.current;
      // If swiped left by more than 40 pixels, close drawer
      if (diffX > 40) {
        onClose();
      }
    }
    touchStartXRef.current = null;
    touchCurrentXRef.current = null;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('catalog', searchQuery.trim());
      onClose();
      setSearchQuery('');
    }
  };

  const mainNavItems = [
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'catalog', label: 'Boutique & Catalogue', icon: ShoppingBag },
    { id: 'about', label: 'À propos de Digishop', icon: Info },
    { id: 'faq', label: 'FAQ & Centre d’aide', icon: HelpCircle },
    { id: 'contact', label: 'Contact & Support', icon: Mail },
  ];

  const quickCategories = [
    { id: 'ebooks', label: 'E-books & Guides', icon: BookOpen },
    { id: 'templates', label: 'Templates & UI Kits', icon: FileCode },
    { id: 'graphics', label: 'Ressources Graphiques', icon: Palette },
    { id: 'courses', label: 'Formations en ligne', icon: GraduationCap },
  ];

  if (!isOpen || !mounted) return null;

  const drawerContent = (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navigation latéral"
      style={{ isolation: 'isolate' }}
    >
      {/* Dimmed backdrop - click outside closes drawer */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel: Full-height (100dvh), ~65% width on mobile, max 340px on desktop */}
      <aside
        ref={drawerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="fixed inset-y-0 left-0 h-full h-[100dvh] w-[65%] min-w-[280px] max-w-[340px] sm:w-80 md:w-84 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 shadow-2xl flex flex-col z-[10000] transform transition-transform duration-300 ease-out select-none"
        style={{
          boxShadow: '4px 0 24px -2px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* ============================================================== */}
        {/* 1. DRAWER HEADER (Brand + Dedicated Close Button)              */}
        {/* ============================================================== */}
        <div className="h-16 px-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-slate-900/90">
          <button
            onClick={() => {
              onNavigate('home');
              onClose();
            }}
            className="flex items-center gap-2.5 text-left focus:outline-none group min-w-0"
          >
            <span className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-display text-sm font-extrabold shadow-sm shadow-sky-500/20 shrink-0">
              D
            </span>
            <div className="flex flex-col leading-none min-w-0">
              <span className="text-base font-bold tracking-tight text-slate-950 dark:text-white font-display">
                Digishop
              </span>
              <span className="text-[10px] font-medium tracking-wide text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                by Lemax Group
              </span>
            </div>
          </button>

          {/* Dedicated Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-1 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Fermer le menu de navigation"
            title="Fermer (Échap)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* 2. DRAWER BODY (Upper navigation, search, categories, admin)   */}
        {/* ============================================================== */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-4 space-y-4">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher des produits..."
              className="w-full pl-3 pr-8 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              aria-label="Lancer la recherche"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Primary Navigation Links */}
          <div className="space-y-1">
            <p className="px-2 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Navigation
            </p>

            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60 font-bold shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                  )}
                </button>
              );
            })}

            {/* Expandable Catégories Submenu */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <LayoutGrid className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span>Rayons & Catégories</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    categoriesExpanded ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {categoriesExpanded && (
                <div className="ml-4 pl-3 border-l border-slate-200 dark:border-slate-800 space-y-1 mt-1">
                  {quickCategories.map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          onNavigate('catalog', `cat=${cat.id}`);
                          onClose();
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                      >
                        <CatIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick Access to Orders if logged in */}
          {user && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  onNavigate('dashboard');
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Mes téléchargements & Achats</span>
              </button>
            </div>
          )}

          {/* Admin Navigation Section */}
          {isAdmin && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <p className="px-2 text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                Espace Administrateur
              </p>

              <button
                onClick={() => {
                  onNavigate('admin');
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/50 hover:bg-blue-100 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span className="truncate">Tableau de bord Admin</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </button>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('admin');
                    onClose();
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 flex items-center gap-1.5 truncate"
                >
                  <Package className="w-3.5 h-3.5 text-blue-500" />
                  <span className="truncate">Produits</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('admin');
                    onClose();
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 flex items-center gap-1.5 truncate"
                >
                  <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                  <span className="truncate">Passerelles</span>
                </button>
              </div>

              {onOpenGitHubExport && (
                <button
                  onClick={() => {
                    onOpenGitHubExport();
                    onClose();
                  }}
                  className="w-full text-left mt-1 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/50 hover:bg-emerald-100 transition-colors flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4 shrink-0" />
                  <span className="truncate">Exporter vers GitHub</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* 3. DRAWER FOOTER (User account, email, settings & controls)   */}
        {/* ============================================================== */}
        <div className="mt-auto p-3.5 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 shrink-0 space-y-3">
          {/* User Account / Profile Details */}
          {user ? (
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-extrabold shrink-0 shadow-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-950 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-medium truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Account Quick Links: Mon Espace & Paramètres */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('dashboard');
                    onClose();
                  }}
                  className="py-1.5 px-2 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <UserIcon className="w-3 h-3 text-slate-400" />
                  <span>Mon compte</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onNavigate('dashboard');
                    onClose();
                  }}
                  className="py-1.5 px-2 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Settings className="w-3 h-3 text-slate-400" />
                  <span>Paramètres</span>
                </button>
              </div>
            </div>
          ) : (
            /* Guest / Not Authenticated Options */
            <div className="space-y-2">
              <div className="text-left px-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Bienvenue sur Digishop
                </p>
                <p className="text-[10px] text-slate-500">
                  Connectez-vous pour retrouver vos fichiers
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuth('login');
                    onClose();
                  }}
                  className="flex-1 py-2 text-xs font-semibold text-center border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                >
                  Se connecter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuth('register');
                    onClose();
                  }}
                  className="flex-1 py-2 text-xs font-semibold text-center bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl transition-colors shadow-sm"
                >
                  Créer compte
                </button>
              </div>
            </div>
          )}

          {/* Theme Mode Toggle (Interactive Switch with Visual Feedback) */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-sky-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {theme === 'dark' ? 'Mode sombre' : 'Mode clair'}
              </span>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                theme === 'dark' ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
              role="switch"
              aria-checked={theme === 'dark'}
              aria-label="Basculer le mode sombre ou clair"
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  theme === 'dark' ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Currency Switcher */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <span className="text-[11px] font-medium text-slate-500">Devise :</span>
            <div className="flex items-center gap-1">
              {currencies.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCurrency(c.code)}
                  className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                    c.code === currency
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{c.flag}</span> <span className="font-mono">{c.code}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Logout Action if Logged In */}
          {user && (
            <button
              type="button"
              onClick={() => {
                logout();
                onNavigate('home');
                onClose();
              }}
              className="w-full py-1.5 text-center text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Se déconnecter</span>
            </button>
          )}
        </div>
      </aside>
    </div>
  );

  return createPortal(drawerContent, document.body);
};
