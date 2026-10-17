# DIGISHOP by Lemax Group - Dossier de Synthèse & Documentation Complète

> Ce document résume l'ensemble des développements, de la configuration et des choix d'architecture réalisés pour la boutique Digishop. Il permet de reprendre le projet ou de le transférer sur n'importe quel compte Google ou environnement d'hébergement.

---

## 1. Vue d'ensemble du Projet
- **Nom commercial :** Digishop by Lemax Group
- **Type d'application :** Plateforme e-commerce de produits digitaux (e-books, templates, formations, ressources graphiques) avec téléchargement instantané après paiement.
- **Technologies clés :** 
  - Frontend : React 18, TypeScript, Tailwind CSS, Lucide Icons.
  - Backend : Express / Node.js (`server.ts`).
  - Base de données : Google Cloud Firestore (`ai-studio-digishoplemaxgro-1998cf08-4934-4b3b-9fce-5db5ecb162d3` sur le projet officiel `digishop-by-lemaxgroup`).
  - Authentification : Firebase Auth (Google Sign-In & Email/Mot de passe).

---

## 2. Moyens de Paiement Intégrés

1. **PayPal Checkout :**
   - Marque affichée : *Digishop by Lemax Group* (avec badges de sécurité et protection des achats).
   - L'adresse e-mail marchande a été masquée de l'interface publique pour plus de professionnalisme et de sécurité.
   
2. **PayDunya :**
   - Intégration pour cartes bancaires, Visa, Mastercard et mobile money d'Afrique de l'Ouest (Sénégal, Côte d'Ivoire, Bénin, etc.).

3. **Mobile Money Togo & Afrique de l'Ouest :**
   - **T-Money Togo** (Mixx by Yas) : `+228 90 99 71 83`
   - **Moov Money Togo** (Flooz) : `+228 99 07 43 00`
   - Notifications automatiques via passerelle Android SMS Webhook.

---

## 3. Système de Webhook & Passerelle SMS Android

Pour valider automatiquement les paiements Mobile Money reçus par SMS :
- **Application relais :** SMS Forwarder / SMS to Webhook sur smartphone Android.
- **Événements supportés :**
  - Réception de SMS / notifications de paiement (T-Money, Moov Money).
  - Validation instantanée du panier et déblocage des liens de téléchargement client.
- **Format Payload JSON supporté par le serveur :**
  ```json
  {
    "key": "{msg}",
    "time": "{time}"
  }
  ```
  *(La route serveur analyse l'expéditeur, le montant et la référence de transaction).*

---

## 4. Hébergement & Noms de Domaine

- **Sous-domaines gratuits :**
  - Vercel : `mon-projet.vercel.app` (gratuit, SSL automatique).
  - Firebase Hosting : `mon-projet.web.app` et `mon-projet.firebaseapp.com` (gratuit, CDN mondial Google).
- **Domaine personnalisé :**
  - Achat d'un domaine (ex: `digishop-lemax.com` sur Cloudflare, Namecheap ou Google Domains pour ~10 €/an).
  - Connexion gratuite sur Vercel ou Firebase Hosting via la section *Custom Domains*.

---

## 5. Comment transférer ce projet sur votre autre compte Google

### Étape 1 : Partager ou transférer le code
- Dans Google AI Studio, cliquez sur le bouton **Share** ou **Export / Download** pour récupérer l'archive ZIP du code source ou le lier à un compte GitHub.
- Sur votre nouveau compte Google, vous pouvez rouvrir le projet en important le dépôt GitHub ou le dossier du projet.

### Étape 2 : Transférer la base de données Firebase
1. Connectez-vous sur [console.firebase.google.com](https://console.firebase.google.com) avec votre compte actuel (`elvisioleng@gmail.com`).
2. Sélectionnez le projet `ai-studio-digishop-12d040d6-66c4-4631-8e46-74d9211f7158`.
3. Cliquez sur la **Roue crantée** (Paramètres du projet) > **Utilisateurs et autorisations**.
4. Cliquez sur **Ajouter un membre** et saisissez votre deuxième adresse Gmail.
5. Sélectionnez le rôle **Propriétaire (Owner)**.
6. Votre second compte Google a maintenant le contrôle absolu sur la base de données et l'hébergement.

### Étape 3 : Transférer le contexte de discussion
- Ouvrez une nouvelle session AI Studio avec votre second compte Google.
- Ouvrez le projet et dites à l'assistant : *"Regarde le fichier DIGISHOP_DOCUMENTATION.md pour comprendre l'historique et reprends le travail avec moi."* L'IA saura instantanément tout ce qui a été fait !
