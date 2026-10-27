/**
 * Module d'Intégration PayPal pour Digishop
 * Compte marchand officiel : lemaxshop01@gmail.com
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
  clientId: process.env.PAYPAL_SANDBOX_CLIENT_ID || '',
  clientSecret: process.env.PAYPAL_SANDBOX_CLIENT_SECRET || '',
  merchantEmail: 'lemaxshop01@gmail.com'
};

const DEFAULT_LIVE: PayPalCredentials = {
  clientId: process.env.PAYPAL_CLIENT_ID || '',
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
  merchantEmail: 'lemaxshop01@gmail.com'
};

function loadPayPalConfig(): PayPalConfigData {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.sandbox && parsed.live) {
        return {
          mode: parsed.mode || 'live',
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
    mode: (process.env.PAYPAL_MODE as 'sandbox' | 'live') || 'live',
    sandbox: { ...DEFAULT_SANDBOX },
    live: {
      clientId: process.env.PAYPAL_CLIENT_ID || '',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
      merchantEmail: process.env.PAYPAL_MERCHANT_EMAIL || 'lemaxshop01@gmail.com'
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
  returnUrl?: string;
  cancelUrl?: string;
}

export async function getPayPalAccessToken(): Promise<{ token?: string; error?: string }> {
  const current = getPayPalConfig();
  const active = current.mode === 'live' ? current.live : current.sandbox;

  if (!active.clientId || !active.clientSecret) {
    return { error: 'Clés API PayPal non configurées.' };
  }

  try {
    const auth = Buffer.from(`${active.clientId}:${active.clientSecret}`).toString('base64');
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
      return { token: tokenData.access_token };
    }
    return { error: tokenData.error_description || tokenData.error || 'Échec d\'authentification PayPal' };
  } catch (err: any) {
    return { error: err.message || 'Erreur réseau PayPal OAuth' };
  }
}

export async function createPayPalOrder(payload: PayPalOrderPayload) {
  const current = getPayPalConfig();
  const isConfigured = Boolean(current.clientId && current.clientSecret && !current.clientId.startsWith('AZ_'));

  if (!isConfigured) {
    if (current.mode === 'live') {
      return {
        success: false,
        error: 'Identifiants API PayPal (Client ID / Secret) manquants ou non configurés en mode Live.',
        mode: current.mode
      };
    }
    // Sandbox without keys
    return {
      success: true,
      id: `PAYPAL-TEST-${Date.now()}`,
      status: 'CREATED',
      approveUrl: '',
      isSimulated: true,
      merchant: current.merchantEmail,
      mode: current.mode
    };
  }

  try {
    const { token, error: tokenError } = await getPayPalAccessToken();
    if (!token) {
      return {
        success: false,
        error: `Erreur d'authentification PayPal (${tokenError || 'Vérifiez vos clés API en admin'})`,
        mode: current.mode
      };
    }

    const orderEndpoint = current.mode === 'live'
      ? 'https://api-m.paypal.com/v2/checkout/orders'
      : 'https://api-m.sandbox.paypal.com/v2/checkout/orders';

    const orderRes = await fetch(orderEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: payload.orderNumber,
          custom_id: payload.orderNumber,
          invoice_id: payload.orderNumber,
          description: `Commande DigiShop ${payload.orderNumber}`,
          amount: {
            currency_code: payload.currency || 'EUR',
            value: Number(payload.amount).toFixed(2)
          },
          payee: {
            email_address: current.merchantEmail
          }
        }],
        application_context: {
          brand_name: 'DigiShop by Lemax Group',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          ...(payload.returnUrl ? { return_url: payload.returnUrl } : {}),
          ...(payload.cancelUrl ? { cancel_url: payload.cancelUrl } : {})
        }
      })
    });

    const orderResult = await orderRes.json();
    if (orderResult.id) {
      const approveLink = orderResult.links?.find((l: any) => l.rel === 'approve' || l.rel === 'payer-action');
      return {
        success: true,
        id: orderResult.id,
        status: orderResult.status,
        approveUrl: approveLink ? approveLink.href : '',
        links: orderResult.links,
        merchant: current.merchantEmail,
        mode: current.mode
      };
    } else {
      return {
        success: false,
        error: orderResult.message || orderResult.details?.[0]?.description || 'Création de commande PayPal rejetée',
        details: orderResult,
        mode: current.mode
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: `Erreur de connexion à l'API PayPal: ${err.message}`,
      mode: current.mode
    };
  }
}

/**
 * Capture stricte d'une commande PayPal côté serveur
 * Ne valide et ne débloque le téléchargement QUE si PayPal confirme le statut COMPLETED
 */
export async function capturePayPalOrder(orderId: string): Promise<{
  success: boolean;
  status: string;
  captureId?: string;
  orderNumber?: string;
  amount?: string;
  currency?: string;
  error?: string;
  raw?: any;
}> {
  if (!orderId) {
    return { success: false, status: 'INVALID_ID', error: 'Identifiant de commande PayPal manquant.' };
  }

  const current = getPayPalConfig();
  const isConfigured = Boolean(current.clientId && current.clientSecret && !current.clientId.startsWith('AZ_'));

  if (!isConfigured) {
    if (current.mode === 'live') {
      return {
        success: false,
        status: 'NOT_CONFIGURED',
        error: 'Passerelle PayPal Live non configurée. Clés requises pour capturer les paiements.'
      };
    }
    // In sandbox test without keys, refuse automatic unlock for safety
    return {
      success: false,
      status: 'SANDBOX_UNCONFIGURED',
      error: 'Veuillez renseigner vos clés API PayPal dans l\'espace administration.'
    };
  }

  try {
    const { token, error: tokenError } = await getPayPalAccessToken();
    if (!token) {
      return { success: false, status: 'AUTH_FAILED', error: tokenError || 'Authentification PayPal impossible' };
    }

    const captureEndpoint = current.mode === 'live'
      ? `https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`
      : `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`;

    const captureRes = await fetch(captureEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const captureData = await captureRes.json();
    console.log('[PayPal Capture Direct API]:', JSON.stringify(captureData).substring(0, 300));

    // Cas 1 : Capture réussie en direct
    if (captureData.status === 'COMPLETED') {
      const captureObj = captureData.purchase_units?.[0]?.payments?.captures?.[0];
      const captureId = captureObj?.id || captureData.id;
      const refId = captureData.purchase_units?.[0]?.reference_id || captureData.purchase_units?.[0]?.custom_id;
      const amountVal = captureObj?.amount?.value;
      const curCode = captureObj?.amount?.currency_code;

      return {
        success: true,
        status: 'COMPLETED',
        captureId,
        orderNumber: refId,
        amount: amountVal,
        currency: curCode,
        raw: captureData
      };
    }

    // Cas 2 : Déjà capturée (idempotence) -> Vérifier le statut de la commande
    if (captureData.name === 'UNPROCESSABLE_ENTITY' || captureData.name === 'ORDER_ALREADY_CAPTURED' || captureData.details?.some((d: any) => d.issue === 'ORDER_ALREADY_CAPTURED')) {
      const orderInfo = await verifyPayPalOrder(orderId);
      if (orderInfo.isPaid) {
        return {
          success: true,
          status: 'COMPLETED',
          captureId: orderInfo.captureId || orderId,
          orderNumber: orderInfo.orderNumber,
          amount: orderInfo.amount,
          currency: orderInfo.currency,
          raw: orderInfo.raw
        };
      }
    }

    return {
      success: false,
      status: captureData.status || captureData.name || 'FAILED',
      error: captureData.message || captureData.details?.[0]?.description || 'Capture PayPal non autorisée ou refusée',
      raw: captureData
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'EXCEPTION',
      error: `Erreur interne lors de la capture: ${err.message}`
    };
  }
}

/**
 * Interroger directement PayPal pour connaître le statut exact d'un ordre
 */
export async function verifyPayPalOrder(orderId: string): Promise<{
  isPaid: boolean;
  status: string;
  captureId?: string;
  orderNumber?: string;
  amount?: string;
  currency?: string;
  raw?: any;
}> {
  const current = getPayPalConfig();
  const { token } = await getPayPalAccessToken();
  if (!token) {
    return { isPaid: false, status: 'AUTH_FAILED' };
  }

  try {
    const checkEndpoint = current.mode === 'live'
      ? `https://api-m.paypal.com/v2/checkout/orders/${orderId}`
      : `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}`;

    const res = await fetch(checkEndpoint, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    const isCompleted = data.status === 'COMPLETED';
    const captureObj = data.purchase_units?.[0]?.payments?.captures?.[0];
    const captureId = captureObj?.id;
    const refId = data.purchase_units?.[0]?.reference_id || data.purchase_units?.[0]?.custom_id;

    return {
      isPaid: isCompleted,
      status: data.status || 'UNKNOWN',
      captureId,
      orderNumber: refId,
      amount: captureObj?.amount?.value,
      currency: captureObj?.amount?.currency_code,
      raw: data
    };
  } catch {
    return { isPaid: false, status: 'ERROR' };
  }
}

/**
 * Valider une notification IPN PayPal (Instant Payment Notification / Webhook)
 */
export async function verifyPayPalIPN(body: any): Promise<{ valid: boolean; status: string; orderRef?: string; txnId?: string }> {
  try {
    const current = paypalConfigData;
    const isSandbox = current.mode === 'sandbox';

    // 1. Check if this is a PayPal REST Webhook (event_type format)
    if (body?.event_type) {
      const eventType = String(body.event_type);
      const resource = body.resource || {};
      const status = (resource.status || '').toUpperCase();
      const orderRef = (resource.custom_id || resource.invoice_id || resource.reference_id || '').toString();
      const txnId = (resource.id || body.id || '').toString();

      if (eventType === 'PAYMENT.CAPTURE.COMPLETED' && status === 'COMPLETED') {
        return {
          valid: true,
          status: 'Completed',
          orderRef,
          txnId
        };
      } else if (eventType === 'CHECKOUT.ORDER.APPROVED') {
        return {
          valid: true,
          status: 'Approved',
          orderRef,
          txnId
        };
      }
    }

    // 2. Traditional IPN validation via webscr
    const verifyUrl = isSandbox 
      ? 'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr'
      : 'https://ipnpb.paypal.com/cgi-bin/webscr';

    let postBody = '';
    if (typeof body === 'string') {
      postBody = `cmd=_notify-validate&${body}`;
    } else if (body && typeof body === 'object') {
      const params = new URLSearchParams();
      params.append('cmd', '_notify-validate');
      for (const [k, v] of Object.entries(body)) {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          params.append(k, String(v));
        }
      }
      postBody = params.toString();
    }

    const orderRef = (body?.custom || body?.invoice || body?.resource?.custom_id || body?.resource?.invoice_id || body?.orderNumber || body?.orderId || '').toString();
    const txnId = (body?.txn_id || body?.resource?.id || body?.id || '').toString();
    const status = (body?.payment_status || body?.resource?.status || body?.status || '').toString();

    try {
      const res = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 
          'User-Agent': 'Digishop-IPN-Verifier',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: postBody
      });
      const text = await res.text();
      const isVerified = text.trim() === 'VERIFIED';
      return {
        valid: isVerified,
        status,
        orderRef,
        txnId
      };
    } catch {
      // In live mode, never return valid: true if verification failed
      return {
        valid: false,
        status: status || 'Failed',
        orderRef,
        txnId
      };
    }
  } catch {
    return { valid: false, status: 'error' };
  }
}
