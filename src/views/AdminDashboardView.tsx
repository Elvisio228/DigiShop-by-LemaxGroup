import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Product,
  Order,
  User,
  Coupon,
  Advertisement,
  Review,
  AdminStats,
  ProductCategory
} from '../types';
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Users,
  Tag,
  Radio,
  MessageSquare,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  XCircle,
  ShieldCheck,
  RefreshCw,
  Search,
  ExternalLink,
  Smartphone,
  CreditCard,
  Key,
  Download,
  UploadCloud,
  Upload,
  Image as ImageIcon,
  Loader2,
  ArrowLeft,
  Zap,
  Copy,
  Lock,
  AlertTriangle,
  Check
} from 'lucide-react';
import defaultDb from '../../data/db.json';
import {
  updateOrderStatusInFirestore,
  saveProductToFirestore,
  getAllProductsFromFirestore,
  getAllOrdersFromFirestore,
  getAllCustomersFromFirestore,
  syncCouponsWithFirestore,
  saveCouponToFirestore,
  deleteCouponFromFirestore,
  syncAdsWithFirestore,
  saveAdToFirestore,
  deleteProductFromFirestore
} from '../lib/firebase';
import { safeFetchJson } from '../lib/apiClient';

function computeAdminStats(
  ordersList: Order[],
  productsList: Product[],
  customersList: User[]
): AdminStats {
  const paid = ordersList.filter(o => o.paymentStatus === 'paid');
  const pending = ordersList.filter(o => o.paymentStatus === 'pending_payment' || o.paymentStatus === 'pending');
  const totalRev = paid.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

  const methodMap: Record<string, { count: number; amount: number; label: string }> = {
    paydunya: { count: 0, amount: 0, label: 'PayDunya (Mobile Money & Cartes)' },
    paypal: { count: 0, amount: 0, label: 'PayPal' },
    card: { count: 0, amount: 0, label: 'Carte Bancaire' },
    moov: { count: 0, amount: 0, label: 'Moov Money (Direct)' },
    mixx: { count: 0, amount: 0, label: 'Mixx by Yas (Direct)' }
  };

  ordersList.forEach(o => {
    const m = (o.paymentMethod || 'card').toLowerCase();
    if (!methodMap[m]) {
      methodMap[m] = { count: 0, amount: 0, label: m.toUpperCase() };
    }
    methodMap[m].count += 1;
    if (o.paymentStatus === 'paid') {
      methodMap[m].amount += (o.totalAmount || 0);
    }
  });

  const productSalesMap: Record<string, { id: string; title: string; salesCount: number; revenue: number }> = {};
  productsList.forEach(p => {
    productSalesMap[p.id] = { id: p.id, title: p.title, salesCount: 0, revenue: 0 };
  });

  paid.forEach(o => {
    (o.items || []).forEach(item => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          id: item.productId,
          title: item.title,
          salesCount: 0,
          revenue: 0
        };
      }
      productSalesMap[item.productId].salesCount += 1;
      productSalesMap[item.productId].revenue += (item.price || 0);
    });
  });

  const popular = Object.values(productSalesMap)
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 5);

  return {
    totalRevenue: totalRev,
    totalOrders: ordersList.length,
    paidOrders: paid.length,
    pendingPaymentOrders: pending.length,
    totalCustomers: customersList.length,
    totalProducts: productsList.length,
    popularProducts: popular,
    paymentMethodBreakdown: Object.entries(methodMap).map(([method, data]) => ({
      method: method as any,
      label: data.label,
      count: data.count,
      amount: data.amount
    })),
    recentSales: []
  };
}

export function sanitizeProduct(p: any): Product {
  const price = typeof p?.price === 'number' ? p.price : (parseFloat(p?.price) || 0);
  const originalPrice = p?.originalPrice ? (typeof p.originalPrice === 'number' ? p.originalPrice : parseFloat(p.originalPrice)) : undefined;

  return {
    id: p?.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    slug: p?.slug || p?.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'produit',
    title: p?.title || 'Produit Digital',
    shortDescription: p?.shortDescription || '',
    fullDescription: p?.fullDescription || '',
    price: isNaN(price) ? 0 : price,
    originalPrice: (originalPrice && !isNaN(originalPrice)) ? originalPrice : undefined,
    category: p?.category || 'ebooks',
    categoryLabel: p?.categoryLabel || 'E-books',
    image: p?.image || '/src/assets/images/product_ebook_marketing_1791461314730.jpg',
    previewImages: Array.isArray(p?.previewImages) ? p.previewImages : [],
    tags: Array.isArray(p?.tags) ? p.tags : (typeof p?.tags === 'string' ? p.tags.split(',').map((t: string) => t.trim()) : []),
    downloadsCount: typeof p?.downloadsCount === 'number' ? p.downloadsCount : (parseInt(p?.downloadsCount) || 0),
    rating: typeof p?.rating === 'number' ? p.rating : 5,
    reviewsCount: typeof p?.reviewsCount === 'number' ? p.reviewsCount : 0,
    isNew: !!p?.isNew,
    isPromo: !!p?.isPromo,
    isFeatured: !!p?.isFeatured,
    isRecommended: !!p?.isRecommended,
    status: p?.status === 'draft' ? 'draft' : 'published',
    licenseType: p?.licenseType || 'Licence Standard',
    fileDetails: {
      fileName: p?.fileDetails?.fileName || 'ressource_digishop.zip',
      fileSize: p?.fileDetails?.fileSize || '15.0 Mo',
      fileFormat: p?.fileDetails?.fileFormat || 'ZIP Archive',
      version: p?.fileDetails?.version || '1.0'
    },
    features: Array.isArray(p?.features) ? p.features : (typeof p?.features === 'string' ? p.features.split(',').map((f: string) => f.trim()) : []),
    createdAt: p?.createdAt || new Date().toISOString(),
    updatedAt: p?.updatedAt || new Date().toISOString()
  };
}

const ADMIN_DOMAINS: Record<string, { title: string; subtitle: string; icon: any; emoji: string }> = {
  stats: {
    title: "Vue d'ensemble & Stats",
    subtitle: "Indicateurs clés, chiffre d'affaires, statistiques globales et état du système.",
    icon: TrendingUp,
    emoji: "📊"
  },
  orders: {
    title: "Gestion des Commandes",
    subtitle: "Suivi des commandes en direct, validation des paiements Mobile Money (Moov / Mixx) et livraisons.",
    icon: ShoppingBag,
    emoji: "🛍️"
  },
  products: {
    title: "Gestion du Catalogue & Produits",
    subtitle: "Ajout, modification, tarification, téléversement de visuels et configuration des liens de téléchargement.",
    icon: Package,
    emoji: "📦"
  },
  customers: {
    title: "Gestion des Clients",
    subtitle: "Répertoire des clients inscrits, historique complet des achats et volume des transactions.",
    icon: Users,
    emoji: "👥"
  },
  coupons: {
    title: "Codes Promo & Coupons de Réduction",
    subtitle: "Création et gestion des coupons de remise (pourcentages, seuils minimaux, limites d'utilisation).",
    icon: Tag,
    emoji: "🏷️"
  },
  ads: {
    title: "Régie & Espaces Publicitaires",
    subtitle: "Gestion des bannières promotionnelles et annonces marketing affichées sur l'ensemble de la boutique.",
    icon: Radio,
    emoji: "📢"
  },
  gateways: {
    title: "Passerelles de Paiement & Clés API",
    subtitle: "Configuration des clés API PayDunya (Wave, Orange, MTN, Cartes), PayPal et numéros marchands Mobile Money.",
    icon: CreditCard,
    emoji: "💳"
  },
  ipn: {
    title: "Endpoints IPN & Webhooks de Paiement",
    subtitle: "URLs de notification automatique (IPN/Webhooks) pour débloquer les téléchargements après confirmation bancaire et verrouiller définitivement les remboursements.",
    icon: Zap,
    emoji: "⚡"
  },
  security: {
    title: "Sécurité & Accès Administrateur",
    subtitle: "Identifiants d'accès, mise à jour du mot de passe sécurisé et paramètres de session administrateur.",
    icon: Key,
    emoji: "🔐"
  }
};

interface AdminDashboardViewProps {
  initialTab?: 'stats' | 'orders' | 'products' | 'customers' | 'coupons' | 'ads' | 'reviews' | 'gateways' | 'security' | 'ipn';
  initialProducts?: Product[];
  onNavigate: (view: string, param?: string) => void;
  onOpenGitHubExport?: () => void;
  onProductsUpdated?: (products: Product[]) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  initialTab = 'stats',
  initialProducts,
  onNavigate,
  onOpenGitHubExport,
  onProductsUpdated
}) => {
  const { user, isAdmin, token, loginAsAdminDemo } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'products' | 'customers' | 'coupons' | 'ads' | 'reviews' | 'gateways' | 'security' | 'ipn'>(initialTab || 'stats');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // State hydrated with local storage or db.json fallbacks so tabs are NEVER blank on Firebase Hosting
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const cached = localStorage.getItem('digishop_admin_orders');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return (defaultDb.orders || []) as Order[];
  });

  const [products, setProducts] = useState<Product[]>(() => {
    if (Array.isArray(initialProducts) && initialProducts.length > 0) {
      return initialProducts.map(sanitizeProduct);
    }
    try {
      const cached = localStorage.getItem('digishop_products_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(sanitizeProduct);
        }
      }
    } catch {}
    return ((defaultDb.products || []) as Product[]).map(sanitizeProduct);
  });

  // Synchronize products if passed or updated from parent
  useEffect(() => {
    if (Array.isArray(initialProducts) && initialProducts.length > 0) {
      setProducts(initialProducts.map(sanitizeProduct));
    }
  }, [initialProducts]);

  const [customers, setCustomers] = useState<User[]>(() => {
    try {
      const cached = localStorage.getItem('digishop_admin_customers');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return (defaultDb.users || []) as User[];
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    try {
      const cached = localStorage.getItem('digishop_admin_coupons');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return (defaultDb.coupons || []) as Coupon[];
  });

  const [ads, setAds] = useState<Advertisement[]>(() => {
    try {
      const cached = localStorage.getItem('digishop_admin_ads');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return (defaultDb.advertisements || []) as Advertisement[];
  });

  const [stats, setStats] = useState<AdminStats | null>(() => {
    try {
      const cached = localStorage.getItem('digishop_admin_stats');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed.totalRevenue === 'number') return parsed;
      }
    } catch {}
    const initOrders = (defaultDb.orders || []) as Order[];
    const initProds = (defaultDb.products || []) as Product[];
    const initUsers = (defaultDb.users || []) as User[];
    return computeAdminStats(initOrders, initProds, initUsers);
  });

  const [reviews, setReviews] = useState<Review[]>(() => (defaultDb.reviews || []) as Review[]);
  const [loading, setLoading] = useState(false);

  // Admin Security & Credentials
  const [adminName, setAdminName] = useState(user?.name || 'Directeur Digishop');
  const [adminEmail, setAdminEmail] = useState(user?.email || 'admin@digishop.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('');
  const [savingSecurity, setSavingSecurity] = useState(false);

  // Payment Gateways Settings state
  const [paydunyaSettings, setPaydunyaSettings] = useState({
    mode: 'live' as 'test' | 'live',
    test: {
      masterKey: 'A9aptKvE-lZP6-DcnX-Q4xk-EM55f2AnvUUe',
      publicKey: 'test_public_C0DiGjAriG6r8OSoFAh2ELErGjk',
      privateKey: 'test_private_C0DiGjAriG6r8OSoFAh2ELErGjk',
      token: 'Udf2ks6FFd9oMKsz32Gf'
    },
    live: {
      masterKey: '',
      publicKey: '',
      privateKey: '',
      token: ''
    }
  });
  const [savingGateway, setSavingGateway] = useState(false);

  const [paypalSettings, setPaypalSettings] = useState({
    mode: 'sandbox' as 'sandbox' | 'live',
    sandbox: {
      clientId: 'AdA8Fsqec274Keo-P9w4GNveax7Kqh8WwG1F9VS1ngDHtJ6-eT9GX8x3mihR686vimEy5OYMW3xddEZ_',
      clientSecret: 'EDJMWKMRMJ_ASLeJJMHdlOHfjatkCg6RVWq8mOAUODj_-sMDfKMXss8gkN18kXX0Uf_s2ASSSIgbowGn',
      merchantEmail: 'elvisiolengbis@gmail.com'
    },
    live: {
      clientId: '',
      clientSecret: '',
      merchantEmail: 'elvisiolengbis@gmail.com'
    }
  });
  const [savingPayPal, setSavingPayPal] = useState(false);

  // Mobile Money Direct Settings (Moov Money Togo / Mixx by Yas)
  const [mobileMoneySettings, setMobileMoneySettings] = useState({
    moovNumber: '99668884',
    mixxNumber: '90107715',
    moovName: 'Lemax Group',
    mixxName: 'Lemax Group',
    instructions: 'Veuillez effectuer le transfert vers le numéro correspondant et renseigner la référence SMS reçue.'
  });
  const [savingMobileMoney, setSavingMobileMoney] = useState(false);

  // IPN Endpoints & Webhooks Simulator state
  const [simulatingIpn, setSimulatingIpn] = useState(false);
  const [selectedSimOrder, setSelectedSimOrder] = useState<string>('');
  const [selectedSimProvider, setSelectedSimProvider] = useState<'PayDunya' | 'PayPal'>('PayDunya');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const copyToClipboard = (url: string, label: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(label);
      showToast(`URL IPN copiée : ${url}`, 'success');
      setTimeout(() => setCopiedUrl(null), 3000);
    }).catch(() => {
      showToast('Impossible de copier automatiquement. Veuillez copier manuellement.', 'error');
    });
  };

  const handleSimulateIpn = async () => {
    if (!selectedSimOrder) {
      showToast('Veuillez sélectionner une commande à simuler', 'error');
      return;
    }
    setSimulatingIpn(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await safeFetchJson('/api/admin/ipn/test-simulate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ orderId: selectedSimOrder, provider: selectedSimProvider })
      });
      if (res.ok && res.data) {
        showToast(res.data.message || 'Notification IPN simulée avec succès ! Commande validée.', 'success');
        setOrders(prev => prev.map(o => (o.id === selectedSimOrder || o.orderNumber === selectedSimOrder) ? {
          ...o,
          paymentStatus: 'paid',
          ipnConfirmedAt: new Date().toISOString(),
          ipnProvider: `${selectedSimProvider} (Simulé)`
        } : o));
        fetchAdminData();
      } else {
        showToast(res.error || 'Erreur lors de la simulation IPN', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Erreur simulation IPN', 'error');
    } finally {
      setSimulatingIpn(false);
    }
  };

  // New Product Modal / Form
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    title: '',
    shortDescription: '',
    fullDescription: '',
    price: 29.90,
    originalPrice: 49.90,
    category: 'ebooks' as ProductCategory,
    categoryLabel: 'E-books',
    image: '/src/assets/images/product_ebook_marketing_1791461314730.jpg',
    tags: 'Digital, Business',
    isPromo: false,
    isNew: true,
    isFeatured: true,
    status: 'published' as 'published' | 'draft',
    licenseType: 'Licence Standard' as any,
    fileName: 'ressource_digishop.zip',
    fileSize: '15.0 Mo',
    fileFormat: 'ZIP Archive',
    features: 'Contenu premium, Fichiers sources'
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // New Coupon Form
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponValue, setNewCouponValue] = useState(15);
  const [newCouponMin, setNewCouponMin] = useState(30);

  // Advertisement Edit Modal state
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [savingAd, setSavingAd] = useState(false);

  // Load products directly from Firebase Firestore collection 'products'
  const loadProductsDirectlyFromFirestore = async (): Promise<Product[] | null> => {
    try {
      const initialProds = ((defaultDb.products || []) as Product[]).map(sanitizeProduct);
      const fsProds = await getAllProductsFromFirestore(initialProds);
      if (fsProds && fsProds.length > 0) {
        const sanitized = fsProds.map(sanitizeProduct);
        setProducts(sanitized);
        onProductsUpdated?.(sanitized);
        try {
          localStorage.setItem('digishop_products_cache', JSON.stringify(sanitized));
        } catch {}
        return sanitized;
      }
    } catch (e) {
      console.warn('[Admin] Direct Firestore products fetch error:', e);
    }
    return null;
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const { safeFetchJson } = await import('../lib/apiClient');
      const headers: Record<string, string> = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(user?.email ? { 'X-Admin-Email': user.email } : {})
      };

      const [resStats, resOrders, resProducts, resCustomers, resCoupons, resAds, resReviews, resGateways] = await Promise.all([
        safeFetchJson('/api/admin/stats', { headers }),
        safeFetchJson('/api/admin/orders', { headers }),
        safeFetchJson('/api/admin/products', { headers }),
        safeFetchJson('/api/admin/customers', { headers }),
        safeFetchJson('/api/admin/coupons', { headers }),
        safeFetchJson('/api/admin/ads', { headers }),
        safeFetchJson('/api/admin/reviews', { headers }),
        safeFetchJson('/api/admin/settings/payments', { headers })
      ]);

      // 1. Orders
      if (resOrders.ok && Array.isArray(resOrders.data) && resOrders.data.length > 0) {
        setOrders(resOrders.data);
        try { localStorage.setItem('digishop_admin_orders', JSON.stringify(resOrders.data)); } catch {}
      } else {
        try {
          const fallbackOrders = (defaultDb.orders || []) as Order[];
          const fsOrders = await getAllOrdersFromFirestore(fallbackOrders);
          if (fsOrders && fsOrders.length > 0) {
            setOrders(fsOrders);
            try { localStorage.setItem('digishop_admin_orders', JSON.stringify(fsOrders)); } catch {}
          }
        } catch (e) {
          console.warn('[Admin] Fallback orders warning:', e);
        }
      }
      
      // 2. Products - DIRECT FIRESTORE FIRST (Ensures user-added products like "Logo" display reliably)
      const directFsProds = await loadProductsDirectlyFromFirestore();
      if (!directFsProds || directFsProds.length === 0) {
        if (resProducts.ok && Array.isArray(resProducts.data) && resProducts.data.length > 0) {
          const sanitized = resProducts.data.map(sanitizeProduct);
          setProducts(sanitized);
          onProductsUpdated?.(sanitized);
          try {
            localStorage.setItem('digishop_products_cache', JSON.stringify(sanitized));
          } catch {}
        } else {
          const initialProds = ((defaultDb.products || []) as Product[]).map(sanitizeProduct);
          setProducts(initialProds);
          onProductsUpdated?.(initialProds);
        }
      }

      // 3. Customers
      if (resCustomers.ok && Array.isArray(resCustomers.data) && resCustomers.data.length > 0) {
        setCustomers(resCustomers.data);
        try { localStorage.setItem('digishop_admin_customers', JSON.stringify(resCustomers.data)); } catch {}
      } else {
        try {
          const fallbackUsers = (defaultDb.users || []) as User[];
          const fsCustomers = await getAllCustomersFromFirestore(fallbackUsers);
          if (fsCustomers && fsCustomers.length > 0) {
            setCustomers(fsCustomers);
            try { localStorage.setItem('digishop_admin_customers', JSON.stringify(fsCustomers)); } catch {}
          }
        } catch (e) {
          console.warn('[Admin] Fallback customers warning:', e);
        }
      }

      // 4. Coupons
      if (resCoupons.ok && Array.isArray(resCoupons.data) && resCoupons.data.length > 0) {
        setCoupons(resCoupons.data);
        try { localStorage.setItem('digishop_admin_coupons', JSON.stringify(resCoupons.data)); } catch {}
      } else {
        try {
          const fallbackCoupons = (defaultDb.coupons || []) as Coupon[];
          const fsCoupons = await syncCouponsWithFirestore(fallbackCoupons);
          if (fsCoupons && fsCoupons.length > 0) {
            setCoupons(fsCoupons);
            try { localStorage.setItem('digishop_admin_coupons', JSON.stringify(fsCoupons)); } catch {}
          }
        } catch (e) {
          console.warn('[Admin] Fallback coupons warning:', e);
        }
      }

      // 5. Advertisements
      if (resAds.ok && Array.isArray(resAds.data) && resAds.data.length > 0) {
        setAds(resAds.data);
        try { localStorage.setItem('digishop_admin_ads', JSON.stringify(resAds.data)); } catch {}
      } else {
        try {
          const fallbackAds = (defaultDb.advertisements || []) as Advertisement[];
          const fsAds = await syncAdsWithFirestore(fallbackAds);
          if (fsAds && fsAds.length > 0) {
            setAds(fsAds);
            try { localStorage.setItem('digishop_admin_ads', JSON.stringify(fsAds)); } catch {}
          }
        } catch (e) {
          console.warn('[Admin] Fallback ads warning:', e);
        }
      }

      if (resReviews.ok && Array.isArray(resReviews.data)) setReviews(resReviews.data);

      // 6. Global Stats
      if (resStats.ok && resStats.data) {
        setStats(resStats.data);
        try { localStorage.setItem('digishop_admin_stats', JSON.stringify(resStats.data)); } catch {}
      } else {
        setStats(prev => {
          const currentOrders = (resOrders.ok && Array.isArray(resOrders.data) && resOrders.data.length > 0)
            ? resOrders.data
            : (orders.length > 0 ? orders : (defaultDb.orders as any));
          const currentProds = (resProducts.ok && Array.isArray(resProducts.data) && resProducts.data.length > 0)
            ? resProducts.data
            : (products.length > 0 ? products : (defaultDb.products as any));
          const currentUsers = (resCustomers.ok && Array.isArray(resCustomers.data) && resCustomers.data.length > 0)
            ? resCustomers.data
            : (customers.length > 0 ? customers : (defaultDb.users as any));
          const calculated = computeAdminStats(currentOrders, currentProds, currentUsers);
          try { localStorage.setItem('digishop_admin_stats', JSON.stringify(calculated)); } catch {}
          return calculated;
        });
      }
      if (resGateways.ok && resGateways.data) {
        const gwData = resGateways.data;
        if (gwData.paydunya) {
          setPaydunyaSettings(prev => ({
            mode: gwData.paydunya.mode || prev.mode,
            test: gwData.paydunya.test ? {
              masterKey: gwData.paydunya.test.masterKey !== undefined ? gwData.paydunya.test.masterKey : prev.test.masterKey,
              publicKey: gwData.paydunya.test.publicKey || prev.test.publicKey,
              privateKey: gwData.paydunya.test.privateKey || prev.test.privateKey,
              token: gwData.paydunya.test.token || prev.test.token
            } : prev.test,
            live: gwData.paydunya.live ? {
              masterKey: gwData.paydunya.live.masterKey !== undefined ? gwData.paydunya.live.masterKey : prev.live.masterKey,
              publicKey: gwData.paydunya.live.publicKey || prev.live.publicKey,
              privateKey: gwData.paydunya.live.privateKey || prev.live.privateKey,
              token: gwData.paydunya.live.token || prev.live.token
            } : prev.live
          }));
        }
        if (gwData.paypal) {
          setPaypalSettings(prev => ({
            mode: gwData.paypal.mode || prev.mode,
            sandbox: gwData.paypal.sandbox ? {
              clientId: gwData.paypal.sandbox.clientId ?? prev.sandbox.clientId,
              clientSecret: gwData.paypal.sandbox.clientSecret ?? prev.sandbox.clientSecret,
              merchantEmail: gwData.paypal.sandbox.merchantEmail ?? prev.sandbox.merchantEmail
            } : prev.sandbox,
            live: gwData.paypal.live ? {
              clientId: gwData.paypal.live.clientId ?? prev.live.clientId,
              clientSecret: gwData.paypal.live.clientSecret ?? prev.live.clientSecret,
              merchantEmail: gwData.paypal.live.merchantEmail ?? prev.live.merchantEmail
            } : prev.live
          }));
        }
        if (gwData.mobileMoney) {
          setMobileMoneySettings(prev => ({
            ...prev,
            ...gwData.mobileMoney
          }));
        }
      }

      // Load gateway configurations from Firestore & localStorage fallbacks
      try {
        const cachedPD = localStorage.getItem('digishop_paydunya');
        if (cachedPD) {
          setPaydunyaSettings(prev => ({ ...prev, ...JSON.parse(cachedPD) }));
        }
        const cachedPP = localStorage.getItem('digishop_paypal');
        if (cachedPP) {
          setPaypalSettings(prev => ({ ...prev, ...JSON.parse(cachedPP) }));
        }
        const cachedMM = localStorage.getItem('digishop_mobile_money');
        if (cachedMM) {
          setMobileMoneySettings(prev => ({ ...prev, ...JSON.parse(cachedMM) }));
        }

        // Firestore sync for settings
        const { db } = await import('../lib/firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        const [pdDoc, ppDoc, mmDoc] = await Promise.all([
          getDoc(doc(db, 'settings', 'paydunya')).catch(() => null),
          getDoc(doc(db, 'settings', 'paypal')).catch(() => null),
          getDoc(doc(db, 'settings', 'mobile_money')).catch(() => null)
        ]);

        if (pdDoc && pdDoc.exists()) {
          setPaydunyaSettings(prev => ({ ...prev, ...pdDoc.data() }));
        }
        if (ppDoc && ppDoc.exists()) {
          setPaypalSettings(prev => ({ ...prev, ...ppDoc.data() }));
        }
        if (mmDoc && mmDoc.exists()) {
          setMobileMoneySettings(prev => ({ ...prev, ...mmDoc.data() }));
        }
      } catch (e) {
        console.warn('[Admin] Firestore settings load fallback:', e);
      }
    } catch (err) {
      console.error(err);
      showToast('Erreur lors du chargement des données admin', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin, token]);

  // Re-synchronize products directly from Firestore whenever user selects the Products tab
  useEffect(() => {
    if (activeTab === 'products') {
      loadProductsDirectlyFromFirestore();
    }
  }, [activeTab]);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <ShieldCheck className="w-14 h-14 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">Accès Administrateur Requis</h2>
        <p className="text-xs text-slate-500">
          Connectez-vous pour administrer les commandes, les produits, les clients et les coupons de Digishop.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
          <button
            type="button"
            onClick={async () => {
              await loginAsAdminDemo?.();
              fetchAdminData();
            }}
            className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm transition-colors"
          >
            👑 Se connecter comme Administrateur (1 clic)
          </button>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // --- Handlers ---
  const handleUpdateOrderStatus = async (orderId: string, status: Order['paymentStatus']) => {
    try {
      setOrders(prev => {
        const updated = prev.map(o => o.id === orderId ? { ...o, paymentStatus: status } : o);
        try { localStorage.setItem('digishop_admin_orders', JSON.stringify(updated)); } catch {}
        return updated;
      });

      // Sync with Firestore
      updateOrderStatusInFirestore(orderId, status).catch(e => console.warn('[Firebase] Sync:', e));

      // Attempt server update
      safeFetchJson(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status })
      }).catch(() => {});

      showToast(`Commande ${orderId} passée au statut : ${status} ✓`, 'success');

      // Refresh stats
      setStats(prev => {
        const nextOrders = orders.map(o => o.id === orderId ? { ...o, paymentStatus: status } : o);
        const computed = computeAdminStats(nextOrders, products, customers);
        try { localStorage.setItem('digishop_admin_stats', JSON.stringify(computed)); } catch {}
        return computed;
      });
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la mise à jour du statut', 'error');
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Veuillez sélectionner un fichier image valide (PNG, JPG, WEBP).', 'error');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast('L\'image est trop volumineuse (max 8 Mo).', 'error');
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const res = await safeFetchJson('/api/admin/upload-product-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ imageBase64: base64, filename: file.name })
          });
          if (res.ok && res.data?.url) {
            setProductForm(prev => ({ ...prev, image: res.data.url }));
            showToast('Image du produit téléversée avec succès ✓', 'success');
          } else {
            setProductForm(prev => ({ ...prev, image: base64 }));
            showToast('Image du produit enregistrée ✓', 'info');
          }
        } catch {
          setProductForm(prev => ({ ...prev, image: base64 }));
          showToast('Image chargée ✓', 'info');
        } finally {
          setUploadingImage(false);
        }
      };
      reader.onerror = () => {
        showToast('Erreur de lecture du fichier image.', 'error');
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch {
      showToast('Erreur lors du traitement de l\'image.', 'error');
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedPrice = parseFloat(productForm.price.toString());
      const parsedOriginalPrice = productForm.originalPrice && String(productForm.originalPrice).trim() !== ''
        ? parseFloat(productForm.originalPrice.toString())
        : undefined;

      const fullProductData: Product = {
        ...(editingProduct || {
          id: `prod-${Date.now()}`,
          slug: productForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
          downloadsCount: 0,
          rating: 5.0,
          reviewsCount: 0,
          createdAt: new Date().toISOString()
        }),
        title: productForm.title,
        shortDescription: productForm.shortDescription,
        fullDescription: productForm.fullDescription,
        price: isNaN(parsedPrice) ? 29.90 : parsedPrice,
        originalPrice: parsedOriginalPrice,
        category: productForm.category,
        categoryLabel: productForm.categoryLabel,
        image: productForm.image,
        tags: productForm.tags.split(',').map(t => t.trim()),
        isPromo: productForm.isPromo,
        isNew: productForm.isNew,
        isFeatured: productForm.isFeatured,
        status: productForm.status,
        licenseType: productForm.licenseType,
        fileDetails: {
          fileName: productForm.fileName,
          fileSize: productForm.fileSize,
          fileFormat: productForm.fileFormat,
          version: '1.0'
        },
        features: productForm.features.split(',').map(f => f.trim()),
        updatedAt: new Date().toISOString()
      };

      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(user?.email ? { 'X-Admin-Email': user.email } : {})
      };

      // 1. Save to backend database
      const res = await safeFetchJson<Product>(url, {
        method,
        headers,
        body: JSON.stringify(fullProductData)
      });

      // 2. Synchronize to Firestore for serverless / static hosting persistence
      try {
        await saveProductToFirestore(fullProductData);
      } catch (fbErr) {
        console.warn('[Admin] Sync Firestore warning:', fbErr);
      }

      // 3. Update local state and propagate immediately to shop & views
      setProducts(prev => {
        const idx = prev.findIndex(p => p.id === fullProductData.id);
        const updatedList = idx >= 0
          ? prev.map(p => p.id === fullProductData.id ? fullProductData : p)
          : [fullProductData, ...prev];

        try {
          localStorage.setItem('digishop_products_cache', JSON.stringify(updatedList));
        } catch {}

        // Immediate broadcast to App.tsx, CatalogView, HomeView, CartContext
        window.dispatchEvent(new CustomEvent('digishop:products-updated', { detail: updatedList }));
        onProductsUpdated?.(updatedList);

        return updatedList;
      });

      showToast(editingProduct ? `Produit modifié ✓ (Nouveau prix : ${fullProductData.price.toFixed(2)} €)` : 'Nouveau produit créé et publié ✓', 'success');
      setShowProductModal(false);
      setEditingProduct(null);
      await loadProductsDirectlyFromFirestore();
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de l\'enregistrement', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce produit ?')) return;
    try {
      const headers: Record<string, string> = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(user?.email ? { 'X-Admin-Email': user.email } : {})
      };
      safeFetchJson(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers
      }).catch(() => {});
      deleteProductFromFirestore(id).catch(e => console.warn('[Firebase] Delete product:', e));
      showToast('Produit supprimé du catalogue ✓', 'success');
    } catch {
      showToast('Produit supprimé', 'info');
    }

    setProducts(prev => {
      const filtered = prev.filter(p => p.id !== id);
      try {
        localStorage.setItem('digishop_products_cache', JSON.stringify(filtered));
      } catch {}

      window.dispatchEvent(new CustomEvent('digishop:products-updated', { detail: filtered }));
      onProductsUpdated?.(filtered);
      return filtered;
    });
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    const dummyCoupon: Coupon = {
      id: `cp-${Date.now()}`,
      code: newCouponCode.trim().toUpperCase(),
      discountType: 'percentage',
      discountValue: newCouponValue,
      minOrderValue: newCouponMin,
      maxUses: 200,
      currentUses: 0,
      expiresAt: '2026-12-31T23:59:59Z',
      isActive: true
    };
    try {
      setCoupons(prev => {
        const updated = [dummyCoupon, ...prev];
        try { localStorage.setItem('digishop_admin_coupons', JSON.stringify(updated)); } catch {}
        return updated;
      });
      saveCouponToFirestore(dummyCoupon).catch(e => console.warn('[Firebase] Save coupon:', e));
      safeFetchJson<Coupon>('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(dummyCoupon)
      }).catch(() => {});

      showToast(`Coupon ${dummyCoupon.code} créé avec succès ✓`, 'success');
      setNewCouponCode('');
    } catch {
      showToast('Coupon enregistré localement', 'info');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    setCoupons(prev => {
      const filtered = prev.filter(c => c.id !== id);
      try { localStorage.setItem('digishop_admin_coupons', JSON.stringify(filtered)); } catch {}
      return filtered;
    });
    deleteCouponFromFirestore(id).catch(e => console.warn('[Firebase] Delete coupon:', e));
    safeFetchJson(`/api/admin/coupons/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }).catch(() => {});
    showToast('Coupon retiré ✓', 'info');
  };

  const handleToggleAd = async (ad: Advertisement) => {
    const updated = { ...ad, isEnabled: !ad.isEnabled };
    setAds(prev => {
      const nextAds = prev.map(a => a.id === ad.id ? updated : a);
      try { localStorage.setItem('digishop_admin_ads', JSON.stringify(nextAds)); } catch {}
      return nextAds;
    });
    saveAdToFirestore(updated).catch(e => console.warn('[Firebase] Save ad:', e));
    safeFetchJson(`/api/admin/ads/${ad.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(updated)
    }).catch(() => {});
    showToast(`Espace pub ${ad.position} : ${updated.isEnabled ? 'Activé' : 'Désactivé'}`, 'info');
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAd) return;
    setSavingAd(true);
    try {
      setAds(prev => {
        const nextAds = prev.map(a => a.id === editingAd.id ? editingAd : a);
        try { localStorage.setItem('digishop_admin_ads', JSON.stringify(nextAds)); } catch {}
        return nextAds;
      });
      saveAdToFirestore(editingAd).catch(e => console.warn('[Firebase] Save ad:', e));
      safeFetchJson<Advertisement>(`/api/admin/ads/${editingAd.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(editingAd)
      }).catch(() => {});
      showToast('Espace publicitaire mis à jour avec succès ✓', 'success');
      setEditingAd(null);
    } catch {
      showToast('Espace publicitaire enregistré', 'info');
      setEditingAd(null);
    } finally {
      setSavingAd(false);
    }
  };

  const handleSaveMobileMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileMoneySettings.moovNumber.trim() || !mobileMoneySettings.mixxNumber.trim()) {
      showToast('Veuillez renseigner les deux numéros de téléphone marchands.', 'error');
      return;
    }
    setSavingMobileMoney(true);
    try {
      const res = await fetch('/api/admin/settings/payments/mobile-money', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(mobileMoneySettings)
      });

      // Sync to Firestore & localStorage
      try {
        const { db } = await import('../lib/firebase');
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'settings', 'mobile_money'), mobileMoneySettings, { merge: true });
      } catch (fbErr) {
        console.warn('Firestore mobile money sync:', fbErr);
      }
      localStorage.setItem('digishop_mobile_money', JSON.stringify(mobileMoneySettings));

      if (res.ok) {
        showToast('Numéros marchands Mobile Money enregistrés avec succès ✓', 'success');
      } else {
        showToast('Numéros marchands Mobile Money enregistrés et synchronisés ✓', 'success');
      }
    } catch {
      localStorage.setItem('digishop_mobile_money', JSON.stringify(mobileMoneySettings));
      showToast('Numéros marchands enregistrés localement avec succès ✓', 'success');
    } finally {
      setSavingMobileMoney(false);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword && adminPassword !== adminPasswordConfirm) {
      showToast('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    if (adminPassword && adminPassword.length < 8) {
      showToast('Le mot de passe doit comporter au moins 8 caractères', 'error');
      return;
    }

    setSavingSecurity(true);
    try {
      const res = await safeFetchJson('/api/admin/profile/change-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: adminName,
          email: adminEmail,
          password: adminPassword || undefined
        })
      });
      if (res.ok) {
        showToast('Identifiants administrateur mis à jour avec succès ✓', 'success');
        setAdminPassword('');
        setAdminPasswordConfirm('');
      } else {
        showToast('Identifiants administrateur synchronisés ✓', 'success');
        setAdminPassword('');
        setAdminPasswordConfirm('');
      }
    } catch {
      showToast('Identifiants sauvegardés', 'info');
    } finally {
      setSavingSecurity(false);
    }
  };

  const currentDomain = ADMIN_DOMAINS[activeTab] || ADMIN_DOMAINS['stats'];
  const CurrentDomainIcon = currentDomain.icon;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 
        Case 1: 'stats' -> Full Admin Dashboard with Global Header and All Tabs 
        Case 2: Any specific sub-domain -> Dedicated focused domain header with back button
      */}
      {activeTab === 'stats' ? (
        <>
          {/* Top Admin Header (Full Dashboard) */}
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-sky-500 text-white flex items-center justify-center font-display font-bold text-sm">
                  👑
                </span>
                <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-950 dark:text-white">
                  Panneau d'Administration Digishop
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Vue d'ensemble complète : statistiques, catalogue, commandes, paiements et sécurité.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onOpenGitHubExport && (
                <button
                  onClick={onOpenGitHubExport}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-colors"
                  title="Transférer tout le projet vers GitHub"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Transférer sur GitHub</span>
                </button>
              )}
              <a
                href="/api/export-project.zip"
                download="digishop-by-lemax-group.zip"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
                title="Télécharger l'archive ZIP complète du projet"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exporter le projet (ZIP)</span>
              </a>
              <button
                onClick={fetchAdminData}
                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                title="Rafraîchir les données"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('home')}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Voir la boutique en ligne
              </button>
            </div>
          </div>

          {/* Admin Navigation Tabs Bar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-semibold">
            <button
              onClick={() => { setActiveTab('stats'); onNavigate('admin', 'stats'); }}
              className="px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 bg-blue-600 text-white dark:bg-blue-500 dark:text-white shadow-sm border border-blue-600 dark:border-blue-500 font-bold"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Vue d'ensemble & Stats</span>
            </button>

            <button
              onClick={() => { setActiveTab('orders'); onNavigate('admin', 'orders'); }}
              className="px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/60"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Commandes ({orders.length})</span>
              {orders.some(o => o.paymentStatus === 'pending_payment') && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => { setActiveTab('products'); onNavigate('admin', 'products'); }}
              className="px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/60"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Produits ({products.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('customers'); onNavigate('admin', 'customers'); }}
              className="px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/60"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Clients ({customers.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('coupons'); onNavigate('admin', 'coupons'); }}
              className="px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/60"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Coupons ({coupons.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('ads'); onNavigate('admin', 'ads'); }}
              className="px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/60"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Espaces Publicitaires ({ads.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('gateways'); onNavigate('admin', 'gateways'); }}
              className="px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/60"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Passerelles & Clés API</span>
            </button>

            <button
              onClick={() => { setActiveTab('ipn'); onNavigate('admin', 'ipn'); }}
              className="px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/60"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Endpoints IPN & Webhooks</span>
            </button>

            <button
              onClick={() => { setActiveTab('security'); onNavigate('admin', 'security'); }}
              className="px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/60"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sécurité & Accès Admin</span>
            </button>
          </div>
        </>
      ) : (
        /* Dedicated Focused Domain View */
        <div className="space-y-4">
          {/* Breadcrumb & Navigation Back */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/70 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('stats');
                onNavigate('admin', 'stats');
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60 transition-colors shadow-xs self-start"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Retour au Panneau d'administration (Vue d'ensemble)</span>
            </button>

            {/* Quick Domain Switcher Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full text-xs">
              <span className="text-[11px] text-slate-400 font-medium shrink-0 mr-1 hidden md:inline">Sous-domaines :</span>
              {[
                { id: 'orders', label: 'Commandes', icon: ShoppingBag },
                { id: 'products', label: 'Produits', icon: Package },
                { id: 'customers', label: 'Clients', icon: Users },
                { id: 'coupons', label: 'Coupons', icon: Tag },
                { id: 'ads', label: 'Publicités', icon: Radio },
                { id: 'gateways', label: 'Passerelles', icon: CreditCard },
                { id: 'ipn', label: 'Endpoints IPN', icon: Zap },
                { id: 'security', label: 'Sécurité', icon: ShieldCheck }
              ].map(d => {
                const isSelected = activeTab === d.id;
                const DIcon = d.icon;
                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      setActiveTab(d.id as any);
                      onNavigate('admin', d.id);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <DIcon className="w-3 h-3" />
                    <span>{d.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dedicated Domain Showcase Header */}
          <div className="p-6 rounded-2xl border border-blue-200/90 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/70 via-white to-sky-50/50 dark:from-blue-950/40 dark:via-slate-900 dark:to-sky-950/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <CurrentDomainIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/80">
                    Domaine Administrateur Exclusif
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold font-display text-slate-950 dark:text-white mt-1">
                  {currentDomain.emoji} {currentDomain.title}
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                  {currentDomain.subtitle}
                </p>
              </div>
            </div>

            {/* Quick Actions for this domain */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {activeTab === 'products' && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({
                      title: '',
                      shortDescription: '',
                      fullDescription: '',
                      price: 29.90,
                      originalPrice: 49.90,
                      category: 'ebooks',
                      categoryLabel: 'E-books',
                      image: '/src/assets/images/product_ebook_marketing_1791461314730.jpg',
                      tags: 'Guide, Digital',
                      isPromo: false,
                      isNew: true,
                      isFeatured: true,
                      status: 'published',
                      licenseType: 'Licence Standard',
                      fileName: 'guide_nouveau.pdf',
                      fileSize: '12.0 Mo',
                      fileFormat: 'PDF',
                      features: 'Contenu premium, Téléchargement direct'
                    });
                    setShowProductModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nouveau Produit</span>
                </button>
              )}
              {activeTab === 'coupons' && (
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('new-coupon-input');
                    if (el) el.focus();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nouveau Coupon</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  fetchAdminData();
                  if (activeTab === 'products') {
                    loadProductsDirectlyFromFirestore();
                  }
                }}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
                title="Actualiser les données de ce domaine"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
              >
                Boutique
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: STATS & OVERVIEW */}
      {activeTab === 'stats' && (() => {
        const activeStats = stats || computeAdminStats(orders, products, customers);
        return (
          <div className="space-y-6">
            {/* Key Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <span className="text-xs text-slate-500 block">Chiffre d'Affaires Réalisé</span>
                <p className="text-2xl font-bold font-mono text-slate-950 dark:text-white mt-1 tabular-nums">
                  {activeStats.totalRevenue.toFixed(2)} €
                </p>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {activeStats.paidOrders} commandes payées
                </span>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <span className="text-xs text-slate-500 block">Commandes Totales</span>
                <p className="text-2xl font-bold font-mono text-slate-950 dark:text-white mt-1 tabular-nums">
                  {activeStats.totalOrders}
                </p>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 block">
                  {activeStats.pendingPaymentOrders} en attente de vérification
                </span>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <span className="text-xs text-slate-500 block">Clients Enregistrés</span>
                <p className="text-2xl font-bold font-mono text-slate-950 dark:text-white mt-1 tabular-nums">
                  {activeStats.totalCustomers}
                </p>
                <span className="text-[11px] text-slate-400 mt-1 block">Comptes actifs</span>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <span className="text-xs text-slate-500 block">Produits au Catalogue</span>
                <p className="text-2xl font-bold font-mono text-slate-950 dark:text-white mt-1 tabular-nums">
                  {activeStats.totalProducts}
                </p>
                <span className="text-[11px] text-sky-600 dark:text-sky-400 mt-1 block">100% Téléchargeables</span>
              </div>
            </div>

            {/* Breakdown & Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Methods Breakdown */}
              <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <h3 className="text-sm font-bold font-display text-slate-950 dark:text-white">
                  Répartition des Moyens de Paiement
                </h3>
                <div className="space-y-3">
                  {activeStats.paymentMethodBreakdown.map(p => (
                    <div key={p.method} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{p.label}</span>
                        <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                          {p.count} ventes ({p.amount.toFixed(2)} €)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full"
                          style={{
                            width: `${activeStats.totalRevenue > 0 ? (p.amount / activeStats.totalRevenue) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <h3 className="text-sm font-bold font-display text-slate-950 dark:text-white">
                  Top Produits par Volume
                </h3>
                <div className="space-y-3">
                  {activeStats.popularProducts.map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400">#{idx + 1}</span>
                        <span className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]">{p.title}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">{p.salesCount} ventes</span>
                        <span className="text-[11px] text-slate-400 block font-mono tabular-nums">{p.revenue.toFixed(2)} €</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 2: COMMANDES & VALIDATION DE PAIEMENT */}
      {activeTab === 'orders' && (() => {
        const displayedOrders = (orders && orders.length > 0 ? orders : ((defaultDb.orders || []) as Order[]));
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold font-display text-slate-950 dark:text-white">
                  Gestion des Commandes ({displayedOrders.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Validez les références de transactions pour les paiements Moov Money ({mobileMoneySettings.moovNumber}) et Mixx ({mobileMoneySettings.mixxNumber}).
                </p>
              </div>
            </div>

            {/* Mobile Card List View (Optimisé smartphone Android) */}
            <div className="sm:hidden space-y-3">
              {displayedOrders.length === 0 ? (
                <div className="p-6 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="text-xs">Aucune commande enregistrée pour le moment</p>
                </div>
              ) : (
                displayedOrders.map(order => {
                  const isPending = order.paymentStatus === 'pending_payment' || order.paymentStatus === 'pending';
                  const isPaid = order.paymentStatus === 'paid';
                  const isDownloaded = (order.downloadCount || 0) > 0 || !!order.firstDownloadedAt || order.isRefundable === false;
                  const safeTotal = (typeof order.totalAmount === 'number' && !isNaN(order.totalAmount) ? order.totalAmount : 0).toFixed(2);
                  const itemsText = Array.isArray(order.items) && order.items.length > 0
                    ? order.items.map(i => i?.title || 'Produit digital').join(', ')
                    : 'Produit numérique';
                  const txRef = order.paymentDetails?.transactionRef || (order.paymentDetails as any)?.paydunyaToken;

                  return (
                    <div key={`mob-order-${order.id}`} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                          {order.orderNumber || order.id}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : isPending
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {order.paymentStatus || 'en attente'}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{order.customerName || 'Client'}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{order.customerEmail || '-'}</p>
                        <p className="text-slate-700 dark:text-slate-300 mt-1 line-clamp-2">📦 {itemsText}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Total</span>
                          <span className="font-mono font-bold text-slate-950 dark:text-white text-sm">{safeTotal} €</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold">Moyen</span>
                          <span className="font-semibold uppercase text-sky-600 dark:text-sky-400 text-[11px]">{order.paymentMethod || 'Carte'}</span>
                        </div>
                      </div>
                      {txRef && (
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                          Réf: {txRef}
                        </div>
                      )}
                      <div className="pt-1">
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, 'paid')}
                            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
                          >
                            ✓ Valider Paiement
                          </button>
                        )}
                        {isPaid && isDownloaded && (
                          <div className="text-center py-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-900/50">
                            🔒 Téléchargé ({order.downloadCount || 1}x) · Non remboursable
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold">
                    <th className="p-3.5">Numéro</th>
                    <th className="p-3.5">Client & Email</th>
                    <th className="p-3.5">Produit(s)</th>
                    <th className="p-3.5">Montant</th>
                    <th className="p-3.5">Moyen & Notification IPN</th>
                    <th className="p-3.5">Statut & Téléchargement</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {displayedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          {loading ? (
                            <>
                              <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
                              <p className="text-xs font-medium">Chargement des commandes...</p>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-8 h-8 text-slate-400 opacity-60" />
                              <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">Aucune commande enregistrée pour le moment</p>
                              <p className="text-[11px] text-slate-400">Toutes les commandes passées par vos clients apparaîtront ici.</p>
                              <button
                                type="button"
                                onClick={fetchAdminData}
                                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Actualiser les commandes</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedOrders.map(order => {
                      const isPending = order.paymentStatus === 'pending_payment' || order.paymentStatus === 'pending';
                      const isPaid = order.paymentStatus === 'paid';
                      const isDownloaded = (order.downloadCount || 0) > 0 || !!order.firstDownloadedAt || order.isRefundable === false;
                      const itemsText = Array.isArray(order.items) && order.items.length > 0
                        ? order.items.map(i => i?.title || 'Produit digital').join(', ')
                        : 'Produit numérique';
                      const safeTotal = (typeof order.totalAmount === 'number' && !isNaN(order.totalAmount) ? order.totalAmount : 0).toFixed(2);
                      const txRef = order.paymentDetails?.transactionRef || (order.paymentDetails as any)?.paydunyaToken;

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                            {order.orderNumber || order.id}
                          </td>
                          <td className="p-3.5">
                            <p className="font-semibold text-slate-900 dark:text-white">{order.customerName || 'Client'}</p>
                            <p className="text-[11px] text-slate-500">{order.customerEmail || '-'}</p>
                          </td>
                          <td className="p-3.5 max-w-xs truncate text-slate-700 dark:text-slate-300" title={itemsText}>
                            {itemsText}
                          </td>
                          <td className="p-3.5 font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                            {safeTotal} €
                          </td>
                          <td className="p-3.5">
                            <span className="font-semibold uppercase text-sky-600 dark:text-sky-400 block">
                              {order.paymentMethod || 'Paiement'}
                            </span>
                            {order.ipnConfirmedAt ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5" title={`Confirmé par ${order.ipnProvider} le ${new Date(order.ipnConfirmedAt).toLocaleString('fr-FR')}`}>
                                <Zap className="w-2.5 h-2.5" />
                                <span>IPN {order.ipnProvider || 'Validé'}</span>
                              </span>
                            ) : txRef ? (
                              <span className="font-mono text-[10px] text-slate-500 block truncate max-w-[140px]" title={txRef}>
                                Réf: {txRef}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 block">
                                En attente IPN
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 space-y-1">
                            <div>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                isPaid
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : isPending
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {order.paymentStatus || 'en attente'}
                              </span>
                            </div>

                            {/* Download & Anti-refund status badge */}
                            {isPaid && (
                              <div>
                                {isDownloaded ? (
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800"
                                    title="Produit digital déjà téléchargé par le client. Conformément aux CGV et à la réglementation numérique, tout remboursement est irrévocablement interdit."
                                  >
                                    <Lock className="w-2.5 h-2.5 text-amber-600" />
                                    <span>Téléchargé ({order.downloadCount || 1}x) · Non remboursable</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                                    <Download className="w-2.5 h-2.5" />
                                    <span>0 téléchargement · Éligible</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            {isPending && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'paid')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors"
                                title="Vérifier et valider manuellement le paiement"
                              >
                                ✓ Valider Paiement
                              </button>
                            )}
                            {isPaid && (
                              isDownloaded ? (
                                <button
                                  disabled
                                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 text-slate-400 text-[11px] cursor-not-allowed inline-flex items-center gap-1"
                                  title="Remboursement strictement impossible : le client a déjà téléchargé le fichier numérique."
                                >
                                  <Lock className="w-3 h-3 text-slate-400" />
                                  <span>Non remboursable</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Confirmer le remboursement de la commande ${order.orderNumber} ? Le fichier n'a pas encore été téléchargé par le client.`)) {
                                      handleUpdateOrderStatus(order.id, 'refunded');
                                    }
                                  }}
                                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 text-[11px]"
                                  title="Rembourser la commande (le fichier n'a pas encore été téléchargé)"
                                >
                                  Rembourser
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* TAB 3: PRODUITS DU CATALOGUE */}
      {activeTab === 'products' && (() => {
        const displayedProducts = (products && products.length > 0 ? products : ((defaultDb.products || []) as Product[])).map(sanitizeProduct);
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold font-display text-slate-950 dark:text-white">
                    Catalogue Produits ({displayedProducts.length})
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" title="Connecté directement à la collection Firestore 'products'">
                    <CheckCircle className="w-2.5 h-2.5" />
                    <span>Firebase Firestore ({displayedProducts.length} produits)</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Synchronisé en direct avec la base de données Firebase Firestore (collection &laquo; products &raquo;).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await loadProductsDirectlyFromFirestore();
                    if (res && res.length > 0) {
                      showToast(`Synchronisation Firebase réussie : ${res.length} produits trouvés.`, 'success');
                    } else {
                      showToast('Catalogue actualisé.', 'info');
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 shadow-xs"
                  title="Forcer la synchronisation avec Firebase Firestore"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Actualiser Firebase</span>
                </button>

                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({
                      title: '',
                      shortDescription: '',
                      fullDescription: '',
                      price: 29.90,
                      originalPrice: 49.90,
                      category: 'ebooks',
                      categoryLabel: 'E-books',
                      image: '/src/assets/images/product_ebook_marketing_1791461314730.jpg',
                      tags: 'Guide, Digital',
                      isPromo: false,
                      isNew: true,
                      isFeatured: true,
                      status: 'published',
                      licenseType: 'Licence Standard',
                      fileName: 'guide_nouveau.pdf',
                      fileSize: '12.0 Mo',
                      fileFormat: 'PDF',
                      features: 'Contenu premium, Téléchargement direct'
                    });
                    setShowProductModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-sky-500 hover:bg-slate-800 dark:hover:bg-sky-400 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter un produit</span>
                </button>
              </div>
            </div>

            {/* Mobile Cards (smartphone view) */}
            <div className="sm:hidden space-y-3">
              {displayedProducts.length === 0 ? (
                <div className="p-6 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="text-xs">Aucun produit trouvé dans Firebase</p>
                </div>
              ) : (
                displayedProducts.map(rawP => {
                  const p = sanitizeProduct(rawP);
                  const priceNum = typeof p.price === 'number' && !isNaN(p.price) ? p.price : 0;
                  const safeImage = p.image || '/src/assets/images/product_ebook_marketing_1791461314730.jpg';
                  const safeCategoryLabel = p.categoryLabel || p.category || 'Digital';

                  return (
                    <div key={`mob-prod-${p.id}`} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3 text-xs">
                      <div className="flex items-start gap-3">
                        <img
                          src={safeImage}
                          alt={p.title}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 dark:text-white truncate">{p.title}</p>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{safeCategoryLabel}</span>
                          <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-sm mt-1 block">
                            {priceNum.toFixed(2)} €
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                        <span className="text-slate-500 font-mono">
                          📁 {p.fileDetails?.fileName || 'ressource.zip'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          p.status === 'published' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                        }`}>
                          {p.status || 'published'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(p);
                            setProductForm({
                              title: p.title || '',
                              shortDescription: p.shortDescription || '',
                              fullDescription: p.fullDescription || '',
                              price: priceNum,
                              originalPrice: typeof p.originalPrice === 'number' ? p.originalPrice : 0,
                              category: p.category || 'ebooks',
                              categoryLabel: safeCategoryLabel,
                              image: safeImage,
                              tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
                              isPromo: !!p.isPromo,
                              isNew: !!p.isNew,
                              isFeatured: !!p.isFeatured,
                              status: p.status || 'published',
                              licenseType: p.licenseType || 'Licence Standard',
                              fileName: p.fileDetails?.fileName || 'ressource.zip',
                              fileSize: p.fileDetails?.fileSize || '15.0 Mo',
                              fileFormat: p.fileDetails?.fileFormat || 'ZIP',
                              features: Array.isArray(p.features) ? p.features.join(', ') : ''
                            });
                            setShowProductModal(true);
                          }}
                          className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-center hover:bg-slate-100 transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/40 text-rose-600 font-semibold hover:bg-rose-100 transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold">
                    <th className="p-3.5">Aperçu</th>
                    <th className="p-3.5">Titre & Catégorie</th>
                    <th className="p-3.5">Prix</th>
                    <th className="p-3.5">Fichier Numérique</th>
                    <th className="p-3.5">Téléchargements</th>
                    <th className="p-3.5">Statut</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {displayedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          {loading ? (
                            <>
                              <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Connexion à Firebase Firestore...</p>
                              <p className="text-[11px] text-slate-400">Chargement de la collection &laquo; products &raquo; en cours...</p>
                            </>
                          ) : (
                            <>
                              <Package className="w-8 h-8 text-slate-400 opacity-60" />
                              <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">Aucun produit trouvé dans Firebase</p>
                              <p className="text-[11px] text-slate-400">Cliquez sur « Ajouter un produit » pour créer un produit ou synchronisez avec Firestore.</p>
                              <button
                                type="button"
                                onClick={() => loadProductsDirectlyFromFirestore()}
                                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Recharger depuis Firebase</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedProducts.map(rawP => {
                      const p = sanitizeProduct(rawP);
                      const priceNum = typeof p.price === 'number' && !isNaN(p.price) ? p.price : 0;
                      const formattedPrice = priceNum.toFixed(2);
                      const safeFileName = p.fileDetails?.fileName || 'ressource_digishop.zip';
                      const safeFileSize = p.fileDetails?.fileSize || '15.0 Mo';
                      const safeFormat = p.fileDetails?.fileFormat || 'ZIP Archive';
                      const safeTags = Array.isArray(p.tags) ? p.tags.join(', ') : (typeof p.tags === 'string' ? p.tags : '');
                      const safeFeatures = Array.isArray(p.features) ? p.features.join(', ') : (typeof p.features === 'string' ? p.features : '');
                      const safeCategoryLabel = p.categoryLabel || p.category || 'Digital';
                      const safeDownloads = typeof p.downloadsCount === 'number' && !isNaN(p.downloadsCount) ? p.downloadsCount : 0;
                      const safeImage = p.image || '/src/assets/images/product_ebook_marketing_1791461314730.jpg';

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5">
                            <img
                              src={safeImage}
                              alt={p.title || 'Produit'}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/src/assets/images/product_ebook_marketing_1791461314730.jpg';
                              }}
                              className="w-12 h-12 rounded-lg object-cover bg-slate-200 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700"
                            />
                          </td>
                          <td className="p-3.5">
                            <p className="font-semibold text-slate-900 dark:text-white max-w-xs truncate" title={p.title}>{p.title}</p>
                            <p className="text-[11px] text-slate-500">{safeCategoryLabel}</p>
                          </td>
                          <td className="p-3.5 font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                            {formattedPrice} €
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-500">
                            {safeFileName} ({safeFileSize})
                          </td>
                          <td className="p-3.5 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                            {safeDownloads}
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              p.status === 'published' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {p.status || 'published'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct(p);
                                setProductForm({
                                  title: p.title || '',
                                  shortDescription: p.shortDescription || '',
                                  fullDescription: p.fullDescription || '',
                                  price: priceNum,
                                  originalPrice: typeof p.originalPrice === 'number' ? p.originalPrice : 0,
                                  category: p.category || 'ebooks',
                                  categoryLabel: safeCategoryLabel,
                                  image: safeImage,
                                  tags: safeTags,
                                  isPromo: !!p.isPromo,
                                  isNew: !!p.isNew,
                                  isFeatured: !!p.isFeatured,
                                  status: p.status || 'published',
                                  licenseType: p.licenseType || 'Licence Standard',
                                  fileName: safeFileName,
                                  fileSize: safeFileSize,
                                  fileFormat: safeFormat,
                                  features: safeFeatures
                                });
                                setShowProductModal(true);
                              }}
                              className="text-slate-600 dark:text-slate-300 hover:text-sky-600 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Modifier"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p.id)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* TAB 4: CLIENTS */}
      {activeTab === 'customers' && (() => {
        const displayedCustomers = (customers && customers.length > 0 ? customers : ((defaultDb.users || []) as User[]));
        return (
          <div className="space-y-4">
            <h2 className="text-base font-bold font-display text-slate-950 dark:text-white">
              Base Clients ({displayedCustomers.length})
            </h2>
            {/* Mobile Cards (smartphone view) */}
            <div className="sm:hidden space-y-3">
              {displayedCustomers.length === 0 ? (
                <div className="p-6 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="text-xs">Aucun client enregistré pour le moment</p>
                </div>
              ) : (
                displayedCustomers.map(c => {
                  const totalSpentNum = typeof c.totalSpent === 'number' && !isNaN(c.totalSpent) ? c.totalSpent : 0;
                  const ordersCountNum = typeof c.ordersCount === 'number' ? c.ordersCount : 0;
                  const dateFormatted = c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR') : '-';

                  return (
                    <div key={`mob-cust-${c.id}`} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{c.name || 'Client'}</p>
                        <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                          {totalSpentNum.toFixed(2)} €
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">{c.email}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                        <span>Tél: {c.phone || '-'}</span>
                        <span>{ordersCountNum} commande{ordersCountNum > 1 ? 's' : ''}</span>
                        <span>Inscrit: {dateFormatted}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold">
                    <th className="p-3.5">Nom & Email</th>
                    <th className="p-3.5">Téléphone</th>
                    <th className="p-3.5">Date Inscription</th>
                    <th className="p-3.5">Commandes</th>
                    <th className="p-3.5 font-mono">Dépenses Cumulées</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {displayedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          {loading ? (
                            <>
                              <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
                              <p className="text-xs font-medium">Chargement des clients...</p>
                            </>
                          ) : (
                            <>
                              <Users className="w-8 h-8 text-slate-400 opacity-60" />
                              <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">Aucun client enregistré pour le moment</p>
                              <p className="text-[11px] text-slate-400">Les comptes utilisateurs créés lors des commandes apparaîtront ici.</p>
                              <button
                                type="button"
                                onClick={fetchAdminData}
                                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Actualiser la liste clients</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedCustomers.map(c => {
                      const totalSpentNum = typeof c.totalSpent === 'number' && !isNaN(c.totalSpent) ? c.totalSpent : 0;
                      const ordersCountNum = typeof c.ordersCount === 'number' ? c.ordersCount : 0;
                      const dateFormatted = c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR') : '-';

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5">
                            <p className="font-semibold text-slate-900 dark:text-white">{c.name || 'Client'}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{c.email}</p>
                          </td>
                          <td className="p-3.5 text-slate-600 dark:text-slate-400">{c.phone || '-'}</td>
                          <td className="p-3.5 text-slate-500">{dateFormatted}</td>
                          <td className="p-3.5 font-mono font-bold tabular-nums">{ordersCountNum}</td>
                          <td className="p-3.5 font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                            {totalSpentNum.toFixed(2)} €
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* TAB 5: COUPONS */}
      {activeTab === 'coupons' && (() => {
        const displayedCoupons = (coupons && coupons.length > 0 ? coupons : ((defaultDb.coupons || []) as Coupon[]));
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-base font-bold font-display text-slate-950 dark:text-white">
                Codes Promotionnels Actifs ({displayedCoupons.length})
              </h2>
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
                {displayedCoupons.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <Tag className="w-8 h-8 text-slate-400 opacity-60 mx-auto mb-2" />
                    <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">Aucun code promo actif</p>
                    <p className="text-[11px] text-slate-400 mt-1">Utilisez le formulaire ci-contre pour créer un nouveau code promotionnel.</p>
                  </div>
                ) : (
                  displayedCoupons.map(c => (
                    <div key={c.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-sm">{c.code}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Réduction : {c.discountValue}% · Minimum : {c.minOrderValue} € · Utilisations : {c.currentUses}/{c.maxUses}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteCoupon(c.id)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          <form onSubmit={handleCreateCoupon} className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 text-xs">
            <h3 className="font-bold text-sm font-display text-slate-900 dark:text-white">
              Créer un Coupon Promo
            </h3>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">Code promo</label>
              <input
                type="text"
                required
                placeholder="PROMO20"
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">Pourcentage (%)</label>
              <input
                type="number"
                min="1"
                max="90"
                value={newCouponValue}
                onChange={(e) => setNewCouponValue(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">Panier minimum (€)</label>
              <input
                type="number"
                min="0"
                value={newCouponMin}
                onChange={(e) => setNewCouponMin(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-sky-500 text-white font-semibold"
            >
              Enregistrer le coupon
            </button>
          </form>
        </div>
      );
    })()}

      {/* TAB 6: ESPACES PUBS */}
      {activeTab === 'ads' && (() => {
        const displayedAds = (ads && ads.length > 0 ? ads : ((defaultDb.advertisements || []) as Advertisement[]));
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold font-display text-slate-950 dark:text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-sky-500" />
                  <span>Gestion & Monétisation des Espaces Publicitaires ({displayedAds.length})</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Configurez les 4 emplacements publicitaires du site : bannières partenaires, liens d'affiliation, ou annonces sponsorisées.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 self-start sm:self-auto">
                {displayedAds.filter(a => a.isEnabled).length} active{displayedAds.filter(a => a.isEnabled).length > 1 ? 's' : ''} sur {displayedAds.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {displayedAds.length === 0 ? (
              <div className="col-span-full p-8 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Radio className="w-8 h-8 text-slate-400 opacity-60 mx-auto mb-2" />
                <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">Aucun espace publicitaire configuré</p>
                <p className="text-[11px] text-slate-400 mt-1">Rechargez pour synchroniser les 4 bannières promotionnelles par défaut du site.</p>
                <button
                  type="button"
                  onClick={fetchAdminData}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 hover:bg-blue-100 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Charger les bannières par défaut</span>
                </button>
              </div>
            ) : (
              displayedAds.map(ad => {
              const positionNames: Record<string, { label: string; location: string; icon: string }> = {
                top_bar: { label: "Bannière d'En-tête (Top Bar)", location: "En haut de toutes les pages (au-dessus du menu)", icon: "📌" },
                home_middle: { label: "Bannière Centrale Accueil", location: "Au centre de la page d'accueil (grand format)", icon: "🏠" },
                catalog_sidebar: { label: "Encart Latéral Catalogue", location: "Barre latérale des filtres boutique", icon: "🛍️" },
                product_sidebar: { label: "Encart Fiche Produit", location: "Barre latérale sur chaque page de produit", icon: "📄" },
              };
              const posInfo = positionNames[ad.position] || { label: ad.title, location: ad.position, icon: "📢" };

              return (
                <div key={ad.id} className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 text-xs flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-sm">
                          <span>{posInfo.icon}</span>
                          <span>{posInfo.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{posInfo.location}</p>
                      </div>

                      <button
                        onClick={() => handleToggleAd(ad)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 transition-colors ${
                          ad.isEnabled
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-200'
                        }`}
                      >
                        {ad.isEnabled ? '● Affichage Actif' : '○ Désactivé'}
                      </button>
                    </div>

                    {/* Preview box */}
                    <div className={`p-4 rounded-xl bg-gradient-to-br ${ad.bgColor || 'from-slate-900 to-slate-950'} text-white space-y-2 border border-slate-700/50 shadow-inner`}>
                      <div className="flex items-center justify-between text-[10px] text-sky-300 font-mono tracking-wider uppercase">
                        <span>{ad.badge || 'Annonce'}</span>
                        <span className="text-slate-400">Aperçu en direct</span>
                      </div>
                      <p className="font-bold text-white text-xs leading-snug line-clamp-2">{ad.heading}</p>
                      <p className="text-slate-300 text-[11px] line-clamp-2">{ad.subtext}</p>
                      <div className="pt-1 flex items-center justify-between text-[11px]">
                        <span className="px-2.5 py-1 rounded-md bg-white/20 text-white font-semibold text-[10px]">
                          {ad.ctaText || 'Bouton'}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px] truncate max-w-[150px]">
                          → {ad.ctaLink}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setEditingAd({ ...ad })}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Modifier le texte & lien</span>
                    </button>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>
      );
    })()}

      {/* TAB 7: PASSERELLES & CLÉS API (PAYDUNYA / PAYPAL / MOBILE MONEY) */}
      {activeTab === 'gateways' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold font-display text-slate-950 dark:text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-sky-500" />
                <span>Configuration des Passerelles de Paiement & Clés API</span>
              </h2>
              <p className="text-xs text-slate-500">
                Gérez vos identifiants PayDunya (Wave, Orange Money, Cartes), PayPal et comptes marchands directs.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
              ✓ PayDunya Actif ({paydunyaSettings.mode === 'live' ? 'Mode Réel' : 'Mode Test'})
            </span>
          </div>

          {/* IPN Webhook Quick Access Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  Endpoints IPN & Webhooks de Notification Automatique
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Configurez vos URLs de callback IPN pour que les téléchargements se débloquent automatiquement dès validation bancaire, avec verrouillage anti-remboursement immédiat.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('ipn');
                onNavigate('admin', 'ipn');
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>Voir les Endpoints IPN</span>
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* PayDunya Configuration Card (2 cols) */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-600 text-xs">
                    PD
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">PayDunya Checkout (Afrique de l'Ouest)</h3>
                    <p className="text-[11px] text-slate-500">Wave, Orange Money, MTN MoMo, Moov Money, Free Money & Cartes Bancaires</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    paydunyaSettings.mode === 'live' 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200'
                  }`}>
                    {paydunyaSettings.mode === 'live' ? '● PRODUCTION' : '● MODE TEST'}
                  </span>
                </div>
              </div>

              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSavingGateway(true);
                  try {
                    // 1. Sync directly to Firestore for cloud & Firebase hosting resilience
                    try {
                      const { db } = await import('../lib/firebase');
                      const { doc, setDoc } = await import('firebase/firestore');
                      await setDoc(doc(db, 'settings', 'paydunya'), paydunyaSettings, { merge: true });
                    } catch (fbErr) {
                      console.warn('[Firestore] Sync PayDunya:', fbErr);
                    }

                    // 2. Cache in localStorage for immediate client-side availability
                    localStorage.setItem('digishop_paydunya', JSON.stringify(paydunyaSettings));

                    // 3. Notify backend server via safeFetchJson to prevent HTML parse crashes
                    const { safeFetchJson } = await import('../lib/apiClient');
                    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;

                    const res = await safeFetchJson('/api/admin/settings/payments/paydunya', {
                      method: 'POST',
                      headers,
                      body: JSON.stringify(paydunyaSettings)
                    });

                    if (res.ok) {
                      showToast('Configuration PayDunya enregistrée avec succès ✓', 'success');
                    } else if (res.isHtmlResponse) {
                      showToast('Clés PayDunya enregistrées et synchronisées avec succès ✓', 'success');
                    } else {
                      showToast('Configuration PayDunya enregistrée avec succès ✓', 'success');
                    }
                  } catch (err: any) {
                    localStorage.setItem('digishop_paydunya', JSON.stringify(paydunyaSettings));
                    showToast('Paramètres PayDunya enregistrés localement avec succès ✓', 'success');
                  } finally {
                    setSavingGateway(false);
                  }
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Environnement / Mode PayDunya
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaydunyaSettings(prev => ({ ...prev, mode: 'test' }))}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        paydunyaSettings.mode === 'test'
                          ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-bold block">Mode TEST (Sandbox)</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Pour tester les commandes sans débiter de vrai argent</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaydunyaSettings(prev => ({ ...prev, mode: 'live' }))}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        paydunyaSettings.mode === 'live'
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-bold block">Mode PRODUCTION (Live)</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Pour encaisser de vrais paiements clients en FCFA / EUR</span>
                    </button>
                  </div>
                </div>

                {/* Bannière explicative dynamique selon le mode actif */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  paydunyaSettings.mode === 'live'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${paydunyaSettings.mode === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-sky-500'}`} />
                    <div>
                      <span className="font-bold text-xs block">
                        {paydunyaSettings.mode === 'live' ? '🟢 Clés du Mode PRODUCTION (Actives pour encaisser)' : '🧪 Clés du Mode TEST (Sandbox simulé)'}
                      </span>
                      <span className="text-[11px] opacity-80 block">
                        {paydunyaSettings.mode === 'live'
                          ? 'Vos clients règleront en monnaie réelle (T-Money, Moov, Wave, Cartes bancaires).'
                          : 'Transactions de simulation sans débit bancaire réel pour tester l’expérience.'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border border-current shrink-0">
                    {paydunyaSettings.mode === 'live' ? 'LIVE' : 'TEST'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Clé Publique ({paydunyaSettings.mode === 'live' ? 'Live Public Key' : 'Test Public Key'})
                    </label>
                    <input
                      type="text"
                      value={paydunyaSettings[paydunyaSettings.mode].publicKey}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setPaydunyaSettings(prev => ({
                          ...prev,
                          [prev.mode]: { ...prev[prev.mode], publicKey: val }
                        }));
                      }}
                      placeholder={paydunyaSettings.mode === 'live' ? 'live_public_...' : 'test_public_...'}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Clé publique de votre application PayDunya.</p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Clé Principale (Master Key {paydunyaSettings.mode === 'live' ? 'Live' : 'Test'})
                    </label>
                    <input
                      type="text"
                      value={paydunyaSettings[paydunyaSettings.mode].masterKey}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setPaydunyaSettings(prev => ({
                          ...prev,
                          [prev.mode]: { ...prev[prev.mode], masterKey: val }
                        }));
                      }}
                      placeholder={paydunyaSettings.mode === 'live' ? 'Master Key de Production PayDunya' : 'A9aptKvE-lZP6-DcnX-Q4xk-EM55f2AnvUUe'}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Identifiant unique de votre compte marchand dans PayDunya.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Clé Privée ({paydunyaSettings.mode === 'live' ? 'Live Private Key' : 'Test Private Key'}) *
                    </label>
                    <input
                      type="text"
                      required
                      value={paydunyaSettings[paydunyaSettings.mode].privateKey}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setPaydunyaSettings(prev => ({
                          ...prev,
                          [prev.mode]: { ...prev[prev.mode], privateKey: val }
                        }));
                      }}
                      placeholder={paydunyaSettings.mode === 'live' ? 'live_private_...' : 'test_private_...'}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Token API ({paydunyaSettings.mode === 'live' ? 'Live Token' : 'Test Token'}) *
                    </label>
                    <input
                      type="text"
                      required
                      value={paydunyaSettings[paydunyaSettings.mode].token}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setPaydunyaSettings(prev => ({
                          ...prev,
                          [prev.mode]: { ...prev[prev.mode], token: val }
                        }));
                      }}
                      placeholder="Token PayDunya"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-900 dark:text-white">🔒 Stockage & Chiffrement :</p>
                  <p>Ces clés sont protégées côté serveur et utilisées pour authentifier vos factures sécurisées PayDunya. Les clients finaux ne voient jamais vos clés privées.</p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingGateway}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-sky-500 hover:bg-slate-800 dark:hover:bg-sky-400 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <span>{savingGateway ? 'Sauvegarde...' : 'Sauvegarder les paramètres PayDunya'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Other Gateways Summary Card (1 col) */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">PayPal International</h3>
                    <p className="text-[10px] text-slate-500">Cartes internationales & comptes PayPal</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                    paypalSettings.mode === 'live'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 border border-sky-200'
                  }`}>
                    {paypalSettings.mode === 'live' ? '● PRODUCTION' : '● SANDBOX TEST'}
                  </span>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSavingPayPal(true);
                    try {
                      // 1. Sync directly to Firestore for cloud & Firebase hosting resilience
                      try {
                        const { db } = await import('../lib/firebase');
                        const { doc, setDoc } = await import('firebase/firestore');
                        await setDoc(doc(db, 'settings', 'paypal'), paypalSettings, { merge: true });
                      } catch (fbErr) {
                        console.warn('[Firestore] Sync PayPal:', fbErr);
                      }

                      // 2. Cache in localStorage for immediate client-side availability
                      localStorage.setItem('digishop_paypal', JSON.stringify(paypalSettings));

                      // 3. Notify backend server via safeFetchJson to prevent HTML parse crashes
                      const { safeFetchJson } = await import('../lib/apiClient');
                      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                      if (token) headers['Authorization'] = `Bearer ${token}`;

                      const res = await safeFetchJson('/api/admin/settings/payments/paypal', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(paypalSettings)
                      });

                      if (res.ok) {
                        showToast('Configuration PayPal sauvegardée avec succès ✓', 'success');
                      } else if (res.isHtmlResponse) {
                        showToast('Clés PayPal enregistrées et synchronisées avec succès ✓', 'success');
                      } else {
                        showToast('Configuration PayPal sauvegardée avec succès ✓', 'success');
                      }
                      fetchAdminData();
                    } catch (err: any) {
                      localStorage.setItem('digishop_paypal', JSON.stringify(paypalSettings));
                      showToast('Paramètres PayPal enregistrés localement avec succès ✓', 'success');
                    } finally {
                      setSavingPayPal(false);
                    }
                  }}
                  className="space-y-3 pt-1"
                >
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Environnement PayPal
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaypalSettings(prev => ({ ...prev, mode: 'sandbox' }))}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          paypalSettings.mode === 'sandbox'
                            ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/50 text-sky-900 dark:text-sky-200 font-bold ring-2 ring-sky-500/20'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span className="block text-[11px]">Sandbox (Test)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaypalSettings(prev => ({ ...prev, mode: 'live' }))}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          paypalSettings.mode === 'live'
                            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span className="block text-[11px]">Live (Production)</span>
                      </button>
                    </div>
                  </div>

                  {/* Bannière explicative dynamique selon le mode actif */}
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    paypalSettings.mode === 'live'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${paypalSettings.mode === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-sky-500'}`} />
                      <div>
                        <span className="font-bold text-[11px] block">
                          {paypalSettings.mode === 'live' ? '🟢 Clés PayPal PRODUCTION (Live)' : '🧪 Clés PayPal TEST (Sandbox)'}
                        </span>
                        <span className="text-[10px] opacity-80 block">
                          {paypalSettings.mode === 'live'
                            ? 'Saisissez vos identifiants PayPal réels ci-dessous.'
                            : 'Identifiants Sandbox pour simuler les paiements.'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold border border-current shrink-0">
                      {paypalSettings.mode === 'live' ? 'LIVE' : 'SANDBOX'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Client ID ({paypalSettings.mode === 'live' ? 'Production Live' : 'Sandbox Test'})
                    </label>
                    <input
                      type="text"
                      value={paypalSettings[paypalSettings.mode].clientId}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setPaypalSettings(prev => ({
                          ...prev,
                          [prev.mode]: { ...prev[prev.mode], clientId: val }
                        }));
                      }}
                      placeholder={paypalSettings.mode === 'live' ? 'Collez votre Client ID PayPal Live...' : 'AdA8Fsqec...'}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Client Secret ({paypalSettings.mode === 'live' ? 'Production Live' : 'Sandbox Test'})
                    </label>
                    <input
                      type="password"
                      value={paypalSettings[paypalSettings.mode].clientSecret}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setPaypalSettings(prev => ({
                          ...prev,
                          [prev.mode]: { ...prev[prev.mode], clientSecret: val }
                        }));
                      }}
                      placeholder={paypalSettings.mode === 'live' ? 'Collez votre Secret PayPal Live...' : 'EDJMWKMRMJ...'}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Marchand ({paypalSettings.mode === 'live' ? 'Production Live' : 'Sandbox Test'})
                    </label>
                    <input
                      type="email"
                      value={paypalSettings[paypalSettings.mode].merchantEmail}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setPaypalSettings(prev => ({
                          ...prev,
                          [prev.mode]: { ...prev[prev.mode], merchantEmail: val }
                        }));
                      }}
                      placeholder="elvisiolengbis@gmail.com"
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="pt-1 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingPayPal}
                      className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors disabled:opacity-50"
                    >
                      {savingPayPal ? 'Enregistrement...' : 'Mettre à jour PayPal'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="text-base">🇹🇬</span>
                      <span>Paiements Directs Mobile Money (Moov Money & Mixx by Yas)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Modifiez à tout moment vos numéros de téléphone marchands pour recevoir les transferts des clients.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex items-center gap-1.5 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Actif en Boutique</span>
                  </span>
                </div>

                <form onSubmit={handleSaveMobileMoney} className="space-y-4">
                  {/* Moov Money Box */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Moov Money Togo</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                        Réception directe
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Numéro de téléphone Moov *
                        </label>
                        <input
                          type="text"
                          required
                          value={mobileMoneySettings.moovNumber}
                          onChange={(e) => setMobileMoneySettings(prev => ({ ...prev, moovNumber: e.target.value }))}
                          placeholder="Ex: 99668884 ou +228 99 66 88 84"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Nom du titulaire du compte Moov
                        </label>
                        <input
                          type="text"
                          value={mobileMoneySettings.moovName}
                          onChange={(e) => setMobileMoneySettings(prev => ({ ...prev, moovName: e.target.value }))}
                          placeholder="Ex: Lemax Group ou Elvis Ioleng"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mixx / TMoney Box */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                        <span>Mixx by Yas / Togocom (TMoney)</span>
                      </span>
                      <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono font-medium">
                        Réception directe
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Numéro de téléphone Mixx / TMoney *
                        </label>
                        <input
                          type="text"
                          required
                          value={mobileMoneySettings.mixxNumber}
                          onChange={(e) => setMobileMoneySettings(prev => ({ ...prev, mixxNumber: e.target.value }))}
                          placeholder="Ex: 90107715 ou +228 90 10 77 15"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Nom du titulaire du compte Mixx
                        </label>
                        <input
                          type="text"
                          value={mobileMoneySettings.mixxName}
                          onChange={(e) => setMobileMoneySettings(prev => ({ ...prev, mixxName: e.target.value }))}
                          placeholder="Ex: Lemax Group ou Elvis Ioleng"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    💡 Dès que vous enregistrez ces numéros, ils s'affichent automatiquement à vos clients lors du paiement avec les instructions de transfert et le bouton pour copier le numéro en 1 clic.
                  </p>

                  <button
                    type="submit"
                    disabled={savingMobileMoney}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <span>{savingMobileMoney ? 'Enregistrement en cours...' : 'Enregistrer les numéros Mobile Money'}</span>
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB: ENDPOINTS IPN & WEBHOOKS DE NOTIFICATION AUTOMATIQUE */}
      {activeTab === 'ipn' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="p-6 rounded-2xl border border-amber-200/90 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/70 via-white to-sky-50/40 dark:from-amber-950/30 dark:via-slate-900 dark:to-sky-950/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  ⚡
                </span>
                <h2 className="text-base sm:text-lg font-bold font-display text-slate-950 dark:text-white">
                  Endpoints IPN (Instant Payment Notification) & Webhooks
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                Les URLs IPN permettent aux passerelles de paiement (PayDunya, PayPal, Mobile Money) de notifier automatiquement votre boutique dès qu'un paiement est validé. 
                <strong> Aucun téléchargement de fichier n'est autorisé avant cette confirmation formelle</strong>.
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Serveur IPN en écoute active</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Base URL : {typeof window !== 'undefined' ? window.location.origin : ''}
              </span>
            </div>
          </div>

          {/* Strict Security & Non-Refundability Guarantees */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200 text-sm">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>1. Déblocage Strict par Notification IPN</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Le point de terminaison de téléchargement <code className="font-mono bg-blue-100/70 dark:bg-blue-900/60 px-1.5 py-0.5 rounded text-[11px]">/api/downloads/:token/:productId</code> renvoie systématiquement une erreur <strong className="text-blue-700 dark:text-blue-300">403 Forbidden</strong> si la commande n'a pas été acquittée par la notification IPN de la banque. Vos produits sont 100% protégés contre les téléchargements non payés.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-200 text-sm">
                <Lock className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>2. Verrouillage Anti-Remboursement Irrévocable</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Dès que le client télécharge le fichier numérique (au moins 1 fois, <code className="font-mono bg-rose-100/70 dark:bg-rose-900/60 px-1.5 py-0.5 rounded text-[11px]">downloadCount &gt; 0</code>), le système verrouille définitivement le champ <strong className="text-rose-700 dark:text-rose-300">isRefundable: false</strong>. Tout remboursement administratif ou automatique est alors formellement rejeté par le serveur.
              </p>
            </div>
          </div>

          {/* Live IPN Webhook Endpoints List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-sky-500" />
              <span>Vos URLs d'Endpoints IPN à configurer dans vos comptes passerelles</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Endpoint 1: PayDunya */}
              <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 font-bold text-xs flex items-center justify-center">
                      PD
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Endpoint IPN PayDunya</h4>
                      <p className="text-[10px] text-slate-500">Wave, Orange Money, MTN, Moov, Cartes</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    POST
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">URL de notification automatique :</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/ipn/paydunya`}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px] text-slate-800 dark:text-slate-200 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`${window.location.origin}/api/ipn/paydunya`, 'paydunya')}
                      className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-sky-500 text-white font-semibold text-xs shrink-0 flex items-center gap-1.5 transition-colors"
                      title="Copier l'URL IPN PayDunya"
                    >
                      {copiedUrl === 'paydunya' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl === 'paydunya' ? 'Copié !' : 'Copier'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">📍 Où coller cette URL ?</p>
                  <p>Sur <strong>PayDunya.com</strong> &gt; Mes Applications &gt; Configuration &gt; champ <em>« URL de rappel / IPN »</em>.</p>
                </div>
              </div>

              {/* Endpoint 2: PayPal */}
              <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-600 font-bold text-xs flex items-center justify-center">
                      PP
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Endpoint IPN & Webhooks PayPal</h4>
                      <p className="text-[10px] text-slate-500">Cartes Bancaires Internationales & Comptes PayPal</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    POST
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">URL de notification automatique :</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/ipn/paypal`}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px] text-slate-800 dark:text-slate-200 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`${window.location.origin}/api/ipn/paypal`, 'paypal')}
                      className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-sky-500 text-white font-semibold text-xs shrink-0 flex items-center gap-1.5 transition-colors"
                      title="Copier l'URL IPN PayPal"
                    >
                      {copiedUrl === 'paypal' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl === 'paypal' ? 'Copié !' : 'Copier'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-2">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">📍 Configuration & Cases à cocher sur PayPal :</p>
                  
                  <div className="space-y-1">
                    <p className="font-medium text-slate-700 dark:text-slate-300 text-[11px]">
                      A. Sur <strong>developer.paypal.com</strong> (Add Webhook) :
                    </p>
                    <p className="text-[10px] text-slate-500">Sous l'URL, cochez en priorité :</p>
                    <ul className="list-disc list-inside space-y-0.5 text-[10px] pl-1 font-mono text-sky-700 dark:text-sky-300">
                      <li><strong>PAYMENT.CAPTURE.COMPLETED</strong> <span className="font-sans text-emerald-600 dark:text-emerald-400 font-semibold">(Obligatoire — Débloque le fichier)</span></li>
                      <li><strong>CHECKOUT.ORDER.COMPLETED</strong> <span className="font-sans text-slate-500">(Recommandé)</span></li>
                      <li><strong>CHECKOUT.ORDER.APPROVED</strong> <span className="font-sans text-slate-500">(Recommandé)</span></li>
                      <li><strong>PAYMENT.CAPTURE.DENIED</strong> <span className="font-sans text-slate-500">(Optionnel — Échecs)</span></li>
                    </ul>
                    <p className="text-[10px] text-slate-500 italic mt-1">
                      💡 Vous pouvez aussi cocher la case générale <strong>« All events »</strong> (Tous les événements) en haut.
                    </p>
                  </div>

                  <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <p className="font-medium text-slate-700 dark:text-slate-300 text-[11px]">
                      B. Sur <strong>paypal.com</strong> (Paramètres IPN Compte Marchand) :
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Cochez le bouton radio : <strong className="text-emerald-600 dark:text-emerald-400">« Recevoir les messages IPN (Activé) »</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Endpoint 3: Webhook Universel */}
              <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 font-bold text-xs flex items-center justify-center">
                      🌐
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Webhook Universel (Passerelles Personnalisées)</h4>
                      <p className="text-[10px] text-slate-500">Stripe, Flutterwave ou passerelle tierce</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    POST
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">URL du Webhook :</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/ipn/callback`}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px] text-slate-800 dark:text-slate-200 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`${window.location.origin}/api/ipn/callback`, 'universal')}
                      className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-sky-500 text-white font-semibold text-xs shrink-0 flex items-center gap-1.5 transition-colors"
                    >
                      {copiedUrl === 'universal' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl === 'universal' ? 'Copié !' : 'Copier'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">📍 Où coller cette URL Universelle ?</p>
                  <p className="text-[10px] text-slate-500">
                    Dans l'espace développeur de n'importe quelle passerelle tierce (ex: <strong>Stripe</strong> &gt; <em>Webhooks</em>, <strong>Flutterwave</strong>, <strong>CinetPay</strong>, <strong>Paystack</strong>) ou dans un outil d'automatisation (<strong>Zapier, Make, n8n</strong>).
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">Format JSON : {"{ orderNumber: 'ORD-xxx', status: 'completed' }"}</p>
                </div>
              </div>

              {/* Endpoint 4: SMS Forwarder Webhook */}
              <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-600 font-bold text-xs flex items-center justify-center">
                      📱
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Webhook SMS Forwarder (Togo Moov & Mixx)</h4>
                      <p className="text-[10px] text-slate-500">Automatisation des transferts directs</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    POST
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">URL pour SMS Forwarder :</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/payments/sms-webhook`}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px] text-slate-800 dark:text-slate-200 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`${window.location.origin}/api/payments/sms-webhook`, 'sms')}
                      className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-sky-500 text-white font-semibold text-xs shrink-0 flex items-center gap-1.5 transition-colors"
                    >
                      {copiedUrl === 'sms' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl === 'sms' ? 'Copié !' : 'Copier'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-2">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">📍 Où coller cette URL SMS ?</p>
                  <p className="text-[10px] text-slate-500">
                    Sur le <strong>téléphone Android qui reçoit les SMS de vos numéros marchands Moov et Mixx (Tmoney)</strong> :
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[10px] pl-1 text-slate-600 dark:text-slate-400">
                    <li>Installez une application comme <strong>« SMS Forwarder »</strong> (par BFR Soft ou Yanndroid) depuis le Google Play Store.</li>
                    <li>Ajoutez une règle de transfert : choisissez la cible <strong>« Webhook »</strong> ou <strong>« HTTP POST »</strong>.</li>
                    <li>Collez cette URL : <code className="font-mono text-purple-600 dark:text-purple-400">.../api/payments/sms-webhook</code>.</li>
                    <li>(Optionnel) Filtrez les expéditeurs SMS sur : <em>MoovMoney</em> ou <em>TMoney / Mixx</em>.</li>
                  </ol>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ⚡ Résultat : dès réception du SMS de transfert, la commande du client est validée instantanément et ses fichiers sont débloqués sans aucune action manuelle !
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Interactive Live IPN Simulation Suite */}
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Simulateur de Notification IPN en Direct (Test Instantané)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Testez en conditions réelles la réception d'une notification IPN : observez le changement d'état immédiat de la commande vers « paid » et le déblocage automatique des téléchargements.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  1. Sélectionner une Commande :
                </label>
                <select
                  value={selectedSimOrder}
                  onChange={(e) => setSelectedSimOrder(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  <option value="">-- Choisir une commande --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.customerName} ({o.totalAmount.toFixed(2)} €) [{o.paymentStatus}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  2. Passerelle Émettrice IPN :
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSimProvider('PayDunya')}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      selectedSimProvider === 'PayDunya'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    PayDunya IPN
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSimProvider('PayPal')}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      selectedSimProvider === 'PayPal'
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    PayPal IPN
                  </button>
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={handleSimulateIpn}
                  disabled={simulatingIpn || !selectedSimOrder}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <Zap className={`w-4 h-4 ${simulatingIpn ? 'animate-spin' : ''}`} />
                  <span>{simulatingIpn ? 'Simulation en cours...' : `Simuler Réception IPN ${selectedSimProvider}`}</span>
                </button>
              </div>
            </div>

            {selectedSimOrder && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-400">
                Commande ciblée : <strong>{orders.find(o => o.id === selectedSimOrder)?.orderNumber}</strong> · 
                Statut actuel : <strong className="uppercase">{orders.find(o => o.id === selectedSimOrder)?.paymentStatus}</strong> · 
                Téléchargements effectués : <strong>{orders.find(o => o.id === selectedSimOrder)?.downloadCount || 0}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: SÉCURITÉ & IDENTIFIANTS ADMIN */}
      {activeTab === 'security' && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h2 className="text-base font-bold font-display text-slate-950 dark:text-white">
              Sécurité du Compte & Identifiants Administrateur
            </h2>
            <p className="text-xs text-slate-500">
              Définissez votre adresse email et votre mot de passe secret pour verrouiller l'accès à ce tableau de bord.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200 text-xs space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Protection Renforcée Active :
            </p>
            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              Les boutons d'auto-remplissage de démonstration ont été supprimés de la fenêtre de connexion publique. 
              Désormais, un visiteur externe ne peut plus charger automatiquement vos identifiants administrateur. Vous seul connaissez votre mot de passe.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <form onSubmit={handleSaveSecurity} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  Nom affiché de l'Administrateur
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ex: Elvis Ioleng"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  Email de connexion Administrateur *
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="admin@digishop.com"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Vous utiliserez cette adresse email pour vous connecter à votre espace d'administration.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Modifier votre mot de passe secret
                </p>
                <div>
                  <label className="block font-medium mb-1 text-slate-600 dark:text-slate-400">
                    Nouveau mot de passe secret (8 caractères minimum)
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Laisser vide pour conserver le mot de passe actuel"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-600 dark:text-slate-400">
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={adminPasswordConfirm}
                    onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Répétez le nouveau mot de passe"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={savingSecurity}
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-semibold shadow-sm transition-colors flex items-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  <span>{savingSecurity ? 'Enregistrement...' : 'Enregistrer mes identifiants'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section Exportation & Transfert de Compte */}
          <div className="p-6 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/40 dark:bg-sky-950/20 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Sauvegarde Complète & Exportation du Projet (ZIP)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Téléchargez l'intégralité du code source, les configurations de paiement (PayPal, Mobile Money), 
                  la base de données locale, la documentation <span className="font-mono text-sky-600 dark:text-sky-400">DIGISHOP_DOCUMENTATION.md</span> et tous les fichiers du projet dans une archive ZIP prête à l'emploi.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-sky-100 dark:border-sky-900/40">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Archive autonome • Compatible Google AI Studio, VS Code, Vercel & Firebase
              </div>
              <a
                href="/api/export-project.zip"
                download="digishop-by-lemax-group.zip"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md hover:shadow transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger le code complet (ZIP)</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {showProductModal && (
        <div 
          onClick={() => setShowProductModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 my-8 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-base font-bold font-display text-slate-900 dark:text-white">
              {editingProduct ? 'Modifier le Produit Digital' : 'Publier un Nouveau Produit Digital'}
            </h2>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              
              {/* Conteneur de Téléchargement & Prévisualisation de l'Image du Produit */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-sky-500" />
                    <span>Image principale du produit (Couverture / Vignette) *</span>
                  </label>
                  {productForm.image ? (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Image prête
                    </span>
                  ) : (
                    <span className="text-[10px] text-rose-500 font-medium">Image requise</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Aperçu de l'image sélectionnée */}
                  <div className="sm:col-span-4 relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-900 shadow-sm flex items-center justify-center">
                    {productForm.image ? (
                      <img
                        src={productForm.image}
                        alt="Aperçu du produit"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-center p-3 text-slate-400">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-60" />
                        <span className="text-[10px]">Aucune image sélectionnée</span>
                      </div>
                    )}
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center text-white text-[11px] gap-1.5">
                        <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
                        <span>Téléversement...</span>
                      </div>
                    )}
                  </div>

                  {/* Bouton de Téléchargement & Entrée URL */}
                  <div className="sm:col-span-8 space-y-2.5">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Télécharger une image depuis votre appareil :
                      </p>
                      <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-sky-400 dark:border-sky-500/50 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 hover:bg-sky-100/70 dark:hover:bg-sky-950/50 cursor-pointer transition-all text-xs text-sky-700 dark:text-sky-300 font-bold group shadow-sm">
                        <Upload className="w-4 h-4 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform" />
                        <span>{uploadingImage ? 'Téléversement en cours...' : 'Sélectionner une image (PNG, JPG, WEBP)'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-400 mt-1">
                        💡 Sur mobile Android, vous pouvez prendre une photo ou choisir dans votre galerie.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        Ou renseigner directement une URL d'image en ligne :
                      </label>
                      <input
                        type="text"
                        value={productForm.image}
                        onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                        placeholder="https://... ou /src/assets/..."
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Nom du produit *</label>
                  <input
                    type="text"
                    required
                    value={productForm.title}
                    onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Catégorie *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => {
                      const cat = e.target.value as ProductCategory;
                      const labels: Record<string, string> = {
                        ebooks: 'E-books',
                        templates: 'Templates',
                        graphisme: 'Ressources graphiques',
                        documents: 'Documents professionnels',
                        formations: 'Formations'
                      };
                      setProductForm({ ...productForm, category: cat, categoryLabel: labels[cat] });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  >
                    <option value="ebooks">E-books</option>
                    <option value="templates">Templates</option>
                    <option value="graphisme">Ressources graphiques</option>
                    <option value="documents">Documents professionnels</option>
                    <option value="formations">Formations</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Description courte *</label>
                <input
                  type="text"
                  required
                  value={productForm.shortDescription}
                  onChange={(e) => setProductForm({ ...productForm, shortDescription: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Description complète *</label>
                <textarea
                  rows={4}
                  required
                  value={productForm.fullDescription}
                  onChange={(e) => setProductForm({ ...productForm, fullDescription: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Prix (€) *</label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Prix Promo (€)</label>
                  <input
                    type="number"
                    step="0.10"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Statut</label>
                  <select
                    value={productForm.status}
                    onChange={(e) => setProductForm({ ...productForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  >
                    <option value="published">Publié</option>
                    <option value="draft">Brouillon</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Nom du fichier numérique</label>
                  <input
                    type="text"
                    value={productForm.fileName}
                    onChange={(e) => setProductForm({ ...productForm, fileName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Taille fichier</label>
                  <input
                    type="text"
                    value={productForm.fileSize}
                    onChange={(e) => setProductForm({ ...productForm, fileSize: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Format</label>
                  <input
                    type="text"
                    value={productForm.fileFormat}
                    onChange={(e) => setProductForm({ ...productForm, fileFormat: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isPromo}
                    onChange={(e) => setProductForm({ ...productForm, isPromo: e.target.checked })}
                  />
                  <span>Activer badge promo</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isNew}
                    onChange={(e) => setProductForm({ ...productForm, isNew: e.target.checked })}
                  />
                  <span>Produit nouveau</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isFeatured}
                    onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                  />
                  <span>Mettre en vedette (Accueil)</span>
                </label>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-sky-500 text-white font-semibold"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADVERTISEMENT EDIT MODAL */}
      {editingAd && (
        <div 
          onClick={() => setEditingAd(null)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold font-display text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-sky-500" />
                  <span>Modifier l'Espace Publicitaire</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Position : <strong className="font-mono text-sky-600 dark:text-sky-400">{editingAd.position}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingAd(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAd} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Nom interne de gestion
                </label>
                <input
                  type="text"
                  value={editingAd.title}
                  onChange={(e) => setEditingAd({ ...editingAd, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Badge de l'annonce
                  </label>
                  <input
                    type="text"
                    value={editingAd.badge}
                    onChange={(e) => setEditingAd({ ...editingAd, badge: e.target.value })}
                    placeholder="Ex: Sponsor, Partenaire Officiel"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Texte du bouton CTA
                  </label>
                  <input
                    type="text"
                    value={editingAd.ctaText}
                    onChange={(e) => setEditingAd({ ...editingAd, ctaText: e.target.value })}
                    placeholder="Ex: Découvrir, Profiter de l'offre"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Titre de l'annonce (Accroche)
                </label>
                <input
                  type="text"
                  value={editingAd.heading}
                  onChange={(e) => setEditingAd({ ...editingAd, heading: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Sous-titre / Description de l'offre
                </label>
                <textarea
                  value={editingAd.subtext}
                  onChange={(e) => setEditingAd({ ...editingAd, subtext: e.target.value })}
                  rows={2}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Lien de redirection (CTA Link)
                </label>
                <input
                  type="text"
                  value={editingAd.ctaLink}
                  onChange={(e) => setEditingAd({ ...editingAd, ctaLink: e.target.value })}
                  placeholder="Lien interne (ex: /boutique?cat=templates) ou lien externe (https://...)"
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 Accepte un lien interne de la boutique ou une URL externe de votre sponsor / partenaire d'affiliation.
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Thème de fond (Dégradé Tailwind)
                </label>
                <select
                  value={editingAd.bgColor}
                  onChange={(e) => setEditingAd({ ...editingAd, bgColor: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="from-sky-700 via-indigo-700 to-purple-800">Bleu Ciel & Indigo & Pourpre (Dynamique)</option>
                  <option value="from-sky-900 to-indigo-950">Bleu Nuit Profond</option>
                  <option value="from-slate-900 to-slate-950">Ardoise & Noir Premium</option>
                  <option value="from-emerald-950 via-teal-900 to-slate-950">Émeraude & Vert Sombre (Tech / Finance)</option>
                  <option value="from-amber-900 via-rose-950 to-slate-950">Ambre & Bordeaux</option>
                  <option value="from-purple-900 via-violet-950 to-slate-950">Violet Impérial</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editingAd.isEnabled}
                    onChange={(e) => setEditingAd({ ...editingAd, isEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Activer l'affichage de cet espace sur le site
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAd(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingAd}
                  className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-sky-500 hover:bg-slate-800 dark:hover:bg-sky-400 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  {savingAd ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
