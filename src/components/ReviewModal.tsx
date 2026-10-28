import React, { useState, useEffect } from 'react';
import { Star, X, CheckCircle2, MessageSquare, ShieldCheck, Send } from 'lucide-react';
import { Product, Review } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { saveReviewToFirestore } from '../lib/firebase';
import { safeFetchJson } from '../lib/apiClient';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialProductId?: string;
  onReviewSubmitted?: (review: Review) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Décevant (1/5)',
  2: 'Moyen (2/5)',
  3: 'Satisfaisant (3/5)',
  4: 'Très bien (4/5)',
  5: 'Exceptionnel ! (5/5)'
};

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  products,
  initialProductId,
  onReviewSubmitted
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedProductId, setSelectedProductId] = useState<string>('general');
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (initialProductId) {
        setSelectedProductId(initialProductId);
      } else {
        setSelectedProductId('general');
      }
      if (user) {
        setUserName(user.name || '');
        setUserEmail(user.email || '');
      } else {
        const savedName = localStorage.getItem('digishop_client_name');
        if (savedName) setUserName(savedName);
      }
    }
  }, [isOpen, initialProductId, user]);

  if (!isOpen) return null;

  const currentProduct = products.find(p => p.id === selectedProductId);
  const activeRating = hoverRating || rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      showToast('Veuillez indiquer votre nom ou pseudonyme.', 'error');
      return;
    }
    if (!comment.trim() || comment.trim().length < 5) {
      showToast('Votre avis doit comporter au moins 5 caractères.', 'error');
      return;
    }

    setSubmitting(true);
    const prodTitle = currentProduct ? currentProduct.title : 'Boutique DigiShop';
    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newReview: Review = {
      id: reviewId,
      productId: selectedProductId,
      productTitle: prodTitle,
      userId: user?.id,
      userName: userName.trim(),
      rating,
      comment: comment.trim(),
      isVerifiedPurchase: !!user || (userEmail.trim().length > 0),
      isApproved: true,
      createdAt: new Date().toISOString()
    };

    try {
      localStorage.setItem('digishop_client_name', userName.trim());

      // 1. Save directly to Firebase Firestore for static hosting resilience
      try {
        await saveReviewToFirestore(newReview);
      } catch (fbErr) {
        console.warn('[ReviewModal] Firestore direct save warning:', fbErr);
      }

      // 2. Save to backend API if running Express
      try {
        await safeFetchJson<Review>('/api/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('digishop_token')
              ? { Authorization: `Bearer ${localStorage.getItem('digishop_token')}` }
              : {})
          },
          body: JSON.stringify({
            productId: selectedProductId,
            productTitle: prodTitle,
            userName: userName.trim(),
            rating,
            comment: comment.trim()
          })
        });
      } catch (apiErr) {
        console.warn('[ReviewModal] API save fallback:', apiErr);
      }

      // 3. Local propagation & callbacks
      onReviewSubmitted?.(newReview);
      window.dispatchEvent(new CustomEvent('digishop:review-added', { detail: newReview }));

      showToast('Merci ! Votre avis a été publié avec succès sur DigiShop.', 'success');
      setComment('');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de l\'enregistrement de votre avis', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-slate-950 dark:text-white">
                Donner votre avis client
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Partagez votre expérience sur les produits ou services DigiShop.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          
          {/* 1. Star Rating Picker */}
          <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              Votre note globale
            </span>
            <div className="flex items-center justify-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  aria-label={`Attribuer ${s} étoiles sur 5`}
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      s <= activeRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 pt-1">
              {RATING_LABELS[activeRating] || 'Sélectionnez une note'}
            </p>
          </div>

          {/* 2. Target Product Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-slate-200 block">
              Produit ou service concerné
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="general">⭐ Expérience globale sur la Boutique DigiShop</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.categoryLabel})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Customer Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                Votre Nom ou Prénom *
              </label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ex : Marc Dupuis, Sarah D."
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                Adresse e-mail (Optionnel)
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="Pour badge acheteur vérifié"
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 4. Comment Textarea */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-slate-200 block">
              Votre commentaire ou retour d'expérience *
            </label>
            <textarea
              required
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Expliquez ce qui vous a plu : rapidité du téléchargement, utilité du contenu pour vos projets, conformité des fichiers..."
              className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Trust guarantee badge */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-[11px] text-blue-700 dark:text-blue-300">
            <ShieldCheck className="w-4 h-4 shrink-0 text-blue-500" />
            <span>Votre avis sera immédiatement visible par la communauté et certifié acheteur.</span>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !userName.trim() || !comment.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Publication en cours...' : 'Publier mon avis'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
