import React, { useState } from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Veuillez entrer une adresse email valide.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { safeFetchJson } = await import('../lib/apiClient');
      const apiRes = await safeFetchJson<{ message?: string }>('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, honeypot })
      });

      setIsSubmitted(true);
      showToast(apiRes.data?.message || 'Merci ! Vous recevrez nos nouveautés et réductions.', 'success');
    } catch {
      setIsSubmitted(true);
      showToast('Merci ! Votre inscription a été prise en compte.', 'success');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 border-t border-slate-200/80 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
        
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 mb-2">
          <Mail className="w-6 h-6" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-950 dark:text-white">
          Recevez nos nouveautés et promotions
        </h2>

        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Rejoignez plus de 12 000 créateurs et entrepreneurs. Recevez en avant-première nos nouveaux packs digitaux, templates exclusifs et remises privées.
        </p>

        {isSubmitted ? (
          <div className="max-w-md mx-auto p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>Votre inscription est confirmée ! Consultez votre boîte mail pour vos avantages.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto pt-2 space-y-2">
            {/* Honeypot field for anti-spam bots */}
            <input
              type="text"
              name="company_website_verify"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
                required
                className="flex-1 px-4 py-3 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-3 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? 'Inscription...' : "S'inscrire"}
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Garanti sans spam. Désabonnement en 1 clic à tout moment. Données protégées RGPD.
            </p>
          </form>
        )}

      </div>
    </section>
  );
};
