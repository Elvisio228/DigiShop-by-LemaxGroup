# DIGISHOP — Votre marché digital, à portée de clic

**Digishop** est une plateforme e-commerce full-stack de nouvelle génération, conçue pour la vente de produits exclusivement numériques téléchargeables immédiatement (e-books, templates professionnels, ressources graphiques 3D, documents juridiques et formations en ligne).

---

## 1. Identité & Caractéristiques Clés

- **Nom officiel** : DIGISHOP
- **Slogan** : « Votre marché digital, à portée de clic. »
- **Livraison** : 100% Numérique, immédiate (« Produit numérique — aucun frais de livraison »).
- **Protection des fichiers** : Accès par jetons cryptographiques signés, durée de validité limitée et plafonnement du nombre de téléchargements par commande.
- **Moyens de paiement supportés** :
  - **Carte Bancaire (Visa / Mastercard)** : Interface conforme aux standards PCI-DSS (aucun stockage des numéros de carte sensibles).
  - **PayPal** : Compte marchand officiel `elvisiolengbis@gmail.com` avec gestion des identifiants via variables d'environnement (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`).
  - **Moov Money** : Compte marchand `99668884` avec saisie de référence de transaction et contrôle administratif avant délivrance.
  - **Mixx** : Numéro `90107715` avec suivi de référence et validation sécurisée côté administrateur.
- **Expérience Utilisateur** : Mode Clair / Mode Sombre, notifications toasts personnalisées, panier glissant, checkout multi-étapes et recherche instantanée.

---

## 2. Architecture Technique

```
digishop/
├── server.ts               # Serveur Express full-stack, API sécurisée & middleware Vite
├── index.html              # Point d'entrée avec SEO balisé & Schema.org JSON-LD
├── metadata.json           # Métadonnées officielles de l'application
├── package.json            # Scripts de build et dépendances
├── .env.example            # Fichier de configuration des variables d'environnement
├── README.md               # Documentation complète de production
├── data/
│   └── db.json             # Base de données persistante (utilisateurs, commandes, produits, coupons)
├── src/
│   ├── types.ts            # Définitions TypeScript strictes
│   ├── main.tsx            # Point d'entrée React 19
│   ├── App.tsx             # Routeur principal & synchronisation des URLs
│   ├── index.css           # Thème Tailwind CSS & polices typographiques
│   ├── context/
│   │   ├── AuthContext.tsx    # Gestion des sessions & rôles (admin/client)
│   │   ├── CartContext.tsx    # État du panier & validation des codes promos
│   │   ├── ToastContext.tsx   # Système de notifications visuelles
│   │   └── ThemeContext.tsx   # Mode Sombre / Mode Clair
│   ├── server/
│   │   ├── database.ts        # Couche de persistance, hachage PBKDF2 & JWT
│   │   ├── digitalVault.ts    # Coffre-fort des fichiers téléchargeables signés
│   │   └── seedData.ts        # Catalogue de démonstration et données initiales
│   ├── components/
│   │   ├── Navbar.tsx         # Barre de navigation (Top Bar Contract 3 zones)
│   │   ├── Footer.tsx         # Pied de page officiel avec badges de réassurance
│   │   ├── Hero.tsx           # Section d'accueil haute conversion
│   │   ├── ProductCard.tsx    # Fiche produit élégante (anti-slop, sans pillule superflue)
│   │   ├── CartDrawer.tsx     # Tiroir latéral du panier
│   │   ├── AdBanner.tsx       # Espaces publicitaires configurables
│   │   ├── NewsletterSection.tsx # Inscription newsletter avec honeypot anti-spam
│   │   ├── AuthModal.tsx      # Modal de connexion / inscription
│   │   └── ToastContainer.tsx # Affichage des alertes et succès
│   └── views/
│       ├── HomeView.tsx              # Page d'accueil complète
│       ├── CatalogView.tsx           # Boutique avec filtres, recherche et tri
│       ├── ProductDetailView.tsx     # Fiche produit détaillée (PDP)
│       ├── CheckoutView.tsx          # Processus de commande en 5 étapes
│       ├── OrderSuccessView.tsx      # Hub de téléchargement direct post-achat
│       ├── CustomerDashboardView.tsx # Espace client (Mes téléchargements, commandes, profil)
│       ├── AdminDashboardView.tsx    # Dashboard propriétaire (/admin)
│       ├── LegalPagesView.tsx        # CGV, RGPD, Cookies, Remboursements
│       ├── AboutView.tsx             # À propos de Digishop
│       ├── FaqView.tsx               # Foire aux questions
│       └── ContactView.tsx           # Formulaire de contact client
```

---

## 3. Comptes Pré-configurés de Démonstration

Pour tester l'ensemble du système, deux comptes sont pré-intégrés :

### 👑 Compte Administrateur / Propriétaire
- **Email** : `admin@digishop.com`
- **Mot de passe** : `Admin@Digishop2026!`
- **Droits** : Accès complet à `/admin`, statistiques en temps réel, création/modification/suppression de produits, création de coupons promos, gestion des bannières pubs et **validation des paiements Moov Money (99668884) & Mixx (90107715)**.

### 👤 Compte Client
- **Email** : `client@digishop.com`
- **Mot de passe** : `Client@Digishop2026!`
- **Statut** : Commandes passées, accès direct à ses téléchargements numériques dans son espace client.

---

## 4. Instructions d'Installation et Démarrage Local

```bash
# 1. Cloner le projet ou naviguer dans le dossier
cd digishop

# 2. Installer les dépendances
npm install

# 3. Copier le fichier de configuration environnement
cp .env.example .env

# 4. Lancer le serveur de développement full-stack (port 3000)
npm run dev
```

L'application s'ouvre sur `http://localhost:3000`.

---

## 5. Configuration des Paiements

### A. Intégration PayPal
Renseignez vos clés fournies par le portail développeur PayPal dans votre fichier `.env` :
```env
PAYPAL_CLIENT_ID="VOTRE_PAYPAL_CLIENT_ID"
PAYPAL_CLIENT_SECRET="VOTRE_PAYPAL_CLIENT_SECRET"
PAYPAL_MERCHANT_EMAIL="elvisiolengbis@gmail.com"
PAYPAL_MODE="sandbox" # Remplacer par "live" pour la production
```

### B. Cartes Bancaires (Visa / Mastercard)
Le système est prêt pour le branchement de votre passerelle bancaire (Stripe, Paystack, Flutterwave, Monetbil, etc.). L'interface est conçue pour respecter les normes PCI-DSS sans jamais sauvegarder les numéros en clair dans la base de données.

### C. Paiements Mobiles (Moov Money & Mixx)
- **Moov Money** : Marchand `99668884`
- **Mixx** : Numéro `90107715`
- **Processus de sécurité** : Lorsqu'un client sélectionne Moov Money ou Mixx, la commande passe au statut `pending_payment` (« Paiement en attente »). Dès réception de la notification de transfert par l'administrateur, celui-ci clique sur **« Valider le paiement »** dans son dashboard `/admin`. La commande passe instantanément à `paid` et le client a immédiatement accès à ses téléchargements.

---

## 6. Connexion d'un Nom de Domaine Professionnel

Pour connecter un nom de domaine personnalisé (ex: `digishop.shop` ou `digishop.store`) :
1. Commandez votre domaine auprès d'un registrar (ex: Namecheap, OVH, Hostinger, Cloudflare).
2. Configurez les enregistrements DNS :
   - Type **A** : `@` pointant vers l'adresse IP de votre serveur de déploiement.
   - Type **CNAME** : `www` pointant vers votre domaine racine ou l'URL de votre hébergement (ex: `cname.vercel-dns.com` ou l'alias Cloud Run).
3. Activez le certificat SSL / HTTPS (automatique avec Cloudflare ou Let's Encrypt).
4. Mettez à jour la variable `APP_URL="https://votre-domaine.com"` dans votre fichier d'environnement.

---

## 7. Instructions de Déploiement en Production

### Déploiement sur Cloud Run / Docker / VPS
Le projet dispose d'une compilation optimisée avec Vite et Express :
```bash
# Compiler le frontend
npm run build

# Démarrer le serveur Node en production
npm start
```

---

© 2026 DIGISHOP. Tous droits réservés.
