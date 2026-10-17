import React, { useState } from 'react';
import { Mail, Clock, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const ContactView: React.FC = () => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Question sur un produit');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
      showToast('Votre message a été transmis à notre équipe support !', 'success');
    }, 600);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold font-display text-slate-950 dark:text-white">
          Contact & Assistance Digishop
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Une question sur un produit, une demande de facture ou une aide pour votre téléchargement ? Nous répondons en moins de 4 heures.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Contact Info & Guarantees (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 text-xs">
            <h3 className="text-sm font-bold font-display text-slate-950 dark:text-white">
              Nos Canaux d'Échange
            </h3>

            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Support Client & Commandes</p>
                <p className="text-slate-500 font-mono">support@digishop.com</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Délais de Réponse</p>
                <p className="text-slate-500">7j/7 — Sous 4 heures en moyenne</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MessageSquare className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Paiements Moov / Mixx</p>
                <p className="text-slate-500">Validation manuelle prioritaire sous 30 min</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form (7 cols) */}
        <div className="md:col-span-7">
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                  Message envoyé avec succès !
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Notre équipe traitera votre demande à l'adresse <strong>{email}</strong> dans les plus brefs délais.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setMessage(''); }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-sky-500 text-white"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Votre nom complet *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alexandre Martin"
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Votre adresse e-mail *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alexandre@exemple.com"
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Sujet de votre demande
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Question sur un produit">Question sur un produit</option>
                    <option value="Aide téléchargement">Aide pour mon téléchargement</option>
                    <option value="Paiement Moov Money / Mixx">Vérification paiement Moov Money ou Mixx</option>
                    <option value="Partenariat / Affiliation">Proposition de partenariat / Affiliation</option>
                    <option value="Autre demande">Autre demande</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Votre message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Précisez votre question ou le numéro de commande concerné..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-sky-500 hover:bg-slate-800 dark:hover:bg-sky-400 text-white font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sending ? 'Transmission...' : 'Envoyer mon message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
