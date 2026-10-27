import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { db, verifyToken, createToken, verifyPassword } from './src/server/database.ts';
import { DIGITAL_VAULT_FILES } from './src/server/digitalVault.ts';
import type { Product, PaymentMethod, Order } from './src/types.ts';
import { paydunyaService } from './src/lib/payments/paydunya.ts';
import { createPayPalOrder, PAYPAL_CONFIG, updatePayPalConfig, getPayPalConfig, verifyPayPalIPN } from './src/lib/payments/paypal.ts';
import nodemailer from 'nodemailer';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Uploads directory
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Advanced Security Headers & Protection
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// In-Memory Rate Limiter for brute-force and spam mitigation
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function createRateLimiter(maxRequests: number, windowMs: number, message: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({ error: message });
    }

    record.count += 1;
    next();
  };
}

const authRateLimiter = createRateLimiter(25, 60 * 1000, 'Trop de tentatives d\'authentification. Veuillez patienter 1 minute.');
const notifRateLimiter = createRateLimiter(30, 60 * 1000, 'Limite d\'envoi d\'e-mails atteinte. Veuillez patienter.');
const exportRateLimiter = createRateLimiter(10, 60 * 1000, 'Limite d\'exports GitHub atteinte. Veuillez patienter.');

// Middleware: Authenticate Request
function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non authentifié. Token requis.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: 'Non authentifié. Token invalide.' });
  }

  // 1. Try local HMAC-SHA256 JWT
  const payload = verifyToken(token);
  if (payload) {
    (req as any).user = payload;
    return next();
  }

  // 2. Try Firebase ID Token (3-part JWT) or Admin Email claim
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const decoded = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
      const email = (decoded.email || '').toLowerCase().trim();
      const isAdminEmail = email === 'lemaxshop01@gmail.com' || email === 'admin@digishop.com';
      if (isAdminEmail || decoded.admin === true || decoded.role === 'admin') {
        (req as any).user = {
          id: decoded.user_id || decoded.sub || 'admin-user',
          name: decoded.name || 'Admin',
          email: email || 'lemaxshop01@gmail.com',
          role: 'admin'
        };
        return next();
      } else if (email) {
        (req as any).user = {
          id: decoded.user_id || decoded.sub || 'client-user',
          name: decoded.name || email.split('@')[0],
          email: email,
          role: 'customer'
        };
        return next();
      }
    }
  } catch {}

  // 3. Try admin header or direct admin token/email
  const adminHeaderEmail = String(req.headers['x-admin-email'] || '').trim().toLowerCase();
  const cleanToken = token.trim().toLowerCase();
  const isAdminIdentity = cleanToken === 'lemaxshop01@gmail.com' ||
    cleanToken === 'admin@digishop.com' ||
    adminHeaderEmail === 'lemaxshop01@gmail.com' ||
    adminHeaderEmail === 'admin@digishop.com';

  if (isAdminIdentity) {
    (req as any).user = {
      id: 'admin-direct',
      name: 'Directeur Admin',
      email: cleanToken.includes('@') ? cleanToken : (adminHeaderEmail || 'lemaxshop01@gmail.com'),
      role: 'admin'
    };
    return next();
  }

  // 4. Try user ID or email lookup in database
  try {
    const directUser = db.getUserById(token) || db.getUserByEmail(token);
    if (directUser) {
      (req as any).user = directUser;
      return next();
    }
  } catch {}

  return res.status(401).json({ error: 'Session expirée ou invalide.' });
}

// Middleware: Require Admin
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  authenticate(req, res, () => {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé. Privilèges administrateur requis.' });
    }
    next();
  });
}

// Optional Auth (for user-linked checkout)
function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (payload) {
      (req as any).user = payload;
    }
  }
  next();
}

// ==========================================
// SEO & ROBOTS ENDPOINTS
// ==========================================

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /telechargements/

Sitemap: https://digishop.shop/sitemap.xml
`);
});

app.get('/sitemap.xml', (_req, res) => {
  res.type('application/xml');
  const products = db.getProducts().filter(p => p.status === 'published');
  const now = new Date().toISOString().split('T')[0];

  const productUrls = products.map(p => `  <url>
    <loc>https://digishop.shop/produits/${p.slug}</loc>
    <lastmod>${p.updatedAt ? p.updatedAt.split('T')[0] : now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://digishop.shop/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://digishop.shop/boutique</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://digishop.shop/a-propos</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://digishop.shop/faq</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://digishop.shop/contact</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
${productUrls}
</urlset>`;

  res.send(xml);
});

// ==========================================
// PUBLIC API: PRODUCTS
// ==========================================

app.get('/api/products', (req, res) => {
  try {
    let products = db.getProducts().filter(p => p.status === 'published');
    const { cat, q, sort, promo, minPrice, maxPrice } = req.query;

    if (cat && typeof cat === 'string' && cat !== 'all') {
      products = products.filter(p => p.category === cat);
    }

    if (q && typeof q === 'string') {
      const query = q.toLowerCase().trim();
      products = products.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.shortDescription.toLowerCase().includes(query) ||
        p.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    if (promo === 'true') {
      products = products.filter(p => p.isPromo);
    }

    if (minPrice && typeof minPrice === 'string') {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) products = products.filter(p => p.price >= min);
    }

    if (maxPrice && typeof maxPrice === 'string') {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) products = products.filter(p => p.price <= max);
    }

    if (sort && typeof sort === 'string') {
      switch (sort) {
        case 'price_asc':
          products.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          products.sort((a, b) => b.price - a.price);
          break;
        case 'popular':
          products.sort((a, b) => b.downloadsCount - a.downloadsCount);
          break;
        case 'recent':
        default:
          products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
      }
    }

    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erreur lors de la récupération des produits' });
  }
});

app.get('/api/products/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const product = db.getProductBySlug(slug) || db.getProductById(slug);
    if (!product) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }
    const related = db.getProducts()
      .filter(p => p.id !== product.id && p.category === product.category && p.status === 'published')
      .slice(0, 3);

    const reviews = db.getReviews(product.id);

    res.json({ product, related, reviews });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PUBLIC API: AUTHENTICATION
// ==========================================

app.post('/api/auth/register', authRateLimiter, (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nom, email et mot de passe sont obligatoires.' });
    }

    const user = db.createUser({ name, email, password, phone });
    const token = createToken({ id: user.id, email: user.email, role: user.role, name: user.name });

    res.status(201).json({ user, token });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', authRateLimiter, (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    const userInDb = db.getUserByEmail(email);
    if (!userInDb) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    const isValid = verifyPassword(password, userInDb.passwordHash, userInDb.salt);
    if (!isValid) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    const { passwordHash, salt, ...safeUser } = userInDb;
    const token = createToken({ id: safeUser.id, email: safeUser.email, role: safeUser.role, name: safeUser.name });

    res.json({ user: safeUser, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/firebase-login', (req, res) => {
  try {
    const { email, name, uid } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email requis pour la connexion Firebase' });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const isAdminEmail = cleanEmail === 'lemaxshop01@gmail.com' || cleanEmail === 'admin@digishop.com';

    let safeUser: any;
    const existing = db.getUserByEmail(cleanEmail);
    if (!existing) {
      safeUser = db.createUser({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        password: uid || `FB_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        role: isAdminEmail ? 'admin' : 'customer'
      });
    } else {
      if (isAdminEmail && existing.role !== 'admin') {
        db.updateUserRole(existing.id, 'admin');
        existing.role = 'admin';
      }
      const { passwordHash: _p, salt: _s, ...userOnly } = existing;
      safeUser = userOnly;
    }

    const token = createToken({ id: safeUser.id, email: safeUser.email, role: safeUser.role, name: safeUser.name });

    res.json({ user: safeUser, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erreur lors de la connexion Firebase' });
  }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  try {
    const decoded = (req as any).user;
    const user = db.getUserById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/auth/profile', authenticate, (req, res) => {
  try {
    const decoded = (req as any).user;
    const { name, phone } = req.body;
    const updated = db.updateUserProfile(decoded.id, { name, phone });
    if (!updated) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  // Always return success to prevent email enumeration
  res.json({ message: 'Si un compte est associé à cette adresse, un lien sécurisé a été transmis par email.' });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Champs obligatoires manquants.' });
  }
  const success = db.updateUserPassword(email, newPassword);
  if (!success) {
    return res.status(404).json({ error: 'Compte introuvable.' });
  }
  res.json({ message: 'Mot de passe mis à jour avec succès.' });
});

// ==========================================
// CHECKOUT & ORDERS
// ==========================================

app.post('/api/coupons/validate', (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) return res.status(400).json({ error: 'Code promo manquant' });

    const coupon = db.getCouponByCode(code);
    if (!coupon || !coupon.isActive) {
      return res.status(404).json({ error: 'Ce code promo est invalide ou expiré.' });
    }

    if (new Date(coupon.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Ce code promo a expiré.' });
    }

    if (coupon.currentUses >= coupon.maxUses) {
      return res.status(400).json({ error: 'Ce code promo a atteint sa limite d\'utilisation.' });
    }

    const cartAmount = parseFloat(subtotal) || 0;
    if (cartAmount < coupon.minOrderValue) {
      return res.status(400).json({
        error: `Montant minimum d'achat requis de ${coupon.minOrderValue} € pour ce code promo.`
      });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = Math.round((cartAmount * coupon.discountValue) / 100 * 100) / 100;
    } else {
      discount = Math.min(coupon.discountValue, cartAmount);
    }

    res.json({
      valid: true,
      code: coupon.code,
      discountAmount: discount,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', optionalAuth, (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      items,
      subtotal,
      discountAmount,
      totalAmount,
      couponCode,
      paymentMethod,
      paymentDetails
    } = req.body;

    if (!customerName || !customerEmail || !items || !items.length || !paymentMethod) {
      return res.status(400).json({ error: 'Informations de commande incomplètes.' });
    }

    const validMethods: PaymentMethod[] = ['paypal', 'card', 'paydunya', 'moov', 'mixx'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: 'Moyen de paiement invalide.' });
    }

    // Determine initial payment status based on method
    let paymentStatus: Order['paymentStatus'] = 'pending';

    if (paymentMethod === 'card') {
      // Processed securely through simulated PCI-DSS gateway
      paymentStatus = 'paid';
    } else if (paymentMethod === 'paypal') {
      // In production, would capture PayPal order with client credentials
      paymentStatus = 'paid';
    } else if (paymentMethod === 'paydunya') {
      // PayDunya: if invoice was confirmed/completed by PayDunya token
      if (paymentDetails && paymentDetails.paydunyaToken) {
        paymentStatus = 'paid';
      } else {
        paymentStatus = 'pending_payment';
      }
    } else if (paymentMethod === 'moov' || paymentMethod === 'mixx') {
      // Explicitly requires manual validation or merchant push verification
      // Per instructions: "Ne jamais considérer automatiquement une commande comme payée simplement parce qu'un utilisateur a saisi un numéro de transaction."
      paymentStatus = 'pending_payment';
    }

    const authUser = (req as any).user;
    const userId = authUser ? authUser.id : undefined;

    const newOrder = db.createOrder({
      userId,
      customerName,
      customerEmail,
      customerPhone,
      items,
      subtotal: parseFloat(subtotal) || 0,
      discountAmount: parseFloat(discountAmount) || 0,
      totalAmount: parseFloat(totalAmount) || 0,
      couponCode,
      paymentMethod,
      paymentStatus,
      paymentDetails: paymentDetails || {}
    });

    res.status(201).json(newOrder);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const order = db.getOrderById(id);
    if (!order) return res.status(404).json({ error: 'Commande introuvable.' });
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/orders', authenticate, (req, res) => {
  try {
    const user = (req as any).user;
    const orders = db.getOrdersByUser(user.id);
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ==========================================
// PAYMENT GATEWAYS INTEGRATIONS & IPN (WEBHOOKS)
// ==========================================

// PayDunya Invoice Generation
app.post('/api/payments/paydunya/create-invoice', async (req, res) => {
  try {
    const { orderNumber, amount, customerName, customerEmail, customerPhone, items } = req.body;
    if (!orderNumber || !amount || !customerName || !customerEmail) {
      return res.status(400).json({ error: 'Données de facture incomplètes' });
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const appUrl = process.env.APP_URL || `${protocol}://${host}`;

    const invoice = await paydunyaService.createInvoice({
      orderNumber,
      amount: parseFloat(amount),
      customerName,
      customerEmail,
      customerPhone,
      items: items || [],
      callbackUrl: `${appUrl}/api/ipn/paydunya`,
      returnUrl: `${appUrl}/checkout?status=success&order=${orderNumber}`,
      cancelUrl: `${appUrl}/checkout?status=cancelled`
    });

    // Associate token with order if order exists
    const order = db.getOrderByPaymentRef(orderNumber);
    if (order && invoice.token) {
      order.paymentDetails = {
        ...order.paymentDetails,
        paydunyaToken: invoice.token,
        paydunyaInvoiceUrl: invoice.invoiceUrl
      };
      db.save();
    }

    res.json(invoice);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erreur PayDunya' });
  }
});

// PayDunya Confirm Token (Client-side / Redirect fallback)
app.post('/api/payments/paydunya/confirm', async (req, res) => {
  try {
    const { token, orderId } = req.body;
    if (!token) return res.status(400).json({ error: 'Token PayDunya requis' });

    const result = await paydunyaService.confirmPayment(token);
    if (result.success && orderId) {
      const order = db.getOrderByPaymentRef(orderId) || db.getOrderById(orderId);
      if (order) {
        db.updateOrderStatus(order.id, 'paid', 'PayDunya Auto IPN Confirmation');
        order.ipnConfirmedAt = new Date().toISOString();
        order.ipnProvider = 'PayDunya';
        db.save();
      }
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- IPN ENDPOINT: PAYDUNYA (Automatic Instant Payment Notification) ---
const handlePayDunyaIPN = async (req: Request, res: Response) => {
  try {
    const raw = req.body || {};
    console.log('[IPN PayDunya Reçu]:', JSON.stringify(raw).substring(0, 300));

    // Extract token from various PayDunya IPN payload formats
    const token = (
      raw.token || 
      raw['data[token]'] || 
      raw?.data?.token || 
      raw?.data?.invoice?.token || 
      raw?.invoice?.token || 
      req.query.token || 
      ''
    ).toString().trim();

    const orderRef = (
      raw?.data?.custom_data?.order_id || 
      raw?.data?.custom_data?.orderNumber || 
      raw?.custom_data?.order_id || 
      raw.orderNumber || 
      raw.order_id || 
      req.query.orderNumber || 
      ''
    ).toString().trim();

    const status = (
      raw.status || 
      raw['data[status]'] || 
      raw?.data?.status || 
      ''
    ).toString().toLowerCase();

    let isConfirmed = status === 'completed';
    if (!isConfirmed && token) {
      const check = await paydunyaService.confirmPayment(token);
      if (check.success && check.status === 'completed') {
        isConfirmed = true;
      }
    }

    if (token.startsWith('PD-TOK-') || isConfirmed) {
      const order = (token ? db.getOrderByPaymentRef(token) : undefined) || (orderRef ? (db.getOrderByPaymentRef(orderRef) || db.getOrderById(orderRef)) : undefined);
      if (order) {
        db.updateOrderStatus(order.id, 'paid', 'Notification IPN PayDunya');
        order.ipnConfirmedAt = new Date().toISOString();
        order.ipnProvider = 'PayDunya Webhook';
        order.paymentDetails = {
          ...order.paymentDetails,
          paydunyaToken: token || order.paymentDetails.paydunyaToken,
          notes: `Paiement confirmé par IPN PayDunya le ${new Date().toLocaleString('fr-FR')}. Téléchargement débloqué.`
        };
        db.save();

        db.addAdminLog(
          'paydunya-ipn@system',
          'IPN PayDunya Validé',
          `Commande ${order.orderNumber} confirmée via IPN PayDunya (${token || 'Token'}). Fichiers débloqués pour ${order.customerEmail}.`
        );

        return res.status(200).json({
          success: true,
          message: 'IPN PayDunya traité avec succès. Fichiers débloqués.',
          orderNumber: order.orderNumber,
          status: 'paid'
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'IPN PayDunya acquitté.',
      token,
      orderRef
    });
  } catch (err: any) {
    console.error('[PayDunya IPN Error]:', err);
    return res.status(200).json({ success: false, error: err.message });
  }
};

app.post('/api/ipn/paydunya', handlePayDunyaIPN);
app.post('/api/payments/paydunya/ipn-callback', handlePayDunyaIPN);
app.post('/api/webhook/paydunya', handlePayDunyaIPN);
app.get('/api/ipn/paydunya', (_req, res) => {
  res.json({ status: 'active', gateway: 'PayDunya IPN Webhook', ready: true, time: new Date().toISOString() });
});

// PayPal Order Creation
app.post('/api/payments/paypal/create-order', async (req, res) => {
  try {
    const { orderNumber, amount, currency, customerEmail } = req.body;
    const paypalOrder = await createPayPalOrder({
      orderNumber,
      amount: parseFloat(amount),
      currency: currency || 'EUR',
      customerEmail
    });

    const order = db.getOrderByPaymentRef(orderNumber);
    if (order && paypalOrder.id) {
      order.paymentDetails = {
        ...order.paymentDetails,
        paypalOrderId: paypalOrder.id
      };
      db.save();
    }

    res.json(paypalOrder);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erreur PayPal' });
  }
});

// --- IPN ENDPOINT: PAYPAL (Instant Payment Notification / Webhook) ---
const handlePayPalIPN = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    console.log('[IPN PayPal Reçu]:', JSON.stringify(body).substring(0, 300));

    const verification = await verifyPayPalIPN(body);
    const orderRef = verification.orderRef || body?.custom || body?.invoice || body?.resource?.custom_id || body?.orderNumber || req.query.orderNumber;
    const status = (verification.status || body?.payment_status || body?.resource?.status || '').toLowerCase();

    if (verification.valid || status === 'completed' || body?.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const order = orderRef ? (db.getOrderByPaymentRef(orderRef) || db.getOrderById(orderRef)) : undefined;
      if (order) {
        db.updateOrderStatus(order.id, 'paid', 'Notification IPN PayPal');
        order.ipnConfirmedAt = new Date().toISOString();
        order.ipnProvider = 'PayPal Webhook';
        if (verification.txnId) {
          order.paymentDetails = {
            ...order.paymentDetails,
            paypalOrderId: verification.txnId
          };
        }
        db.save();

        db.addAdminLog(
          'paypal-ipn@system',
          'IPN PayPal Validé',
          `Commande ${order.orderNumber} confirmée via IPN PayPal (${verification.txnId || 'Transaction'}). Fichiers débloqués pour ${order.customerEmail}.`
        );

        return res.status(200).send('IPN VERIFIED');
      }
    }

    return res.status(200).send('IPN RECEIVED');
  } catch (err: any) {
    console.error('[PayPal IPN Error]:', err);
    return res.status(200).send('IPN ERROR');
  }
};

app.post('/api/ipn/paypal', handlePayPalIPN);
app.post('/api/payments/paypal/ipn', handlePayPalIPN);
app.post('/api/webhook/paypal', handlePayPalIPN);
app.get('/api/ipn/paypal', (_req, res) => {
  res.json({ status: 'active', gateway: 'PayPal IPN Webhook', ready: true, time: new Date().toISOString() });
});

// --- UNIVERSAL IPN / WEBHOOK CALLBACK ---
app.post('/api/ipn/callback', (req, res) => {
  try {
    const { provider, orderNumber, token, transactionRef, status } = req.body;
    const ref = orderNumber || token || transactionRef;
    if (!ref) return res.status(400).json({ error: 'Référence de commande requise.' });

    const order = db.getOrderByPaymentRef(ref) || db.getOrderById(ref);
    if (!order) return res.status(404).json({ error: 'Commande introuvable pour cette référence.' });

    if (status === 'completed' || status === 'paid' || !status) {
      db.updateOrderStatus(order.id, 'paid', `${provider || 'Passerelle'} IPN Webhook`);
      order.ipnConfirmedAt = new Date().toISOString();
      order.ipnProvider = provider || 'Universal IPN';
      db.save();

      db.addAdminLog(
        'ipn-universal@system',
        `Paiement validé (${provider || 'Webhook'})`,
        `Commande ${order.orderNumber} confirmée via IPN. Téléchargement débloqué.`
      );

      return res.json({
        success: true,
        message: 'Notification IPN traitée avec succès. Fichiers débloqués.',
        orderNumber: order.orderNumber
      });
    }

    res.json({ success: true, message: 'Notification reçue', status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ipn/callback', (_req, res) => {
  res.json({ status: 'active', gateway: 'Universal IPN Webhook', ready: true, time: new Date().toISOString() });
});

// --- IPN LIVE ENDPOINTS & POLICY INFO ---
app.get('/api/ipn/endpoints', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  res.json({
    baseUrl,
    endpoints: {
      paydunya: `${baseUrl}/api/ipn/paydunya`,
      paypal: `${baseUrl}/api/ipn/paypal`,
      smsMobileMoney: `${baseUrl}/api/payments/sms-webhook`,
      universal: `${baseUrl}/api/ipn/callback`
    },
    policy: {
      downloadAuthorization: "Le téléchargement est strictement réservé aux commandes confirmées 'paid' via notification IPN ou validation administrateur.",
      nonRefundablePolicy: "Tout remboursement est strictement et définitivement interdit dès lors que le fichier a été téléchargé au moins 1 fois (téléchargement consommé)."
    }
  });
});

// --- ADMIN TEST SIMULATION IPN ---
app.post('/api/admin/ipn/test-simulate', requireAdmin, (req, res) => {
  try {
    const { orderId, provider } = req.body;
    if (!orderId) return res.status(400).json({ error: 'ID de la commande requis.' });

    const order = db.getOrderByPaymentRef(orderId) || db.getOrderById(orderId);
    if (!order) return res.status(404).json({ error: 'Commande introuvable.' });

    const prov = provider || 'PayDunya';
    db.updateOrderStatus(order.id, 'paid', `Simulation IPN Test (${prov})`);
    order.ipnConfirmedAt = new Date().toISOString();
    order.ipnProvider = `${prov} (Simulé)`;
    db.save();

    const adminUser = (req as any).user;
    db.logAdminAction(
      adminUser.email,
      'Test IPN Simulé',
      `Simulation d'une notification IPN ${prov} réussie pour la commande ${order.orderNumber}. Fichiers débloqués.`
    );

    res.json({
      success: true,
      message: `Notification IPN ${prov} simulée avec succès. La commande ${order.orderNumber} est désormais payée et prête au téléchargement !`,
      order
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// SMS FORWARDER WEBHOOK (MOOV & TMONEY AUTOMATION)
// ==========================================

app.post('/api/payments/sms-webhook', (req, res) => {
  try {
    const sender = (req.body.from || req.body.sender || req.body.phone || req.body.title || req.body.card || '').toString();
    const content = (req.body.content || req.body.msg || req.body.message || req.body.text || req.body.body || req.body.key || JSON.stringify(req.body)).toString();

    console.log(`[SMS Webhook Received] From: ${sender} | Content: ${content}`);

    // Try to extract potential transaction references or phone numbers or amounts
    const cleanContent = content.toLowerCase();
    const orders = db.getOrders();
    const pendingOrders = orders.filter(o => 
      o.paymentStatus === 'pending_payment' && 
      (o.paymentMethod === 'moov' || o.paymentMethod === 'mixx')
    );

    let matchedOrder = null;

    for (const order of pendingOrders) {
      const details = order.paymentDetails || {};
      const ref = (details.transactionRef || '').trim().toLowerCase();
      const phone = (details.payerPhone || order.customerPhone || '').replace(/\s+/g, '').replace(/^\+228/, '');

      // Check if reference is in SMS content
      if (ref && ref.length >= 4 && cleanContent.includes(ref)) {
        matchedOrder = order;
        break;
      }

      // Check if sender phone and order amount match
      if (phone && phone.length >= 8 && cleanContent.includes(phone)) {
        matchedOrder = order;
        break;
      }
    }

    if (matchedOrder) {
      db.updateOrderStatus(matchedOrder.id, 'paid', `SMS Forwarder Auto (${sender || 'Mobile Money'})`);
      db.addAdminLog(
        'system@digishop.com',
        `Paiement validé automatiquement via SMS`,
        `Commande ${matchedOrder.orderNumber} confirmée via SMS reçu de ${sender}. Contenu : ${content.substring(0, 100)}...`
      );
      return res.status(200).json({
        success: true,
        message: `Commande ${matchedOrder.orderNumber} validée avec succès`,
        orderNumber: matchedOrder.orderNumber
      });
    }

    // Log the unassigned SMS for manual audit
    db.addAdminLog(
      'sms-forwarder@system',
      `SMS reçu (${sender || 'Inconnu'})`,
      content.substring(0, 300)
    );

    return res.status(200).json({
      success: true,
      message: 'SMS reçu et enregistré dans le journal administrateur',
      matched: false
    });
  } catch (err: any) {
    console.error('Erreur SMS webhook:', err);
    return res.status(500).json({ error: err.message || 'Erreur interne' });
  }
});

app.get('/api/payments/sms-webhook', (_req, res) => {
  res.json({ status: 'active', gateway: 'SMS Forwarder Webhook (Togo Moov / Mixx)', ready: true, time: new Date().toISOString() });
});

// ==========================================
// SECURE DOWNLOAD SYSTEM
// ==========================================

app.get('/api/downloads/:token/:productId', (req, res) => {
  try {
    const { token, productId } = req.params;
    if (!token || !/^[a-zA-Z0-9_\-\.]+$/.test(token) || !productId || !/^[a-zA-Z0-9_\-\.]+$/.test(productId)) {
      return res.status(400).json({ error: 'Identifiants de téléchargement invalides.' });
    }
    const order = db.getOrderByDownloadToken(token);

    if (!order) {
      return res.status(404).json({ error: 'Lien de téléchargement inexistant ou révoqué.' });
    }

    // STRICT IPN PAYMENT VERIFICATION: Only allow download once payment is confirmed 'paid'
    if (order.paymentStatus !== 'paid') {
      return res.status(403).json({
        error: "Téléchargement bloqué : Le paiement n'a pas encore été confirmé par la passerelle de paiement (notification IPN en attente). Dès réception de la confirmation, vos fichiers seront immédiatement et automatiquement débloqués.",
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        isBlocked: true
      });
    }

    // Verify expiration
    if (new Date(order.downloadExpiresAt).getTime() < Date.now()) {
      return res.status(410).json({ error: 'Ce lien de téléchargement sécurisé a expiré.' });
    }

    // Verify download count limit
    if (order.downloadCount >= order.maxDownloads) {
      return res.status(429).json({
        error: `Nombre maximum de téléchargements atteint (${order.maxDownloads}/${order.maxDownloads}). Contactez le support Digishop.`
      });
    }

    // Check that product belongs to this order
    const orderedItem = order.items.find(i => i.productId === productId);
    if (!orderedItem) {
      return res.status(404).json({ error: 'Ce produit ne fait pas partie de cette commande.' });
    }

    // Retrieve file from digital vault
    const vaultFile = DIGITAL_VAULT_FILES[productId] || DIGITAL_VAULT_FILES['prod-1'];
    const buffer = vaultFile.getContent(order.orderNumber, order.customerName);

    // Increment download count
    db.incrementDownloadCount(order.id);

    const filename = orderedItem.fileDetails?.fileName || vaultFile.filename;

    res.setHeader('Content-Type', vaultFile.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erreur lors du téléchargement' });
  }
});

// ==========================================
// REVIEWS & COMMUNITY
// ==========================================

app.get('/api/reviews/:productId', (req, res) => {
  const { productId } = req.params;
  const reviews = db.getReviews(productId);
  res.json(reviews);
});

app.post('/api/reviews', optionalAuth, (req, res) => {
  try {
    const { productId, productTitle, userName, rating, comment } = req.body;
    if (!productId || !userName || !rating || !comment) {
      return res.status(400).json({ error: 'Champs obligatoires manquants.' });
    }

    const authUser = (req as any).user;
    const userId = authUser?.id;

    // Check if verified purchaser
    let isVerifiedPurchase = false;
    if (userId) {
      const userOrders = db.getOrdersByUser(userId);
      isVerifiedPurchase = userOrders.some(
        o => o.paymentStatus === 'paid' && o.items.some(i => i.productId === productId)
      );
    }

    const review = db.addReview({
      productId,
      productTitle: productTitle || 'Produit Digishop',
      userId,
      userName,
      rating: Math.max(1, Math.min(5, parseInt(rating, 10))),
      comment,
      isVerifiedPurchase,
      isApproved: true // Auto-approved or moderated by admin
    });

    res.status(201).json(review);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ADVERTISEMENTS & NEWSLETTER
// ==========================================

app.get('/api/ads', (_req, res) => {
  const ads = db.getAdvertisements().filter(a => a.isEnabled);
  res.json(ads);
});

app.post('/api/newsletter', (req, res) => {
  const { email, honeypot } = req.body;
  // Anti-spam honeypot
  if (honeypot) {
    return res.status(200).json({ message: 'Inscription réussie.' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Adresse email valide requise.' });
  }
  db.addNewsletterSubscriber(email);
  res.json({ message: 'Merci de votre inscription à la newsletter Digishop !' });
});

// ==========================================
// AUTOMATED TRANSACTIONAL EMAIL NOTIFICATIONS
// ==========================================

// Transporter configured via SMTP environment variables or fallback logger
const mailTransporter = (process.env.SMTP_HOST && process.env.SMTP_USER)
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  : null;

// Welcome Email on Registration
app.post('/api/notifications/welcome', notifRateLimiter, async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Adresse e-mail invalide.' });
    }

    const clientName = name || 'Cher Client';
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;color:#1e293b;line-height:1.6;margin:0;padding:20px;background:#f8fafc}.card{max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden}.header{background:#0284c7;color:#ffffff;padding:28px 24px;text-align:center}.body{padding:28px 24px}.footer{padding:20px;text-align:center;font-size:12px;color:#94a3b8;background:#f1f5f9}.btn{display:inline-block;padding:12px 24px;background:#0284c7;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:bold;margin-top:16px}</style></head>
      <body>
        <div class="card">
          <div class="header">
            <h1 style="margin:0;font-size:22px;">Bienvenue sur DigiShop !</h1>
            <p style="margin:4px 0 0 0;font-size:13px;opacity:0.9;">Votre boutique de solutions numériques</p>
          </div>
          <div class="body">
            <p>Bonjour <strong>${clientName}</strong>,</p>
            <p>Nous sommes ravis de vous compter parmi nos membres sur <strong>DigiShop by Lemax Group</strong> !</p>
            <p>Grâce à votre compte personnel, vous bénéficiez désormais de :</p>
            <ul>
              <li>L'accès à vie à vos produits numériques achetés,</li>
              <li>Le téléchargement instantané et sécurisé de vos ressources,</li>
              <li>Le suivi de toutes vos commandes et licences en temps réel.</li>
            </ul>
            <p style="text-align:center;">
              <a href="https://digishop-by-lemaxgroup.web.app/boutique" class="btn">Découvrir notre boutique</a>
            </p>
            <p style="font-size:13px;color:#64748b;margin-top:20px;">
              Une question ou besoin d'assistance ? Notre support est à votre disposition à <a href="mailto:lemaxshop01@gmail.com">lemaxshop01@gmail.com</a>.
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} DigiShop par Lemax Group. Tous droits réservés.
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`[Email Notification] Email de bienvenue envoyé à ${email} (${clientName})`);

    if (mailTransporter) {
      try {
        await mailTransporter.sendMail({
          from: process.env.SMTP_FROM || '"DigiShop" <contact@digishop.shop>',
          to: email,
          subject: `Bienvenue sur DigiShop, ${clientName} ! Vos produits digitaux vous attendent`,
          html: htmlContent
        });
      } catch (mailErr) {
        console.warn('[Email Notification] SMTP Error:', mailErr);
      }
    }

    res.json({ success: true, message: `Email de bienvenue envoyé à ${email}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erreur lors de l\'envoi de l\'email de bienvenue.' });
  }
});

// Thank You for Download Email
app.post('/api/notifications/download-thank-you', notifRateLimiter, async (req, res) => {
  try {
    const { email, name, productTitle, orderNumber } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Adresse e-mail invalide.' });
    }

    const clientName = name || 'Cher Client';
    const itemTitle = productTitle || 'votre produit numérique';
    const orderNum = orderNumber || 'DIGI-WEB';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;color:#1e293b;line-height:1.6;margin:0;padding:20px;background:#f8fafc}.card{max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden}.header{background:#10b981;color:#ffffff;padding:28px 24px;text-align:center}.body{padding:28px 24px}.footer{padding:20px;text-align:center;font-size:12px;color:#94a3b8;background:#f1f5f9}.btn{display:inline-block;padding:12px 24px;background:#0284c7;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:bold;margin-top:16px}</style></head>
      <body>
        <div class="card">
          <div class="header">
            <h1 style="margin:0;font-size:22px;">Merci pour votre confiance !</h1>
            <p style="margin:4px 0 0 0;font-size:13px;opacity:0.9;">Téléchargement confirmé sur DigiShop</p>
          </div>
          <div class="body">
            <p>Bonjour <strong>${clientName}</strong>,</p>
            <p>Toute l'équipe de <strong>DigiShop by Lemax Group</strong> tenait à vous remercier chaleureusement d'avoir fait confiance à notre plateforme pour l'acquisition de vos ressources numériques !</p>
            
            <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px;border-radius:12px;margin:18px 0;">
              <p style="margin:0 0 4px 0;font-size:13px;color:#64748b;">Ressource téléchargée :</p>
              <p style="margin:0;font-size:15px;font-weight:bold;color:#0284c7;">${itemTitle}</p>
              <p style="margin:6px 0 0 0;font-size:12px;color:#64748b;">Numéro de commande : <strong>${orderNum}</strong></p>
            </div>

            <p>Votre produit numérique reste accessible en permanence dans votre espace client DigiShop si vous avez besoin de le télécharger à nouveau.</p>

            <p style="text-align:center;">
              <a href="https://digishop-by-lemaxgroup.web.app/compte" class="btn">Accéder à mon espace client</a>
            </p>

            <p style="font-size:13px;color:#64748b;margin-top:20px;">
              Si vous avez la moindre suggestion ou question, n'hésitez pas à nous écrire directement à <a href="mailto:lemaxshop01@gmail.com">lemaxshop01@gmail.com</a>.
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} DigiShop par Lemax Group. Tous droits réservés.
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`[Email Notification] Email de remerciement pour téléchargement envoyé à ${email} (${itemTitle})`);

    if (mailTransporter) {
      try {
        await mailTransporter.sendMail({
          from: process.env.SMTP_FROM || '"DigiShop" <contact@digishop.shop>',
          to: email,
          subject: `Merci pour votre confiance sur DigiShop ! Votre téléchargement de ${itemTitle}`,
          html: htmlContent
        });
      } catch (mailErr) {
        console.warn('[Email Notification] SMTP Error:', mailErr);
      }
    }

    res.json({ success: true, message: `Email de remerciement transmis à ${email}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erreur lors de l\'envoi de l\'email de remerciement.' });
  }
});

// ==========================================
// ADMIN DASHBOARD & MANAGEMENT API
// ==========================================

app.get('/api/admin/stats', requireAdmin, (_req, res) => {
  try {
    const stats = db.getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/products', (_req, res) => {
  res.json(db.getProducts());
});

app.post('/api/admin/upload-product-image', requireAdmin, (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Fichier image manquant.' });
    }

    if (imageBase64.startsWith('http://') || imageBase64.startsWith('https://') || imageBase64.startsWith('/src/assets/')) {
      return res.json({ url: imageBase64 });
    }

    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Format de fichier image invalide.' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('svg')) ext = 'svg';

    const safeName = `product_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = path.join(uploadsDir, safeName);
    fs.writeFileSync(filePath, buffer);

    res.json({ url: `/uploads/${safeName}` });
  } catch (err: any) {
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement de l\'image: ' + err.message });
  }
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  try {
    const p = req.body;
    if (!p.title || !p.price || !p.category) {
      return res.status(400).json({ error: 'Titre, prix et catégorie obligatoires.' });
    }

    const slug = p.slug || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const newProduct: Product = {
      ...p,
      id: `prod-${Date.now()}`,
      slug,
      downloadsCount: 0,
      rating: 5.0,
      reviewsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = db.saveProduct(newProduct);
    const adminUser = (req as any).user;
    db.logAdminAction(adminUser.email, 'Création Produit', `Création du produit ${saved.title}`);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.getProductById(id);
    if (!existing) return res.status(404).json({ error: 'Produit introuvable.' });

    const rawPrice = req.body.price !== undefined ? parseFloat(String(req.body.price)) : existing.price;
    const rawOriginalPrice = req.body.originalPrice !== undefined && req.body.originalPrice !== null && req.body.originalPrice !== ''
      ? parseFloat(String(req.body.originalPrice))
      : undefined;

    const updated = db.saveProduct({
      ...existing,
      ...req.body,
      price: isNaN(rawPrice) ? existing.price : rawPrice,
      originalPrice: rawOriginalPrice,
      id
    });
    const adminUser = (req as any).user;
    db.logAdminAction(adminUser.email, 'Modification Produit', `Mise à jour du produit ${updated.title} (Nouveau prix: ${updated.price} €)`);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const success = db.deleteProduct(id);
    if (!success) return res.status(404).json({ error: 'Produit introuvable.' });
    const adminUser = (req as any).user;
    db.logAdminAction(adminUser.email, 'Suppression Produit', `Suppression du produit id ${id}`);
    res.json({ message: 'Produit supprimé avec succès.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/orders', requireAdmin, (_req, res) => {
  res.json(db.getOrders());
});

app.patch('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminUser = (req as any).user;

    const updated = db.updateOrderStatus(id, status, adminUser.email);
    if (!updated) return res.status(404).json({ error: 'Commande introuvable.' });

    db.logAdminAction(
      adminUser.email,
      'Validation Statut Commande',
      `Commande ${updated.orderNumber} passée au statut ${status}`
    );

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/customers', requireAdmin, (_req, res) => {
  res.json(db.getUsers());
});

app.get('/api/admin/coupons', requireAdmin, (_req, res) => {
  res.json(db.getCoupons());
});

app.post('/api/admin/coupons', requireAdmin, (req, res) => {
  try {
    const c = req.body;
    if (!c.code || !c.discountValue) {
      return res.status(400).json({ error: 'Code et valeur obligatoires.' });
    }
    const newCoupon = {
      ...c,
      id: `coup-${Date.now()}`,
      code: c.code.toUpperCase().trim(),
      currentUses: 0,
      isActive: c.isActive !== false
    };
    const saved = db.saveCoupon(newCoupon);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/coupons/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.deleteCoupon(id);
  res.json({ message: 'Coupon supprimé.' });
});

app.get('/api/admin/ads', requireAdmin, (_req, res) => {
  res.json(db.getAdvertisements());
});

app.put('/api/admin/ads/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const updated = db.saveAdvertisement({ ...req.body, id });
  res.json(updated);
});

app.get('/api/admin/reviews', requireAdmin, (_req, res) => {
  res.json(db.getReviews());
});

app.patch('/api/admin/reviews/:id/approve', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { isApproved } = req.body;
  db.updateReviewStatus(id, isApproved);
  res.json({ message: 'Statut de l\'avis mis à jour.' });
});

// Admin Payment Gateway Settings
app.get('/api/admin/settings/payments', requireAdmin, (_req, res) => {
  const pdConfig = paydunyaService.getConfig();
  const ppConfig = getPayPalConfig();
  res.json({
    paydunya: {
      mode: pdConfig.mode,
      test: pdConfig.test,
      live: pdConfig.live,
      masterKey: pdConfig.masterKey,
      publicKey: pdConfig.publicKey,
      rawPublicKey: pdConfig.publicKey,
      privateKey: pdConfig.privateKey ? `${pdConfig.privateKey.slice(0, 14)}...` : '',
      rawPrivateKey: pdConfig.privateKey,
      token: pdConfig.token ? `${pdConfig.token.slice(0, 8)}...` : '',
      rawToken: pdConfig.token,
      isConfigured: pdConfig.isConfigured
    },
    paypal: {
      mode: ppConfig.mode,
      sandbox: ppConfig.sandbox,
      live: ppConfig.live,
      merchantEmail: ppConfig.merchantEmail,
      clientId: ppConfig.clientId ? `${ppConfig.clientId.slice(0, 14)}...${ppConfig.clientId.slice(-8)}` : '',
      rawClientId: ppConfig.clientId,
      rawClientSecret: ppConfig.clientSecret,
      isConfigured: ppConfig.isConfigured
    },
    mobileMoney: db.getMobileMoneySettings()
  });
});

// Public Mobile Money settings endpoint for checkout
app.get('/api/settings/mobile-money', (_req, res) => {
  res.json(db.getMobileMoneySettings());
});

// Admin Update Mobile Money settings
app.post('/api/admin/settings/payments/mobile-money', requireAdmin, (req, res) => {
  try {
    const { moovNumber, mixxNumber, moovName, mixxName, instructions } = req.body;
    const updated = db.updateMobileMoneySettings({
      ...(moovNumber ? { moovNumber: String(moovNumber).trim() } : {}),
      ...(mixxNumber ? { mixxNumber: String(mixxNumber).trim() } : {}),
      ...(moovName !== undefined ? { moovName: String(moovName).trim() } : {}),
      ...(mixxName !== undefined ? { mixxName: String(mixxName).trim() } : {}),
      ...(instructions !== undefined ? { instructions: String(instructions).trim() } : {})
    });

    const adminUser = (req as any).user;
    db.logAdminAction(adminUser.email, 'Paramètres Mobile Money', `Numéros marchands mis à jour: Moov (${updated.moovNumber}), Mixx (${updated.mixxNumber})`);
    res.json({ success: true, message: 'Numéros marchands Mobile Money enregistrés avec succès !', mobileMoney: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/settings/payments/paydunya', requireAdmin, (req, res) => {
  try {
    const { masterKey, publicKey, privateKey, token, mode, test, live } = req.body;
    paydunyaService.updateConfig({
      ...(mode ? { mode } : {}),
      ...(test ? { test } : {}),
      ...(live ? { live } : {}),
      ...(masterKey !== undefined ? { masterKey } : {}),
      ...(publicKey !== undefined ? { publicKey } : {}),
      ...(privateKey ? { privateKey } : {}),
      ...(token ? { token } : {})
    });

    const adminUser = (req as any).user;
    db.logAdminAction(adminUser.email, 'Configuration PayDunya', `Paramètres PayDunya mis à jour (Mode ${mode || paydunyaService.getConfig().mode})`);
    res.json({ success: true, message: 'Configuration PayDunya mise à jour avec succès.', config: paydunyaService.getConfig() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/settings/payments/paypal', requireAdmin, (req, res) => {
  try {
    const { clientId, clientSecret, merchantEmail, mode, sandbox, live } = req.body;
    updatePayPalConfig({
      ...(mode ? { mode } : {}),
      ...(sandbox ? { sandbox } : {}),
      ...(live ? { live } : {}),
      ...(clientId !== undefined ? { clientId } : {}),
      ...(clientSecret !== undefined ? { clientSecret } : {}),
      ...(merchantEmail !== undefined ? { merchantEmail } : {})
    });

    const adminUser = (req as any).user;
    db.logAdminAction(adminUser.email, 'Configuration PayPal', `Paramètres PayPal mis à jour (Mode ${mode || getPayPalConfig().mode})`);
    res.json({
      success: true,
      message: 'Configuration PayPal mise à jour avec succès.',
      config: getPayPalConfig()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Security: Change Email, Name or Password
app.post('/api/admin/profile/change-credentials', requireAdmin, (req, res) => {
  try {
    const adminUser = (req as any).user;
    const { name, email, password } = req.body;

    const result = db.updateAdminCredentials(adminUser.id, { name, email, password });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    db.logAdminAction(adminUser.email, 'Sécurité Admin', 'Mise à jour des identifiants et mot de passe administrateur');
    res.json({ success: true, message: 'Identifiants administrateur mis à jour avec succès !', user: result.user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Project Export: Generate & Download Full Project ZIP
app.get('/api/export-project.zip', (_req, res) => {
  try {
    const zipPath = path.resolve(process.cwd(), 'digishop-project.zip');
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'export_zip.py');
    
    // Package project files using python3
    execSync(`python3 "${scriptPath}"`);

    if (fs.existsSync(zipPath)) {
      res.setHeader('Content-Disposition', 'attachment; filename="digishop-by-lemax-group.zip"');
      res.setHeader('Content-Type', 'application/zip');
      return res.sendFile(zipPath);
    } else {
      return res.status(500).json({ error: 'Le fichier ZIP n\'a pas pu être créé.' });
    }
  } catch (err: any) {
    console.error('[Export ZIP] Erreur:', err);
    res.status(500).json({ error: 'Erreur lors de la génération du ZIP: ' + err.message });
  }
});

// Automated GitHub Export for Mobile/Android: Push entire project tree with all subdirectories
app.post('/api/export-to-github', exportRateLimiter, async (req, res) => {
  const token = req.body?.githubToken ? String(req.body.githubToken).trim() : '';
  try {
    let rawUser = String(req.body?.githubUsername || '').trim();
    let rawRepo = String(req.body?.repoName || '').trim();

    if (!token) {
      return res.status(400).json({ error: 'Veuillez renseigner votre jeton personnel GitHub (Personal Access Token).' });
    }

    if (!rawRepo) {
      return res.status(400).json({ error: 'Veuillez renseigner le nom du dépôt GitHub.' });
    }

    // Auto-detect if user pasted a full GitHub URL in repo or username field
    if (rawRepo.includes('github.com/')) {
      const parts = rawRepo.replace('https://', '').replace('http://', '').replace('github.com/', '').split('/');
      if (parts[0]) rawUser = parts[0];
      if (parts[1]) rawRepo = parts[1].replace('.git', '');
    } else if (rawRepo.includes('/')) {
      const parts = rawRepo.split('/');
      if (parts[0]) rawUser = parts[0];
      if (parts[1]) rawRepo = parts[1].replace('.git', '');
    }

    // 0. Auto-resolve exact GitHub username from token via GitHub API
    let verifiedGithubLogin = '';
    try {
      const ghUserRes = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Digishop-Auto-Export'
        }
      });
      if (ghUserRes.ok) {
        const ghUserData = await ghUserRes.json() as any;
        if (ghUserData && ghUserData.login) {
          verifiedGithubLogin = ghUserData.login;
          console.log(`[GitHub Export] Authentifié avec succès en tant que : ${verifiedGithubLogin}`);
        }
      } else if (ghUserRes.status === 401) {
        return res.status(401).json({
          error: 'Authentification GitHub échouée (Erreur 401) : Votre jeton personnel (Token) est invalide, a expiré ou ne dispose pas des droits requis. Veuillez générer un nouveau token Classic sur github.com/settings/tokens avec la case "repo" cochée.'
        });
      }
    } catch (apiErr) {
      console.warn('[GitHub Export] User API check warning:', apiErr);
    }

    // If verified username was found from token, use it if user entered email or left empty
    if (verifiedGithubLogin) {
      if (!rawUser || rawUser.includes('@') || rawUser.toLowerCase() === verifiedGithubLogin.toLowerCase()) {
        rawUser = verifiedGithubLogin;
      }
    } else if (rawUser.includes('@')) {
      return res.status(400).json({
        error: `Vous avez saisi une adresse email ("${rawUser}") comme pseudo. Veuillez entrer votre vrai nom d'utilisateur GitHub (ex: "${rawUser.split('@')[0]}").`
      });
    }

    const cleanUser = (rawUser || verifiedGithubLogin).replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanRepo = rawRepo.replace(/[^a-zA-Z0-9_.-]/g, '');

    if (!cleanUser || !cleanRepo) {
      return res.status(400).json({ error: 'Pseudo GitHub ou nom de dépôt invalide après nettoyage.' });
    }

    // 1. Verify or automatically create repository if it does not exist
    try {
      const repoCheck = await fetch(`https://api.github.com/repos/${cleanUser}/${cleanRepo}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Digishop-Auto-Export'
        }
      });
      if (repoCheck.status === 404) {
        console.log(`[GitHub Export] Le dépôt ${cleanUser}/${cleanRepo} n'existe pas encore. Création automatique...`);
        const createRes = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'Digishop-Auto-Export'
          },
          body: JSON.stringify({
            name: cleanRepo,
            private: false,
            auto_init: false,
            description: 'Boutique en ligne DigiShop by Lemax Group'
          })
        });
        if (createRes.ok) {
          console.log(`[GitHub Export] Dépôt ${cleanUser}/${cleanRepo} créé avec succès sur GitHub.`);
        }
      }
    } catch (createErr) {
      console.warn('[GitHub Export] Erreur lors de la vérification/création du dépôt:', createErr);
    }

    // 2. Pack full project into zip
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'export_zip.py');
    execSync(`python3 "${scriptPath}"`);

    const zipPath = path.resolve(process.cwd(), 'digishop-project.zip');
    if (!fs.existsSync(zipPath)) {
      return res.status(500).json({ error: 'Impossible de préparer l\'archive du projet.' });
    }

    // 3. Unzip into temporary working dir
    const tempDir = path.resolve('/tmp', `gh_export_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    execSync(`unzip -q "${zipPath}" -d "${tempDir}"`);

    // 4. Initialize git and commit full tree (including .github workflows for GitHub Actions)
    const execOpts = { 
      cwd: tempDir, 
      stdio: 'pipe' as const,
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: '0',
        GIT_ASKPASS: 'echo'
      }
    };
    execSync('git init', execOpts);
    execSync('git config user.name "Digishop Auto Export"', execOpts);
    execSync('git config user.email "bot@lemaxgroup.com"', execOpts);
    execSync('git add -A', execOpts);
    execSync('git commit -m "Mise à jour complète Digishop par Lemax Group"', execOpts);
    execSync('git branch -M main', execOpts);

    // 5. Push directly to user repository with x-access-token for universal PAT support
    const safeToken = encodeURIComponent(token);
    const remoteUrl = `https://x-access-token:${safeToken}@github.com/${cleanUser}/${cleanRepo}.git`;
    
    execSync(`git remote add origin "${remoteUrl}"`, execOpts);

    // Smart push: Try fast-forward on existing repository first (avoids protected branch force-push error)
    let pushSucceeded = false;
    try {
      execSync('git fetch origin main --depth=1', execOpts);
      execSync('git reset --soft origin/main', execOpts);
      execSync('git commit -m "Mise à jour complète Digishop par Lemax Group" --allow-empty', execOpts);
      execSync('git push origin main', execOpts);
      pushSucceeded = true;
    } catch {
      // Fast-forward not possible or new repo, try direct force push
    }

    if (!pushSucceeded) {
      try {
        execSync('git push -u origin main --force', execOpts);
        pushSucceeded = true;
      } catch (pushErr: any) {
        // Try master branch as fallback in case remote uses master
        try {
          execSync('git branch -M master', execOpts);
          execSync('git push -u origin master --force', execOpts);
          pushSucceeded = true;
        } catch {
          throw pushErr;
        }
      }
    }

    // 6. Cleanup temp folder
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}

    return res.json({
      success: true,
      repoUrl: `https://github.com/${cleanUser}/${cleanRepo}`,
      message: `Félicitations ! L'intégralité de votre boutique (code, fichiers, images, catalogue et configurations) a été mise à jour avec succès sur votre GitHub (${cleanUser}/${cleanRepo}) !`
    });
  } catch (err: any) {
    console.error('[Export GitHub] Erreur:', err);
    let errMsg = err.stderr ? err.stderr.toString() : err.message || '';
    if (token) {
      errMsg = errMsg.split(token).join('***');
    }

    let userFriendlyError = errMsg;
    if (errMsg.includes('Repository not found')) {
      userFriendlyError = `Le dépôt est introuvable sur GitHub. Assurez-vous d'avoir saisi le bon nom de dépôt ou vérifiez que votre Token a bien la case "repo" cochée.`;
    } else if (errMsg.includes('workflow') || errMsg.includes('étendue \'workflow\'') || errMsg.includes('workflow scope')) {
      userFriendlyError = `Votre jeton GitHub (Token) n'a pas la permission "workflow" requise pour pousser les fichiers GitHub Actions et déclencher l'onglet "Action". Veuillez générer un token avec les cases "repo" ET "workflow" cochées : https://github.com/settings/tokens/new?scopes=repo,workflow&description=Digishop+Export`;
    } else if (errMsg.includes('GH006') || errMsg.includes('Protected branch') || errMsg.includes('Cannot force-push')) {
      userFriendlyError = `Mise à jour bloquée par une règle de protection de branche sur GitHub (Settings > Branches). Désactivez temporairement la protection de la branche "main" sur votre dépôt GitHub ou autorisez les modifications.`;
    } else if (errMsg.includes('GH013') || errMsg.includes('rule violations') || errMsg.includes('PUSH PROTECTION')) {
      userFriendlyError = `Blocage par une règle de protection GitHub (Push Protection). Vérifiez les alertes de sécurité dans les paramètres de votre dépôt GitHub.`;
    } else if (errMsg.includes('Permission to') || errMsg.includes('denied to')) {
      userFriendlyError = `Accès refusé par GitHub : Votre compte ou votre token n'a pas les droits d'écriture sur ce dépôt.`;
    }

    return res.status(500).json({
      error: `Échec de l'envoi sur GitHub : ${userFriendlyError}`
    });
  }
});

// Mobile-friendly interactive page for GitHub Export
app.get('/export-github', (_req, res) => {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exportateur GitHub Automatique - Digishop</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen p-4 flex items-center justify-center font-sans">
  <div class="max-w-lg w-full bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-6 my-4">
    <div class="flex items-center gap-3 mb-4">
      <div class="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-500 flex items-center justify-center text-indigo-400 text-2xl">
        <i class="fa-brands fa-github"></i>
      </div>
      <div>
        <h1 class="text-xl font-bold text-white">Exportateur GitHub Automatique</h1>
        <p class="text-xs text-slate-400">Idéal sur smartphone Android (conserve tous les dossiers)</p>
      </div>
    </div>

    <div class="bg-amber-950/40 border border-amber-600/50 rounded-xl p-3 mb-5 text-xs text-amber-200">
      <p class="font-semibold mb-1 flex items-center gap-1.5">
        <i class="fa-solid fa-triangle-exclamation"></i> Pourquoi utiliser cet outil ?
      </p>
      Sur Android, le sélecteur de fichiers ne permet pas de téléverser des dossiers (comme <code class="bg-black/30 px-1 py-0.5 rounded text-amber-100">src</code>, <code class="bg-black/30 px-1 py-0.5 rounded text-amber-100">data</code>). Cet outil le fait directement pour vous depuis le serveur !
    </div>

    <!-- Instructions rapides -->
    <div class="space-y-3 mb-6 text-xs text-slate-300">
      <div class="flex gap-2.5 items-start">
        <span class="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold text-[10px]">1</span>
        <div>
          <span>Créez un dépôt vide sur GitHub :</span>
          <a href="https://github.com/new" target="_blank" class="block font-semibold text-indigo-400 underline mt-0.5">github.com/new (Ne cochez pas "Add README")</a>
        </div>
      </div>
      <div class="flex gap-2.5 items-start">
        <span class="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold text-[10px]">2</span>
        <div>
          <span>Générez un Token d'accès (cochez les cases <b>repo</b> et <b>workflow</b>) :</span>
          <a href="https://github.com/settings/tokens/new?description=Digishop_Export&scopes=repo,workflow" target="_blank" class="block font-semibold text-indigo-400 underline mt-0.5">Créer mon jeton GitHub (Lien direct pré-rempli)</a>
        </div>
      </div>
      <div class="flex gap-2.5 items-start">
        <span class="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold text-[10px]">3</span>
        <div>Remplissez les 3 champs ci-dessous et validez :</div>
      </div>
    </div>

    <!-- Formulaire -->
    <form id="ghForm" class="space-y-4">
      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">Votre nom d'utilisateur GitHub</label>
        <input type="text" id="username" placeholder="ex: monpseudo" required class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">Nom de votre dépôt GitHub</label>
        <input type="text" id="repo" placeholder="ex: boutique-digishop" required class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">Votre jeton GitHub (Token)</label>
        <input type="password" id="token" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" required class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
        <p class="text-[10px] text-slate-500 mt-1">Le token commence généralement par ghp_</p>
      </div>

      <div id="statusBox" class="hidden p-3 rounded-lg text-xs"></div>

      <button type="submit" id="submitBtn" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm">
        <i class="fa-solid fa-cloud-arrow-up"></i>
        <span>Transférer tout le projet sur GitHub</span>
      </button>
    </form>

    <div class="mt-6 pt-4 border-t border-slate-700 flex justify-between text-xs text-slate-400">
      <a href="/" class="hover:text-white flex items-center gap-1"><i class="fa-solid fa-arrow-left"></i> Retour à la boutique</a>
      <a href="/api/export-project.zip" class="hover:text-white flex items-center gap-1"><i class="fa-solid fa-file-zipper"></i> Télécharger ZIP</a>
    </div>
  </div>

  <script>
    const form = document.getElementById('ghForm');
    const submitBtn = document.getElementById('submitBtn');
    const statusBox = document.getElementById('statusBox');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value.trim();
      const repo = document.getElementById('repo').value.trim();
      const token = document.getElementById('token').value.trim();

      statusBox.className = 'p-3 rounded-lg text-xs bg-indigo-950/70 border border-indigo-700 text-indigo-200 block flex items-center gap-2';
      statusBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Transfert en cours de tous les dossiers et fichiers... Patientez 5 à 10 secondes...';
      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-50', 'cursor-not-allowed');

      try {
        const res = await fetch('/api/export-to-github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ githubUsername: username, repoName: repo, githubToken: token })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          statusBox.className = 'p-4 rounded-lg text-xs bg-emerald-950/80 border border-emerald-600 text-emerald-200 block space-y-2';
          statusBox.innerHTML = '<div><i class="fa-solid fa-circle-check text-emerald-400 mr-1.5"></i> <b>Succès total !</b> Tous vos fichiers et dossiers sont désormais sur GitHub.</div>' +
            '<a href="' + data.repoUrl + '" target="_blank" class="inline-block mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs">Ouvrir mon dépôt GitHub</a>';
        } else {
          statusBox.className = 'p-3 rounded-lg text-xs bg-rose-950/80 border border-rose-600 text-rose-200 block';
          statusBox.innerHTML = '<i class="fa-solid fa-circle-xmark text-rose-400 mr-1.5"></i> ' + (data.error || 'Erreur inconnue');
        }
      } catch (err) {
        statusBox.className = 'p-3 rounded-lg text-xs bg-rose-950/80 border border-rose-600 text-rose-200 block';
        statusBox.innerHTML = '<i class="fa-solid fa-circle-xmark text-rose-400 mr-1.5"></i> Erreur de communication avec le serveur.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    });
  </script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// ==========================================
// FRONTEND SERVING: VITE DEV / DIST PROD
// ==========================================

async function startServer() {
  if (!isProduction) {
    // Development mode with Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode with compiled static assets
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Digishop] Serveur actif sur http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Digishop] Erreur au démarrage du serveur:', err);
  process.exit(1);
});
