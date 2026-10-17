import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PhoneInputWithCountry } from './PhoneInputWithCountry';

const ADMIN_EMAILS = ['lemaxshop01@gmail.com', 'admin@digishop.com', 'elvisioleng@gmail.com'];

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess?: () => void;
  onNavigate?: (view: string, param?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
  onNavigate
}) => {
  const { login, register, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const loggedUser = await loginWithGoogle();
      const isUserAdmin = loggedUser?.role === 'admin' || (loggedUser?.email && ADMIN_EMAILS.includes(loggedUser.email.toLowerCase().trim()));
      
      if (isUserAdmin) {
        showToast('Bienvenue dans votre espace Administrateur Digishop !', 'success');
        onClose();
        if (onNavigate) {
          onNavigate('admin');
        } else if (onSuccess) {
          onSuccess();
        }
      } else {
        showToast('Connexion Google réussie !', 'success');
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Échec de la connexion Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Close modal when pressing Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Password Strength Calculation (indicatif et fluide)
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200 dark:bg-slate-700', textColor: 'text-slate-400', percent: 0 };
    let score = 0;
    if (pwd.length >= 4) score += 1;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) || /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) {
      return {
        score: 1,
        label: 'Court',
        color: 'bg-amber-500',
        textColor: 'text-amber-500',
        percent: 40
      };
    }
    if (score === 3 || score === 4) {
      return {
        score: 2,
        label: 'Bon',
        color: 'bg-sky-500',
        textColor: 'text-sky-500',
        percent: 75
      };
    }
    return {
      score: 3,
      label: 'Très sécurisé ✓',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-500',
      percent: 100
    };
  };

  const passwordStrength = getPasswordStrength(password);
  const cleanEmail = email.trim().toLowerCase();
  const passwordsMatch = !confirmPassword || password === confirmPassword;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!cleanEmail) {
      setError('Veuillez renseigner votre adresse e-mail.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Veuillez renseigner votre nom complet.');
        return;
      }
      if (!password) {
        setError('Veuillez renseigner un mot de passe.');
        return;
      }
      if (!confirmPassword) {
        setError('Veuillez confirmer votre mot de passe dans le second champ.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Les deux mots de passe ne sont pas identiques. Veuillez vérifier votre saisie.');
        return;
      }
    } else if (mode === 'login' && !password) {
      setError('Veuillez saisir votre mot de passe.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const loggedUser = await login(cleanEmail, password);
        const isUserAdmin = loggedUser?.role === 'admin' || (loggedUser?.email && ADMIN_EMAILS.includes(loggedUser.email.toLowerCase().trim()));
        
        if (isUserAdmin) {
          showToast('Bienvenue dans votre espace Administrateur Digishop !', 'success');
          onClose();
          if (onNavigate) {
            onNavigate('admin');
          } else if (onSuccess) {
            onSuccess();
          }
        } else {
          showToast('Connexion réussie ! Heureux de vous revoir.', 'success');
          onClose();
          if (onSuccess) onSuccess();
        }
      } else if (mode === 'register') {
        const newUser = await register(name.trim(), cleanEmail, password, phone.trim());
        const isUserAdmin = newUser?.role === 'admin' || (newUser?.email && ADMIN_EMAILS.includes(newUser.email.toLowerCase().trim()));
        
        // Envoi automatique de l'e-mail de bienvenue au nouveau client
        import('../lib/emailService').then(({ sendWelcomeEmail }) => {
          sendWelcomeEmail(cleanEmail, name.trim()).catch(() => {});
        });

        if (isUserAdmin) {
          showToast('Compte administrateur configuré ! Un email de bienvenue vous a été envoyé.', 'success');
          onClose();
          if (onNavigate) {
            onNavigate('admin');
          } else if (onSuccess) {
            onSuccess();
          }
        } else {
          showToast('Compte créé avec succès ! Un e-mail de bienvenue vous a été envoyé.', 'success');
          onClose();
          if (onSuccess) onSuccess();
        }
      } else if (mode === 'forgot') {
        try {
          const { resetPasswordWithEmail } = await import('../lib/firebase');
          await resetPasswordWithEmail(cleanEmail);
        } catch {
          const { safeFetchJson } = await import('../lib/apiClient');
          await safeFetchJson('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail })
          });
        }
        setForgotSuccess(true);
        showToast('Email de réinitialisation envoyé.', 'info');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal Dialog (clicks inside will not close) */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 my-6 max-h-[92vh] overflow-y-auto animate-in zoom-in-95"
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1 mb-6">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 mx-auto flex items-center justify-center font-display font-bold text-lg mb-2">
            D
          </div>
          <h2 className="text-xl font-bold font-display text-slate-950 dark:text-white">
            {mode === 'login' ? 'Connexion à votre compte' : mode === 'register' ? 'Créer un compte Digishop' : 'Mot de passe oublié'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {mode === 'login'
              ? 'Accédez à vos commandes et téléchargements numériques'
              : mode === 'register'
              ? 'Rejoignez notre plateforme pour stocker vos produits à vie'
              : 'Recevez un lien sécurisé pour redéfinir votre mot de passe'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium space-y-2">
            <div>{error}</div>
            {(error.includes('réseau') || error.includes('network') || error.includes('Firebase')) && (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <span>Utiliser la connexion Google (Recommandé)</span>
              </button>
            )}
          </div>
        )}

        {/* Forgot Success Message */}
        {forgotSuccess ? (
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Un email de réinitialisation a été envoyé si l'adresse existe. Vérifiez vos spams si nécessaire.
            </p>
            <button
              onClick={() => { setMode('login'); setForgotSuccess(false); }}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
            >
              Retour à la connexion
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Direct Google 1-click option on Mobile */}
            {mode !== 'forgot' && (
              <div className="mb-2 space-y-2.5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading || googleLoading}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-semibold text-xs transition-all flex items-center justify-center gap-2.5 shadow-sm disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{googleLoading ? 'Connexion Google...' : 'Continuer avec Google (Instantané)'}</span>
                </button>

                <div className="relative flex items-center justify-center pt-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <span className="relative bg-white dark:bg-slate-900 px-3 text-[10px] font-semibold tracking-wider uppercase text-slate-400">
                    Ou par e-mail
                  </span>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nom complet
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Jean Dupont"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Adresse email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="nom@exemple.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Numéro de téléphone (optionnel)
                </label>
                <PhoneInputWithCountry
                  value={phone}
                  onChange={setPhone}
                  defaultCountryCode="TG"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Sélectionnez le drapeau de votre pays pour insérer automatiquement l'indicatif.
                </p>
              </div>
            )}

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mot de passe *
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded focus:outline-none"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    title={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Jauge visuelle de force du mot de passe (rouge -> orange -> vert) */}
                {mode === 'register' && password && (
                  <div className="mt-2 space-y-1.5 animate-in fade-in">
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`font-semibold ${passwordStrength.textColor}`}>
                        Sécurité : {passwordStrength.label}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {password.length} car.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2e Champ de vérification obligatoire : Confirmation du Mot de passe (Mode Inscription) */}
            {mode === 'register' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Confirmez votre mot de passe *
                  </label>
                  {confirmPassword && (
                    <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                      passwordsMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                    }`}>
                      {passwordsMatch ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Mots de passe identiques</span>
                        </>
                      ) : (
                        <span>Ne correspond pas</span>
                      )}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                    confirmPassword && !passwordsMatch ? 'text-rose-500' : 'text-slate-400'
                  }`} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Retapez votre mot de passe à l'identique"
                    className={`w-full pl-9 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                      confirmPassword && !passwordsMatch
                        ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500 bg-rose-50/20'
                        : confirmPassword && passwordsMatch
                        ? 'border-emerald-400 dark:border-emerald-600 focus:ring-emerald-500 bg-emerald-50/10'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-sky-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded focus:outline-none"
                    aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    title={showConfirmPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium flex items-center gap-1 animate-in fade-in">
                    <span>⚠️ Les deux mots de passe ne sont pas identiques. Veuillez vérifier.</span>
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span>
                {loading
                  ? 'Traitement en cours...'
                  : mode === 'login'
                  ? 'Se connecter'
                  : mode === 'register'
                  ? 'Créer mon compte'
                  : 'Envoyer le lien'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Mode Switch Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          {mode === 'login' ? (
            <p>
              Pas encore de compte ?{' '}
              <button
                onClick={() => { setMode('register'); setError(null); }}
                className="font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                Créer un compte
              </button>
            </p>
          ) : mode === 'register' ? (
            <p>
              Déjà inscrit ?{' '}
              <button
                onClick={() => { setMode('login'); setError(null); }}
                className="font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                Se connecter
              </button>
            </p>
          ) : (
            <button
              onClick={() => { setMode('login'); setError(null); }}
              className="font-semibold text-sky-600 dark:text-sky-400 hover:underline"
            >
              Retour à la page de connexion
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
