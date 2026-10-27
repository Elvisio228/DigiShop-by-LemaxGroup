import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import defaultDb from '../../data/db.json';

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

const ADMIN_EMAILS = ['lemaxshop01@gmail.com', 'admin@digishop.com'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize user from cached session to prevent flash of logged-out state
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('digishop_user_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) return parsed;
      }
    } catch {}
    return null;
  });

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
          const isUserAdmin = ADMIN_EMAILS.includes(cleanEmail);
          
          let profile = await getUserFromFirestore(fbUser.uid);
          if (!profile) {
            profile = {
              id: fbUser.uid,
              name: fbUser.displayName || cleanEmail.split('@')[0] || 'Utilisateur',
              email: cleanEmail,
              role: isUserAdmin ? 'admin' : 'customer',
              createdAt: new Date().toISOString(),
              ordersCount: 0,
              totalSpent: 0
            };
            saveUserToFirestore(profile).catch(() => {});
          }
          try {
            const idToken = await fbUser.getIdToken();
            setToken(idToken);
            localStorage.setItem('digishop_token', idToken);
          } catch {
            setToken(fbUser.uid);
            localStorage.setItem('digishop_token', fbUser.uid);
          }

          localStorage.setItem('digishop_user_session', JSON.stringify(profile));
          setUser(profile);
          setIsLoading(false);
        } else {
          // If no Firebase session, check if there is a valid stored session
          const savedSession = localStorage.getItem('digishop_user_session');
          if (savedSession) {
            try {
              const parsed = JSON.parse(savedSession);
              if (parsed && parsed.email) {
                setUser(parsed);
                setIsLoading(false);
                return;
              }
            } catch {}
          }

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
      // Fallback to local session
      const savedSession = localStorage.getItem('digishop_user_session');
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          if (parsed && parsed.email) setUser(parsed);
        } catch {}
      }
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
        localStorage.setItem('digishop_user_session', JSON.stringify(data));
      } else {
        // On static hosting (Firebase Hosting), /api/auth/me returns index.html.
        // DO NOT wipe the user if we already have a saved local user session!
        const saved = localStorage.getItem('digishop_user_session');
        if (!saved) {
          localStorage.removeItem('digishop_token');
          setToken(null);
          setUser(null);
        }
      }
    } catch (err) {
      console.error('Failed to authenticate session:', err);
      const saved = localStorage.getItem('digishop_user_session');
      if (!saved) {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Try Firebase Authentication (Serverless & production-ready for Firebase Hosting)
      try {
        const { loginWithEmailPassword } = await import('../lib/firebase');
        const loggedUser = await loginWithEmailPassword(cleanEmail, password);
        localStorage.setItem('digishop_token', loggedUser.id);
        localStorage.setItem('digishop_user_session', JSON.stringify(loggedUser));
        setToken(loggedUser.id);
        setUser(loggedUser);
        return loggedUser;
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
          throw new Error('Mot de passe incorrect pour cette adresse e-mail.');
        } else if (fbErr.code === 'auth/invalid-email') {
          throw new Error('Adresse e-mail invalide.');
        } else if (fbErr.code === 'auth/operation-not-allowed') {
          throw new Error('Le fournisseur Email/Mot de passe doit être activé dans Firebase Authentication.');
        }
      }

      // 2. Fallback to local server API or db.json users
      const { safeFetchJson } = await import('../lib/apiClient');
      const apiRes = await safeFetchJson<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      });

      if (apiRes.ok && apiRes.data?.user) {
        localStorage.setItem('digishop_token', apiRes.data.token);
        localStorage.setItem('digishop_user_session', JSON.stringify(apiRes.data.user));
        setToken(apiRes.data.token);
        setUser(apiRes.data.user);
        return apiRes.data.user;
      }

      // 3. Fallback for offline demo customer accounts (non-admin)
      const matchedUser = (defaultDb.users as any[])?.find(u => u.email.toLowerCase().trim() === cleanEmail);
      if (matchedUser && matchedUser.role !== 'admin') {
        const userObj: User = {
          id: matchedUser.id,
          name: matchedUser.name,
          email: matchedUser.email,
          role: 'customer',
          phone: matchedUser.phone,
          createdAt: matchedUser.createdAt,
          ordersCount: matchedUser.ordersCount || 0,
          totalSpent: matchedUser.totalSpent || 0
        };
        localStorage.setItem('digishop_token', userObj.id);
        localStorage.setItem('digishop_user_session', JSON.stringify(userObj));
        setToken(userObj.id);
        setUser(userObj);
        return userObj;
      }

      throw new Error('Adresse e-mail ou mot de passe incorrect. Vous pouvez vous connecter avec Google ou réinitialiser votre mot de passe.');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string): Promise<User> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    try {
      // 1. Try Firebase Authentication
      try {
        const { registerWithEmailPassword } = await import('../lib/firebase');
        const newUser = await registerWithEmailPassword(cleanName, cleanEmail, password, phone);
        localStorage.setItem('digishop_token', newUser.id);
        localStorage.setItem('digishop_user_session', JSON.stringify(newUser));
        setToken(newUser.id);
        setUser(newUser);
        return newUser;
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/email-already-in-use') {
          throw new Error('Cette adresse e-mail est déjà utilisée. Veuillez vous connecter.');
        } else if (fbErr.code === 'auth/invalid-email') {
          throw new Error('L\'adresse e-mail saisie n\'est pas valide.');
        }
      }

      // 2. Client-side registration fallback for static Hosting
      const isNewAdmin = ADMIN_EMAILS.includes(cleanEmail);
      const fallbackUser: User = {
        id: `usr-${Date.now()}`,
        name: cleanName || 'Utilisateur',
        email: cleanEmail,
        role: isNewAdmin ? 'admin' : 'customer',
        phone: phone ? phone.trim() : '',
        createdAt: new Date().toISOString(),
        ordersCount: 0,
        totalSpent: 0
      };
      localStorage.setItem('digishop_token', fallbackUser.id);
      localStorage.setItem('digishop_user_session', JSON.stringify(fallbackUser));
      setToken(fallbackUser.id);
      setUser(fallbackUser);
      return fallbackUser;
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
      const isAdminUser = ADMIN_EMAILS.includes(cleanEmail);

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
        saveUserToFirestore(profile).catch(() => {});
      }

      const idToken = await fbUser.getIdToken().catch(() => fbUser.uid);
      localStorage.setItem('digishop_token', idToken);
      localStorage.setItem('digishop_user_session', JSON.stringify(profile));
      setToken(idToken);
      setUser(profile);
      return profile;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('digishop_token');
    localStorage.removeItem('digishop_user_session');
    setToken(null);
    setUser(null);
    import('../lib/firebase').then(({ signOutFromFirebase }) => signOutFromFirebase()).catch(() => {});
  };

  const refreshUser = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

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
