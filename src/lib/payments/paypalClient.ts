/**
 * Client-Side PayPal Integration for Digishop
 * Handles PayPal JS SDK dynamic loading, order creation and capture
 * Operates reliably in both full-stack Express and static Firebase Hosting environments
 */

export interface PayPalActiveConfig {
  mode: 'sandbox' | 'live';
  clientId: string;
  merchantEmail: string;
  isConfigured: boolean;
}

/**
 * Retrieve active PayPal configuration with multi-source fallback:
 * 1. LocalStorage
 * 2. Backend /api/payments/paypal/public-config
 * 3. Firestore 'settings/paypal'
 */
export async function getPayPalActiveConfig(): Promise<PayPalActiveConfig> {
  let config: any = null;

  // 1. Try localStorage
  try {
    const cached = localStorage.getItem('digishop_paypal');
    if (cached) {
      config = JSON.parse(cached);
    }
  } catch {}

  // 2. Try backend API if empty or missing clientId
  if (!config || (!config.live?.clientId && !config.sandbox?.clientId && !config.clientId)) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch('/api/payments/paypal/public-config', {
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.clientId || data.mode)) {
          config = data;
        }
      }
    } catch {}
  }

  // 3. Fallback to Firestore
  if (!config || (!config.live?.clientId && !config.sandbox?.clientId && !config.clientId)) {
    try {
      const { db } = await import('../firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      const snap = await Promise.race([
        getDoc(doc(db, 'settings', 'paypal')),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
      ]);
      if (snap && (snap as any).exists && (snap as any).exists()) {
        config = (snap as any).data();
      }
    } catch (e) {
      console.warn('[PayPalClient] Firestore timeout ou indisponible:', e);
    }
  }

  const mode: 'sandbox' | 'live' = config?.mode === 'live' ? 'live' : 'sandbox';
  const targetObj = config?.[mode] || (mode === 'live' ? config?.live : config?.sandbox) || config || {};

  const clientId: string = (targetObj.clientId || config?.clientId || '').trim();
  const merchantEmail: string = (targetObj.merchantEmail || config?.merchantEmail || 'lemaxshop01@gmail.com').trim();

  const isConfigured = Boolean(clientId && !clientId.startsWith('AZ_'));

  return {
    mode,
    clientId,
    merchantEmail,
    isConfigured
  };
}

let paypalSdkPromise: Promise<any> | null = null;
let currentSdkClientId = '';
let currentSdkCurrency = '';

/**
 * Dynamically loads the official PayPal JS SDK with an 8-second safety timeout
 */
export function loadPayPalSdk(clientId: string, currency: string = 'EUR'): Promise<any> {
  const effectiveClientId = clientId.trim() || 'sb';
  const effectiveCurrency = (currency || 'EUR').toUpperCase();

  // If already loaded with the same credentials and currency, return existing
  if (
    (window as any).paypal &&
    currentSdkClientId === effectiveClientId &&
    currentSdkCurrency === effectiveCurrency
  ) {
    return Promise.resolve((window as any).paypal);
  }

  // Remove previous script if client ID or currency changed
  if (currentSdkClientId !== effectiveClientId || currentSdkCurrency !== effectiveCurrency) {
    const oldScript = document.getElementById('paypal-js-sdk');
    if (oldScript && oldScript.parentNode) {
      oldScript.parentNode.removeChild(oldScript);
    }
    paypalSdkPromise = null;
    (window as any).paypal = undefined;
  }

  if (paypalSdkPromise) {
    return paypalSdkPromise;
  }

  paypalSdkPromise = new Promise((resolve, reject) => {
    currentSdkClientId = effectiveClientId;
    currentSdkCurrency = effectiveCurrency;

    const timeoutTimer = setTimeout(() => {
      paypalSdkPromise = null;
      reject(
        new Error(
          'Délai de connexion aux serveurs PayPal dépassé (8s). Utilisez le bouton de paiement direct ci-dessous.'
        )
      );
    }, 8000);

    const script = document.createElement('script');
    script.id = 'paypal-js-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      effectiveClientId
    )}&currency=${encodeURIComponent(effectiveCurrency)}&intent=capture&enable-funding=card`;
    script.async = true;

    script.onload = () => {
      clearTimeout(timeoutTimer);
      if ((window as any).paypal) {
        resolve((window as any).paypal);
      } else {
        paypalSdkPromise = null;
        reject(new Error("Le SDK PayPal s'est chargé mais l'objet global est introuvable."));
      }
    };

    script.onerror = () => {
      clearTimeout(timeoutTimer);
      paypalSdkPromise = null;
      reject(
        new Error(
          'Impossible de joindre les serveurs PayPal. Vérifiez votre connexion internet ou vos bloqueurs de publicité.'
        )
      );
    };

    document.head.appendChild(script);
  });

  return paypalSdkPromise;
}
