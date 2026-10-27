import React from 'react';
import { ShieldCheck, Download, Lock, CreditCard, RefreshCw, UploadCloud } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenGitHubExport?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenGitHubExport }) => {
  const { isAdmin } = useAuth();
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs transition-colors overflow-x-clip w-full max-w-full">
      
      {/* Trust Badges Strip */}
      <div className="border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-sky-500 shrink-0" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-xs">Téléchargement Immédiat</p>
              <p className="text-[11px] text-slate-500">Accès direct après confirmation</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-xs">Paiement 100% Sécurisé</p>
              <p className="text-[11px] text-slate-500">Cartes, PayPal, Moov Money, Mixx</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-xs">Licences Certifiées</p>
              <p className="text-[11px] text-slate-500">Contenu 100% légal & vérifié</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-xs">Mises à Jour Incluses</p>
              <p className="text-[11px] text-slate-500">Accès continu aux évolutions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-5 gap-8">
        
        {/* Brand Column */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-icon.svg"
              alt="Digishop Logo"
              className="w-7 h-7 rounded-lg shadow-sm shadow-sky-500/20 shrink-0 object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const fb = target.nextElementSibling as HTMLElement;
                if (fb) fb.style.display = 'flex';
              }}
            />
            <span className="hidden w-7 h-7 rounded-lg bg-sky-500 text-white items-center justify-center font-display text-sm font-extrabold">
              D
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold font-display text-slate-950 dark:text-white">
                Digishop
              </span>
              <span className="text-[10px] font-medium tracking-wide text-slate-500 dark:text-slate-400 mt-0.5">
                by Lemax Group
              </span>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-300 font-medium text-xs leading-relaxed max-w-sm">
            « Votre marché digital, à portée de clic. »
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-sm">
            La plateforme e-commerce de référence pour acquérir instantanément e-books, templates professionnels, ressources graphiques et formations numériques sécurisées.
          </p>

          <div className="pt-2 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[11px] font-mono">
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              Visa · Mastercard · PayPal · Moov · Mixx
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-3">
          <p className="font-semibold text-slate-900 dark:text-white text-xs tracking-wider uppercase">Navigation</p>
          <ul className="space-y-2">
            <li>
              <button onClick={() => onNavigate('home')} className="hover:text-sky-500 transition-colors">
                Accueil
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('catalog')} className="hover:text-sky-500 transition-colors">
                Boutique
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('categories')} className="hover:text-sky-500 transition-colors">
                Catégories
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('about')} className="hover:text-sky-500 transition-colors">
                À propos
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('contact')} className="hover:text-sky-500 transition-colors">
                Contact
              </button>
            </li>
          </ul>
        </div>

        {/* Aide & Support */}
        <div className="space-y-3">
          <p className="font-semibold text-slate-900 dark:text-white text-xs tracking-wider uppercase">Aide & Support</p>
          <ul className="space-y-2">
            <li>
              <button onClick={() => onNavigate('faq')} className="hover:text-sky-500 transition-colors">
                FAQ & Aide
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('legal', 'downloads')} className="hover:text-sky-500 transition-colors">
                Livraison numérique
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('legal', 'payment')} className="hover:text-sky-500 transition-colors">
                Moyens de paiement
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('legal', 'refund')} className="hover:text-sky-500 transition-colors">
                Politique de remboursement
              </button>
            </li>
          </ul>
        </div>

        {/* Légal */}
        <div className="space-y-3">
          <p className="font-semibold text-slate-900 dark:text-white text-xs tracking-wider uppercase">Légal</p>
          <ul className="space-y-2">
            <li>
              <button onClick={() => onNavigate('legal', 'cgv')} className="hover:text-sky-500 transition-colors">
                Conditions Générales (CGV)
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('legal', 'privacy')} className="hover:text-sky-500 transition-colors">
                Politique de confidentialité
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('legal', 'mentions')} className="hover:text-sky-500 transition-colors">
                Mentions Légales
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('legal', 'cookies')} className="hover:text-sky-500 transition-colors">
                Politique des cookies
              </button>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-slate-100 dark:border-slate-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Digishop by Lemax Group. Tous droits réservés. Vente de produits numériques exclusifs.</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-3 gap-y-1.5">
            <span>SSL 256-bit crypté</span>
            <span>·</span>
            <span>PCI-DSS Conforme</span>
            {isAdmin && (
              <>
                <span>·</span>
                <button onClick={() => onNavigate('admin')} className="text-sky-600 dark:text-sky-400 hover:underline font-semibold">
                  Accès administration
                </button>
                {onOpenGitHubExport && (
                  <>
                    <span>·</span>
                    <button
                      onClick={onOpenGitHubExport}
                      className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                      title="Transférer tout le projet sur GitHub pour l'importer sur un autre compte"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Exporter GitHub</span>
                    </button>
                  </>
                )}
                <span>·</span>
                <a href="/api/export-project.zip" download="digishop-by-lemax-group.zip" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1">
                  <span>Exporter ZIP</span>
                </a>
              </>
            )}
          </div>
        </div>
      </div>

    </footer>
  );
};
