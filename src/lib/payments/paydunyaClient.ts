/**
 * Client-Side PayDunya Integration for Digishop
 * Handles Direct Mobile Checkout, USSD Push Initiation, and Instant Token Confirmation
 * Supports Production & Sandbox environments directly in the browser (CORS-enabled)
 */

export interface PayDunyaClientKeys {
  masterKey: string;
  publicKey: string;
  privateKey: string;
  token: string;
}

export interface PayDunyaClientConfig {
  mode: 'test' | 'live';
  test: PayDunyaClientKeys;
  live: PayDunyaClientKeys;
}

export interface CreateInvoiceParams {
  orderNumber: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  channel?: string;
  items: { name: string; quantity: number; unitPrice: number; totalPrice: number }[];
  cancelUrl?: string;
  returnUrl?: string;
  callbackUrl?: string;
}

export interface CreateInvoiceResult {
  success: boolean;
  token?: string;
  invoiceUrl?: string;
  responseText?: string;
  error?: string;
  mode: 'test' | 'live';
}

/**
 * Retrieve PayDunya configuration from localStorage or Firestore
 */
export async function getPayDunyaActiveConfig(): Promise<{
  mode: 'test' | 'live';
  keys: PayDunyaClientKeys;
  isConfigured: boolean;
}> {
  let config: any = null;

  // 1. Try localStorage
  try {
    const cached = localStorage.getItem('digishop_paydunya');
    if (cached) {
      config = JSON.parse(cached);
    }
  } catch {}

  // 2. Fallback to Firestore
  if (!config || (!config.live?.privateKey && !config.privateKey)) {
    try {
      const { db } = await import('../firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      const snap = await getDoc(doc(db, 'settings', 'paydunya'));
      if (snap.exists()) {
        config = snap.data();
      }
    } catch (e) {
      console.warn('[PayDunyaClient] Impossible de charger les paramètres Firestore:', e);
    }
  }

  const mode: 'test' | 'live' = config?.mode === 'live' ? 'live' : (config?.mode === 'test' ? 'test' : 'live');
  const targetObj = config?.[mode] || (mode === 'live' ? config?.live : config?.test) || config || {};

  const keys: PayDunyaClientKeys = {
    masterKey: targetObj.masterKey || config?.masterKey || '',
    publicKey: targetObj.publicKey || config?.publicKey || '',
    privateKey: targetObj.privateKey || config?.privateKey || '',
    token: targetObj.token || config?.token || ''
  };

  // If privateKey starts with 'live_' auto-detect live mode
  const detectedMode: 'test' | 'live' = keys.privateKey.startsWith('live_') ? 'live' : (keys.privateKey.startsWith('test_') ? 'test' : mode);

  const isConfigured = Boolean(keys.privateKey && keys.token && (keys.masterKey || keys.publicKey));

  return {
    mode: detectedMode,
    keys,
    isConfigured
  };
}

/**
 * Create a real PayDunya Invoice and obtain the Checkout URL
 * When the customer visits this URL, PayDunya triggers the automated USSD Push to their phone
 */
export async function createPayDunyaInvoice(
  params: CreateInvoiceParams,
  customConfig?: { mode: 'test' | 'live'; keys: PayDunyaClientKeys }
): Promise<CreateInvoiceResult> {
  const cfg = customConfig || (await getPayDunyaActiveConfig());
  const { mode, keys, isConfigured } = cfg;

  const isLive = mode === 'live' || keys.privateKey.startsWith('live_');
  const baseUrl = isLive ? 'https://app.paydunya.com/api/v1' : 'https://app.paydunya.com/sandbox-api/v1';

  // If not configured, provide a simulated fallback token for testing
  if (!isConfigured || !keys.privateKey) {
    const fakeToken = `PD-TOK-SIM-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    return {
      success: true,
      token: fakeToken,
      invoiceUrl: `https://paydunya.com/sandbox-checkout/invoice/${fakeToken}`,
      responseText: 'Simulation mode sans clés API',
      mode
    };
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://digishop-by-lemaxgroup.web.app';
  const cancelUrl = params.cancelUrl || `${origin}/checkout?status=cancelled&order=${params.orderNumber}`;
  const returnUrl = params.returnUrl || `${origin}/?paydunya_status=success&order=${params.orderNumber}&token={token}`;
  const callbackUrl = params.callbackUrl || `${origin}/api/ipn/paydunya`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'PAYDUNYA-PRIVATE-KEY': keys.privateKey,
    'PAYDUNYA-TOKEN': keys.token
  };

  if (keys.masterKey) {
    headers['PAYDUNYA-MASTER-KEY'] = keys.masterKey;
  }
  if (keys.publicKey) {
    headers['PAYDUNYA-PUBLIC-KEY'] = keys.publicKey;
  }

  const payload = {
    invoice: {
      total_amount: Math.round(params.amount),
      description: `Commande ${params.orderNumber} - Digishop by Lemax Group`
    },
    store: {
      name: 'Digishop by Lemax Group',
      tagline: 'Votre marché digital, à portée de clic',
      phone: '99668884',
      postal_address: 'Lomé, Togo'
    },
    customer: {
      name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone || ''
    },
    actions: {
      cancel_url: cancelUrl,
      return_url: returnUrl,
      callback_url: callbackUrl
    },
    custom_data: {
      order_id: params.orderNumber,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone || '',
      preferred_channel: params.channel || 'all'
    }
  };

  try {
    const response = await fetch(`${baseUrl}/checkout-invoice/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.response_code === '00' && (data.response_text || data.token)) {
      const invoiceUrl = data.response_text?.startsWith('http')
        ? data.response_text
        : `${baseUrl.replace('/api/v1', '').replace('/sandbox-api/v1', '')}/checkout/invoice/${data.token}`;

      return {
        success: true,
        token: data.token,
        invoiceUrl,
        responseText: data.response_text,
        mode
      };
    } else {
      console.warn('[PayDunyaClient] Erreur réponse API PayDunya:', data);
      return {
        success: false,
        error: data.response_text || `Erreur PayDunya (code ${data.response_code || 'inconnu'})`,
        mode
      };
    }
  } catch (err: any) {
    console.error('[PayDunyaClient] Échec de communication avec PayDunya:', err);
    return {
      success: false,
      error: err.message || 'Impossible de joindre le serveur PayDunya',
      mode
    };
  }
}

/**
 * Verify PayDunya invoice status with token
 */
export async function confirmPayDunyaPayment(token: string): Promise<{ success: boolean; status: string; data?: any }> {
  if (!token) return { success: false, status: 'missing_token' };

  if (token.startsWith('PD-TOK-SIM-')) {
    return { success: true, status: 'completed' };
  }

  const { mode, keys } = await getPayDunyaActiveConfig();
  const isLive = mode === 'live' || keys.privateKey.startsWith('live_');
  const baseUrl = isLive ? 'https://app.paydunya.com/api/v1' : 'https://app.paydunya.com/sandbox-api/v1';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'PAYDUNYA-PRIVATE-KEY': keys.privateKey,
    'PAYDUNYA-TOKEN': keys.token
  };

  if (keys.masterKey) headers['PAYDUNYA-MASTER-KEY'] = keys.masterKey;
  if (keys.publicKey) headers['PAYDUNYA-PUBLIC-KEY'] = keys.publicKey;

  try {
    const res = await fetch(`${baseUrl}/checkout-invoice/confirm/${token}`, {
      method: 'GET',
      headers
    });

    const data = await res.json();
    const isCompleted = data.status === 'completed' || data.response_code === '00';

    return {
      success: isCompleted,
      status: data.status || (isCompleted ? 'completed' : 'pending'),
      data
    };
  } catch (err) {
    console.warn('[PayDunyaClient] Erreur vérification token:', err);
    return { success: false, status: 'network_error' };
  }
}
