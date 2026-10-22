import React, { useState } from 'react';
import { 
  X, 
  GitBranch, 
  UploadCloud, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink, 
  Lock, 
  FolderArchive, 
  Key, 
  User, 
  ShieldCheck,
  Loader2
} from 'lucide-react';

interface GitHubExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubExportModal: React.FC<GitHubExportModalProps> = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState('');
  const [repoName, setRepoName] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ repoUrl: string; message: string } | null>(null);

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessData(null);

    const cleanUser = username.trim();
    const cleanRepo = repoName.trim();
    const cleanTok = token.trim();

    if (!cleanRepo || !cleanTok) {
      setError('Veuillez renseigner au moins le nom du dépôt et votre jeton GitHub (Token).');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/export-to-github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          githubUsername: cleanUser,
          repoName: cleanRepo,
          githubToken: cleanTok
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Une erreur est survenue lors du transfert.');
      }

      setSuccessData(data);
    } catch (err: any) {
      setError(err.message || 'Impossible de se connecter à GitHub. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 my-8 text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-slate-900 text-white dark:bg-sky-500/20 dark:text-sky-400 dark:border dark:border-sky-500/30 flex items-center justify-center shrink-0 shadow-sm">
            <UploadCloud className="w-6 h-6 text-white dark:text-sky-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-display text-slate-950 dark:text-white leading-tight">
              Exportateur GitHub Automatique
            </h2>
            <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">
              Conçu spécialement pour smartphone Android & transfert de compte
            </p>
          </div>
        </div>

        {/* Why this is needed on Android */}
        <div className="p-3.5 mb-5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
          <div className="font-semibold flex items-center gap-1.5 mb-1 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Pourquoi cet outil est indispensable sur Android ?</span>
          </div>
          Sur smartphone Android, le sélecteur de fichiers ne permet pas de téléverser des dossiers (comme <code className="bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded font-mono font-semibold">src/</code>, <code className="bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded font-mono font-semibold">data/</code>, <code className="bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded font-mono font-semibold">scripts/</code>). Cet outil transfère l'intégralité du projet directement sur votre GitHub en 5 secondes !
        </div>

        {/* Success View */}
        {successData ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-sm">
              <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 mb-1.5">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Transfert terminé avec succès !</span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed mb-3">
                Tous les dossiers (<code className="bg-emerald-100 dark:bg-emerald-900/40 px-1 rounded">src</code>, <code className="bg-emerald-100 dark:bg-emerald-900/40 px-1 rounded">data</code>, <code className="bg-emerald-100 dark:bg-emerald-900/40 px-1 rounded">scripts</code>) et tous les fichiers du projet sont maintenant disponibles sur votre GitHub.
              </p>
              
              <a
                href={successData.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <span>Voir mon dépôt sur GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-500" />
                Étape suivante sur votre autre compte Google AI Studio :
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 pl-1">
                <li>Connectez-vous sur Google AI Studio avec votre second compte.</li>
                <li>Cliquez sur <strong>« Create »</strong> ou <strong>« Import from GitHub »</strong>.</li>
                <li>Sélectionnez votre dépôt <strong>{repoName || 'votre dépôt'}</strong>.</li>
                <li>Votre boutique sera clonée à 100% à l'identique avec tous ses produits, son code et ses configurations !</li>
              </ol>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-sky-500 text-white hover:bg-slate-800 dark:hover:bg-sky-400 transition-colors shadow-sm"
            >
              Fermer la fenêtre
            </button>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Error banner */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Field 1: GitHub Username */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>1. Votre pseudo GitHub</span>
                </span>
                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-normal">Auto-détection via token</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: jean-dupont (ou votre email)"
                disabled={loading}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
              />
              <p className="text-[11px] text-slate-400">
                Votre nom d'utilisateur GitHub. Si vous entrez votre email, votre identifiant sera automatiquement résolu.
              </p>
            </div>

            {/* Field 2: Repository Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                  <span>2. Nom du dépôt GitHub (Repo)</span>
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">Créé auto si inexistant</span>
              </label>
              <input
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="Ex: digishop-boutique"
                required
                disabled={loading}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
              />
              <p className="text-[11px] text-slate-400">
                Le nom du dépôt sur votre compte GitHub. S'il n'existe pas encore, il sera créé automatiquement !
              </p>
            </div>

            {/* Field 3: Personal Access Token */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span>3. Votre jeton personnel (Token GitHub)</span>
                </span>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=Digishop+Export"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
                >
                  <span>Créer un token en 1 clic (repo + workflow)</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                required
                disabled={loading}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
              />
              <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                💡 <strong>Rappel pour GitHub Actions :</strong> Cochez bien <strong>« repo »</strong> ET <strong>« workflow »</strong>. C'est ce qui permet aux fichiers <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">.github/workflows</code> d'être mis à jour pour lancer automatiquement vos builds dans l'onglet <strong>Action</strong> sur GitHub !
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transfert complet en cours... (Patientez quelques secondes)</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Transférer tout le projet sur GitHub</span>
                </>
              )}
            </button>

            {/* Alternative direct ZIP download */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <FolderArchive className="w-3.5 h-3.5 text-slate-400" />
                Besoin de l'archive ZIP directe ?
              </span>
              <a
                href="/api/export-project.zip"
                download="digishop-by-lemax-group.zip"
                className="text-sky-600 dark:text-sky-400 font-semibold hover:underline"
              >
                Télécharger .zip
              </a>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
