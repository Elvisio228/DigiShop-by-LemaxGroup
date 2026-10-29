import React, { useEffect, useRef, useState } from 'react';
import { getPayPalActiveConfig, loadPayPalSdk, PayPalActiveConfig } from '../lib/payments/paypalClient';
import { ShieldCheck, AlertCircle, RefreshCw, ExternalLink, Lock } from 'lucide-react';

interface PayPalSmartButtonsProps {
  orderNumber: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  onSuccess: (details: {
    paypalOrderId: string;
    paypalCaptureId?: string;
    payerEmail?: string;
    status: string;
  }) => Promise<void>;
  onError: (errorMsg: string) => void;
  onCancel?: () => void;
}

export const PayPalSmartButtons: React.FC<PayPalSmartButtonsProps> = ({
  orderNumber,
  amount,
  currency,
  customerEmail,
  customerName,
  onSuccess,
  onError,
  onCancel
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<PayPalActiveConfig | null>(null);
  const [sdkLoading, setSdkLoading] = useState(true);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [buttonsRendered, setButtonsRendered] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Normalize charge currency (PayPal accepts EUR, USD, GBP, etc.)
  const normalizedCurrency = currency === 'USD' ? 'USD' : 'EUR';
  const formattedAmount = Number(amount).toFixed(2);

  // Direct PayPal redirect handler (official standard & REST checkout flow)
  const handleDirectPayPalRedirect = async () => {
    setRedirecting(true);
    try {
      const { safeFetchJson } = await import('../lib/apiClient');
      const res = await safeFetchJson<any>('/api/payments/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          amount,
          currency: normalizedCurrency,
          customerEmail
        })
      });

      if (res.ok && res.data?.approveUrl) {
        window.location.href = res.data.approveUrl;
        return;
      }

      if (res.data?.error) {
        setRedirecting(false);
        onError(res.data.error);
      } else {
        // Fallback: Official PayPal checkout gateway with merchant account
        const merchant = config?.merchantEmail || 'lemaxshop01@gmail.com';
        const fallbackUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(
          merchant
        )}&item_name=${encodeURIComponent(
          `Commande DigiShop ${orderNumber}`
        )}&amount=${formattedAmount}&currency_code=${normalizedCurrency}&invoice=${encodeURIComponent(
          orderNumber
        )}&no_shipping=1&return=${encodeURIComponent(
          window.location.origin + `/?paypal_result=success&order=${orderNumber}`
        )}&cancel_return=${encodeURIComponent(
          window.location.origin + `/?paypal_result=cancelled&order=${orderNumber}`
        )}`;
        window.location.href = fallbackUrl;
      }
    } catch (err: any) {
      setRedirecting(false);
      onError(err?.message || 'Erreur lors de la connexion directe aux serveurs PayPal.');
    }
  };

  useEffect(() => {
    let isMounted = true;
    let timer: any = null;

    async function initSdk() {
      setSdkLoading(true);
      setSdkError(null);
      setButtonsRendered(false);

      try {
        const activeConfig = await getPayPalActiveConfig();
        if (!isMounted) return;
        setConfig(activeConfig);

        // In Live mode without client ID: don't hang, offer immediate direct redirect and setup instructions
        if (activeConfig.mode === 'live' && !activeConfig.clientId) {
          setSdkLoading(false);
          return;
        }

        const effectiveClientId = activeConfig.clientId || (activeConfig.mode === 'sandbox' ? 'sb' : '');
        if (!effectiveClientId) {
          setSdkLoading(false);
          return;
        }

        // Set safety timeout to prevent infinite spinner
        timer = setTimeout(() => {
          if (isMounted && !buttonsRendered) {
            setSdkLoading(false);
          }
        }, 5000);

        const paypal = await loadPayPalSdk(effectiveClientId, normalizedCurrency);
        if (!isMounted) return;

        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        if (paypal && paypal.Buttons && containerRef.current) {
          const buttons = paypal.Buttons({
            style: {
              layout: 'vertical',
              color: 'gold',
              shape: 'rect',
              label: 'pay',
              height: 44
            },
            createOrder: (_data: any, actions: any) => {
              return actions.order.create({
                intent: 'CAPTURE',
                purchase_units: [
                  {
                    reference_id: orderNumber,
                    custom_id: orderNumber,
                    description: `Commande DigiShop ${orderNumber}`,
                    amount: {
                      currency_code: normalizedCurrency,
                      value: formattedAmount
                    },
                    payee: {
                      email_address: activeConfig.merchantEmail
                    }
                  }
                ],
                application_context: {
                  brand_name: 'DigiShop by Lemax Group',
                  shipping_preference: 'NO_SHIPPING',
                  user_action: 'PAY_NOW'
                }
              });
            },
            onApprove: async (_data: any, actions: any) => {
              try {
                const captureDetails = await actions.order.capture();
                if (captureDetails.status === 'COMPLETED') {
                  const captureId =
                    captureDetails.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
                    captureDetails.id;
                  await onSuccess({
                    paypalOrderId: captureDetails.id,
                    paypalCaptureId: captureId,
                    payerEmail: captureDetails.payer?.email_address || customerEmail,
                    status: 'COMPLETED'
                  });
                } else {
                  onError(
                    `Paiement PayPal non finalisé (Statut: ${captureDetails.status || 'En attente'}).`
                  );
                }
              } catch (captureErr: any) {
                onError(captureErr?.message || 'Échec lors de la capture du paiement PayPal.');
              }
            },
            onCancel: () => {
              if (onCancel) onCancel();
            },
            onError: (err: any) => {
              const message = err?.message || 'Erreur lors de la communication avec PayPal.';
              onError(message);
            }
          });

          if (isMounted && containerRef.current) {
            await buttons.render(containerRef.current);
            setButtonsRendered(true);
            setSdkLoading(false);
          }
        } else {
          setSdkLoading(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setSdkLoading(false);
        setSdkError(err.message || 'Impossible de charger le module interactif PayPal.');
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    initSdk();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [orderNumber, formattedAmount, normalizedCurrency, customerEmail]);

  return (
    <div className="space-y-3 w-full">
      {/* Case 1: Unconfigured Live Mode Banner */}
      {config && config.mode === 'live' && !config.clientId && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2.5">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Mode Production PayPal Activé</span>
          </div>
          <p className="leading-relaxed">
            Pour finaliser automatiquement les paiements par boutons intégrés sur votre compte marchand{' '}
            <strong>{config.merchantEmail}</strong>, vous pouvez renseigner votre{' '}
            <strong>Client ID PayPal</strong> dans l'administration.
          </p>
          <div className="pt-1 flex flex-wrap gap-2">
            <a
              href="/admin?tab=gateways"
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Configurer le Client ID en Admin</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Case 2: Loading State indicator (rendered ABOVE the container, not replacing it) */}
      {sdkLoading && (
        <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50/70 dark:bg-sky-950/40 flex items-center justify-center gap-2.5 text-xs text-sky-800 dark:text-sky-300">
          <RefreshCw className="w-4 h-4 text-sky-500 animate-spin" />
          <span>Connexion sécurisée aux serveurs PayPal...</span>
        </div>
      )}

      {/* Case 3: Error Banner with Retry */}
      {sdkError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Connexion interactive indisponible</span>
          </div>
          <p className="leading-relaxed text-[11px]">{sdkError}</p>
        </div>
      )}

      {/* Official PayPal Buttons Container (ALWAYS preserved in the DOM) */}
      <div
        ref={containerRef}
        className={`min-h-[44px] transition-opacity duration-200 ${
          sdkLoading && !buttonsRendered ? 'hidden' : 'block'
        }`}
      />

      {/* Direct Connection & Fallback Button: ALWAYS available to guarantee the user can connect to PayPal */}
      {(!buttonsRendered || sdkError || (config?.mode === 'live' && !config?.clientId)) && (
        <button
          type="button"
          disabled={redirecting}
          onClick={handleDirectPayPalRedirect}
          className="w-full py-3 px-4 rounded-xl bg-[#0070BA] hover:bg-[#003087] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
        >
          {redirecting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Connexion à PayPal en cours...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Payer avec PayPal (Connexion Directe)</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </>
          )}
        </button>
      )}

      <p className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1 pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span>Portail officiel PayPal • Chiffrement 256-bit • Protection des achats</span>
      </p>
    </div>
  );
};
