import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Product, User, Order, Coupon, Review, Advertisement, AdminStats } from '../types.ts';
import { INITIAL_PRODUCTS, INITIAL_COUPONS, INITIAL_ADS, INITIAL_REVIEWS } from './seedData.ts';
import { generateDownloadToken } from './digitalVault.ts';

export interface DatabaseSchema {
  users: (User & { passwordHash: string; salt: string })[];
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  reviews: Review[];
  advertisements: Advertisement[];
  newsletterSubscribers: { id: string; email: string; createdAt: string }[];
  adminLogs: { id: string; adminEmail: string; action: string; details: string; timestamp: string }[];
  mobileMoneySettings?: {
    moovNumber: string;
    mixxNumber: string;
    moovName: string;
    mixxName: string;
    instructions: string;
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return checkHash === hash;
}

export function createToken(payload: object): string {
  const secret = process.env.JWT_SECRET || 'digishop_default_secret_key_2026';
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 3600 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): any | null {
  try {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) return null;
    const secret = process.env.JWT_SECRET || 'digishop_default_secret_key_2026';
    const expectedSignature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSignature) return null;
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (decoded.exp && Date.now() > decoded.exp) return null;
    return decoded;
  } catch {
    return null;
  }
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadDatabase();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Error reading db.json, re-initializing...', err);
      }
    }
    const initial = this.getInitialData();
    this.save(initial);
    return initial;
  }

  private save(dataToSave?: DatabaseSchema) {
    this.ensureDirectory();
    const data = dataToSave || this.data;
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  private getInitialData(): DatabaseSchema {
    const adminPass = hashPassword('Admin@Digishop2026!');
    const clientPass = hashPassword('Client@Digishop2026!');

    const adminUser: User & { passwordHash: string; salt: string } = {
      id: 'usr-admin-1',
      name: 'Directeur Digishop',
      email: 'admin@digishop.com',
      role: 'admin',
      phone: '+33 6 12 34 56 78',
      createdAt: '2026-01-01T08:00:00Z',
      ordersCount: 0,
      totalSpent: 0,
      passwordHash: adminPass.hash,
      salt: adminPass.salt
    };

    const clientUser: User & { passwordHash: string; salt: string } = {
      id: 'usr-client-1',
      name: 'Thomas Laurent',
      email: 'client@digishop.com',
      role: 'customer',
      phone: '+33 6 98 76 54 32',
      createdAt: '2026-02-10T11:20:00Z',
      ordersCount: 2,
      totalSpent: 78.90,
      passwordHash: clientPass.hash,
      salt: clientPass.salt
    };

    const sampleOrders: Order[] = [
      {
        id: 'ord-1001',
        orderNumber: 'DS-2026-1001',
        userId: 'usr-client-1',
        customerName: 'Thomas Laurent',
        customerEmail: 'client@digishop.com',
        customerPhone: '+33 6 98 76 54 32',
        items: [
          {
            productId: 'prod-1',
            slug: 'guide-marketing-digital',
            title: 'Guide Ultime du Marketing Digital & Croissance',
            price: 29.90,
            image: '/src/assets/images/product_ebook_marketing_1791461314730.jpg',
            categoryLabel: 'E-books',
            fileDetails: INITIAL_PRODUCTS[0].fileDetails
          },
          {
            productId: 'prod-2',
            slug: 'templates-business-plan-pitch',
            title: 'Pack Ultime Business Plan & Pitch Deck Exécutif',
            price: 49.00,
            image: '/src/assets/images/product_template_business_1791461332483.jpg',
            categoryLabel: 'Templates',
            fileDetails: INITIAL_PRODUCTS[1].fileDetails
          }
        ],
        subtotal: 78.90,
        discountAmount: 0,
        totalAmount: 78.90,
        paymentMethod: 'card',
        paymentStatus: 'paid',
        paymentDetails: {
          cardLast4: '4242'
        },
        downloadToken: generateDownloadToken(),
        downloadExpiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        downloadCount: 1,
        maxDownloads: 5,
        createdAt: '2026-03-20T10:15:00Z',
        verifiedAt: '2026-03-20T10:15:05Z'
      },
      {
        id: 'ord-1002',
        orderNumber: 'DS-2026-1002',
        customerName: 'Amadou Koné',
        customerEmail: 'amadou.kone@example.com',
        customerPhone: '+225 07 88 99 00',
        items: [
          {
            productId: 'prod-3',
            slug: 'pack-3d-icons-ui-assets',
            title: 'Mega Pack 3D Icons & UI Assets Haute Résolution',
            price: 39.00,
            image: '/src/assets/images/product_graphics_3d_icons_1791461343514.jpg',
            categoryLabel: 'Ressources graphiques',
            fileDetails: INITIAL_PRODUCTS[2].fileDetails
          }
        ],
        subtotal: 39.00,
        discountAmount: 0,
        totalAmount: 39.00,
        paymentMethod: 'moov',
        paymentStatus: 'pending_payment',
        paymentDetails: {
          payerPhone: '99668884',
          transactionRef: 'MOOV-TX-88492019',
          notes: 'Transfert effectué vers le numéro marchand Moov Money 99668884'
        },
        downloadToken: generateDownloadToken(),
        downloadExpiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        downloadCount: 0,
        maxDownloads: 5,
        createdAt: '2026-03-24T14:45:00Z'
      },
      {
        id: 'ord-1003',
        orderNumber: 'DS-2026-1003',
        customerName: 'Koffi Mensah',
        customerEmail: 'koffi.mensah@example.com',
        customerPhone: '+228 90 10 77 15',
        items: [
          {
            productId: 'prod-4',
            slug: 'masterclass-ecommerce-scaling',
            title: 'Masterclass E-commerce & Scaling International',
            price: 89.00,
            image: '/src/assets/images/product_course_ecommerce_1791461354436.jpg',
            categoryLabel: 'Formations',
            fileDetails: INITIAL_PRODUCTS[3].fileDetails
          }
        ],
        subtotal: 89.00,
        discountAmount: 0,
        totalAmount: 89.00,
        paymentMethod: 'mixx',
        paymentStatus: 'pending_payment',
        paymentDetails: {
          payerPhone: '90107715',
          transactionRef: 'MIXX-TRX-990145',
          notes: 'Paiement Mixx au numéro 90107715'
        },
        downloadToken: generateDownloadToken(),
        downloadExpiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        downloadCount: 0,
        maxDownloads: 5,
        createdAt: '2026-03-25T09:12:00Z'
      }
    ];

    return {
      users: [adminUser, clientUser],
      products: INITIAL_PRODUCTS,
      orders: sampleOrders,
      coupons: INITIAL_COUPONS,
      reviews: INITIAL_REVIEWS,
      advertisements: INITIAL_ADS,
      newsletterSubscribers: [
        { id: 'sub-1', email: 'pro.creator@agency.com', createdAt: '2026-02-14T09:00:00Z' },
        { id: 'sub-2', email: 'designer@studio.co', createdAt: '2026-03-01T15:30:00Z' }
      ],
      adminLogs: [
        {
          id: 'log-1',
          adminEmail: 'admin@digishop.com',
          action: 'Système initialisé',
          details: 'Catalogue initial et politiques de téléchargement configurés',
          timestamp: '2026-01-01T08:00:00Z'
        }
      ]
    };
  }

  // --- Products ---
  getProducts(): Product[] {
    return this.data.products;
  }

  getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  getProductBySlug(slug: string): Product | undefined {
    return this.data.products.find(p => p.slug === slug);
  }

  saveProduct(product: Product): Product {
    const index = this.data.products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      this.data.products[index] = { ...product, updatedAt: new Date().toISOString() };
    } else {
      this.data.products.unshift(product);
    }
    this.save();
    return product;
  }

  deleteProduct(id: string): boolean {
    const initLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => p.id !== id);
    if (this.data.products.length !== initLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Users ---
  getUsers(): User[] {
    return this.data.users.map(({ passwordHash, salt, ...safeUser }) => safeUser);
  }

  getUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id: string): User | undefined {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return undefined;
    const { passwordHash, salt, ...safeUser } = user;
    return safeUser;
  }

  createUser(userData: { name: string; email: string; password: string; phone?: string; role?: 'admin' | 'customer' }) {
    const existing = this.getUserByEmail(userData.email);
    if (existing) throw new Error('Un compte avec cette adresse email existe déjà.');

    const { hash, salt } = hashPassword(userData.password);
    const newUser: User & { passwordHash: string; salt: string } = {
      id: `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      name: userData.name,
      email: userData.email.toLowerCase(),
      role: userData.role || 'customer',
      phone: userData.phone,
      createdAt: new Date().toISOString(),
      ordersCount: 0,
      totalSpent: 0,
      passwordHash: hash,
      salt
    };

    this.data.users.push(newUser);
    this.save();
    const { passwordHash, salt: _, ...safeUser } = newUser;
    return safeUser;
  }

  updateUserProfile(userId: string, updates: { name?: string; phone?: string }): User | null {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return null;
    if (updates.name) user.name = updates.name.trim();
    if (updates.phone !== undefined) user.phone = updates.phone.trim();
    this.save();
    const { passwordHash, salt: _, ...safeUser } = user;
    return safeUser;
  }

  updateUserPassword(email: string, newPassword: string): boolean {
    const user = this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return false;
    const { hash, salt } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;
    this.save();
    return true;
  }

  updateUserRole(userId: string, role: 'admin' | 'customer'): boolean {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return false;
    user.role = role;
    this.save();
    return true;
  }


  updateAdminCredentials(adminId: string, updates: { name?: string; email?: string; password?: string }): { success: boolean; user?: any; error?: string } {
    const user = this.data.users.find(u => u.id === adminId && u.role === 'admin');
    if (!user) return { success: false, error: 'Compte administrateur introuvable.' };

    if (updates.email && updates.email.trim() && updates.email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = this.data.users.some(u => u.id !== adminId && u.email.toLowerCase() === updates.email!.trim().toLowerCase());
      if (emailExists) return { success: false, error: 'Cette adresse email est déjà utilisée par un autre compte.' };
      user.email = updates.email.trim().toLowerCase();
    }

    if (updates.name && updates.name.trim()) {
      user.name = updates.name.trim();
    }

    if (updates.password && updates.password.trim()) {
      const { hash, salt } = hashPassword(updates.password.trim());
      user.passwordHash = hash;
      user.salt = salt;
    }

    this.save();
    const { passwordHash, salt: _, ...safeUser } = user;
    return { success: true, user: safeUser };
  }

  // --- Orders ---
  getOrders(): Order[] {
    return this.data.orders;
  }

  getOrderById(id: string): Order | undefined {
    return this.data.orders.find(o => o.id === id || o.orderNumber === id);
  }

  getOrderByDownloadToken(token: string): Order | undefined {
    return this.data.orders.find(o => o.downloadToken === token);
  }

  getOrdersByUser(userId: string): Order[] {
    return this.data.orders.filter(o => o.userId === userId);
  }

  createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'downloadToken' | 'downloadExpiresAt' | 'downloadCount' | 'maxDownloads' | 'createdAt'>): Order {
    const count = this.data.orders.length + 1001;
    const orderNumber = `DS-${new Date().getFullYear()}-${count}`;
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      orderNumber,
      downloadToken: generateDownloadToken(),
      downloadExpiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      downloadCount: 0,
      maxDownloads: 5,
      createdAt: new Date().toISOString()
    };

    this.data.orders.unshift(newOrder);

    // Update user stats if registered user
    if (newOrder.userId) {
      const user = this.data.users.find(u => u.id === newOrder.userId);
      if (user) {
        user.ordersCount += 1;
        if (newOrder.paymentStatus === 'paid') {
          user.totalSpent += newOrder.totalAmount;
        }
      }
    }

    // Update product downloads counter if paid
    if (newOrder.paymentStatus === 'paid') {
      newOrder.items.forEach(item => {
        const prod = this.data.products.find(p => p.id === item.productId);
        if (prod) prod.downloadsCount += 1;
      });
    }

    this.save();
    return newOrder;
  }

  updateOrderStatus(orderId: string, status: Order['paymentStatus'], verifiedBy?: string): Order | undefined {
    const order = this.data.orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (!order) return undefined;

    const oldStatus = order.paymentStatus;
    order.paymentStatus = status;

    if (status === 'paid' && oldStatus !== 'paid') {
      order.verifiedAt = new Date().toISOString();
      if (verifiedBy) order.verifiedBy = verifiedBy;

      // Update product download counts
      order.items.forEach(item => {
        const prod = this.data.products.find(p => p.id === item.productId);
        if (prod) prod.downloadsCount += 1;
      });

      // Update user total spent
      if (order.userId) {
        const user = this.data.users.find(u => u.id === order.userId);
        if (user) user.totalSpent += order.totalAmount;
      }
    }

    this.save();
    return order;
  }

  incrementDownloadCount(orderId: string): Order | undefined {
    const order = this.data.orders.find(o => o.id === orderId);
    if (!order) return undefined;
    order.downloadCount += 1;
    this.save();
    return order;
  }

  // --- Coupons ---
  getCoupons(): Coupon[] {
    return this.data.coupons;
  }

  getCouponByCode(code: string): Coupon | undefined {
    return this.data.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
  }

  saveCoupon(coupon: Coupon): Coupon {
    const index = this.data.coupons.findIndex(c => c.id === coupon.id);
    if (index >= 0) {
      this.data.coupons[index] = coupon;
    } else {
      this.data.coupons.unshift(coupon);
    }
    this.save();
    return coupon;
  }

  deleteCoupon(id: string): boolean {
    const initLen = this.data.coupons.length;
    this.data.coupons = this.data.coupons.filter(c => c.id !== id);
    if (this.data.coupons.length !== initLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Advertisements ---
  getAdvertisements(): Advertisement[] {
    return this.data.advertisements;
  }

  saveAdvertisement(ad: Advertisement): Advertisement {
    const index = this.data.advertisements.findIndex(a => a.id === ad.id);
    if (index >= 0) {
      this.data.advertisements[index] = ad;
    } else {
      this.data.advertisements.push(ad);
    }
    this.save();
    return ad;
  }

  // --- Reviews ---
  getReviews(productId?: string): Review[] {
    if (productId) {
      return this.data.reviews.filter(r => r.productId === productId && r.isApproved);
    }
    return this.data.reviews;
  }

  addReview(reviewData: Omit<Review, 'id' | 'createdAt'>): Review {
    const newReview: Review = {
      ...reviewData,
      id: `rev-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      createdAt: new Date().toISOString()
    };
    this.data.reviews.unshift(newReview);
    this.save();
    return newReview;
  }

  updateReviewStatus(id: string, isApproved: boolean): boolean {
    const review = this.data.reviews.find(r => r.id === id);
    if (!review) return false;
    review.isApproved = isApproved;
    this.save();
    return true;
  }

  // --- Newsletter ---
  addNewsletterSubscriber(email: string): boolean {
    const normalized = email.toLowerCase().trim();
    if (this.data.newsletterSubscribers.some(s => s.email === normalized)) {
      return true; // Already subscribed
    }
    this.data.newsletterSubscribers.push({
      id: `sub-${Date.now()}`,
      email: normalized,
      createdAt: new Date().toISOString()
    });
    this.save();
    return true;
  }

  // --- Admin Logs ---
  logAdminAction(adminEmail: string, action: string, details: string) {
    this.data.adminLogs.unshift({
      id: `log-${Date.now()}`,
      adminEmail,
      action,
      details,
      timestamp: new Date().toISOString()
    });
    if (this.data.adminLogs.length > 200) {
      this.data.adminLogs.pop();
    }
    this.save();
  }

  addAdminLog(adminEmail: string, action: string, details: string) {
    this.logAdminAction(adminEmail, action, details);
  }

  // --- Statistics ---
  getStats(): AdminStats {
    const paidOrders = this.data.orders.filter(o => o.paymentStatus === 'paid');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const productSalesMap: Record<string, { title: string; count: number; revenue: number }> = {};
    const paymentMap: Record<string, { count: number; amount: number }> = {
      card: { count: 0, amount: 0 },
      paypal: { count: 0, amount: 0 },
      moov: { count: 0, amount: 0 },
      mixx: { count: 0, amount: 0 }
    };

    paidOrders.forEach(order => {
      if (paymentMap[order.paymentMethod]) {
        paymentMap[order.paymentMethod].count += 1;
        paymentMap[order.paymentMethod].amount += order.totalAmount;
      }
      order.items.forEach(item => {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = { title: item.title, count: 0, revenue: 0 };
        }
        productSalesMap[item.productId].count += 1;
        productSalesMap[item.productId].revenue += item.price;
      });
    });

    const popularProducts = Object.entries(productSalesMap)
      .map(([id, data]) => ({ id, title: data.title, salesCount: data.count, revenue: data.revenue }))
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 5);

    const paymentMethodBreakdown = [
      { method: 'card' as const, label: 'Carte Bancaire (Visa/MC)', count: paymentMap.card.count, amount: paymentMap.card.amount },
      { method: 'paypal' as const, label: 'PayPal', count: paymentMap.paypal.count, amount: paymentMap.paypal.amount },
      { method: 'moov' as const, label: 'Moov Money (99668884)', count: paymentMap.moov.count, amount: paymentMap.moov.amount },
      { method: 'mixx' as const, label: 'Mixx (90107715)', count: paymentMap.mixx.count, amount: paymentMap.mixx.amount }
    ];

    // Recent sales by date
    const salesByDate: Record<string, { amount: number; count: number }> = {};
    paidOrders.forEach(o => {
      const dateKey = o.createdAt.split('T')[0];
      if (!salesByDate[dateKey]) salesByDate[dateKey] = { amount: 0, count: 0 };
      salesByDate[dateKey].amount += o.totalAmount;
      salesByDate[dateKey].count += 1;
    });

    const recentSales = Object.entries(salesByDate)
      .map(([date, val]) => ({ date, amount: val.amount, count: val.count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders: this.data.orders.length,
      paidOrders: paidOrders.length,
      pendingPaymentOrders: this.data.orders.filter(o => o.paymentStatus === 'pending_payment').length,
      totalCustomers: this.data.users.filter(u => u.role === 'customer').length,
      totalProducts: this.data.products.length,
      popularProducts,
      paymentMethodBreakdown,
      recentSales
    };
  }

  getMobileMoneySettings(): { moovNumber: string; mixxNumber: string; moovName: string; mixxName: string; instructions: string } {
    if (!this.data.mobileMoneySettings) {
      this.data.mobileMoneySettings = {
        moovNumber: '99668884',
        mixxNumber: '90107715',
        moovName: 'Lemax Group',
        mixxName: 'Lemax Group',
        instructions: 'Veuillez effectuer le transfert vers le numéro correspondant et renseigner la référence SMS reçue.'
      };
      this.save();
    }
    return this.data.mobileMoneySettings;
  }

  updateMobileMoneySettings(updates: Partial<{ moovNumber: string; mixxNumber: string; moovName: string; mixxName: string; instructions: string }>): { moovNumber: string; mixxNumber: string; moovName: string; mixxName: string; instructions: string } {
    const current = this.getMobileMoneySettings();
    this.data.mobileMoneySettings = {
      ...current,
      ...updates
    };
    this.save();
    return this.data.mobileMoneySettings;
  }
}

export const db = new Database();
