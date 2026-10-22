import React from 'react';
import { ShieldCheck, Award, Zap, HeartHandshake, ArrowRight } from 'lucide-react';

interface AboutViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Hero About */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
          Notre Mission & Vision
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-950 dark:text-white leading-tight">
          Votre marché digital, à portée de clic.
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          Digishop est née d'une conviction simple : l'accès aux meilleures ressources professionnelles, guides stratégiques et templates doit être instantané, légal et d'une clarté absolue.
        </p>
      </div>

      {/* 4 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
            Instantanéité Radicale
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Pas de transporteur, pas de retard postal. Aussitôt votre paiement confirmé, vos fichiers sont débloqués sur votre compte et prêts à l'emploi.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
            100% Légal & Propriétaire
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Nous refusons tout contenu piraté. Chaque produit est créé pour la boutique ou distribué avec des licences commerciales conformes et vérifiées.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
            Paiements Inclusifs & Sécurisés
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Parce que le talent est universel, nous intégrons les cartes bancaires internationales, PayPal, ainsi que les solutions mobiles comme Moov Money et Mixx.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
            Normes d'Excellence & Tests Pratiques
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Chaque modèle financier, kit juridique ou guide est audité et testé en conditions réelles avant d'être référencé dans notre catalogue.
          </p>
        </div>
      </div>

      {/* CTA Box */}
      <div className="text-center p-8 sm:p-12 rounded-3xl bg-slate-900 text-white space-y-4">
        <h2 className="text-2xl font-bold font-display">Prêt à accélérer vos projets ?</h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
          Découvrez notre collection d'e-books, de templates et de formations conçus pour générer des résultats tangibles.
        </p>
        <button
          onClick={() => onNavigate('catalog')}
          className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors inline-flex items-center gap-2"
        >
          <span>Découvrir le catalogue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
