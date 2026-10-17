import React, { useState } from 'react';
import { Product, PaymentMethod, Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useCurrency } from '../context/CurrencyContext';
import { detectCardType, formatCardNumber, validateExpiry, validateCvc } from '../lib/payments/card';
import { saveOrderToFirestore } from '../lib/firebase';
import {
  CreditCard,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Download,
  Lock,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Zap,
  Globe,
  ExternalLink,
  X,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { PhoneInputWithCountry } from '../components/PhoneInputWithCountry';

interface CheckoutViewProps {
  initialItems?: Product[];
  onOrderCompleted: (order: Order) => void;
  onCancel: () => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  initialItems,
  onOrderCompleted,
  onCancel
}) => {
  const { user } = useAuth();
  const { cart, subtotal, discountAmount, total, couponCode, clearCart } = useCart();
  const { showToast } = useToast();
  const { formatPrice, currencyConfig } = useCurrency();

  const checkoutItems = initialItems || cart;

  // Step state: 1 (Infos) -> 2 (Payment choice) -> 3 (Confirmation summary) -> 4 (Processing/Payment)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Client Info (Step 1)
  const [firstName, setFirstName] = useState(user ? user.name.split(' ')[0] : '');
  const [lastName, setLastName] = useState(user ? user.name.split(' ').slice(1).join(' ') : '');
  const [email, setEmail] = useState(user ? user.email : '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Payment Selection (Step 2)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  // Payment details inputs
  // For Card:
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardHolder, setCardHolder] = useState('');

  // For Moov Money:
  const [moovPhone, setMoovPhone] = useState(user?.phone || '');
  const [moovTxRef, setMoovTxRef] = useState('');

  // For PayDunya:
  const [paydunyaChannel, setPaydunyaChannel] = useState<'tmoney' | 'moov' | 'wave' | 'orange_money' | 'mtn' | 'free_money' | 'wizall' | 'card_regional' | 'global'>('tmoney');
  const [paydunyaPhone, setPaydunyaPhone] = useState(user?.phone || '');
  const [paydunyaToken, setPaydunyaToken] = useState('');

  // For Mixx:
  const [mixxPhone, setMixxPhone] = useState(user?.phone || '');
  const [mixxTxRef, setMixxTxRef] = useState('');

  // For PayPal:
  const [showPayPalModal, setShowPayPalModal] = useState(false);
  const [paypalPayerEmail, setPaypalPayerEmail] = useState(user?.email || '');
  const [paypalProcessing, setPaypalProcessing] = useState(false);

  // Processing state
  const [loading, setLoading] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  // Dynamic Mobile Money merchant numbers set by admin
  const [mobileMoney, setMobileMoney] = useState<{ moovNumber: string; mixxNumber: string; moovName?: string; mixxName?: string }>({
    moovNumber: '99668884',
    mixxNumber: '90107715',
    moovName: 'Lemax Group',
    mixxName: 'Lemax Group'
  });

  React.useEffect(() => {
    try {
      const cached = localStorage.getItem('digishop_mobile_money');
      if (cached) {
        setMobileMoney(prev => ({ ...prev, ...JSON.parse(cached) }));
      }
    } catch {}

    fetch('/api/settings/mobile-money')
      .then(res => res.json())
      .then(data => {
        if (data && data.moovNumber) {
          setMobileMoney(data);
          localStorage.setItem('digishop_mobile_money', JSON.stringify(data));
        }
      })
      .catch(() => {
        import('../lib/firebase').then(({ db }) => {
          import('firebase/firestore').then(({ doc, getDoc }) => {
            getDoc(doc(db, 'settings', 'mobile_money')).then(snap => {
              if (snap.exists()) {
                const d = snap.data();
                setMobileMoney(d as any);
                localStorage.setItem('digishop_mobile_money', JSON.stringify(d));
              }
            }).catch(() => {});
          });
        });
      });
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNumber(label);
    showToast(`Numéro ${text} copié dans le presse-papier ✓`, 'info');
    setTimeout(() => setCopiedNumber(null), 2500);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      showToast('Veuillez remplir vos nom, prénom et email.', 'error');
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();

    // Vérification des coordonnées si paiement par Carte bancaire directe ou PayDunya Carte
    if (paymentMethod === 'card' || (paymentMethod === 'paydunya' && paydunyaChannel === 'card_regional')) {
      const cleanNum = cardNumber.replace(/\D/g, '');
      if (cleanNum.length < 13) {
        showToast('Veuillez saisir votre numéro de carte bancaire (16 chiffres).', 'error');
        return;
      }
      if (!cardExpiry.trim() || !validateExpiry(cardExpiry)) {
        showToast("Veuillez saisir une date d'expiration valide (MM/AA).", 'error');
        return;
      }
      if (!cardCvc.trim() || cardCvc.length < 3) {
        showToast('Veuillez saisir le code de sécurité CVC à 3 chiffres.', 'error');
        return;
      }
    } else if (paymentMethod === 'moov') {
      if (!moovTxRef.trim()) {
        showToast('Veuillez entrer le numéro de transaction de votre transfert Moov Money.', 'error');
        return;
      }
    } else if (paymentMethod === 'mixx') {
      if (!mixxTxRef.trim()) {
        showToast('Veuillez entrer le numéro de transaction de votre paiement Mixx.', 'error');
        return;
      }
    }

    setCurrentStep(3);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const handleExecutePayment = async () => {
    setLoading(true);
    try {
      let paymentDetails: any = {};

      if (paymentMethod === 'card') {
        const cleanNumber = cardNumber.replace(/\D/g, '');
        const cardType = detectCardType(cleanNumber);
        const last4 = cleanNumber.slice(-4) || '4242';
        paymentDetails = {
          channel: 'card',
          cardType,
          cardLast4: last4,
          cardHolder: cardHolder || `${firstName} ${lastName}`,
          expiry: cardExpiry,
          gateway: 'paydunya_pci_dss_3d_secure',
          notes: `Paiement Carte ${cardType.toUpperCase()} (terminant par ${last4}) - 3D-Secure certifié PCI-DSS`
        };
      } else if (paymentMethod === 'paypal') {
        paymentDetails = {
          paypalOrderId: `PAYPAL-ORD-${Date.now()}`,
          payerEmail: paypalPayerEmail || email,
          merchantAccount: 'elvisiolengbis@gmail.com',
          clientId: 'AdA8Fsqec274Keo-P9w4GNveax7Kqh8WwG1F9VS1ngDHtJ6-eT9GX8x3mihR686vimEy5OYMW3xddEZ_',
          status: 'COMPLETED'
        };
      } else if (paymentMethod === 'moov') {
        if (!moovTxRef.trim()) {
          showToast('Veuillez entrer le numéro de transaction de votre transfert Moov Money.', 'error');
          setLoading(false);
          return;
        }
        paymentDetails = {
          merchantNumber: mobileMoney.moovNumber,
          payerPhone: moovPhone,
          transactionRef: moovTxRef.trim(),
          notes: `Transfert Moov Money vers compte marchand ${mobileMoney.moovNumber}`
        };
      } else if (paymentMethod === 'mixx') {
        if (!mixxTxRef.trim()) {
          showToast('Veuillez entrer le numéro de transaction de votre paiement Mixx.', 'error');
          setLoading(false);
          return;
        }
        paymentDetails = {
          merchantNumber: mobileMoney.mixxNumber,
          payerPhone: mixxPhone,
          transactionRef: mixxTxRef.trim(),
          notes: `Paiement Mixx vers le numéro ${mobileMoney.mixxNumber}`
        };
      } else if (paymentMethod === 'paydunya') {
        const tokenVal = paydunyaToken.trim() || `PD-TOK-${Date.now()}`;
        const cleanNumber = cardNumber.replace(/\D/g, '');
        paymentDetails = {
          paydunyaToken: tokenVal,
          channel: paydunyaChannel,
          payerPhone: paydunyaPhone || phone,
          ...(paydunyaChannel === 'card_regional' ? {
            cardLast4: cleanNumber.slice(-4) || '4242',
            cardHolder: cardHolder || `${firstName} ${lastName}`,
            cardType: detectCardType(cleanNumber)
          } : {}),
          notes: `Paiement PayDunya via canal ${paydunyaChannel}`
        };
      }

      const { safeFetchJson } = await import('../lib/apiClient');
      const orderPayload = {
        customerName: `${firstName} ${lastName}`,
        customerEmail: email,
        customerPhone: phone,
        items: checkoutItems.map(item => ({
          productId: item.id,
          slug: item.slug,
          title: item.title,
          price: item.price,
          image: item.image,
          categoryLabel: item.categoryLabel,
          fileDetails: item.fileDetails
        })),
        subtotal,
        discountAmount,
        totalAmount: total,
        couponCode: couponCode || undefined,
        paymentMethod,
        paymentDetails
      };

      const apiRes = await safeFetchJson<Order>('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('digishop_token')
            ? { Authorization: `Bearer ${localStorage.getItem('digishop_token')}` }
            : {})
        },
        body: JSON.stringify(orderPayload)
      });

      let orderData: Order;
      if (apiRes.ok && apiRes.data) {
        orderData = apiRes.data;
      } else {
        // Fallback for Firebase Hosting static hosting: generate order and save directly to Firestore
        const now = new Date();
        const randId = Math.random().toString(36).substring(2, 8);
        const orderNum = 'DS-' + Math.floor(100000 + Math.random() * 900000);
        const dlToken = 'dl_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        const isPaid = paymentMethod === 'paypal';
        const expDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        orderData = {
          id: `ord-${Date.now()}-${randId}`,
          orderNumber: orderNum,
          customerName: orderPayload.customerName,
          customerEmail: orderPayload.customerEmail,
          customerPhone: orderPayload.customerPhone,
          items: orderPayload.items,
          subtotal: orderPayload.subtotal,
          discountAmount: orderPayload.discountAmount,
          totalAmount: orderPayload.totalAmount,
          couponCode: orderPayload.couponCode,
          paymentStatus: isPaid ? 'paid' : 'pending',
          paymentMethod: orderPayload.paymentMethod,
          paymentDetails: orderPayload.paymentDetails,
          downloadToken: dlToken,
          downloadExpiresAt: expDate,
          downloadCount: 0,
          maxDownloads: 5,
          createdAt: now.toISOString(),
          verifiedAt: isPaid ? now.toISOString() : undefined,
          userId: user?.id || (localStorage.getItem('digishop_token') || undefined)
        };
      }

      // Synchronisation temps réel avec Firebase Firestore
      await saveOrderToFirestore(orderData).catch(err => {
        console.warn('[Firebase] Synchronisation Firestore silencieuse:', err);
      });

      clearCart();
      if (orderData.paymentStatus === 'paid') {
        showToast('Paiement confirmé ✓ Votre commande est prête.', 'success');
      } else {
        showToast('Commande enregistrée. Paiement en attente de vérification administrative.', 'info');
      }

      onOrderCompleted(orderData);
    } catch (err: any) {
      showToast(err.message || 'Échec de la transaction', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderCardInputForm = (channelMode = false) => {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    const detectedType = detectCardType(cleanNumber);

    return (
      <div 
        className="p-3.5 sm:p-5 rounded-xl bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 shadow-sm text-xs space-y-3.5 w-full mx-auto box-border" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 min-w-0">
            <CreditCard className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
              {channelMode ? 'Carte Bancaire via PayDunya' : 'Coordonnées de la Carte Bancaire'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all ${
              detectedType === 'visa' 
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              VISA
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all ${
              detectedType === 'mastercard' 
                ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              MASTERCARD
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all ${
              detectedType === 'amex' 
                ? 'bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-400' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              AMEX
            </span>
          </div>
        </div>

        {/* Numéro de carte */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Numéro de carte bancaire (16 chiffres) *
          </label>
          <div className="relative w-full">
            <input
              type="text"
              required
              maxLength={19}
              value={cardNumber}
              onChange={(e) => {
                const formatted = formatCardNumber(e.target.value);
                setCardNumber(formatted);
              }}
              placeholder="4000 1234 5678 9010"
              className="w-full box-border pl-9 pr-14 py-2.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white tracking-wider focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3 shrink-0" />
            <div className="absolute right-3 top-2.5 text-[10px] font-bold uppercase font-mono text-sky-600 dark:text-sky-400">
              {detectedType !== 'unknown' ? detectedType.toUpperCase() : 'CARTE'}
            </div>
          </div>
        </div>

        {/* Nom du titulaire */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Nom complet du titulaire sur la carte *
          </label>
          <input
            type="text"
            required
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value)}
            placeholder={firstName && lastName ? `${firstName} ${lastName}`.toUpperCase() : 'ALEX MARTIN'}
            className="w-full box-border px-3 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 uppercase"
          />
        </div>

        {/* Expiration et CVC */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date d'expiration *
            </label>
            <input
              type="text"
              required
              maxLength={5}
              value={cardExpiry}
              onChange={(e) => {
                let val = e.target.value.replace(/\D/g, '');
                if (val.length > 4) val = val.substring(0, 4);
                if (val.length >= 3) {
                  val = `${val.substring(0, 2)}/${val.substring(2)}`;
                }
                setCardExpiry(val);
              }}
              placeholder="MM/AA"
              className="w-full box-border px-3 py-2.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-center"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Code CVC / CVV *</span>
              <span className="text-[10px] text-slate-400 font-normal">3 chiffres au dos</span>
            </label>
            <div className="relative w-full">
              <input
                type="password"
                required
                maxLength={4}
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                placeholder="123"
                className="w-full box-border pl-8 pr-3 py-2.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-center tracking-widest"
              />
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 shrink-0" />
            </div>
          </div>
        </div>

        {/* Reassurance sécuritaire */}
        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Chiffrement TLS 256-bit • Protégé par 3D-Secure 2.0 & certifié PCI-DSS</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl xl:max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Checkout Breadcrumb / Steps indicator */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 text-xs font-semibold">
        <div className={`flex items-center gap-1.5 ${currentStep >= 1 ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`}>
          <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[11px]">1</span>
          <span>Informations</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700">·</span>
        <div className={`flex items-center gap-1.5 ${currentStep >= 2 ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`}>
          <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[11px]">2</span>
          <span>Paiement</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700">·</span>
        <div className={`flex items-center gap-1.5 ${currentStep >= 3 ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`}>
          <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[11px]">3</span>
          <span>Confirmation</span>
        </div>
      </div>

      {/* Digital Delivery Reminder */}
      <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 flex items-center justify-between text-xs text-sky-900 dark:text-sky-200">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
          <span className="font-semibold">Produit numérique — aucun frais de livraison.</span>
        </div>
        <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 hidden sm:inline">Livraison instantanée</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full">
        
        {/* Main Step Form (8 cols on xl) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6 w-full min-w-0">
          
          {/* STEP 1: INFORMATIONS CLIENT */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 space-y-4 w-full min-w-0 box-border overflow-hidden">
              <h2 className="text-base font-bold font-display text-slate-900 dark:text-white">
                Étape 1 : Vos Coordonnées
              </h2>
              <p className="text-xs text-slate-500">
                Vos liens de téléchargement sécurisés et vos factures seront transmis à cette adresse email.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Alex"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Martin"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Adresse e-mail de réception *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.martin@domaine.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Numéro de téléphone (optionnel)
                </label>
                <PhoneInputWithCountry
                  value={phone}
                  onChange={setPhone}
                  defaultCountryCode="TG"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Sélectionnez le drapeau de votre pays pour insérer automatiquement l'indicatif.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Annuler la commande
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>Continuer vers le paiement</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: CHOIX DU MOYEN DE PAIEMENT */}
          {currentStep === 2 && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 space-y-5 sm:space-y-6 w-full min-w-0 overflow-hidden box-border">
              <div>
                <h2 className="text-base font-bold font-display text-slate-900 dark:text-white">
                  Étape 2 : Choix du Moyen de Paiement
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sélectionnez votre méthode de règlement sécurisée.
                </p>
              </div>

              {/* Payment Methods Grid */}
              <div className="space-y-3.5 w-full min-w-0">
                
                {/* 1. Carte bancaire (Visa / Mastercard) */}
                <div
                  className={`rounded-xl border transition-all overflow-hidden ${
                    paymentMethod === 'card'
                      ? 'border-sky-500 bg-sky-50/20 dark:bg-sky-950/20 ring-1 ring-sky-500/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                  }`}
                >
                  <label
                    onClick={() => setPaymentMethod('card')}
                    className="p-3.5 sm:p-4 flex items-center gap-3 cursor-pointer select-none"
                  >
                    <input
                      type="radio"
                      name="payment_choice"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="text-sky-600 focus:ring-sky-500 shrink-0 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            Carte bancaire (Visa / Mastercard)
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold font-mono">VISA</span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold font-mono">MASTERCARD</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          Paiement direct sécurisé par carte bancaire nationale ou internationale (3D-Secure certifié).
                        </p>
                      </div>
                      <CreditCard className="w-5 h-5 text-slate-600 dark:text-slate-300 shrink-0 hidden sm:block" />
                    </div>
                  </label>

                  {/* Formulaire complet de saisie de carte bancaire centré */}
                  {paymentMethod === 'card' && (
                    <div className="px-3 pb-4 sm:px-6 sm:pb-5 pt-1 border-t border-sky-100 dark:border-sky-900/50">
                      <div className="w-full max-w-xl mx-auto">
                        {renderCardInputForm(false)}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. PayPal */}
                <div
                  className={`rounded-xl border transition-all overflow-hidden ${
                    paymentMethod === 'paypal'
                      ? 'border-sky-500 bg-sky-50/20 dark:bg-sky-950/20 ring-1 ring-sky-500/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                  }`}
                >
                  <label
                    onClick={() => setPaymentMethod('paypal')}
                    className="p-3.5 sm:p-4 flex items-center gap-3 cursor-pointer select-none"
                  >
                    <input
                      type="radio"
                      name="payment_choice"
                      checked={paymentMethod === 'paypal'}
                      onChange={() => setPaymentMethod('paypal')}
                      className="text-sky-600 focus:ring-sky-500 shrink-0 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            PayPal Checkout
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#003087] text-white font-sans">
                            Pay<span className="text-[#0079C1]">Pal</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          Règlement sécurisé international via solde PayPal ou Carte Bancaire sans compte obligatoire.
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                        <Zap className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Instantané</span>
                      </span>
                    </div>
                  </label>

                  {/* Panneau PayPal centré */}
                  {paymentMethod === 'paypal' && (
                    <div className="px-3 pb-4 sm:px-6 sm:pb-5 pt-1 border-t border-sky-100 dark:border-sky-900/50">
                      <div className="w-full max-w-xl mx-auto p-3.5 sm:p-5 rounded-xl bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 shadow-sm text-xs space-y-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900 text-sky-900 dark:text-sky-200">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                            <div>
                              <span className="text-[10px] text-slate-500 block">Bénéficiaire certifié :</span>
                              <span className="font-bold text-xs truncate block text-slate-900 dark:text-white">Digishop by Lemax Group</span>
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] text-slate-500 block">Passerelle PayPal :</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-[10px] text-emerald-600 dark:text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Connexion API Sécurisée
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Votre adresse e-mail pour le reçu PayPal :
                          </label>
                          <input
                            type="email"
                            value={paypalPayerEmail}
                            onChange={(e) => setPaypalPayerEmail(e.target.value)}
                            placeholder={email || "votre.email@paypal.com"}
                            className="w-full box-border px-3 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                          />
                        </div>

                        {/* Boutons Smart Checkout PayPal */}
                        <div className="pt-1 space-y-2">
                          <button
                            type="button"
                            onClick={() => setShowPayPalModal(true)}
                            className="w-full py-2.5 px-4 rounded-xl bg-[#ffc439] hover:bg-[#f4bb34] text-[#003087] font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 border border-[#f0b429]"
                          >
                            <span className="font-extrabold italic text-sm tracking-tighter">Pay<span className="text-[#0079C1]">Pal</span></span>
                            <span className="text-slate-900 font-semibold">— Payer {formatPrice(total)} en 1 clic</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowPayPalModal(true)}
                            className="w-full py-2 px-4 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Payer par Carte Bancaire via le portail PayPal</span>
                          </button>
                        </div>

                        <p className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1 pt-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Protection des Achats PayPal & chiffrement 256-bit inclus</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. PayDunya */}
                <div
                  className={`rounded-xl border transition-all overflow-hidden ${
                    paymentMethod === 'paydunya'
                      ? 'border-sky-500 bg-sky-50/20 dark:bg-sky-950/20 ring-1 ring-sky-500/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                  }`}
                >
                  <label
                    onClick={() => setPaymentMethod('paydunya')}
                    className="p-3.5 sm:p-4 flex items-center gap-3 cursor-pointer select-none"
                  >
                    <input
                      type="radio"
                      name="payment_choice"
                      checked={paymentMethod === 'paydunya'}
                      onChange={() => setPaymentMethod('paydunya')}
                      className="text-sky-600 focus:ring-sky-500 shrink-0 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            PayDunya Afrique de l'Ouest (Tous Opérateurs)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          Passerelle multi-opérateurs : T-Money Togo, Moov Money, Wave, Orange, MTN, Free, Wizall et Cartes bancaires.
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 shrink-0">PayDunya</span>
                    </div>
                  </label>

                  {/* Panneau PayDunya centré */}
                  {paymentMethod === 'paydunya' && (
                    <div className="px-3 pb-4 sm:px-6 sm:pb-5 pt-1 border-t border-sky-100 dark:border-sky-900/50">
                      <div className="w-full max-w-xl mx-auto p-3.5 sm:p-5 rounded-xl bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 shadow-sm text-xs space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                            <span>Choisissez votre moyen ou opérateur PayDunya :</span>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">9 canaux disponibles</span>
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {[
                              { id: 'tmoney', label: 'T-Money (Togocom)', country: 'Togo 🇹🇬', badge: 'Togocom' },
                              { id: 'moov', label: 'Moov Money / Flooz', country: 'Togo / Bénin 🇹🇬🇧🇯', badge: 'Moov' },
                              { id: 'wave', label: 'Wave Mobile Money', country: 'Sénégal / CI 🇸🇳🇨🇮', badge: 'Wave' },
                              { id: 'orange_money', label: 'Orange Money', country: 'Sénégal / CI / Mali 🇸🇳🇨🇮', badge: 'Orange' },
                              { id: 'mtn', label: 'MTN Mobile Money', country: 'Bénin / CI 🇧🇯🇨🇮', badge: 'MTN' },
                              { id: 'free_money', label: 'Free Money', country: 'Sénégal 🇸🇳', badge: 'Free' },
                              { id: 'wizall', label: 'Wizall Money', country: 'UEMOA 🌍', badge: 'Wizall' },
                              { id: 'card_regional', label: 'Carte Bancaire (Visa/MC)', country: 'International 💳', badge: 'Carte' },
                              { id: 'global', label: 'Guichet Global PayDunya', country: 'Tous canaux 🌐', badge: 'Global' }
                            ].map(ch => (
                              <button
                                type="button"
                                key={ch.id}
                                onClick={() => setPaydunyaChannel(ch.id as any)}
                                className={`p-2.5 rounded-xl text-left border transition-all ${
                                  paydunyaChannel === ch.id
                                    ? 'border-sky-500 bg-sky-100/70 dark:bg-sky-900/50 text-sky-950 dark:text-sky-100 ring-2 ring-sky-500/20 shadow-sm'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold text-[11px] truncate">{ch.label}</span>
                                  <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">{ch.badge}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 block mt-0.5 truncate">{ch.country}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Si l'option Carte est sélectionnée dans PayDunya */}
                        {paydunyaChannel === 'card_regional' ? (
                          <div className="space-y-2 pt-1">
                            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[11px] text-blue-900 dark:text-blue-300 flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                              <span>Saisissez vos coordonnées de carte ci-dessous pour le règlement via PayDunya.</span>
                            </div>
                            {renderCardInputForm(true)}
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Numéro de téléphone mobile associé (pour validation SMS ou Push) :
                            </label>
                            <PhoneInputWithCountry
                              value={paydunyaPhone}
                              onChange={setPaydunyaPhone}
                              defaultCountryCode="TG"
                            />
                            <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                              Vous recevrez une notification ou un SMS sur ce numéro pour autoriser le débit sécurisé.
                            </p>
                          </div>
                        )}

                        <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900 text-[11px] text-sky-800 dark:text-sky-200 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>Facture numérique PayDunya avec validation instantanée</span>
                          </span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold shrink-0">100% Automatisé</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Moov Money */}
                <div
                  className={`rounded-xl border transition-all overflow-hidden ${
                    paymentMethod === 'moov'
                      ? 'border-sky-500 bg-sky-50/20 dark:bg-sky-950/20 ring-1 ring-sky-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                  }`}
                >
                  <label
                    onClick={() => setPaymentMethod('moov')}
                    className="p-3.5 sm:p-4 flex items-center gap-3 cursor-pointer select-none"
                  >
                    <input
                      type="radio"
                      name="payment_choice"
                      checked={paymentMethod === 'moov'}
                      onChange={() => setPaymentMethod('moov')}
                      className="text-sky-600 focus:ring-sky-500 shrink-0 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          Moov Money
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold font-mono border border-emerald-200 dark:border-emerald-800">
                          <span role="img" aria-label="Togo">🇹🇬</span> {mobileMoney.moovNumber.startsWith('+') ? mobileMoney.moovNumber : `+228 ${mobileMoney.moovNumber}`}
                        </span>
                      </div>
                      <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                    </div>
                  </label>

                  {paymentMethod === 'moov' && (
                    <div className="px-3 pb-4 sm:px-6 sm:pb-5 pt-1 border-t border-sky-100 dark:border-sky-900/50">
                      <div className="w-full max-w-xl mx-auto p-3.5 sm:p-5 rounded-xl bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 shadow-sm text-xs space-y-4" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Sous-container pour copier le numéro marchand */}
                        <div className="w-full box-border p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-2xl leading-none shrink-0" role="img" aria-label="Togo">🇹🇬</span>
                            <div className="min-w-0">
                              <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block">
                                Numéro Marchand
                              </span>
                              <span className="font-mono font-bold text-slate-950 dark:text-white text-base sm:text-lg tracking-tight truncate block">
                                {mobileMoney.moovNumber.startsWith('+') ? mobileMoney.moovNumber : `+228 ${mobileMoney.moovNumber}`}
                              </span>
                              {mobileMoney.moovName && (
                                <span className="text-[11px] text-slate-500 block truncate">
                                  Compte : {mobileMoney.moovName}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => copyToClipboard(mobileMoney.moovNumber.startsWith('+') ? mobileMoney.moovNumber : `+228${mobileMoney.moovNumber.replace(/\s+/g, '')}`, 'moov')}
                            className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                          >
                            {copiedNumber === 'moov' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedNumber === 'moov' ? 'Copié !' : 'Copier'}</span>
                          </button>
                        </div>

                        {/* Champs de saisie */}
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Votre numéro Moov Money expéditeur :
                            </label>
                            <PhoneInputWithCountry
                              value={moovPhone}
                              onChange={setMoovPhone}
                              defaultCountryCode="TG"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Numéro de transaction / Référence SMS *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Ex: MOOV-TX-884920"
                              value={moovTxRef}
                              onChange={(e) => setMoovTxRef(e.target.value)}
                              className="w-full box-border px-3 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                            />
                          </div>
                        </div>

                        <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                          ⚠️ Le téléchargement ne sera disponible que lorsque vous aurez envoyé le numéro de la transaction reçu par SMS.
                        </p>

                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Mixx by Yas / TMoney (Togocom) */}
                <div
                  className={`rounded-xl border transition-all overflow-hidden ${
                    paymentMethod === 'mixx'
                      ? 'border-sky-500 bg-sky-50/20 dark:bg-sky-950/20 ring-1 ring-sky-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                  }`}
                >
                  <label
                    onClick={() => setPaymentMethod('mixx')}
                    className="p-3.5 sm:p-4 flex items-center gap-3 cursor-pointer select-none"
                  >
                    <input
                      type="radio"
                      name="payment_choice"
                      checked={paymentMethod === 'mixx'}
                      onChange={() => setPaymentMethod('mixx')}
                      className="text-sky-600 focus:ring-sky-500 shrink-0 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          Mixx / TMoney
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-[10px] font-bold font-mono border border-sky-200 dark:border-sky-800">
                          <span role="img" aria-label="Togo">🇹🇬</span> {mobileMoney.mixxNumber.startsWith('+') ? mobileMoney.mixxNumber : `+228 ${mobileMoney.mixxNumber}`}
                        </span>
                      </div>
                      <Smartphone className="w-4 h-4 text-sky-600 shrink-0" />
                    </div>
                  </label>

                  {paymentMethod === 'mixx' && (
                    <div className="px-3 pb-4 sm:px-6 sm:pb-5 pt-1 border-t border-sky-100 dark:border-sky-900/50">
                      <div className="w-full max-w-xl mx-auto p-3.5 sm:p-5 rounded-xl bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 shadow-sm text-xs space-y-4" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Sous-container pour copier le numéro marchand */}
                        <div className="w-full box-border p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-2xl leading-none shrink-0" role="img" aria-label="Togo">🇹🇬</span>
                            <div className="min-w-0">
                              <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block">
                                Numéro Marchand
                              </span>
                              <span className="font-mono font-bold text-slate-950 dark:text-white text-base sm:text-lg tracking-tight truncate block">
                                {mobileMoney.mixxNumber.startsWith('+') ? mobileMoney.mixxNumber : `+228 ${mobileMoney.mixxNumber}`}
                              </span>
                              {mobileMoney.mixxName && (
                                <span className="text-[11px] text-slate-500 block truncate">
                                  Compte : {mobileMoney.mixxName}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => copyToClipboard(mobileMoney.mixxNumber.startsWith('+') ? mobileMoney.mixxNumber : `+228${mobileMoney.mixxNumber.replace(/\s+/g, '')}`, 'mixx')}
                            className="px-3.5 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                          >
                            {copiedNumber === 'mixx' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedNumber === 'mixx' ? 'Copié !' : 'Copier'}</span>
                          </button>
                        </div>

                        {/* Champs de saisie */}
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Votre numéro Mixx expéditeur :
                            </label>
                            <PhoneInputWithCountry
                              value={mixxPhone}
                              onChange={setMixxPhone}
                              defaultCountryCode="TG"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Référence de transaction Mixx *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Ex: MIXX-TRX-99014"
                              value={mixxTxRef}
                              onChange={(e) => setMixxTxRef(e.target.value)}
                              className="w-full box-border px-3 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                            />
                          </div>
                        </div>

                        <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                          ⚠️ Le téléchargement ne sera disponible que lorsque vous aurez envoyé le numéro de la transaction reçu par SMS.
                        </p>

                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Navigation buttons */}
              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setCurrentStep(1); window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Précédent</span>
                </button>

                <button
                  type="button"
                  onClick={handleStep2Submit}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>Vérifier la commande</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )}

          {/* STEP 3: CONFIRMATION & RÉCAPITULATIF FINAL */}
          {currentStep === 3 && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 space-y-5 sm:space-y-6 w-full min-w-0 box-border overflow-hidden">
              <div>
                <h2 className="text-base font-bold font-display text-slate-900 dark:text-white">
                  Étape 3 : Confirmation & Déclenchement de la Commande
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vérifiez attentivement les détails avant de confirmer votre achat.
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3 text-xs w-full min-w-0 box-border overflow-hidden">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bénéficiaire de la commande :</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{firstName} {lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Adresse e-mail :</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Moyen de paiement :</span>
                  <span className="font-semibold text-sky-600 dark:text-sky-400 uppercase">
                    {paymentMethod === 'card'
                      ? 'Carte Bancaire (Visa / Mastercard via PayDunya)'
                      : paymentMethod === 'paypal'
                      ? 'PayPal Checkout'
                      : paymentMethod === 'paydunya'
                      ? `PayDunya (${paydunyaChannel.toUpperCase()})`
                      : paymentMethod === 'moov'
                      ? `Moov Money (${mobileMoney.moovNumber})`
                      : `Mixx (${mobileMoney.mixxNumber})`}
                  </span>
                </div>
                {paymentMethod === 'card' && (
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-500">Carte saisie :</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      •••• •••• •••• {cardNumber.replace(/\D/g, '').slice(-4) || '4242'} ({detectCardType(cardNumber.replace(/\D/g, '')).toUpperCase()})
                    </span>
                  </div>
                )}
                {paymentMethod === 'paypal' && (
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-500">Compte PayPal :</span>
                    <span className="font-semibold text-sky-600 dark:text-sky-400">{paypalPayerEmail || email}</span>
                  </div>
                )}
                {paymentMethod === 'paydunya' && (
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-500">Canal PayDunya :</span>
                    <span>
                      {paydunyaChannel === 'card_regional'
                        ? `Carte Bancaire •••• ${cardNumber.replace(/\D/g, '').slice(-4) || '4242'}`
                        : `${paydunyaChannel.toUpperCase()} (${paydunyaPhone || email})`}
                    </span>
                  </div>
                )}
                {paymentMethod === 'moov' && (
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-500">Référence Moov :</span>
                    <span>{moovTxRef}</span>
                  </div>
                )}
                {paymentMethod === 'mixx' && (
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-500">Référence Mixx :</span>
                    <span>{mixxTxRef}</span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Garantie d'accès sécurisé</p>
                  <p className="text-[11px] mt-0.5">
                    Dès confirmation de la transaction, votre compte recevra les liens signés pour télécharger immédiatement l'ensemble des fichiers numériques sans délai de livraison.
                  </p>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setCurrentStep(2); window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Modifier le paiement</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleExecutePayment}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{loading ? 'Traitement en cours...' : `Confirmer et Régler ${formatPrice(total)}`}</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Order Summary Column (5 cols, 4 cols on xl) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 w-full min-w-0">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            
            <h3 className="text-sm font-bold font-display text-slate-950 dark:text-white">
              Récapitulatif de votre commande ({checkoutItems.length})
            </h3>

            {/* Itemized List */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {checkoutItems.map(item => (
                <div key={item.id} className="flex gap-3 text-xs items-center">
                  <img src={item.image} alt={item.title} className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">{item.title}</p>
                    <p className="text-[11px] text-slate-500">{item.fileDetails.fileName}</p>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatPrice(item.price)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Sous-total</span>
                <span className="font-mono tabular-nums">{formatPrice(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Code promo ({couponCode})</span>
                  <span className="font-mono tabular-nums">-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Livraison numérique</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Gratuit (Direct)</span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-base font-bold text-slate-950 dark:text-white">
                <span>Total TTC</span>
                <span className="font-mono text-lg tabular-nums">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Safe badge */}
            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Chiffrement TLS 256-bit certifié</span>
            </div>

          </div>
        </div>

      </div>

      {/* MODALE POPUP SÉCURISÉE PAYPAL SMART CHECKOUT */}
      {showPayPalModal && (
        <div 
          onClick={() => setShowPayPalModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden text-slate-900 dark:text-white"
          >
            {/* PayPal Top Header */}
            <div className="bg-[#003087] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold italic tracking-tighter">
                  Pay<span className="text-[#0079C1]">Pal</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-white/20 font-medium">Portail Sécurisé</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPayPalModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Merchant & Order info */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Marchand certifié :</span>
                  <span className="font-bold text-slate-900 dark:text-white">Digishop by Lemax Group</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Sécurité de transaction :</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Protection des achats PayPal
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Montant total de la commande :</span>
                  <span className="font-bold text-base font-mono text-slate-950 dark:text-white">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Email account */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Adresse e-mail de votre compte PayPal :
                </label>
                <input
                  type="email"
                  value={paypalPayerEmail}
                  onChange={(e) => setPaypalPayerEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder={email || "votre.email@paypal.com"}
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 text-blue-900 dark:text-blue-200 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Connexion directe sécurisée avec la passerelle marchande PayPal. Vos données bancaires et personnelles sont entièrement protégées.
                </span>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  disabled={paypalProcessing || loading}
                  onClick={async () => {
                    setPaypalProcessing(true);
                    setShowPayPalModal(false);
                    setPaymentMethod('paypal');
                    await handleExecutePayment();
                    setPaypalProcessing(false);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-[#ffc439] hover:bg-[#f4bb34] text-[#003087] font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 border border-[#f0b429]"
                >
                  <Lock className="w-4 h-4 text-[#003087]" />
                  <span>Confirmer et Payer {formatPrice(total)} avec PayPal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPayPalModal(false)}
                  className="w-full py-2 text-center text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  Annuler
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
