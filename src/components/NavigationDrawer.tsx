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
  ChevronLeft,
  FileText,
  Layers,
  CreditCard,
  Package,
  TrendingUp,
  Users,
  Tag,
  Radio,
  Key,
  FileArchive,
  ArrowLeftRight,
  Check,
  UserCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';

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
  const { user, isAdmin, logout, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency, currencies } = useCurrency();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);
  const [adminMenuExpanded, setAdminMenuExpanded] = useState(true);
  const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimatedIn, setIsAnimatedIn] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const drawerRef = useRef<HTMLElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const gestureIntentRef = useRef<'horizontal' | 'vertical' | 'click' | null>(null);

  const isPointerDownRef = useRef(false);
  const pointerStartXRef = useRef<number>(0);
  const pointerStartTimeRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Synchronize opening/closing animation lifecycle with isOpen prop
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      setDragOffset(0);
      const frame = requestAnimationFrame(() => {
        setIsAnimatedIn(true);
      });
      return () => cancelAnimationFrame(frame);
    } else {
      setIsAnimatedIn(false);
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
        setDragOffset(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (shouldRender) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [shouldRender]);

  // Smooth slide-to-close handler
  const handleTriggerClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setIsDragging(false);
    setIsAnimatedIn(false);
    setTimeout(() => {
      onClose();
    }, 240);
  };

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && shouldRender) {
        if (accountSwitcherOpen) {
          setAccountSwitcherOpen(false);
        } else {
          handleTriggerClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shouldRender, accountSwitcherOpen]);

  // Touch gesture handling: distinguish vertical list scrolling from horizontal left slide
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    // If touched on an interactive button, link, or form control, prioritize standard click
    if (target.closest('button, a, input, textarea, select')) {
      gestureIntentRef.current = 'click';
      return;
    }
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchStartTimeRef.current = Date.now();
    gestureIntentRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (gestureIntentRef.current === 'click') return;
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const clientX = e.touches[0].clientX;
    const clientY = e.touches[0].clientY;
    const diffX = clientX - touchStartXRef.current;
    const diffY = clientY - touchStartYRef.current;

    // Detect gesture intent: require at least 15px movement and horizontal dominance
    if (gestureIntentRef.current === null) {
      if (Math.abs(diffX) > 15 || Math.abs(diffY) > 15) {
        if (Math.abs(diffY) >= Math.abs(diffX)) {
          // User is scrolling the inner list vertically
          gestureIntentRef.current = 'vertical';
        } else if (diffX < -10) {
          // User is deliberately pushing/sliding horizontally to the left
          gestureIntentRef.current = 'horizontal';
          setIsDragging(true);
        }
      }
    }

    if (gestureIntentRef.current === 'horizontal') {
      // Clamped: sliding left creates negative offset
      const newOffset = diffX < 0 ? diffX : diffX * 0.15;
      setDragOffset(newOffset);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (gestureIntentRef.current === 'horizontal' && touchStartXRef.current !== null) {
      const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
      const diffX = endX - touchStartXRef.current;
      const duration = Date.now() - touchStartTimeRef.current;
      const velocity = diffX / Math.max(1, duration);

      // Threshold: pushed left by > 50px OR fast flick to the left
      if (diffX < -50 || velocity < -0.35) {
        handleTriggerClose();
      } else {
        setDragOffset(0);
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    gestureIntentRef.current = null;
    setIsDragging(false);
  };

  // Pointer / Mouse drag handling for desktop & laptop trackpads
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('input, textarea, select, button, a');
    const isDragHandle = target.closest('[data-drag-handle="true"]');
    if (isInteractive && !isDragHandle) return;

    isPointerDownRef.current = true;
    pointerStartXRef.current = e.clientX;
    pointerStartTimeRef.current = Date.now();
    setIsDragging(true);

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    const diffX = e.clientX - pointerStartXRef.current;
    const newOffset = diffX < 0 ? diffX : diffX * 0.15;
    setDragOffset(newOffset);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsDragging(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const diffX = e.clientX - pointerStartXRef.current;
    const duration = Date.now() - pointerStartTimeRef.current;
    const velocity = diffX / Math.max(1, duration);

    if (diffX < -50 || velocity < -0.35) {
      handleTriggerClose();
    } else {
      setDragOffset(0);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('catalog', searchQuery.trim());
      onClose();
      setSearchQuery('');
    }
  };

  // Direct ZIP project export handler
  const handleExportZip = () => {
    showToast('Préparation du téléchargement du projet...', 'info');
    const link = document.createElement('a');
    link.href = '/api/export-project.zip';
    link.download = 'digishop-by-lemax-group.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  // Quick Account Switch helper (Demo quick accounts or login modal)
  const handleSwitchToDemo = async (email: string, pass: string) => {
    try {
      await login(email, pass);
      setAccountSwitcherOpen(false);
      showToast(`Connecté avec succès en tant que ${email}`, 'success');
    } catch {
      showToast('Impossible de basculer de compte automatiquement.', 'error');
      onOpenAuth('login');
      onClose();
    }
  };

  if (!shouldRender || !mounted) return null;

  const drawerContent = (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navigation latéral coulissant"
      style={{ isolation: 'isolate' }}
    >
      {/* Dimmed backdrop - click outside triggers smooth close */}
      <div
        onClick={handleTriggerClose}
        className={`fixed inset-0 bg-slate-950/70 backdrop-blur-xs select-none ${
          isClosing ? 'pointer-events-none' : 'cursor-pointer'
        }`}
        style={{
          opacity: isDragging
            ? Math.max(0, 1 - Math.abs(dragOffset) / 300)
            : isClosing || !isAnimatedIn
              ? 0
              : 1,
          transition: isDragging ? 'none' : 'opacity 250ms ease-out',
        }}
        aria-hidden="true"
      />

      {/* Slide-out Interactive Drawer Panel:
          Responds in real-time to touch or mouse drag pushing to the left.
          Full-height (100dvh), ~65% on mobile, max 350px on desktop. */}
      <aside
        ref={drawerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="fixed inset-y-0 left-0 h-[100dvh] max-h-[100dvh] w-[65%] min-w-[285px] max-w-[350px] sm:w-84 md:w-88 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 shadow-2xl flex flex-col z-[10000] min-h-0 select-none sm:select-auto will-change-transform"
        style={{
          boxShadow: '8px 0 36px -4px rgba(0, 0, 0, 0.35)',
          transform: isDragging
            ? `translateX(${dragOffset}px)`
            : isClosing || !isAnimatedIn
              ? 'translateX(-100%)'
              : 'translateX(0px)',
          transition: isDragging
            ? 'none'
            : isClosing
              ? 'transform 240ms cubic-bezier(0.32, 0.72, 0, 1)'
              : 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* ============================================================== */}
        {/* Tactile Edge Sliding Pull/Push Tab (Coulisseau latéral)       */}
        {/* Allows pushing to the left from anywhere along the right edge  */}
        {/* ============================================================== */}
        <div
          data-drag-handle="true"
          onClick={handleTriggerClose}
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-30 flex items-center cursor-ew-resize select-none group focus:outline-none"
          title="Bande coulissante : Pousser vers la gauche pour fermer"
          aria-label="Pousser vers la gauche pour fermer"
        >
          <div className="flex flex-col items-center justify-center w-7 h-24 rounded-r-2xl bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 shadow-xl border border-l-0 border-white/20 dark:border-slate-800 backdrop-blur-sm transition-all group-hover:scale-105 active:scale-95 group-hover:w-8">
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 duration-200" />
            <div className="w-1 h-6 rounded-full bg-white/40 dark:bg-slate-900/40 my-1" />
            <span className="text-[8px] font-bold uppercase tracking-wider rotate-90 origin-center text-white/70 dark:text-slate-800/70">
              Glisser
            </span>
          </div>
        </div>

        {/* Real-time drag/push status feedback pill */}
        {isDragging && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 px-3 py-1.5 rounded-full bg-slate-900/95 text-white text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-1.5 border border-sky-400/40 pointer-events-none animate-in fade-in duration-100">
            <ChevronLeft className="w-4 h-4 text-sky-400 animate-pulse" />
            <span>
              {dragOffset < -50
                ? 'Relâcher pour fermer ←'
                : 'Pousser vers la gauche...'}
            </span>
          </div>
        )}

        {/* ============================================================== */}
        {/* 1. DRAWER HEADER (Brand + Coulissant Push/Close Button)        */}
        {/* ============================================================== */}
        <div className="sticky top-0 z-20 h-16 px-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
          <button
            onClick={() => {
              onNavigate('home');
              onClose();
            }}
            className="flex items-center gap-2.5 text-left focus:outline-none group min-w-0"
          >
            <img
              src="/logo-icon.svg"
              alt="Digishop Logo"
              className="w-8 h-8 rounded-lg shadow-sm shadow-sky-500/20 shrink-0 object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const fb = target.nextElementSibling as HTMLElement;
                if (fb) fb.style.display = 'flex';
              }}
            />
            <span className="hidden w-8 h-8 rounded-lg bg-sky-500 text-white items-center justify-center font-display text-sm font-extrabold shadow-sm shadow-sky-500/20 shrink-0">
              D
            </span>
            <div className="flex flex-col leading-none min-w-0">
              <span className="text-base font-bold tracking-tight text-slate-950 dark:text-white font-display">
                DigiShop
              </span>
              <span className="text-[10px] font-medium tracking-wide text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                by Lemax Group
              </span>
            </div>
          </button>

          {/* Coulissant Close Button: Push to close or click */}
          <button
            type="button"
            onClick={handleTriggerClose}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all text-xs font-medium group border border-slate-200/80 dark:border-slate-700/80 hover:shadow-xs active:scale-95"
            aria-label="Fermer le menu coulissant"
            title="Pousser vers la gauche pour fermer (ou cliquer)"
          >
            <ChevronLeft className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">Fermer</span>
            <X className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500 transition-colors ml-0.5" />
          </button>
        </div>

        {/* Sub-header interactive sliding guide & grip bar */}
        <div
          data-drag-handle="true"
          onClick={handleTriggerClose}
          className="px-3.5 py-1.5 bg-blue-50/80 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between text-[11px] text-blue-700 dark:text-blue-300 cursor-grab active:cursor-grabbing select-none transition-colors hover:bg-blue-100/70 dark:hover:bg-blue-900/50"
          title="Faites glisser vers la gauche pour fermer"
        >
          <div className="flex items-center gap-1.5 font-medium">
            <ChevronLeft className="w-3.5 h-3.5 animate-pulse" />
            <span>Bande coulissante</span>
          </div>
          <span className="text-[10px] text-blue-600 dark:text-blue-300 flex items-center gap-1">
            <span>Pousser vers la gauche</span>
            <span className="font-mono font-bold">←</span>
          </span>
        </div>

        {/* ============================================================== */}
        {/* 2. DRAWER BODY (Scrollable on Desktop & Landscape Mode)         */}
        {/* ============================================================== */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 space-y-4 touch-pan-y"
          style={{
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un produit digital..."
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

          {/* SECTION 1: NAVIGATION */}
          <div className="space-y-1">
            <p className="px-2 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Navigation
            </p>

            {/* 1. Accueil (NO chevron >) */}
            <button
              type="button"
              onClick={() => {
                onNavigate('home');
                onClose();
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                currentView === 'home'
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60 font-bold shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Home
                  className={`w-4 h-4 shrink-0 ${
                    currentView === 'home' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span className="truncate">Accueil</span>
              </div>
              {currentView === 'home' && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
              )}
            </button>

            {/* 2. Produits & Rayons (Menu Dépliable avec tous les sous-menus actifs) */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                  currentView === 'catalog'
                    ? 'bg-blue-50/90 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold border border-blue-200/60 dark:border-blue-900/40 shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
                aria-expanded={categoriesExpanded}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">Produits & Rayons</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-100/80 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">
                    6 rayons
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                      categoriesExpanded ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Sous-menus complets et interactifs de Produits */}
              {categoriesExpanded && (
                <div className="ml-4 pl-3 border-l-2 border-blue-200 dark:border-slate-800 space-y-1 mt-1 transition-all">
                  {/* Tous les produits */}
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('catalog');
                      onClose();
                    }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center gap-2 transition-colors ${
                      currentView === 'catalog'
                        ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/60 dark:bg-blue-950/40'
                        : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">Tous les produits</span>
                  </button>

                  {/* E-books & Guides */}
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('catalog', 'cat=ebooks');
                      onClose();
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">E-books & Guides</span>
                  </button>

                  {/* Templates & UI kits */}
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('catalog', 'cat=templates');
                      onClose();
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                  >
                    <FileCode className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">Templates & UI kits</span>
                  </button>

                  {/* Ressources Graphiques */}
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('catalog', 'cat=graphisme');
                      onClose();
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                  >
                    <Palette className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">Ressources Graphiques</span>
                  </button>

                  {/* Formations en ligne */}
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('catalog', 'cat=formations');
                      onClose();
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">Formations en ligne</span>
                  </button>

                  {/* Documents & Contrats pros */}
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('catalog', 'cat=documents');
                      onClose();
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span className="truncate">Documents & Contrats pros</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. Mes téléchargements & Achats (NO chevron >) */}
            <button
              type="button"
              onClick={() => {
                if (user) {
                  onNavigate('dashboard');
                } else {
                  onOpenAuth('login');
                }
                onClose();
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                currentView === 'dashboard'
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60 font-bold shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Download
                  className={`w-4 h-4 shrink-0 ${
                    currentView === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-500'
                  }`}
                />
                <span className="truncate">Mes téléchargements & Achats</span>
              </div>
              {currentView === 'dashboard' && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
              )}
            </button>

            {/* 5. FAQ & centre d'aide (NO chevron >) */}
            <button
              type="button"
              onClick={() => {
                onNavigate('faq');
                onClose();
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                currentView === 'faq'
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60 font-bold shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <HelpCircle
                  className={`w-4 h-4 shrink-0 ${
                    currentView === 'faq' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span className="truncate">FAQ & centre d'aide</span>
              </div>
              {currentView === 'faq' && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
              )}
            </button>

            {/* 6. À propos de DigiShop (NO chevron >) */}
            <button
              type="button"
              onClick={() => {
                onNavigate('about');
                onClose();
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                currentView === 'about'
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60 font-bold shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Info
                  className={`w-4 h-4 shrink-0 ${
                    currentView === 'about' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span className="truncate">À propos de DigiShop</span>
              </div>
              {currentView === 'about' && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
              )}
            </button>

            {/* 7. Contact & support (NO chevron >) */}
            <button
              type="button"
              onClick={() => {
                onNavigate('contact');
                onClose();
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                currentView === 'contact'
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60 font-bold shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Mail
                  className={`w-4 h-4 shrink-0 ${
                    currentView === 'contact' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span className="truncate">Contact & support</span>
              </div>
              {currentView === 'contact' && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
              )}
            </button>
          </div>

          {/* SECTION 2: ESPACE ADMINISTRATEUR (Visible UNIQUEMENT lorsque l'administrateur est connecté) */}
          {isAdmin && user && (
            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-1">
              <p className="px-2 text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 mb-1.5">
                Espace Administrateur
              </p>

              {/* Tableau de bord admin > (Expandable with chevron >) */}
              <div>
                <button
                  type="button"
                  onClick={() => setAdminMenuExpanded(!adminMenuExpanded)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-between"
                  aria-expanded={adminMenuExpanded}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span className="truncate font-bold">Tableau de bord admin</span>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 transition-transform duration-200 shrink-0 ${
                      adminMenuExpanded ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {/* Sub-menus of Tableau de bord admin */}
                {adminMenuExpanded && (
                  <div className="ml-4 pl-3 border-l-2 border-blue-200 dark:border-blue-900/60 space-y-1 mt-1 transition-all">
                    {/* Vue d'ensemble & Stats */}
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('admin', 'stats');
                        onClose();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">Vue d'ensemble & Stats</span>
                    </button>

                    {/* Commandes */}
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('admin', 'orders');
                        onClose();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">Commandes</span>
                    </button>

                    {/* Produit */}
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('admin', 'products');
                        onClose();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                    >
                      <Package className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">Produits</span>
                    </button>

                    {/* Client */}
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('admin', 'customers');
                        onClose();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">Clients</span>
                    </button>

                    {/* Coupon */}
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('admin', 'coupons');
                        onClose();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                    >
                      <Tag className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">Coupons</span>
                    </button>

                    {/* Espace Publicitaire */}
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('admin', 'ads');
                        onClose();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                    >
                      <Radio className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">Espace Publicitaire</span>
                    </button>

                    {/* Passerelle & Clé API */}
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('admin', 'gateways');
                        onClose();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">Passerelle & Clé API</span>
                    </button>

                    {/* Endpoints IPN & Webhooks */}
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('admin', 'ipn');
                        onClose();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">Endpoints IPN & Webhooks</span>
                    </button>

                    {/* Sécurité & Accès Admin */}
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('admin', 'security');
                        onClose();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                    >
                      <Key className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">Sécurité & Accès Admin</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Exporter vers GitHub (NO chevron >) */}
              <button
                type="button"
                onClick={() => {
                  if (onOpenGitHubExport) onOpenGitHubExport();
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/50 hover:bg-emerald-100 transition-colors flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate">Exporter vers GitHub</span>
              </button>

              {/* Exporter le projet zip (NO chevron >) */}
              <button
                type="button"
                onClick={handleExportZip}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <FileArchive className="w-4 h-4 shrink-0 text-amber-500" />
                <span className="truncate">Exporter le projet zip</span>
              </button>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* 3. DRAWER FOOTER (Professional Email / Account, Theme & Devise) */}
        {/* ============================================================== */}
        <div className="mt-auto p-3.5 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 shrink-0 space-y-3">
          
          {/* USER ACCOUNT CARD (Professional presentation + Clickable email to change account) */}
          {user ? (
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-extrabold shrink-0 shadow-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-950 dark:text-white truncate">
                        {user.name}
                      </p>
                      {isAdmin && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                          Admin
                        </span>
                      )}
                    </div>
                    {/* The Clickable Email Address Button to Change Account */}
                    <button
                      type="button"
                      onClick={() => setAccountSwitcherOpen(!accountSwitcherOpen)}
                      className="group/email flex items-center gap-1.5 mt-0.5 text-left text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-mono transition-colors focus:outline-none"
                      title="Cliquer pour changer de compte"
                      aria-label={`Changer de compte (actuellement ${user.email})`}
                    >
                      <span className="truncate underline underline-offset-2 decoration-blue-300 dark:decoration-blue-700 group-hover/email:decoration-blue-600">
                        {user.email}
                      </span>
                      <ArrowLeftRight className="w-3 h-3 shrink-0 text-blue-500 opacity-80 group-hover/email:opacity-100 group-hover/email:rotate-180 transition-transform duration-200" />
                    </button>
                  </div>
                </div>

                {/* Account Switcher Interactive Panel (shown when clicking the email) */}
                {accountSwitcherOpen && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/70 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Changer de compte</span>
                      <button
                        type="button"
                        onClick={() => setAccountSwitcherOpen(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        Fermer
                      </button>
                    </div>

                    <div className="space-y-1">
                      {/* Button to connect with another account (opens login modal) */}
                      <button
                        type="button"
                        onClick={() => {
                          setAccountSwitcherOpen(false);
                          onOpenAuth('login');
                          onClose();
                        }}
                        className="w-full py-1.5 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-[11px] text-left flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>Se connecter à un autre compte...</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick links: Mon compte & Paramètres */}
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
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Bienvenue sur DigiShop
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Connectez-vous pour retrouver vos achats
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAuth('login');
                      onClose();
                    }}
                    className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                    title="Choisir un compte"
                  >
                    <UserIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAuth('login');
                      onClose();
                    }}
                    className="flex-1 py-1.5 text-xs font-semibold text-center border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Se connecter
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAuth('register');
                      onClose();
                    }}
                    className="flex-1 py-1.5 text-xs font-semibold text-center bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg transition-colors shadow-sm"
                  >
                    Créer compte
                  </button>
                </div>
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
