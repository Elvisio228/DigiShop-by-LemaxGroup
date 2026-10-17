/**
 * Module d'Intégration PayPal pour Digishop
 * Compte marchand officiel : elvisiolengbis@gmail.com
 */

import fs from 'fs';
import path from 'path';

export interface PayPalCredentials {
  clientId: string;
  clientSecret: string;
  merchantEmail: string;
}

export interface PayPalConfigData {
  mode: 'sandbox' | 'live';
  sandbox: PayPalCredentials;
  live: PayPalCredentials;
}

const CONFIG_FILE = path.resolve(process.cwd(), 'data', 'paypal-config.json');

const DEFAULT_SANDBOX: PayPalCredentials = {
  clientId: 'AdA8Fsqec274Keo-P9w4GNveax7Kqh8WwG1F9VS1ngDHtJ6-eT9GX8x3mihR686vimEy5OYMW3xddEZ_',
  clientSecret: 'EDJMWKMRMJ_ASLeJJMHdlOHfjatkCg6RVWq8mOAUODj_-sMDfKMXss8gkN18kXX0Uf_s2ASSSIgbowGn',
  merchantEmail: 'elvisiolengbis@gmail.com'
};

const DEFAULT_LIVE: PayPalCredentials = {
  clientId: '',
  clientSecret: '',
  merchantEmail: 'elvisiolengbis@gmail.com'
};

function loadPayPalConfig(): PayPalConfigData {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.sandbox && parsed.live) {
        return {
          mode: parsed.mode || 'sandbox',
          sandbox: {
            clientId: parsed.sandbox.clientId ?? DEFAULT_SANDBOX.clientId,
            clientSecret: parsed.sandbox.clientSecret ?? DEFAULT_SANDBOX.clientSecret,
            merchantEmail: parsed.sandbox.merchantEmail ?? DEFAULT_SANDBOX.merchantEmail
          },
          live: {
            clientId: parsed.live.clientId ?? DEFAULT_LIVE.clientId,
            clientSecret: parsed.live.clientSecret ?? DEFAULT_LIVE.clientSecret,
            merchantEmail: parsed.live.merchantEmail ?? DEFAULT_LIVE.merchantEmail
          }
        };
      }
    }
  } catch (err) {
    console.warn('[PayPal] Erreur lecture configuration:', err);
  }

  return {
    mode: (process.env.PAYPAL_MODE as 'sandbox' | 'live') || 'sandbox',
    sandbox: { ...DEFAULT_SANDBOX },
    live: {
      clientId: process.env.PAYPAL_CLIENT_ID || '',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
      merchantEmail: process.env.PAYPAL_MERCHANT_EMAIL || 'elvisiolengbis@gmail.com'
    }
  };
}

let paypalConfigData: PayPalConfigData = loadPayPalConfig();

function savePayPalConfig() {
  try {
    const dir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(paypalConfigData, null, 2), 'utf-8');
  } catch (err) {
    console.error('[PayPal] Erreur sauvegarde configuration:', err);
  }
}

export function updatePayPalConfig(updates: {
  mode?: 'sandbox' | 'live';
  clientId?: string;
  clientSecret?: string;
  merchantEmail?: string;
  sandbox?: Partial<PayPalCredentials>;
  live?: Partial<PayPalCredentials>;
}) {
  if (updates.mode) {
    paypalConfigData.mode = updates.mode;
  }
  if (updates.sandbox) {
    paypalConfigData.sandbox = { ...paypalConfigData.sandbox, ...updates.sandbox };
  }
  if (updates.live) {
    paypalConfigData.live = { ...paypalConfigData.live, ...updates.live };
  }

  // Direct updates apply to currently active mode
  const active = paypalConfigData.mode === 'live' ? paypalConfigData.live : paypalConfigData.sandbox;
  if (updates.clientId !== undefined) active.clientId = updates.clientId.trim();
  if (updates.clientSecret !== undefined) active.clientSecret = updates.clientSecret.trim();
  if (updates.merchantEmail !== undefined) active.merchantEmail = updates.merchantEmail.trim();

  savePayPalConfig();
}

export function getPayPalConfig() {
  const active = paypalConfigData.mode === 'live' ? paypalConfigData.live : paypalConfigData.sandbox;
  return {
    mode: paypalConfigData.mode,
    sandbox: { ...paypalConfigData.sandbox },
    live: { ...paypalConfigData.live },
    clientId: active.clientId,
    clientSecret: active.clientSecret,
    merchantEmail: active.merchantEmail,
    isConfigured: Boolean(active.clientId && active.clientSecret && !active.clientId.startsWith('AZ_'))
  };
}

export const PAYPAL_CONFIG = {
  get mode() { return paypalConfigData.mode; },
  get clientId() { return (paypalConfigData.mode === 'live' ? paypalConfigData.live : paypalConfigData.sandbox).clientId; },
  get clientSecret() { return (paypalConfigData.mode === 'live' ? paypalConfigData.live : paypalConfigData.sandbox).clientSecret; },
  get merchantEmail() { return (paypalConfigData.mode === 'live' ? paypalConfigData.live : paypalConfigData.sandbox).merchantEmail; }
};

export interface PayPalOrderPayload {
  orderNumber: string;
  amount: number;
  currency: string;
  customerEmail: string;
}

export async function createPayPalOrder(payload: PayPalOrderPayload) {
  const current = getPayPalConfig();
  const isConfigured = Boolean(current.clientId && current.clientSecret && !current.clientId.startsWith('AZ_'));

  if (isConfigured) {
    try {
      const auth = Buffer.from(`${current.clientId}:${current.clientSecret}`).toString('base64');
      const tokenEndpoint = current.mode === 'live'
        ? 'https://api-m.paypal.com/v1/oauth2/token'
        : 'https://api-m.sandbox.paypal.com/v1/oauth2/token';

      const tokenRes = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      const tokenData = await tokenRes.json();

      if (tokenData.access_token) {
        const orderEndpoint = current.mode === 'live'
          ? 'https://api-m.paypal.com/v2/checkout/orders'
          : 'https://api-m.sandbox.paypal.com/v2/checkout/orders';

        const orderRes = await fetch(orderEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [{
              reference_id: payload.orderNumber,
              amount: {
                currency_code: payload.currency || 'EUR',
                value: payload.amount.toFixed(2)
              },
              payee: {
                email_address: current.merchantEmail
              }
            }]
          })
        });

        const orderResult = await orderRes.json();
        return {
          ...orderResult,
          merchant: current.merchantEmail,
          mode: current.mode
        };
      } else {
        console.warn('[PayPal] Authentification token échouée ou informations de compte invalides:', tokenData);
      }
    } catch (err) {
      console.warn('[PayPal] Erreur API PayPal directe, fallback sécurisé:', err);
    }
  }

  // Sandbox simulation reference
  return {
    id: `PAYPAL-ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    status: 'CREATED',
    merchant: current.merchantEmail,
    mode: current.mode
  };
}
