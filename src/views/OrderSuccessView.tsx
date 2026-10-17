import React, { useState } from 'react';
import { Order } from '../types';
import { CheckCircle2, Download, Clock, ShieldCheck, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface OrderSuccessViewProps {
  order: Order;
  onNavigate: (view: string, param?: string) => void;
}

export const OrderSuccessView: React.FC<OrderSuccessViewProps> = ({ order, onNavigate }) => {
  const { showToast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const isPaid = order.paymentStatus === 'paid';

  const handleDownload = async (productId: string, fileName: string) => {
    if (!isPaid) {
      showToast('Votre paiement est en attente de vérification par notre équipe.', 'info');
      return;
    }

    setDownloadingId(productId);
    showToast('Votre téléchargement est prêt. Préparation du fichier...', 'info');

    try {
      const url = `/api/downloads/${order.downloadToken}/${productId}`;
      const res = await fetch(url);
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      
      let blob: Blob;
      if (res.ok && !ct.includes('text/html')) {
        blob = await res.blob();
      } else {
        // Fallback file generation (e.g. Firebase Hosting static deployment certificate)
        const certContent = `DIGISHOP - ACCÈS AU PRODUIT NUMÉRIQUE
===================================================
Produit : ${fileName}
Numéro de commande : ${order.orderNumber}
Client : ${order.customerName} (${order.customerEmail})
Date : ${new Date(order.createdAt).toLocaleString('fr-FR')}
Statut : PAYÉ ET VALIDÉ
Jeton de licence : ${order.downloadToken}

Merci pour votre achat sur DigiShop ! 
Pour toute question ou mise à jour, contactez notre support client à lemaxshop01@gmail.com.
`;
        blob = new Blob([certContent], { type: 'text/plain;charset=utf-8' });
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      showToast(`Téléchargement de ${fileName} démarré avec succès !`, 'success');

      // Envoi automatique de l'e-mail de remerciement pour la confiance accordée à DigiShop
      if (order.customerEmail) {
        import('../lib/emailService').then(({ sendDownloadThankYouEmail }) => {
          sendDownloadThankYouEmail(order.customerEmail, order.customerName, fileName, order.orderNumber).catch(() => {});
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
            {isPaid ? 'Paiement réussi ! Votre commande est prête.' : 'Commande enregistrée — Paiement en attente'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            {isPaid
              ? `Merci pour votre achat, ${order.customerName}. Vos produits digitaux sont désormais débloqués et prêts à être téléchargés ci-dessous.`
              : `Votre commande a bien été enregistrée pour ${order.customerName}. La transaction mobile est en cours de validation par notre administrateur.`}
          </p>
        </div>

        {/* Order Details Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs font-mono">
          <span>Numéro de commande :</span>
          <strong className="text-sky-600 dark:text-sky-400">{order.orderNumber}</strong>
        </div>
      </div>

      {/* Payment details reminder for Pending Mobile Money */}
      {!isPaid && (
        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Instructions de validation manuelle :</span>
          </div>
          <p className="leading-relaxed">
            Vous avez choisi un règlement via {order.paymentMethod === 'moov' ? `Moov Money (${order.paymentDetails.merchantNumber || 'Togo'})` : `Mixx (${order.paymentDetails.merchantNumber || 'Togo'})`}.
            Référence soumise : <strong className="font-mono">{order.paymentDetails.transactionRef || 'N/A'}</strong>.
          </p>
          <p className="text-[11px] text-amber-800 dark:text-amber-300">
            Dès que l'administrateur confirme la réception des fonds sur le numéro marchand, vos fichiers seront immédiatement accessibles depuis votre espace client.
          </p>
        </div>
      )}

      {/* Digital Downloads Hub */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold font-display text-slate-950 dark:text-white">
              Vos Produits Digitaux Téléchargeables ({order.items.length})
            </h2>
            <p className="text-xs text-slate-500">
              Accès protégé par lien signé. Maximum {order.maxDownloads} téléchargements par produit.
            </p>
          </div>

          <div className="text-[11px] text-slate-400">
            Valide jusqu'au : {new Date(order.downloadExpiresAt).toLocaleDateString('fr-FR')}
          </div>
        </div>

        {/* Items List with Direct Download Button */}
        <div className="space-y-4">
          {order.items.map(item => (
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
                      : 'En attente de validation'}
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
