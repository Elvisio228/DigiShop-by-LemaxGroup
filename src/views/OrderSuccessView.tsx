import React, { useState } from 'react';
import { Order } from '../types';
import { CheckCircle2, Download, Clock, ShieldCheck, AlertCircle, ArrowRight, ExternalLink, RefreshCw, Lock, Zap } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface OrderSuccessViewProps {
  order: Order;
  onNavigate: (view: string, param?: string) => void;
}

export const OrderSuccessView: React.FC<OrderSuccessViewProps> = ({ order, onNavigate }) => {
  const { showToast } = useToast();
  const [currentOrder, setCurrentOrder] = useState<Order>(order);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const isPaid = currentOrder.paymentStatus === 'paid';

  const checkOrderStatus = async () => {
    setCheckingStatus(true);
    try {
      const res = await fetch(`/api/orders/${currentOrder.id}`);
      if (res.ok) {
        const updated = await res.json();
        setCurrentOrder(updated);
        if (updated.paymentStatus === 'paid') {
          showToast('✓ Confirmation IPN reçue ! Vos fichiers digitaux sont désormais débloqués.', 'success');
        } else {
          showToast('En attente de la notification IPN de la banque/passerelle...', 'info');
        }
      }
    } catch {
      showToast('Vérification effectuée.', 'info');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleDownload = async (productId: string, fileName: string) => {
    if (!isPaid) {
      showToast('Téléchargement bloqué : Le paiement est en attente de confirmation automatique par notification IPN.', 'error');
      return;
    }

    setDownloadingId(productId);
    showToast('Vérification des droits et préparation sécurisée du fichier...', 'info');

    try {
      const url = `/api/downloads/${currentOrder.downloadToken}/${productId}`;
      const res = await fetch(url);
      
      // STRICT IPN VERIFICATION: If not ok, read json error and abort immediately
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error || "Téléchargement refusé : La confirmation automatique de paiement (IPN) n'a pas encore été validée.";
        showToast(errMsg, 'error');
        return;
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      // Once downloaded at least once, refund is definitively blocked
      setCurrentOrder(prev => ({
        ...prev,
        downloadCount: (prev.downloadCount || 0) + 1,
        isRefundable: false
      }));

      showToast(`Téléchargement de ${fileName} démarré avec succès !`, 'success');

      // Envoi automatique de l'e-mail de confirmation
      if (currentOrder.customerEmail) {
        import('../lib/emailService').then(({ sendDownloadThankYouEmail }) => {
          sendDownloadThankYouEmail(currentOrder.customerEmail, currentOrder.customerName, fileName, currentOrder.orderNumber).catch(() => {});
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Échec du téléchargement', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      
      {/* Top Banner Status */}
      <div className={`p-8 rounded-3xl border text-center space-y-4 shadow-xl ${
        isPaid
          ? 'bg-gradient-to-b from-emerald-500/10 to-transparent border-emerald-500/30'
          : 'bg-gradient-to-b from-amber-500/10 to-transparent border-amber-500/30'
      }`}>
        <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
          isPaid ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'
        }`}>
          {isPaid ? <CheckCircle2 className="w-10 h-10" /> : <Clock className="w-10 h-10" />}
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-950 dark:text-white">
            {isPaid ? 'Paiement confirmé ! Votre commande est débloquée.' : 'Commande enregistrée — Notification IPN en attente'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            {isPaid
              ? `Merci pour votre achat, ${currentOrder.customerName}. Le paiement a été validé par notification IPN et vos fichiers sont prêts au téléchargement ci-dessous.`
              : `Votre commande a bien été enregistrée pour ${currentOrder.customerName}. Le téléchargement sera débloqué automatiquement dès réception de la notification bancaire IPN.`}
          </p>
        </div>

        {/* Order Details Tag & IPN verification */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <span>Numéro de commande :</span>
            <strong className="text-sky-600 dark:text-sky-400">{currentOrder.orderNumber}</strong>
          </div>
          {!isPaid && (
            <button
              onClick={checkOrderStatus}
              disabled={checkingStatus}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              title="Vérifier si la notification IPN a été reçue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingStatus ? 'animate-spin' : ''}`} />
              <span>{checkingStatus ? 'Vérification...' : 'Vérifier la confirmation de paiement'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Payment details reminder for Pending Mobile Money / IPN */}
      {!isPaid && (
        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Processus de notification automatique (IPN / Webhook) :</span>
          </div>
          <p className="leading-relaxed">
            Moyen de paiement : <strong className="uppercase">{currentOrder.paymentMethod}</strong>.
            {currentOrder.paymentDetails?.transactionRef && (
              <> Référence soumise : <strong className="font-mono">{currentOrder.paymentDetails.transactionRef}</strong>.</>
            )}
          </p>
          <p className="text-[11px] text-amber-800 dark:text-amber-300">
            🔒 <strong>Protection stricte des téléchargements :</strong> Les fichiers ne peuvent être téléchargés que lorsque la notification IPN de confirmation est reçue par la boutique.
          </p>
        </div>
      )}

      {/* Strict Anti-Refund Legal Notice */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3">
        <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-900 dark:text-white">
            Conditions de Vente & Politique Anti-Remboursement
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Conformément à la réglementation sur les contenus numériques dématérialisés, <strong>aucun remboursement n'est possible une fois que le fichier a été téléchargé</strong>. Le téléchargement entraîne l'exécution pleine et entière de la commande.
          </p>
        </div>
      </div>

      {/* Digital Downloads Hub */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold font-display text-slate-950 dark:text-white">
              Vos Produits Digitaux Téléchargeables ({currentOrder.items.length})
            </h2>
            <p className="text-xs text-slate-500">
              Accès protégé par jeton IPN sécurisé. Maximum {currentOrder.maxDownloads} téléchargements par produit.
            </p>
          </div>

          <div className="text-[11px] text-slate-400">
            Valide jusqu'au : {new Date(currentOrder.downloadExpiresAt).toLocaleDateString('fr-FR')}
          </div>
        </div>

        {/* Items List with Direct Download Button */}
        <div className="space-y-4">
          {currentOrder.items.map(item => (
            <div
              key={item.productId}
              className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-14 h-14 rounded-lg object-cover bg-slate-200 shrink-0"
                />
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{item.categoryLabel}</span>
                    <span>·</span>
                    <span className="font-mono">{item.fileDetails.fileName}</span>
                    <span>·</span>
                    <span>{item.fileDetails.fileSize}</span>
                  </div>
                  {currentOrder.downloadCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Fichier téléchargé ({currentOrder.downloadCount}x) — Commande non remboursable</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownload(item.productId, item.fileDetails.fileName)}
                  disabled={!isPaid || downloadingId === item.productId}
                  className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm ${
                    isPaid
                      ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {downloadingId === item.productId
                      ? 'Téléchargement...'
                      : isPaid
                      ? 'Télécharger le fichier'
                      : 'Verrouillé (IPN en attente)'}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Security & License Notice */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Fichiers hébergés sur stockage sécurisé privé.</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
          >
            <span>Retrouver dans mon compte</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Next Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs pt-4">
        <button
          type="button"
          onClick={() => onNavigate('catalog')}
          className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
        >
          Continuer vers la boutique
        </button>

        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold shadow-sm"
        >
          Accéder à mon espace client
        </button>
      </div>

    </div>
  );
};
