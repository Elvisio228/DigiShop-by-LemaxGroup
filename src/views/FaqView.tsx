import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Download, ShieldCheck, CreditCard, RefreshCw } from 'lucide-react';

export const FaqView: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Comment s\'effectue la livraison des produits après paiement ?',
      a: 'La livraison est 100% numérique et immédiate. Dès confirmation de votre règlement, votre page de commande affiche les liens de téléchargement sécurisés. De plus, les fichiers restent rattachés à vie à votre compte client Digishop dans l\'onglet « Mes Téléchargements ».'
    },
    {
      q: 'Y a-t-il des frais de port ou de livraison à prévoir ?',
      a: 'Aucun ! Comme l\'indique notre devise (« Produit numérique — aucun frais de livraison »), tous nos produits sont dématérialisés. Vous payez uniquement le prix affiché sans supplément caché.'
    },
    {
      q: 'Quels sont les moyens de paiement disponibles sur Digishop ?',
      a: 'Nous acceptons : 1) Les cartes bancaires (Visa, Mastercard) via protocole sécurisé PCI-DSS, 2) PayPal Checkout, 3) Moov Money, et 4) Mixx by Yas / TMoney aux numéros marchands officiels affichés lors de l\'étape de paiement.'
    },
    {
      q: 'Comment fonctionne la validation des paiements Moov Money et Mixx ?',
      a: 'Pour ces solutions mobiles, vous effectuez le transfert du montant exact vers le numéro indiqué lors de l\'étape de paiement, puis saisissez votre numéro de transaction SMS. Par mesure de sécurité anti-fraude, notre équipe administrateur vérifie la réception des fonds avant de basculer la commande au statut "Payé" et de libérer vos téléchargements.'
    },
    {
      q: 'Combien de fois puis-je télécharger mes fichiers ?',
      a: 'Chaque commande comprend 5 téléchargements autorisés par produit sur une période initiale de 30 jours. Si vous perdez vos fichiers ultérieurement suite à un changement d\'ordinateur, notre support client réactive gratuitement vos liens sur simple demande.'
    },
    {
      q: 'Puis-je utiliser les templates et documents pour mes projets clients ?',
      a: 'Oui ! Tous nos produits bénéficient au minimum d\'une Licence Commerciale standard vous autorisant à utiliser, adapter et incorporer les ressources dans vos missions clients. Seule la revente brute ou la redistribution gratuite du fichier original est prohibée.'
    },
    {
      q: 'Les fichiers sont-ils garantis sans virus ?',
      a: 'Absolument. Tous les fichiers de notre coffre-fort numérique sont contrôlés et hébergés sur des serveurs sécurisés avec des liens signés et cryptés.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 mb-1">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold font-display text-slate-950 dark:text-white">
          Foire Aux Questions (FAQ)
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Retrouvez les réponses immédiates à toutes vos questions sur les formats, livraisons et paiements.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-all"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 text-xs sm:text-sm font-bold text-slate-900 dark:text-white"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
