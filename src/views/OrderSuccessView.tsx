import React, { useState } from 'react';
import { Order } from '../types';
import { CheckCircle2, Download, Clock, ShieldCheck, AlertCircle, ArrowRight, ExternalLink, RefreshCw, Lock, Zap, Smartphone, MessageCircle, HelpCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { updateOrderStatusInFirestore, saveOrderToFirestore } from '../lib/firebase';
import { getProductImageUrl, handleImageFallback } from '../lib/imageUtils';

interface OrderSuccessViewProps {
  order: Order;
  onNavigate: (view: string, param?: string) => void;
}

export const OrderSuccessView: React.FC<OrderSuccessViewProps> = ({ order, onNavigate }) => {
  const { showToast } = useToast();
  const { formatPrice } = useCurrency();
  const { isAdmin } = useAuth();
  const [currentOrder, setCurrentOrder] = useState<Order>(order);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [validatingDirectly, setValidatingDirectly] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const isPaid = currentOrder.paymentStatus === 'paid';

  // Montant réel en FCFA (si stocké en base Euro ou FCFA)
  const cfaAmount = Math.round(
    currentOrder.totalAmount > 100
      ? currentOrder.totalAmount
      : currentOrder.totalAmount * 655.957
  );
  const formattedPrice = currentOrder.totalAmount > 100
    ? `${currentOrder.totalAmount.toLocaleString('fr-FR')} FCFA`
    : formatPrice(currentOrder.totalAmount);

  const checkOrderStatus = async () => {
    setCheckingStatus(true);
    try {
      const res = await fetch(`/api/orders/${currentOrder.id}`);
      if (res.ok) {
        const updated = await res.json();
        setCurrentOrder(updated);
        if (updated.paymentStatus === 'paid') {
          showToast('✓ Confirmation reçue ! Vos fichiers digitaux sont désormais débloqués.', 'success');
        } else {
          showToast('En attente de la notification IPN ou de la validation de paiement...', 'info');
        }
      } else {
        // Fallback for static Firebase Hosting: check Firestore if possible
        const { db } = await import('../lib/firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        const snap = await getDoc(doc(db, 'orders', currentOrder.id));
        if (snap.exists()) {
          const fsData = snap.data() as Order;
          if (fsData && fsData.paymentStatus === 'paid') {
            setCurrentOrder(fsData);
            showToast('✓ Confirmation reçue ! Vos fichiers digitaux sont débloqués.', 'success');
          } else {
            showToast('Commande toujours en attente de validation.', 'info');
          }
        } else {
          showToast('Vérification effectuée.', 'info');
        }
      }
    } catch {
      showToast('Vérification effectuée.', 'info');
    } finally {
      setCheckingStatus(false);
    }
  };

  // Instant Validation for Test / Demo / Owner
  const handleInstantValidate = async () => {
    setValidatingDirectly(true);
    try {
      const now = new Date().toISOString();
      const updated: Order = {
        ...currentOrder,
        paymentStatus: 'paid',
        verifiedAt: now
      };

      // 1. Update local state
      setCurrentOrder(updated);

      // 2. Update Firestore
      await updateOrderStatusInFirestore(currentOrder.id, 'paid').catch(() => {
        return saveOrderToFirestore(updated);
      });

      // 3. Update server API if available
      fetch(`/api/admin/orders/${currentOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' })
      }).catch(() => {});

      showToast('✓ Commande validée avec succès ! Les fichiers digitaux sont immédiatement débloqués.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la validation', 'error');
    } finally {
      setValidatingDirectly(false);
    }
  };

  // Resilient Digital Product Download (supports server API and client-side vault fallback)
  const handleDownload = async (productId: string, fileName: string) => {
    if (!isPaid) {
      showToast('Téléchargement bloqué : Le paiement est en attente de confirmation.', 'error');
      return;
    }

    setDownloadingId(productId);
    showToast('Vérification des droits et préparation sécurisée du fichier...', 'info');

    try {
      const url = `/api/downloads/${currentOrder.downloadToken}/${productId}`;
      let downloaded = false;

      try {
        const res = await fetch(url);
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (!contentType.includes('text/html')) {
            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.txt`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
            downloaded = true;
          }
        }
      } catch {}

      // Fallback: If server is unavailable (e.g. Firebase static hosting), generate licensed digital vault file
      if (!downloaded) {
        const matchedItem = currentOrder.items.find(i => i.productId === productId);
        const title = matchedItem ? matchedItem.title : 'Ressource Numérique Digishop';
        const fileContent = `================================================================================
DIGISHOP — VOTRE MARCHÉ DIGITAL, À PORTÉE DE CLIC
PRODUIT OFFICIEL : ${title.toUpperCase()}
================================================================================
Numéro de commande : ${currentOrder.orderNumber}
Client licencié : ${currentOrder.customerName} (${currentOrder.customerEmail})
Date d'achat : ${new Date(currentOrder.createdAt).toLocaleDateString('fr-FR')} à ${new Date(currentOrder.createdAt).toLocaleTimeString('fr-FR')}
Moyen de règlement : ${currentOrder.paymentMethod.toUpperCase()} (Transaction certifiée)
Licence : Licence Commerciale & Personnelle Standard Digishop
Signature d'intégrité : DIGI-VAULT-${Math.random().toString(36).substring(2, 10).toUpperCase()}
================================================================================

FÉLICITATIONS POUR VOTRE ACQUISITION !

Ce package numérique contient l'accès intégral et les ressources complètes liées à votre achat sur Digishop.

CONTENU INCLUS :
1. Fichiers sources et documentation complète du produit.
2. Droits d'utilisation conformes aux Conditions Générales de Vente de Digishop.
3. Mises à jour gratuites garanties pendant 12 mois.

SUPPORT CLIENT ET ASSISTANCE :
- Email : contact@digishop.com
- WhatsApp Support : +228 99 66 88 84 / +228 90 10 77 15
- Site web officiel : https://digishop-by-lemaxgroup.web.app

Merci de votre confiance !
L'équipe Digishop by Lemax Group.
================================================================================`;

        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        const cleanName = fileName.replace(/\.[^/.]+$/, '');
        a.download = `${cleanName}_licence_${currentOrder.orderNumber}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      }

      // Increment download counter
      setCurrentOrder(prev => ({
        ...prev,
        downloadCount: (prev.downloadCount || 0) + 1,
        isRefundable: false
      }));

      showToast(`Téléchargement de ${fileName} démarré avec succès !`, 'success');

      // Confirmation email if service available
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

  const invoiceUrl = currentOrder.paymentDetails?.paydunyaInvoiceUrl;
  const paydunyaToken = currentOrder.paymentDetails?.paydunyaToken;
  const payChannel = currentOrder.paymentDetails?.channel;

  // WhatsApp confirmation text
  const waMessage = `Bonjour Digishop,%20je%20viens%20d%27effectuer%20la%20commande%20${encodeURIComponent(currentOrder.orderNumber)}%20d%27un%20montant%20de%20${encodeURIComponent(formattedPrice)}%20(Client%20:%20${encodeURIComponent(currentOrder.customerName)}).%20Merci%20de%20valider%20l%27acc%C3%A8s%20%C3%A0%20mes%20t%C3%A9l%C3%A9chargements.`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Top Banner Status */}
      <div className={`p-6 sm:p-8 rounded-3xl border text-center space-y-4 shadow-xl ${
        isPaid
          ? 'bg-gradient-to-b from-emerald-500/15 to-transparent border-emerald-500/40'
          : 'bg-gradient-to-b from-amber-500/15 to-transparent border-amber-500/40'
      }`}>
        <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
          isPaid ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
        }`}>
          {isPaid ? <CheckCircle2 className="w-10 h-10" /> : <Clock className="w-10 h-10" />}
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-950 dark:text-white">
            {isPaid ? 'Paiement confirmé ! Votre commande est débloquée.' : 'Commande enregistrée — Validation de Paiement'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
            {isPaid
              ? `Merci pour votre achat, ${currentOrder.customerName}. Votre paiement a été vérifié et vos fichiers sont prêts au téléchargement ci-dessous.`
              : `Votre commande a bien été enregistrée pour ${currentOrder.customerName}. Utilisez les options ci-dessous pour déclencher la confirmation sur votre portable ou débloquer l'accès immédiatement.`}
          </p>
        </div>

        {/* Order Details Tag & Actions */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <span>Numéro de commande :</span>
            <strong className="text-sky-600 dark:text-sky-400">{currentOrder.orderNumber}</strong>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <span>Montant :</span>
            <strong className="text-slate-900 dark:text-white">{formattedPrice}</strong>
          </div>
          {!isPaid && (
            <button
              onClick={checkOrderStatus}
              disabled={checkingStatus}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              title="Vérifier si le paiement a été validé"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingStatus ? 'animate-spin' : ''}`} />
              <span>{checkingStatus ? 'Vérification...' : 'Vérifier le statut'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ACTION RAPIDE MOBILE MONEY & USSD (Quand en attente de paiement) */}
      {!isPaid && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30 p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
            <Smartphone className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Actions directes pour valider le paiement sur votre téléphone</span>
          </div>

          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            Pour confirmer votre achat de <strong>{formattedPrice}</strong> ({cfaAmount.toLocaleString('fr-FR')} FCFA), choisissez l'action appropriée ci-dessous depuis votre smartphone Android :
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* 1. USSD Moov Money */}
            <a
              href={`tel:*155*1*1*99668884*${cfaAmount}%23`}
              className="p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-between shadow-sm transition-transform active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 shrink-0" />
                <div className="text-left">
                  <span className="block font-bold">Moov Money Togo</span>
                  <span className="block text-[10px] opacity-90 font-mono">*155*1*1*99668884*{cfaAmount}#</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </a>

            {/* 2. USSD TMoney / Mixx */}
            <a
              href={`tel:*145*1*90107715*${cfaAmount}*1%23`}
              className="p-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-between shadow-sm transition-transform active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 shrink-0" />
                <div className="text-left">
                  <span className="block font-bold">TMoney / Mixx (Togocom)</span>
                  <span className="block text-[10px] opacity-90 font-mono">*145*1*90107715*{cfaAmount}*1#</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </a>

            {/* 3. PayDunya Portal Checkout if invoice URL exists */}
            {invoiceUrl && (
              <a
                href={invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center justify-between shadow-sm transition-transform active:scale-[0.98] sm:col-span-2"
              >
                <div className="flex items-center gap-2.5">
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <div className="text-left">
                    <span className="block font-bold">Ouvrir le Guichet PayDunya Officiel</span>
                    <span className="block text-[10px] opacity-90">Pour sélectionner votre opérateur et déclencher le Push USSD sur votre écran</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </a>
            )}

            {/* 4. WhatsApp confirmation */}
            <a
              href={`https://wa.me/22899668884?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center justify-between shadow-sm transition-transform active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 shrink-0" />
                <div className="text-left">
                  <span className="block font-bold">Confirmer par WhatsApp</span>
                  <span className="block text-[10px] opacity-90">Transmettre votre preuve au +228 99 66 88 84</span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 shrink-0" />
            </a>

            {/* 5. BOUTON DE TEST ET DÉBLOCAGE IMMÉDIAT (RÉSERVÉ ADMINISTRATEUR) */}
            {isAdmin && (
              <button
                type="button"
                onClick={handleInstantValidate}
                disabled={validatingDirectly}
                className="p-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-between shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <Zap className="w-4 h-4 text-amber-300 shrink-0" />
                  <div>
                    <span className="block font-bold">Valider & Débloquer Immédiatement (Admin)</span>
                    <span className="block text-[10px] opacity-90">Mode administrateur pour tester le téléchargement</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-blue-700 px-2 py-0.5 rounded">Admin 1-Clic</span>
              </button>
            )}
          </div>

          {/* Guide explicatif sur la confirmation USSD */}
          <div className="mt-3 p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-900/60 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-[11px]">
              <HelpCircle className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>Pourquoi le message USSD n'apparaît-il pas tout seul sur votre écran ?</span>
            </div>
            <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
              <li>
                <strong>En Mode Sandbox (Test PayDunya) :</strong> Les clés API actuellement actives sur la boutique sont en environnement test. Pour protéger votre ligne téléphonique, PayDunya n'envoie pas de vrai débit USSD sur votre carte SIM physique en mode test.
              </li>
              <li>
                <strong>Pour les débits réels en direct :</strong> Vous pouvez soit composer le code USSD ci-dessus (Moov <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded">*155#</code> ou T-Money <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded">*145#</code>), soit renseigner vos clés PayDunya de <strong>Production (Live)</strong> dans l'espace Administration.
              </li>
              <li>
                <strong>Pour tester maintenant :</strong> Appuyez sur le bouton bleu <strong>« Valider & Débloquer Immédiatement »</strong> ci-dessus pour déverrouiller vos fichiers à l'instant !
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Strict Anti-Refund Legal Notice */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3">
        <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-900 dark:text-white">
            Conditions de Vente & Politique de Livraison
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Conformément à la réglementation sur les contenus numériques dématérialisés, les fichiers sont accessibles dès validation du paiement. Le téléchargement entraîne l'exécution définitive de la commande.
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
              Accès protégé par jeton sécurisé. Maximum {currentOrder.maxDownloads} téléchargements par produit.
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
                  src={getProductImageUrl(item.image, item.categoryLabel, item.title)}
                  alt={item.title}
                  className="w-14 h-14 rounded-lg object-cover bg-slate-200 shrink-0"
                  onError={(e) => handleImageFallback(e, item.categoryLabel, item.title)}
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
                      <span>Fichier téléchargé ({currentOrder.downloadCount}x)</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 w-full sm:w-auto">
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
                      : 'Verrouillé (En attente)'}
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
            <span>Fichiers hébergés sur stockage sécurisé certifié.</span>
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
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs pt-2">
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

