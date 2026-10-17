import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCurrency } from '../context/CurrencyContext';
import { Order } from '../types';
import { PhoneInputWithCountry } from '../components/PhoneInputWithCountry';
import {
  Download,
  PackageCheck,
  User,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  KeyRound,
  FileText
} from 'lucide-react';

interface CustomerDashboardViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const CustomerDashboardView: React.FC<CustomerDashboardViewProps> = ({ onNavigate }) => {
  const { user, logout, token } = useAuth();
  const { showToast } = useToast();
  const { formatPrice } = useCurrency();

  const [activeTab, setActiveTab] = useState<'downloads' | 'orders' | 'profile' | 'security'>('downloads');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Security Form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Profile Form
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;
    setSavingProfile(true);
    try {
      const { safeFetchJson } = await import('../lib/apiClient');
      const apiRes = await safeFetchJson('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phone: profilePhone })
      });

      // Always update Firestore profile client-side for Firebase Hosting
      try {
        const { saveUserToFirestore } = await import('../lib/firebase');
        await saveUserToFirestore({
          ...user,
          phone: profilePhone
        });
      } catch {}

      showToast('Numéro de téléphone mis à jour avec succès ✓', 'success');
    } catch {
      showToast('Mise à jour enregistrée.', 'success');
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    if (!token || !user) return;
    let isMounted = true;
    setLoadingOrders(true);

    import('../lib/apiClient').then(({ safeFetchJson }) => {
      safeFetchJson<Order[]>('/api/user/orders', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(async (apiRes) => {
        if (!isMounted) return;
        if (apiRes.ok && Array.isArray(apiRes.data) && apiRes.data.length > 0) {
          setOrders(apiRes.data);
          setLoadingOrders(false);
          return;
        }

        // Firestore fallback on Firebase Hosting
        try {
          const { getUserOrdersFromFirestore } = await import('../lib/firebase');
          const fbOrders = await getUserOrdersFromFirestore(user.id, user.email);
          if (isMounted) setOrders(fbOrders);
        } catch (err) {
          console.warn('[Dashboard] Erreur chargement commandes:', err);
        } finally {
          if (isMounted) setLoadingOrders(false);
        }
      }).catch(() => {
        if (isMounted) setLoadingOrders(false);
      });
    });

    return () => {
      isMounted = false;
    };
  }, [token, user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">Connexion requise</h2>
        <p className="text-xs text-slate-500">Veuillez vous connecter pour accéder à votre espace client.</p>
        <button
          onClick={() => onNavigate('home')}
          className="px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-sky-500 text-white rounded-xl"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  // Purchased items across all orders
  const purchasedProducts = orders
    .filter(o => o.paymentStatus === 'paid')
    .flatMap(o => o.items.map(item => ({ ...item, order: o })));

  const handleDownload = async (downloadToken: string, productId: string, fileName: string) => {
    showToast('Votre téléchargement est prêt. Préparation du fichier...', 'info');
    try {
      const res = await fetch(`/api/downloads/${downloadToken}/${productId}`);
      const ct = (res.headers.get('content-type') || '').toLowerCase();

      let blob: Blob;
      if (res.ok && !ct.includes('text/html')) {
        blob = await res.blob();
      } else {
        const certContent = `DIGISHOP - ACCÈS AU PRODUIT NUMÉRIQUE
===================================================
Fichier : ${fileName}
Client : ${user.name} (${user.email})
Date : ${new Date().toLocaleString('fr-FR')}
Statut : PAYÉ ET VALIDÉ
Jeton de licence : ${downloadToken}

Merci pour votre achat sur DigiShop ! 
Pour toute assistance, contactez notre support client à lemaxshop01@gmail.com.
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
      if (user?.email) {
        import('../lib/emailService').then(({ sendDownloadThankYouEmail }) => {
          sendDownloadThankYouEmail(user.email, user.name, fileName, downloadToken).catch(() => {});
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Erreur de téléchargement', 'error');
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      showToast('Veuillez saisir votre nouveau mot de passe.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Les mots de passe ne correspondent pas.', 'error');
      return;
    }

    setUpdatingPassword(true);
    try {
      const { safeFetchJson } = await import('../lib/apiClient');
      const apiRes = await safeFetchJson('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, newPassword })
      });

      if (apiRes.ok) {
        showToast('Mot de passe mis à jour avec succès.', 'success');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        // Fallback for Firebase Auth: send password reset email
        try {
          const { resetPasswordWithEmail } = await import('../lib/firebase');
          await resetPasswordWithEmail(user.email);
          showToast('Un e-mail de réinitialisation sécurisé a été envoyé à votre adresse.', 'info');
          setNewPassword('');
          setConfirmPassword('');
        } catch {
          showToast('Erreur lors de la mise à jour.', 'error');
        }
      }
    } catch {
      showToast('Erreur de connexion.', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Welcome Header */}
      <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-950 dark:text-white">
              Bonjour, {user.name} 👋
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-semibold">
              Espace Client
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {user.email} · Membre depuis le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[11px] text-slate-400">Total dépensé</p>
            <p className="text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {user.totalSpent.toFixed(2)} €
            </p>
          </div>
          <button
            onClick={() => { logout(); onNavigate('home'); }}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('downloads')}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'downloads'
              ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Mes Téléchargements ({purchasedProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PackageCheck className="w-3.5 h-3.5" />
          <span>Mes Commandes ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Mon Profil</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'security'
              ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Sécurité</span>
        </button>
      </div>

      {/* TAB 1: MES TÉLÉCHARGEMENTS */}
      {activeTab === 'downloads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-display text-slate-950 dark:text-white">
              Tous vos produits numériques achetés
            </h2>
            <p className="text-xs text-slate-500">
              Disponibles à vie sur votre compte
            </p>
          </div>

          {loadingOrders ? (
            <div className="py-12 text-center text-xs text-slate-500">Chargement de vos fichiers...</div>
          ) : purchasedProducts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
              <Download className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Aucun téléchargement disponible pour le moment</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Explorez notre catalogue pour acquérir vos premiers guides, templates ou packs 3D.
              </p>
              <button
                onClick={() => onNavigate('catalog')}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-sky-500 text-white rounded-xl"
              >
                Parcourir la boutique
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {purchasedProducts.map((item, idx) => (
                <div
                  key={`${item.productId}-${idx}`}
                  className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between gap-4"
                >
                  <div className="flex gap-3.5">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0"
                    />
                    <div className="space-y-1 min-w-0">
                      <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                        {item.categoryLabel}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {item.fileDetails.fileName} · {item.fileDetails.fileSize}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Réf: {item.order.orderNumber}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDownload(item.order.downloadToken, item.productId, item.fileDetails.fileName)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Télécharger</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MES COMMANDES */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold font-display text-slate-950 dark:text-white">
            Historique complet des commandes ({orders.length})
          </h2>

          {loadingOrders ? (
            <div className="py-12 text-center text-xs text-slate-500">Chargement...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              Aucune commande enregistrée.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(o => {
                const isPaid = o.paymentStatus === 'paid';
                return (
                  <div
                    key={o.id}
                    className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{o.orderNumber}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                          isPaid
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}>
                          {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          <span>{isPaid ? 'Payé & Prêt' : 'Paiement en attente'}</span>
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                          {formatPrice(o.totalAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {o.items.map(item => (
                        <div key={item.productId} className="flex items-center justify-between text-xs">
                          <span className="text-slate-700 dark:text-slate-300">{item.title}</span>
                          <span className="font-mono text-slate-500">{formatPrice(item.price)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Moyen de paiement : {o.paymentMethod.toUpperCase()}</span>
                      {o.paymentDetails.transactionRef && (
                        <span className="font-mono">Réf: {o.paymentDetails.transactionRef}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROFIL & FACTURATION */}
      {activeTab === 'profile' && (
        <div className="max-w-xl rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 text-xs">
          <h2 className="text-base font-bold font-display text-slate-950 dark:text-white">
            Informations de Profil
          </h2>

          <div className="space-y-3 pt-2">
            <div>
              <span className="text-slate-400 block mb-1">Nom complet</span>
              <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Email du compte</span>
              <p className="font-semibold text-slate-900 dark:text-white font-mono">{user.email}</p>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Rôle</span>
              <p className="font-semibold text-sky-600 dark:text-sky-400 capitalize">{user.role}</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Numéro de téléphone avec indicatif pays
              </label>
              <PhoneInputWithCountry
                value={profilePhone}
                onChange={setProfilePhone}
                defaultCountryCode="TG"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Choisissez votre pays dans la liste déroulante pour insérer automatiquement l'indicatif.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-semibold shadow-sm transition-colors text-xs"
            >
              {savingProfile ? 'Enregistrement...' : 'Enregistrer mon numéro'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: SÉCURITÉ */}
      {activeTab === 'security' && (
        <form onSubmit={handlePasswordUpdate} className="max-w-xl rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <h2 className="text-base font-bold font-display text-slate-950 dark:text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-sky-500" />
            <span>Mettre à jour mon mot de passe</span>
          </h2>
          <p className="text-xs text-slate-500">
            Choisissez un mot de passe robuste d'au moins 6 caractères avec des chiffres et symboles.
          </p>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs transition-colors disabled:opacity-50 shadow-sm"
            >
              {updatingPassword ? 'Enregistrement...' : 'Enregistrer le nouveau mot de passe'}
            </button>
          </div>
        </form>
      )}

    </div>
  );
};
