import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Product, Coupon } from '../types';
import { useToast } from './ToastContext';

interface CartContextType {
  cart: Product[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  couponCode: string;
  discountAmount: number;
  subtotal: number;
  total: number;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [cart, setCart] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('digishop_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponCode, setCouponCode] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  useEffect(() => {
    localStorage.setItem('digishop_cart', JSON.stringify(cart));
  }, [cart]);

  // Synchronize cart item prices if modified in Admin
  useEffect(() => {
    const handleProductsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<Product[]>;
      if (Array.isArray(customEvent.detail)) {
        const updatedList = customEvent.detail;
        setCart(prevCart => {
          let hasChanged = false;
          const nextCart = prevCart.map(item => {
            const fresh = updatedList.find(p => p.id === item.id);
            if (fresh && (fresh.price !== item.price || fresh.originalPrice !== item.originalPrice || fresh.title !== item.title)) {
              hasChanged = true;
              return { ...item, price: fresh.price, originalPrice: fresh.originalPrice, title: fresh.title };
            }
            return item;
          });
          return hasChanged ? nextCart : prevCart;
        });
      }
    };
    window.addEventListener('digishop:products-updated', handleProductsUpdated);
    return () => {
      window.removeEventListener('digishop:products-updated', handleProductsUpdated);
    };
  }, []);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (parseFloat(String(item?.price)) || 0), 0);
  }, [cart]);

  const total = useMemo(() => {
    const calc = subtotal - discountAmount;
    return calc > 0 ? Math.round(calc * 100) / 100 : 0;
  }, [subtotal, discountAmount]);

  const addToCart = (product: Product) => {
    const exists = cart.some(item => item.id === product.id);
    if (exists) {
      showToast('Ce produit est déjà dans votre panier.', 'info');
      setIsCartOpen(true);
      return;
    }

    setCart(prev => [...prev, product]);
    showToast('Produit ajouté au panier ✓', 'success');
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
    if (cart.length <= 1) {
      setCouponCode('');
      setDiscountAmount(0);
    }
  };

  const clearCart = () => {
    setCart([]);
    setCouponCode('');
    setDiscountAmount(0);
  };

  const isInCart = (productId: string) => {
    return cart.some(item => item.id === productId);
  };

  const applyCoupon = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) throw new Error('Veuillez entrer un code.');

    const { safeFetchJson } = await import('../lib/apiClient');
    const apiRes = await safeFetchJson<{ code: string; discountAmount: number }>('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: cleanCode, subtotal })
    });

    if (apiRes.ok && apiRes.data) {
      setCouponCode(apiRes.data.code);
      setDiscountAmount(apiRes.data.discountAmount);
      showToast(`Code ${apiRes.data.code} appliqué (-${apiRes.data.discountAmount} €) ✓`, 'success');
      return;
    }

    // Fallback on Firebase Hosting: validate directly via Firestore / catalog
    try {
      const { getCouponsFromFirestore } = await import('../lib/firebase');
      const coupons = await getCouponsFromFirestore();
      let matched: Coupon | undefined = coupons.find(c => c.code.toUpperCase() === cleanCode && c.isActive);

      if (!matched) {
        const dbData = (await import('../../data/db.json')).default;
        matched = ((dbData.coupons || []) as Coupon[]).find(c => c.code.toUpperCase() === cleanCode && c.isActive);
      }

      if (matched) {
        if (matched.minOrderValue && subtotal < matched.minOrderValue) {
          throw new Error(`Montant minimum d'achat requis : ${matched.minOrderValue} €`);
        }
        const disc = matched.discountType === 'percentage'
          ? Math.round((subtotal * (matched.discountValue / 100)) * 100) / 100
          : Math.min(subtotal, matched.discountValue);

        setCouponCode(matched.code);
        setDiscountAmount(disc);
        showToast(`Code ${matched.code} appliqué (-${disc} €) ✓`, 'success');
        return;
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch')) throw e;
    }

    throw new Error('Code promo non reconnu ou expiré.');
  };

  const removeCoupon = () => {
    setCouponCode('');
    setDiscountAmount(0);
    showToast('Code promo retiré.', 'info');
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        addToCart,
        removeFromCart,
        clearCart,
        couponCode,
        discountAmount,
        subtotal,
        total,
        applyCoupon,
        removeCoupon,
        isInCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
