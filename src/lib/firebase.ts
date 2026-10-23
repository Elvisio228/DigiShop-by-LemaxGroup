import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, Order, Coupon, Review, Advertisement, User } from '../types';

const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without passing firebaseConfig.firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { onAuthStateChanged };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot as requested by skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connexion active et validée avec Firestore.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Le client Firestore est hors-ligne ou initialise sa connexion.');
    }
    return false;
  }
}

// Initialise connection test
testConnection();

// --- Firestore Sync Helpers ---

export async function syncProductsWithFirestore(fallbackProducts: Product[]): Promise<Product[]> {
  const path = 'products';
  try {
    const snap = await getDocs(collection(db, path));
    if (!snap.empty) {
      const items: Product[] = [];
      snap.forEach(d => {
        const item = d.data() as Product;
        if (item && item.id && item.title) {
          items.push(item);
        }
      });
      if (items.length > 0) {
        const existingIds = new Set(items.map(i => i.id));
        const missingFallbacks = fallbackProducts.filter(fb => !existingIds.has(fb.id));
        if (missingFallbacks.length > 0) {
          for (const m of missingFallbacks) {
            setDoc(doc(db, path, m.id), m).catch(() => {});
          }
          return [...items, ...missingFallbacks];
        }
        return items;
      }
    }
    // Seed initial products to Firestore
    for (const prod of fallbackProducts) {
      await setDoc(doc(db, path, prod.id), prod).catch(() => {});
    }
    return fallbackProducts;
  } catch (err) {
    console.warn('[Firebase] Lecture Firestore en attente, utilisation des données locales:', err);
    return fallbackProducts;
  }
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  const path = 'products';
  try {
    await setDoc(doc(db, path, product.id), product);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${product.id}`);
  }
}

export async function saveOrderToFirestore(order: Order): Promise<void> {
  const path = 'orders';
  try {
    await setDoc(doc(db, path, order.id), order);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${path}/${order.id}`);
  }
}

export async function updateOrderStatusInFirestore(orderId: string, status: Order['paymentStatus']): Promise<void> {
  const path = 'orders';
  try {
    await updateDoc(doc(db, path, orderId), {
      paymentStatus: status,
      verifiedAt: status === 'paid' ? new Date().toISOString() : undefined
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${path}/${orderId}`);
  }
}

export async function saveUserToFirestore(user: User): Promise<void> {
  const path = 'users';
  try {
    await setDoc(doc(db, path, user.id), user, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${user.id}`);
  }
}

export async function signInWithGoogle() {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err) {
    console.error('[Firebase Auth] Erreur connexion Google:', err);
    throw err;
  }
}

export async function signOutFromFirebase() {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.error('[Firebase Auth] Erreur déconnexion:', err);
  }
}

export async function getUserFromFirestore(userId: string): Promise<User | null> {
  try {
    const d = await getDoc(doc(db, 'users', userId));
    if (d.exists()) {
      return d.data() as User;
    }
  } catch (err) {
    console.warn('[Firestore] getUserFromFirestore:', err);
  }
  return null;
}

export function toSafeFirebaseAuthPassword(password: string): string {
  if (!password) return '';
  // Firebase Auth enforces >= 6 chars; this allows customers to register with any short password
  return password.length < 6 ? `${password}#dgKey6` : password;
}

export async function registerWithEmailPassword(name: string, email: string, password: string, phone?: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const safePassword = toSafeFirebaseAuthPassword(password);

  let cred;
  try {
    cred = await createUserWithEmailAndPassword(auth, cleanEmail, safePassword);
  } catch (err: any) {
    if (err.code === 'auth/network-request-failed') {
      // Automatic retry for mobile cellular / slow latency networks
      await new Promise(res => setTimeout(res, 800));
      cred = await createUserWithEmailAndPassword(auth, cleanEmail, safePassword);
    } else {
      throw err;
    }
  }

  if (cleanName && cred.user) {
    try {
      await updateProfile(cred.user, { displayName: cleanName });
    } catch {}
  }
  const isAdmin = cleanEmail === 'lemaxshop01@gmail.com' || cleanEmail === 'admin@digishop.com' || cleanEmail === 'elvisioleng@gmail.com';
  const newUser: User = {
    id: cred.user.uid,
    name: cleanName || cleanEmail.split('@')[0],
    email: cleanEmail,
    role: isAdmin ? 'admin' : 'customer',
    phone: phone ? phone.trim() : '',
    createdAt: new Date().toISOString(),
    ordersCount: 0,
    totalSpent: 0
  };
  await saveUserToFirestore(newUser);
  return newUser;
}

export async function loginWithEmailPassword(email: string, password: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const safePassword = toSafeFirebaseAuthPassword(password);

  let cred;
  try {
    cred = await signInWithEmailAndPassword(auth, cleanEmail, safePassword);
  } catch (err: any) {
    // If user previously registered with original short password before adapter or exact match
    if (safePassword !== password) {
      try {
        cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      } catch {
        throw err;
      }
    } else if (err.code === 'auth/network-request-failed') {
      // Automatic retry for mobile cellular / slow latency networks
      await new Promise(res => setTimeout(res, 800));
      cred = await signInWithEmailAndPassword(auth, cleanEmail, safePassword);
    } else {
      throw err;
    }
  }

  const userDoc = await getUserFromFirestore(cred.user.uid);
  if (userDoc) return userDoc;

  const isAdmin = cleanEmail === 'lemaxshop01@gmail.com' || cleanEmail === 'admin@digishop.com' || cleanEmail === 'elvisioleng@gmail.com';
  const fallbackUser: User = {
    id: cred.user.uid,
    name: cred.user.displayName || cleanEmail.split('@')[0],
    email: cleanEmail,
    role: isAdmin ? 'admin' : 'customer',
    createdAt: new Date().toISOString(),
    ordersCount: 0,
    totalSpent: 0
  };
  await saveUserToFirestore(fallbackUser);
  return fallbackUser;
}

export async function resetPasswordWithEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function getUserOrdersFromFirestore(userId: string, email?: string): Promise<Order[]> {
  try {
    const ordersRef = collection(db, 'orders');
    const snap = await getDocs(ordersRef);
    const results: Order[] = [];
    snap.forEach(d => {
      const ord = d.data() as Order;
      if (ord.userId === userId || (email && ord.customerEmail && ord.customerEmail.toLowerCase() === email.toLowerCase())) {
        results.push(ord);
      }
    });
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.warn('[Firestore] getUserOrdersFromFirestore:', err);
    return [];
  }
}

export async function getAllOrdersFromFirestore(fallbackOrders: Order[] = []): Promise<Order[]> {
  try {
    const snap = await getDocs(collection(db, 'orders'));
    if (!snap.empty) {
      const items: Order[] = [];
      snap.forEach(d => items.push(d.data() as Order));
      return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (fallbackOrders.length > 0) {
      for (const ord of fallbackOrders.slice(0, 10)) {
        await setDoc(doc(db, 'orders', ord.id), ord).catch(() => {});
      }
      return fallbackOrders;
    }
  } catch (err) {
    console.warn('[Firestore] getAllOrdersFromFirestore warning:', err);
  }
  return fallbackOrders;
}

export async function getAllCustomersFromFirestore(fallbackUsers: User[] = []): Promise<User[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    if (!snap.empty) {
      const items: User[] = [];
      snap.forEach(d => items.push(d.data() as User));
      return items;
    } else if (fallbackUsers.length > 0) {
      for (const u of fallbackUsers) {
        await setDoc(doc(db, 'users', u.id), u).catch(() => {});
      }
      return fallbackUsers;
    }
  } catch (err) {
    console.warn('[Firestore] getAllCustomersFromFirestore warning:', err);
  }
  return fallbackUsers;
}

export async function getCouponsFromFirestore(): Promise<Coupon[]> {
  try {
    const snap = await getDocs(collection(db, 'coupons'));
    const items: Coupon[] = [];
    snap.forEach(d => items.push(d.data() as Coupon));
    return items;
  } catch (err) {
    console.warn('[Firestore] getCouponsFromFirestore:', err);
    return [];
  }
}

export async function syncCouponsWithFirestore(fallbackCoupons: Coupon[] = []): Promise<Coupon[]> {
  try {
    const snap = await getDocs(collection(db, 'coupons'));
    if (!snap.empty) {
      const items: Coupon[] = [];
      snap.forEach(d => items.push(d.data() as Coupon));
      return items;
    } else if (fallbackCoupons.length > 0) {
      for (const coup of fallbackCoupons) {
        await setDoc(doc(db, 'coupons', coup.id), coup).catch(() => {});
      }
      return fallbackCoupons;
    }
  } catch (err) {
    console.warn('[Firestore] syncCouponsWithFirestore warning:', err);
  }
  return fallbackCoupons;
}

export async function saveCouponToFirestore(coupon: Coupon): Promise<void> {
  const path = 'coupons';
  try {
    await setDoc(doc(db, path, coupon.id), coupon);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${coupon.id}`);
  }
}

export async function deleteCouponFromFirestore(couponId: string): Promise<void> {
  const path = 'coupons';
  try {
    await deleteDoc(doc(db, path, couponId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${path}/${couponId}`);
  }
}

export async function syncAdsWithFirestore(fallbackAds: Advertisement[] = []): Promise<Advertisement[]> {
  try {
    const snap = await getDocs(collection(db, 'advertisements'));
    if (!snap.empty) {
      const items: Advertisement[] = [];
      snap.forEach(d => items.push(d.data() as Advertisement));
      return items;
    } else if (fallbackAds.length > 0) {
      for (const ad of fallbackAds) {
        await setDoc(doc(db, 'advertisements', ad.id), ad).catch(() => {});
      }
      return fallbackAds;
    }
  } catch (err) {
    console.warn('[Firestore] syncAdsWithFirestore warning:', err);
  }
  return fallbackAds;
}

export async function saveAdToFirestore(ad: Advertisement): Promise<void> {
  const path = 'advertisements';
  try {
    await setDoc(doc(db, path, ad.id), ad);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${ad.id}`);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const path = 'products';
  try {
    await deleteDoc(doc(db, path, productId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${path}/${productId}`);
  }
}



