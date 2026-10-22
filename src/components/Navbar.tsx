import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Moon,
  Sun,
  User as UserIcon,
  Menu,
  X,
  ShieldCheck,
  UploadCloud,
  ChevronDown,
  Check,
  BookOpen,
  FileCode,
  Palette,
  GraduationCap,
  FileText,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import { NavigationDrawer } from './NavigationDrawer';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenGitHubExport?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenAuth, onOpenGitHubExport }) => {
  const { user, isAdmin, logout } = useAuth();
  const { cart, openCart } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency, currencyConfig, currencies } = useCurrency();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);

  // References for outside click detection
  const searchRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const productsDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Automatically close any open popover/menu when clicking anywhere else on the page or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchOpen && searchRef.current && !searchRef.current.contains(target)) {
        setSearchOpen(false);
      }
      if (currencyDropdownOpen && currencyRef.current && !currencyRef.current.contains(target)) {
        setCurrencyDropdownOpen(false);
      }
      if (userDropdownOpen && userDropdownRef.current && !userDropdownRef.current.contains(target)) {
        setUserDropdownOpen(false);
      }
      if (productsDropdownOpen && productsDropdownRef.current && !productsDropdownRef.current.contains(target)) {
        setProductsDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setCurrencyDropdownOpen(false);
        setUserDropdownOpen(false);
        setProductsDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchOpen, currencyDropdownOpen, userDropdownOpen, productsDropdownOpen]);

  const navLinks = [
    { id: 'home', label: 'Accueil' },
    { id: 'catalog', label: 'Boutique' },
    { id: 'categories', label: 'Catégories' },
    { id: 'about', label: 'À propos' },
    { id: 'faq', label: 'FAQ' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('catalog', searchQuery.trim());
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md transition-colors overflow-x-clip">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-1.5 sm:gap-4">
        
        {/* Zone 1: Top Left Hamburger Menu Button + Brand Wordmark */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-1 text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Ouvrir le menu de navigation"
            aria-expanded={mobileMenuOpen}
            title="Menu principal"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
            className="flex items-center gap-1.5 sm:gap-2 text-left focus:outline-none group shrink-0 min-w-0"
          >
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-display text-sm sm:text-base font-extrabold shadow-sm shadow-sky-500/20 shrink-0">
              D
            </span>
            <div className="flex flex-col leading-none min-w-0">
              <span className="text-base sm:text-xl font-bold tracking-tight text-slate-950 dark:text-white font-display">
                Digishop
              </span>
              <span className="hidden min-[360px]:inline text-[9px] sm:text-[10px] font-medium tracking-wide text-slate-500 dark:text-slate-400 mt-0.5 whitespace-nowrap">
                by Lemax Group
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: 4-6 clean text navigation links with interactive Produits dropdown */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => onNavigate('home')}
            className={`transition-colors hover:text-sky-600 dark:hover:text-sky-400 whitespace-nowrap ${
              currentView === 'home' ? 'text-sky-600 dark:text-sky-400 font-semibold' : ''
            }`}
          >
            Accueil
          </button>

          {/* Interactive Produits Dropdown */}
          <div
            ref={productsDropdownRef}
            className="relative"
            onMouseEnter={() => setProductsDropdownOpen(true)}
          >
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => {
                  onNavigate('catalog');
                  setProductsDropdownOpen(false);
                }}
                className={`transition-colors hover:text-sky-600 dark:hover:text-sky-400 whitespace-nowrap py-1 ${
                  currentView === 'catalog' ? 'text-sky-600 dark:text-sky-400 font-semibold' : ''
                }`}
              >
                Produits
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setProductsDropdownOpen(!productsDropdownOpen);
                }}
                className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors focus:outline-none"
                aria-label="Afficher les rayons produits"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${productsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {productsDropdownOpen && (
              <div
                onMouseLeave={() => setProductsDropdownOpen(false)}
                className="absolute top-full left-0 mt-1.5 w-64 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5"
              >
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                  Catalogue & Rayons
                </div>

                <button
                  onClick={() => {
                    onNavigate('catalog');
                    setProductsDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                >
                  <Layers className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Tous les Produits</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('catalog', 'cat=ebooks');
                    setProductsDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>E-books & Guides</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('catalog', 'cat=templates');
                    setProductsDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                >
                  <FileCode className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Templates & UI kits</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('catalog', 'cat=graphisme');
                    setProductsDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                >
                  <Palette className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Ressources Graphiques</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('catalog', 'cat=formations');
                    setProductsDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                >
                  <GraduationCap className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Formations en ligne</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('catalog', 'cat=documents');
                    setProductsDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                >
                  <FileText className="w-4 h-4 text-sky-500 shrink-0" />
                  <span>Documents & Contrats</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('about')}
            className={`transition-colors hover:text-sky-600 dark:hover:text-sky-400 whitespace-nowrap ${
              currentView === 'about' ? 'text-sky-600 dark:text-sky-400 font-semibold' : ''
            }`}
          >
            À propos
          </button>

          <button
            onClick={() => onNavigate('faq')}
            className={`transition-colors hover:text-sky-600 dark:hover:text-sky-400 whitespace-nowrap ${
              currentView === 'faq' ? 'text-sky-600 dark:text-sky-400 font-semibold' : ''
            }`}
          >
            FAQ
          </button>

          <button
            onClick={() => onNavigate('contact')}
            className={`transition-colors hover:text-sky-600 dark:hover:text-sky-400 whitespace-nowrap ${
              currentView === 'contact' ? 'text-sky-600 dark:text-sky-400 font-semibold' : ''
            }`}
          >
            Contact
          </button>
        </nav>

        {/* Zone 3: Primary actions (Search, Currency, Theme, Cart, Auth, Menu) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          
          {/* Search Trigger */}
          <div ref={searchRef} className="relative">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  autoFocus
                  className="w-28 xs:w-36 sm:w-64 pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-1.5 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-1.5 sm:right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                title="Rechercher"
                aria-label="Recherche"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Currency Dropdown Selector (Compact on mobile, full on tablet/desktop) */}
          <div ref={currencyRef} className="relative">
            <button
              type="button"
              onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-colors shadow-sm"
              title="Changer la devise (Euro, Dollar, Franc CFA)"
              aria-label="Sélecteur de devise"
            >
              <span className="text-xs sm:text-sm leading-none">{currencyConfig.flag}</span>
              <span className="font-mono font-bold text-[11px] sm:text-xs">{currencyConfig.code}</span>
              <span className="hidden sm:inline text-[10px] text-slate-500 font-normal">({currencyConfig.symbol})</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {currencyDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50 animate-in fade-in text-xs"
                onClick={() => setCurrencyDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Devise d'affichage
                </div>
                {currencies.map(c => {
                  const isActive = c.code === currency;
                  return (
                    <button
                      key={c.code}
                      onClick={() => setCurrency(c.code)}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                        isActive
                          ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">{c.flag}</span>
                        <div>
                          <p className="font-semibold leading-tight">{c.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{c.code} ({c.symbol})</p>
                        </div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-sky-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Theme toggle (Always visible, functional in both light & dark modes) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            title={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
            aria-label="Changer de thème"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
          </button>

          {/* Cart Drawer Trigger */}
          <button
            onClick={openCart}
            className="relative p-1.5 sm:p-2 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            aria-label={`Panier (${cart.length} articles)`}
          >
            <ShoppingBag className="w-4 h-4" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {cart.length}
              </span>
            )}
          </button>

          {/* Direct Quick Admin Access for Mobile & Desktop (Visible ONLY when admin is connected) */}
          {isAdmin && user && (
            <button
              onClick={() => onNavigate('admin')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all border ${
                currentView === 'admin'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
              }`}
              title="Accéder à l'espace Administrateur"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="text-[11px] sm:text-xs">Admin</span>
            </button>
          )}

          {/* Auth / Account */}
          {user ? (
            <div ref={userDropdownRef} className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 p-1 sm:pl-2 sm:pr-3 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                title={user.name}
              >
                <div className="w-6 h-6 sm:w-5 sm:h-5 rounded-full bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300 flex items-center justify-center text-[11px] sm:text-[10px] font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[80px] truncate">{user.name}</span>
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 text-xs text-slate-700 dark:text-slate-300 z-50 animate-in fade-in"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-2"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    Mon espace client
                  </button>

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => onNavigate('admin')}
                        className="w-full text-left px-3 py-2 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors flex items-center gap-2 font-medium"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Tableau de bord Admin
                      </button>
                      {onOpenGitHubExport && (
                        <button
                          onClick={onOpenGitHubExport}
                          className="w-full text-left px-3 py-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors flex items-center gap-2 font-medium"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          Exporter vers GitHub
                        </button>
                      )}
                    </>
                  )}

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                  <button
                    onClick={() => { logout(); onNavigate('home'); }}
                    className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Mobile compact user icon button */}
              <button
                onClick={() => onOpenAuth('login')}
                className="sm:hidden p-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                title="Se connecter / Mon compte"
                aria-label="Connexion"
              >
                <UserIcon className="w-4 h-4" />
              </button>

              {/* Desktop auth buttons */}
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
                >
                  Se connecter
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('register')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shadow-sm"
                >
                  Créer un compte
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Full-height Slide-out Navigation Drawer */}
      <NavigationDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentView={currentView}
        onNavigate={onNavigate}
        onOpenAuth={onOpenAuth}
        onOpenGitHubExport={onOpenGitHubExport}
      />
    </header>
  );
};
