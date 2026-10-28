import React, { useEffect, useRef, useState } from 'react';
import { getPayPalActiveConfig, loadPayPalSdk, PayPalActiveConfig } from '../lib/payments/paypalClient';
import { ShieldCheck, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

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

  // Normalize charge currency (PayPal accepts EUR, USD, GBP, etc.)
  const normalizedCurrency = currency === 'USD' ? 'USD' : 'EUR';
  const formattedAmount = Number(amount).toFixed(2);

  useEffect(() => {
    let isMounted = true;

    async function initSdk() {
      setSdkLoading(true);
      setSdkError(null);
      try {
        const activeConfig = await getPayPalActiveConfig();
        if (!isMounted) return;
        setConfig(activeConfig);

        // In Live mode, a valid Client ID is strictly required
        if (activeConfig.mode === 'live' && !activeConfig.clientId) {
          setSdkLoading(false);
          return;
        }

        const effectiveClientId = activeConfig.clientId || (activeConfig.mode === 'sandbox' ? 'sb' : '');
        if (!effectiveClientId) {
          setSdkLoading(false);
          return;
        }

        const paypal = await loadPayPalSdk(effectiveClientId, normalizedCurrency);
        if (!isMounted || !containerRef.current) return;

        // Clear container before rendering
        containerRef.current.innerHTML = '';

        if (paypal && paypal.Buttons) {
          paypal
            .Buttons({
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
            })
            .render(containerRef.current);
        }

        setSdkLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        setSdkLoading(false);
        setSdkError(err.message || 'Impossible de charger le module de paiement PayPal.');
      }
    }

    initSdk();

    return () => {
      isMounted = false;
    };
  }, [orderNumber, formattedAmount, normalizedCurrency, customerEmail]);

  // Case 1: Unconfigured Live Mode
  if (config && config.mode === 'live' && !config.clientId) {
    return (
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2.5">
        <div className="flex items-center gap-2 font-bold">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Identifiant PayPal (Client ID) Requis</span>
        </div>
        <p className="leading-relaxed">
          Pour encaisser directement les paiements PayPal sur votre compte marchand{' '}
          <strong>{config.merchantEmail}</strong> en mode Production, renseignez votre{' '}
          <strong>Client ID PayPal</strong> dans le panneau d'administration.
        </p>
        <div className="pt-1 flex flex-wrap gap-2">
          <a
            href="/admin?tab=gateways"
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>Ouvrir l'onglet Passerelles en Admin</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  // Case 2: Loading SDK
  if (sdkLoading) {
    return (
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
        <RefreshCw className="w-4 h-4 text-sky-500 animate-spin" />
        <span>Connexion sécurisée aux serveurs PayPal...</span>
      </div>
    );
  }

  // Case 3: Error Loading SDK
  if (sdkError) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 space-y-2">
        <div className="flex items-center gap-2 font-bold">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Erreur de chargement PayPal</span>
        </div>
        <p className="leading-relaxed">{sdkError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Container where the official PayPal buttons are mounted */}
      <div ref={containerRef} className="min-h-[44px]" />

      <p className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span>Portail officiel PayPal • Chiffrement 256-bit • Protection des achats</span>
      </p>
    </div>
  );
};
