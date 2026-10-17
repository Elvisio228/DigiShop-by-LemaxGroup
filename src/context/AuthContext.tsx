import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('digishop_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Monitor Firebase Authentication state automatically (for Firebase Hosting & cloud sessions)
  useEffect(() => {
    let isMounted = true;
    import('../lib/firebase').then(({ auth, onAuthStateChanged, getUserFromFirestore, saveUserToFirestore }) => {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (!isMounted) return;
        if (fbUser) {
          const cleanEmail = (fbUser.email || '').toLowerCase().trim();
          const isAdmin = cleanEmail === 'lemaxshop01@gmail.com' || cleanEmail === 'admin@digishop.com' || cleanEmail === 'elvisioleng@gmail.com';
          
          let profile = await getUserFromFirestore(fbUser.uid);
          if (!profile) {
            profile = {
              id: fbUser.uid,
              name: fbUser.displayName || cleanEmail.split('@')[0] || 'Utilisateur',
              email: cleanEmail,
              role: isAdmin ? 'admin' : 'customer',
              createdAt: new Date().toISOString(),
              ordersCount: 0,
              totalSpent: 0
            };
            saveUserToFirestore(profile).catch(() => {});
          }
          setUser(profile);
          setIsLoading(false);
        } else {
          // If no Firebase session, check if there was a local backend session
          const localTok = localStorage.getItem('digishop_token');
          if (localTok) {
            fetchCurrentUser(localTok);
          } else {
            setUser(null);
            setIsLoading(false);
          }
        }
      });
      return () => unsubscribe();
    }).catch(err => {
      console.warn('[Firebase] Auth listener error:', err);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchCurrentUser = useCallback(async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setUser(data);
      } else {
        localStorage.removeItem('digishop_token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to authenticate session:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    try {
      // 1. Try Firebase Authentication (Serverless & production-ready for Firebase Hosting)
      try {
        const { loginWithEmailPassword } = await import('../lib/firebase');
        const loggedUser = await loginWithEmailPassword(cleanEmail, password);
        localStorage.setItem('digishop_token', loggedUser.id);
        setToken(loggedUser.id);
        setUser(loggedUser);

        // Notify local server asynchronously if present (silent fallback)
        import('../lib/apiClient').then(({ safeFetchJson }) => {
          safeFetchJson('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          }).catch(() => {});
        });
        return loggedUser;
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
          throw new Error('Adresse e-mail ou mot de passe incorrect.');
        } else if (fbErr.code === 'auth/invalid-email') {
          throw new Error('Adresse e-mail invalide.');
        } else if (fbErr.code === 'auth/operation-not-allowed') {
          throw new Error('Le fournisseur "Adresse e-mail / Mot de passe" doit être activé dans votre console Firebase (Authentication > Mode de connexion). Vous pouvez aussi vous connecter avec le bouton "Continuer avec Google".');
        } else if (fbErr.code === 'auth/too-many-requests') {
          throw new Error('Trop de tentatives infructueuses. Veuillez patienter un instant ou utiliser Google.');
        } else if (fbErr.code === 'auth/network-request-failed') {
          throw new Error('La connexion réseau vers Firebase a été interrompue. Vérifiez votre connexion internet ou utilisez « Continuer avec Google » qui fonctionne directement sur votre smartphone.');
        } else if (fbErr.code && !fbErr.message?.includes('fetch')) {
          throw new Error(fbErr.message || 'Erreur lors de la connexion.');
        }
      }

      // 2. Fallback to local server API if running in Express dev environment
      const { safeFetchJson } = await import('../lib/apiClient');
      const apiRes = await safeFetchJson<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      });

      if (apiRes.ok && apiRes.data?.user) {
        localStorage.setItem('digishop_token', apiRes.data.token);
        setToken(apiRes.data.token);
        setUser(apiRes.data.user);
        return apiRes.data.user;
      } else {
        throw new Error(apiRes.error || 'Connexion impossible. Vérifiez vos identifiants ou utilisez Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    try {
      // 1. Try Firebase Authentication (Serverless & production-ready for Firebase Hosting)
      try {
        const { registerWithEmailPassword } = await import('../lib/firebase');
        const newUser = await registerWithEmailPassword(cleanName, cleanEmail, password, phone);
        localStorage.setItem('digishop_token', newUser.id);
        setToken(newUser.id);
        setUser(newUser);

        // Notify local server asynchronously if present (silent fallback)
        import('../lib/apiClient').then(({ safeFetchJson }) => {
          safeFetchJson('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: cleanName, email: cleanEmail, password, phone })
          }).catch(() => {});
        });
        return newUser;
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/email-already-in-use') {
          throw new Error('Cette adresse e-mail est déjà utilisée par un autre compte. Veuillez vous connecter.');
        } else if (fbErr.code === 'auth/invalid-email') {
          throw new Error('L\'adresse e-mail saisie n\'est pas valide.');
        } else if (fbErr.code === 'auth/operation-not-allowed') {
          throw new Error('Le fournisseur "Adresse e-mail / Mot de passe" doit être activé dans votre console Firebase (Authentication > Mode de connexion). Vous pouvez aussi créer votre compte en 1 clic avec le bouton "Continuer avec Google".');
        } else if (fbErr.code === 'auth/network-request-failed') {
          throw new Error('La connexion réseau vers Firebase a été interrompue. Vérifiez votre connexion internet ou utilisez « Continuer avec Google » qui fonctionne directement sur votre smartphone.');
        } else if (fbErr.code && !fbErr.message?.includes('fetch')) {
          throw new Error(fbErr.message || 'Erreur lors de la création du compte.');
        }
      }

      // 2. Fallback to local server API if running in Express dev environment
      const { safeFetchJson } = await import('../lib/apiClient');
      const apiRes = await safeFetchJson<{ user: User; token: string }>('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone })
      });

      if (apiRes.ok && apiRes.data?.user) {
        localStorage.setItem('digishop_token', apiRes.data.token);
        setToken(apiRes.data.token);
        setUser(apiRes.data.user);
        return apiRes.data.user;
      } else {
        throw new Error(apiRes.error || 'Impossible de créer le compte. Utilisez le bouton "Continuer avec Google" ou activez Email/Mot de passe dans Firebase.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<User> => {
    setIsLoading(true);
    try {
      const { signInWithGoogle, saveUserToFirestore, getUserFromFirestore } = await import('../lib/firebase');
      const cred = await signInWithGoogle();
      const fbUser = cred.user;

      const cleanEmail = (fbUser.email || '').toLowerCase().trim();
      const isAdminUser = cleanEmail === 'lemaxshop01@gmail.com' || cleanEmail === 'admin@digishop.com' || cleanEmail === 'elvisioleng@gmail.com';

      let profile = await getUserFromFirestore(fbUser.uid);
      if (!profile) {
        profile = {
          id: fbUser.uid,
          name: fbUser.displayName || cleanEmail.split('@')[0] || 'Utilisateur Google',
          email: cleanEmail,
          role: isAdminUser ? 'admin' : 'customer',
          createdAt: new Date().toISOString(),
          ordersCount: 0,
          totalSpent: 0
        };
        await saveUserToFirestore(profile);
      }

      localStorage.setItem('digishop_token', profile.id);
      setToken(profile.id);
      setUser(profile);

      // Asynchronously notify local backend if available
      import('../lib/apiClient').then(({ safeFetchJson }) => {
        safeFetchJson('/api/auth/firebase-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: fbUser.email,
            name: fbUser.displayName,
            uid: fbUser.uid
          })
        }).catch(() => {});
      });

      return profile;
    } catch (gErr: any) {
      if (gErr.code === 'auth/popup-closed-by-user') {
        throw new Error('Connexion Google annulée (fenêtre fermée).');
      } else if (gErr.code === 'auth/cancelled-popup-request') {
        throw new Error('Une tentative de connexion est déjà en cours.');
      } else if (gErr.code === 'auth/unauthorized-domain') {
        throw new Error('Ce domaine web doit être autorisé dans votre console Firebase (Authentication > Paramètres > Domaines autorisés).');
      }
      throw gErr;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('digishop_token');
    setToken(null);
    setUser(null);
    import('../lib/firebase').then(({ signOutFromFirebase }) => signOutFromFirebase()).catch(() => {});
  };

  const refreshUser = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  const ADMIN_EMAILS = ['lemaxshop01@gmail.com', 'admin@digishop.com', 'elvisioleng@gmail.com'];
  const isAdmin = user?.role === 'admin' || (!!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim()));

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
