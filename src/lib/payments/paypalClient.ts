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
 * Retrieve active PayPal configuration from localStorage or Firestore
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

  // 2. Fallback to Firestore if empty or not configured
  if (!config || (!config.live?.clientId && !config.sandbox?.clientId && !config.clientId)) {
    try {
      const { db } = await import('../firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      const snap = await getDoc(doc(db, 'settings', 'paypal'));
      if (snap.exists()) {
        config = snap.data();
      }
    } catch (e) {
      console.warn('[PayPalClient] Impossible de charger les paramètres Firestore:', e);
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
 * Dynamically loads the official PayPal JS SDK
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

    const script = document.createElement('script');
    script.id = 'paypal-js-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      effectiveClientId
    )}&currency=${encodeURIComponent(effectiveCurrency)}&intent=capture&enable-funding=card`;
    script.async = true;

    script.onload = () => {
      if ((window as any).paypal) {
        resolve((window as any).paypal);
      } else {
        reject(new Error("Le SDK PayPal s'est chargé mais l'objet global est introuvable."));
      }
    };

    script.onerror = () => {
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
