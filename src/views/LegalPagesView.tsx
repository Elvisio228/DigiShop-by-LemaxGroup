import React, { useState } from 'react';
import { ShieldCheck, FileText, Lock, RefreshCw, Cookie, HelpCircle } from 'lucide-react';

interface LegalPagesViewProps {
  initialPage?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const LegalPagesView: React.FC<LegalPagesViewProps> = ({ initialPage = 'cgv' }) => {
  const [activePage, setActivePage] = useState<string>(initialPage);

  const tabs = [
    { id: 'cgv', label: 'Conditions Générales de Vente (CGV)', icon: FileText },
    { id: 'privacy', label: 'Politique de Confidentialité (RGPD)', icon: Lock },
    { id: 'refund', label: 'Politique de Remboursement', icon: RefreshCw },
    { id: 'downloads', label: 'Politique de Téléchargement & Licences', icon: ShieldCheck },
    { id: 'mentions', label: 'Mentions Légales', icon: HelpCircle },
    { id: 'cookies', label: 'Politique des Cookies', icon: Cookie },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold font-display text-slate-950 dark:text-white">
          Informations Légales & Conformité
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Consultez nos engagements de sécurité, conditions de vente et règles de délivrance numérique.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-sm">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activePage === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActivePage(tab.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-sm space-y-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          
          {/* CGV */}
          {activePage === 'cgv' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-display text-slate-950 dark:text-white">
                Conditions Générales de Vente (CGV) — Digishop
              </h2>
              <p className="text-xs text-slate-400">Dernière révision : 15 janvier 2026</p>

              <h3 className="font-bold text-slate-900 dark:text-white pt-2">Article 1 : Objet</h3>
              <p>
                Les présentes Conditions Générales de Vente régissent la vente en ligne de contenus et produits exclusivement numériques (e-books, templates, packs graphiques 3D, documents juridiques et formations en ligne) sur la plateforme <strong>Digishop</strong> (« https://digishop.shop »).
              </p>

              <h3 className="font-bold text-slate-900 dark:text-white pt-2">Article 2 : Nature des produits & Exécution immédiate</h3>
              <p>
                Les produits proposés sont des fichiers numériques dématérialisés livrés sans support physique. Conformément aux dispositions de l'article L. 221-28 du Code de la Consommation (et des dispositions équivalentes applicables dans les pays d'exploitation), le client reconnaît expressément que la délivrance et le téléchargement du contenu débutent immédiatement après confirmation du paiement.
              </p>

              <h3 className="font-bold text-slate-900 dark:text-white pt-2">Article 3 : Tarifs et Modalités de Paiement</h3>
              <p>
                Les prix sont indiqués en Euros (€) toutes taxes comprises. Les moyens de règlement acceptés sont : Carte Bancaire (Visa, Mastercard), PayDunya, PayPal Checkout (Digishop by Lemax Group), Moov Money Togo (numéro marchand togolais 🇹🇬 +228 99 66 88 84) et Mixx / TMoney Togocom (numéro récepteur togolais 🇹🇬 +228 90 10 77 15). Pour les règlements via transferts mobiles directs, la commande demeure au statut de vérification administrative jusqu'à contrôle effectif de la transaction.
              </p>

              <h3 className="font-bold text-slate-900 dark:text-white pt-2">Article 4 : Frais et Modalités de Livraison</h3>
              <p>
                La livraison s'effectue exclusivement par voie électronique de manière instantanée après validation. Aucun frais de transport ou d'emballage n'est facturé au client (« Produit numérique — aucun frais de livraison »).
              </p>
            </div>
          )}

          {/* PRIVACY */}
          {activePage === 'privacy' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-display text-slate-950 dark:text-white">
                Politique de Confidentialité & RGPD
              </h2>
              <p className="text-xs text-slate-400">Conformité aux directives européennes et internationales</p>

              <h3 className="font-bold text-slate-900 dark:text-white pt-2">1. Données collectées</h3>
              <p>
                Dans le cadre de l'exploitation de la plateforme, Digishop collecte les données strictement indispensables à l'exécution de la commande : Nom, prénom, adresse e-mail, numéro de téléphone (en cas d'utilisation des passerelles mobiles), ainsi que les adresses IP pour l'authentification des jetons de téléchargement.
              </p>

              <h3 className="font-bold text-slate-900 dark:text-white pt-2">2. Non-conservation des données bancaires</h3>
              <p>
                Digishop n'a jamais accès et ne stocke en aucun cas les numéros complets de cartes bancaires ni les cryptogrammes de sécurité. Toutes les transactions par carte sont traitées par un prestataire certifié conforme à la norme de sécurité PCI-DSS.
              </p>

              <h3 className="font-bold text-slate-900 dark:text-white pt-2">3. Vos Droits</h3>
              <p>
                Vous bénéficiez d'un droit d'accès, de modification et d'effacement de vos données personnelles sur simple demande par email à l'adresse <strong>privacy@digishop.com</strong>.
              </p>
            </div>
          )}

          {/* REFUND */}
          {activePage === 'refund' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-display text-slate-950 dark:text-white">
                Politique de Remboursement des Biens Numériques
              </h2>
              <p className="text-xs text-slate-400">Règles d'application, notifications IPN et garanties de conformité</p>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                <p className="font-bold">
                  ⚡ Confirmation de Paiement par Notification Automatique (IPN / Webhook) :
                </p>
                <p>
                  Les fichiers numériques ne peuvent être téléchargés que lorsque notre boutique reçoit la notification automatique et formelle de confirmation de paiement (Instant Payment Notification - IPN) émise par l'établissement financier ou la passerelle (PayDunya, PayPal ou Mobile Money).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                <p className="font-bold text-slate-900 dark:text-white">
                  🔒 Règle de Non-Remboursement après Téléchargement (Art. L.221-28 du Code de la Consommation) :
                </p>
                <p>
                  En raison de la nature immatérielle et non restituable des contenus informatiques numériques, <strong>aucun remboursement n'est possible dès lors que le fichier a été téléchargé au moins une fois</strong>. Le démarrage du téléchargement constitue la consommation intégrale de la prestation numérique.
                </p>
              </div>

              <h3 className="font-bold text-slate-900 dark:text-white pt-2">Cas d'éligibilité exceptionnels au remboursement :</h3>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li>Le produit n'a encore fait l'objet d'<strong>aucun téléchargement</strong> (contrôle certifié par nos journaux cryptographiques de téléchargement).</li>
                <li>Le fichier numérique s'avère corrompu ou illisible, et notre support technique n'a pas pu fournir une copie valide sous 48 heures.</li>
                <li>Paiement débité en double en raison d'une anomalie technique de la passerelle de paiement.</li>
              </ul>
            </div>
          )}

          {/* DOWNLOADS */}
          {activePage === 'downloads' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-display text-slate-950 dark:text-white">
                Politique de Téléchargement & Licences d'Usage
              </h2>

              <h3 className="font-bold text-slate-900 dark:text-white pt-2">Sécurité des Liens Signés :</h3>
              <p>
                Afin de prémunir les auteurs contre le vol de propriété intellectuelle, chaque commande génère un jeton cryptographique à usage sécurisé.
                Chaque produit est assorti d'une limite de <strong>5 téléchargements</strong> et d'une durée de validité de 30 jours (renouvelable sur simple demande auprès de notre support si vous changez d'ordinateur).
              </p>

              <h3 className="font-bold text-slate-900 dark:text-white pt-2">Droits concédés :</h3>
              <p>
                L'acquisition d'un produit sur Digishop confère un droit d'utilisation individuel et professionnel. Il est strictement interdit de republier, revendre ou distribuer gratuitement les fichiers originaux sur des plateformes tierces.
              </p>
            </div>
          )}

          {/* MENTIONS */}
          {activePage === 'mentions' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-display text-slate-950 dark:text-white">
                Mentions Légales
              </h2>

              <p><strong>Éditeur du Site :</strong> Digishop Digital SARL</p>
              <p><strong>Marque :</strong> DIGISHOP — « Votre marché digital, à portée de clic. »</p>
              <p><strong>Contact :</strong> contact@digishop.com</p>
              <p><strong>Directeur de la publication :</strong> Direction Générale Digishop</p>
              <p><strong>Hébergement :</strong> Infrastructure Cloud Sécurisée haute disponibilité avec certificats TLS Let's Encrypt / Cloudflare.</p>
            </div>
          )}

          {/* COOKIES */}
          {activePage === 'cookies' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-display text-slate-950 dark:text-white">
                Politique Relative aux Cookies
              </h2>

              <p>
                Digishop utilise exclusivement des cookies fonctionnels et sécurisés pour maintenir votre session de connexion, sauvegarder l'état de votre panier d'achats, et mémoriser votre préférence d'affichage (Mode Sombre / Mode Clair).
              </p>
              <p>
                Aucun tracker publicitaire intrusif ou cookie tiers non consenti n'est utilisé pour collecter des données à des fins de profilage non sollicité.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
