export type ProductCategory = 
  | 'ebooks' 
  | 'templates' 
  | 'graphisme' 
  | 'documents' 
  | 'formations';

export type PaymentMethod = 'paypal' | 'card' | 'paydunya' | 'moov' | 'mixx';

export type OrderStatus = 
  | 'pending' 
  | 'pending_payment' 
  | 'paid' 
  | 'failed' 
  | 'cancelled' 
  | 'refunded';

export interface FileDetails {
  fileName: string;
  fileSize: string;
  fileFormat: string;
  version: string;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  originalPrice?: number;
  category: ProductCategory;
  categoryLabel: string;
  image: string;
  previewImages?: string[];
  tags: string[];
  downloadsCount: number;
  rating: number;
  reviewsCount: number;
  isNew?: boolean;
  isPromo?: boolean;
  isFeatured?: boolean;
  isRecommended?: boolean;
  status: 'published' | 'draft';
  licenseType: 'Licence Standard' | 'Licence Commerciale' | 'Licence Étendue';
  fileDetails: FileDetails;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  phone?: string;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
}

export interface OrderItem {
  productId: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  categoryLabel: string;
  fileDetails: FileDetails;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: OrderStatus;
  paymentDetails: {
    transactionRef?: string;
    merchantNumber?: string;
    payerName?: string;
    payerPhone?: string;
    paypalOrderId?: string;
    cardLast4?: string;
    paydunyaToken?: string;
    paydunyaInvoiceUrl?: string;
    paydunyaReceiptUrl?: string;
    channel?: string;
    notes?: string;
  };
  downloadToken: string;
  downloadExpiresAt: string;
  downloadCount: number;
  maxDownloads: number;
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxUses: number;
  currentUses: number;
  expiresAt: string;
  isActive: boolean;
  validCategories?: string[];
}

export interface Review {
  id: string;
  productId: string;
  productTitle: string;
  userId?: string;
  userName: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: string;
}

export interface Advertisement {
  id: string;
  title: string;
  position: 'home_middle' | 'catalog_sidebar' | 'top_bar' | 'product_sidebar' | string;
  badge: string;
  heading: string;
  subtext: string;
  ctaText: string;
  ctaLink: string;
  imageUrl?: string;
  bgColor: string;
  isEnabled: boolean;
}

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  pendingPaymentOrders: number;
  totalCustomers: number;
  totalProducts: number;
  popularProducts: {
    id: string;
    title: string;
    salesCount: number;
    revenue: number;
  }[];
  paymentMethodBreakdown: {
    method: PaymentMethod;
    label: string;
    count: number;
    amount: number;
  }[];
  recentSales: {
    date: string;
    amount: number;
    count: number;
  }[];
}
