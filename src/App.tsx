import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { ToastContainer } from './components/ToastContainer';
import { AuthModal } from './components/AuthModal';
import { AdBanner } from './components/AdBanner';
import { GitHubExportModal } from './components/GitHubExportModal';

// Views
import { HomeView } from './views/HomeView';
import { CatalogView } from './views/CatalogView';
import { ProductDetailView } from './views/ProductDetailView';
import { CheckoutView } from './views/CheckoutView';
import { OrderSuccessView } from './views/OrderSuccessView';
import { CustomerDashboardView } from './views/CustomerDashboardView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { LegalPagesView } from './views/LegalPagesView';
import { AboutView } from './views/AboutView';
import { FaqView } from './views/FaqView';
import { ContactView } from './views/ContactView';

import { Product, Order } from './types';
import defaultDb from '../data/db.json';

function MainApp() {
  const { user, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParam, setViewParam] = useState<string | undefined>(undefined);
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem('digishop_products_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return (defaultDb.products || []) as Product[];
  });
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [checkoutDirectItem, setCheckoutDirectItem] = useState<Product | null>(null);

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // GitHub Export Modal state (Android/Mobile project transfer)
  const [githubModalOpen, setGithubModalOpen] = useState(false);

  // Centralized product loading & synchronisation
  const loadProducts = useCallback(async (forceRefresh = false) => {
    try {
      const { safeFetchJson } = await import('./lib/apiClient');
      const url = '/api/products' + (forceRefresh ? `?_t=${Date.now()}` : '');
      const apiRes = await safeFetchJson<Product[]>(url);
      if (apiRes.ok && Array.isArray(apiRes.data) && apiRes.data.length > 0) {
        setProducts(apiRes.data);
        try {
          localStorage.setItem('digishop_products_cache', JSON.stringify(apiRes.data));
        } catch {}
        return;
      }
    } catch {}

    // Fallback for Firebase Hosting static hosting: load directly from Firestore
    try {
      const { syncProductsWithFirestore } = await import('./lib/firebase');
      const dbData = (await import('../data/db.json')).default;
      const initialProds = (dbData.products || []) as Product[];
      const firestoreProds = await syncProductsWithFirestore(initialProds);
      if (firestoreProds && firestoreProds.length > 0) {
        setProducts(firestoreProds);
        try {
          localStorage.setItem('digishop_products_cache', JSON.stringify(firestoreProds));
        } catch {}
        return;
      }
    } catch (fbErr) {
      console.warn('[App] Chargement produits par défaut:', fbErr);
      try {
        const dbData = (await import('../data/db.json')).default;
        if (Array.isArray(dbData.products)) {
          setProducts(dbData.products as Product[]);
        }
      } catch {}
    }
  }, []);

  // Synchronize on mount and listen to real-time update events
  useEffect(() => {
    loadProducts();

    const handleProductsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<Product[]>;
      if (Array.isArray(customEvent.detail) && customEvent.detail.length > 0) {
        setProducts(customEvent.detail);
        try {
          localStorage.setItem('digishop_products_cache', JSON.stringify(customEvent.detail));
        } catch {}
      } else {
        loadProducts(true);
      }
    };

    window.addEventListener('digishop:products-updated', handleProductsUpdated);
    return () => {
      window.removeEventListener('digishop:products-updated', handleProductsUpdated);
    };
  }, [loadProducts]);

  // Handle URL parsing on mount and popstate for clean SEO URLs
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname;
      const search = window.location.search;

      if (path === '/' || path === '') {
        setCurrentView('home');
      } else if (path.startsWith('/produits/')) {
        const slug = path.replace('/produits/', '');
        if (!slug || slug === 'all' || slug === 'tous' || slug === 'catalogue' || slug === 'boutique') {
          setCurrentView('catalog');
        } else {
          setSelectedProductSlug(slug);
          setCurrentView('product');
        }
      } else if (path === '/produits' || path === '/products' || path === '/boutique' || path === '/catalogue') {
        const urlParams = new URLSearchParams(search);
        const q = urlParams.get('q') || '';
        const cat = urlParams.get('cat') || '';
        setViewParam(q || (cat ? `cat=${cat}` : undefined));
        setCurrentView('catalog');
      } else if (path === '/admin') {
        const urlParams = new URLSearchParams(search);
        const tab = urlParams.get('tab') || 'stats';
        setViewParam(tab);
        setCurrentView('admin');
      } else if (path === '/compte' || path === '/dashboard') {
        setCurrentView('dashboard');
      } else if (path === '/a-propos') {
        setCurrentView('about');
      } else if (path === '/faq') {
        setCurrentView('faq');
      } else if (path === '/contact') {
        setCurrentView('contact');
      } else if (path === '/export-github' || search.includes('export=github')) {
        setGithubModalOpen(true);
      } else if (path.startsWith('/legal')) {
        const sub = path.replace('/legal/', '').replace('/legal', '');
        setViewParam(sub || 'cgv');
        setCurrentView('legal');
      }
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
  }, []);

  // Navigation router
  const navigate = (view: string, param?: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (view === 'home' || view === 'catalog' || view === 'product' || view === 'categories' || view === 'produits' || view === 'products') {
      loadProducts(true);
    }

    if (view === 'export-github') {
      setGithubModalOpen(true);
      return;
    }

    if (view === 'home') {
      window.history.pushState({}, '', '/');
      setCurrentView('home');
    } else if (view === 'catalog' || view === 'produits' || view === 'products') {
      let path = '/boutique';
      if (param && !param.includes('=')) {
        path += `?q=${encodeURIComponent(param)}`;
      } else if (param) {
        path += `?${param}`;
      }
      window.history.pushState({}, '', path);
      setViewParam(param);
      setCurrentView('catalog');
    } else if (view === 'categories') {
      window.history.pushState({}, '', '/boutique');
      setViewParam(param || 'all');
      setCurrentView('catalog');
    } else if (view === 'product') {
      window.history.pushState({}, '', `/produits/${param}`);
      setSelectedProductSlug(param || null);
      setCurrentView('product');
    } else if (view === 'checkout') {
      window.history.pushState({}, '', '/checkout');
      setCurrentView('checkout');
    } else if (view === 'dashboard') {
      window.history.pushState({}, '', '/compte');
      setCurrentView('dashboard');
    } else if (view === 'admin') {
      if (!isAdmin) {
        window.history.pushState({}, '', '/');
        setCurrentView('home');
        return;
      }
      let path = '/admin';
      if (param) path += `?tab=${param}`;
      window.history.pushState({}, '', path);
      setViewParam(param || 'stats');
      setCurrentView('admin');
    } else if (view === 'about') {
      window.history.pushState({}, '', '/a-propos');
      setCurrentView('about');
    } else if (view === 'faq') {
      window.history.pushState({}, '', '/faq');
      setCurrentView('faq');
    } else if (view === 'contact') {
      window.history.pushState({}, '', '/contact');
      setCurrentView('contact');
    } else if (view === 'legal') {
      window.history.pushState({}, '', `/legal/${param || 'cgv'}`);
      setViewParam(param || 'cgv');
      setCurrentView('legal');
    }
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleSelectProduct = (slug: string) => {
    navigate('product', slug);
  };

  const handleBuyNow = (product: Product) => {
    setCheckoutDirectItem(product);
    navigate('checkout');
  };

  const handleOrderCompleted = (order: Order) => {
    setActiveOrder(order);
    setCheckoutDirectItem(null);
    setCurrentView('success');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 w-full max-w-full overflow-x-clip">
      
      {/* Espace Publicitaire 1 : Top Bar Announcement Banner */}
      <AdBanner position="top_bar" onNavigate={navigate} />

      {/* 3-Zone Top Bar Contract */}
      <Navbar
        currentView={currentView}
        onNavigate={navigate}
        onOpenAuth={handleOpenAuth}
        onOpenGitHubExport={() => setGithubModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-full overflow-x-clip">
        {currentView === 'home' && (
          <HomeView
            products={products}
            onSelectProduct={handleSelectProduct}
            onBuyNow={handleBuyNow}
            onNavigate={navigate}
          />
        )}

        {currentView === 'catalog' && (
          <CatalogView
            products={products}
            initialCategory={viewParam?.startsWith('cat=') ? viewParam.replace('cat=', '') : (viewParam === 'all' ? 'all' : undefined)}
            initialSearch={viewParam && !viewParam.includes('=') && viewParam !== 'all' ? viewParam : ''}
            onSelectProduct={handleSelectProduct}
            onBuyNow={handleBuyNow}
            onNavigate={navigate}
          />
        )}

        {currentView === 'product' && selectedProductSlug && (
          <ProductDetailView
            slug={selectedProductSlug}
            onBack={() => navigate('catalog')}
            onSelectProduct={handleSelectProduct}
            onBuyNow={handleBuyNow}
            onNavigate={navigate}
          />
        )}

        {currentView === 'checkout' && (
          <CheckoutView
            initialItems={checkoutDirectItem ? [checkoutDirectItem] : undefined}
            onOrderCompleted={handleOrderCompleted}
            onCancel={() => navigate('catalog')}
          />
        )}

        {currentView === 'success' && activeOrder && (
          <OrderSuccessView
            order={activeOrder}
            onNavigate={navigate}
          />
        )}

        {currentView === 'dashboard' && (
          <CustomerDashboardView
            onNavigate={navigate}
          />
        )}

        {currentView === 'admin' && (
          isAdmin ? (
            <AdminDashboardView
              initialTab={(viewParam as any) || 'stats'}
              initialProducts={products}
              onNavigate={navigate}
              onOpenGitHubExport={() => setGithubModalOpen(true)}
              onProductsUpdated={(updated) => setProducts(updated)}
            />
          ) : (
            <HomeView
              products={products}
              onSelectProduct={handleSelectProduct}
              onBuyNow={handleBuyNow}
              onNavigate={navigate}
            />
          )
        )}

        {currentView === 'legal' && (
          <LegalPagesView
            initialPage={viewParam || 'cgv'}
            onNavigate={navigate}
          />
        )}

        {currentView === 'about' && (
          <AboutView
            onNavigate={navigate}
          />
        )}

        {currentView === 'faq' && (
          <FaqView />
        )}

        {currentView === 'contact' && (
          <ContactView />
        )}
      </main>

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        onCheckout={() => {
          setCheckoutDirectItem(null);
          navigate('checkout');
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onNavigate={navigate}
      />

      {/* GitHub Export Modal (Android / Mobile Project Transfer) */}
      <GitHubExportModal
        isOpen={githubModalOpen}
        onClose={() => setGithubModalOpen(false)}
      />

      {/* Toast Notification Container */}
      <ToastContainer />

      {/* Full Footer */}
      <Footer 
        onNavigate={navigate} 
        onOpenGitHubExport={() => setGithubModalOpen(true)}
      />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <MainApp />
            </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
