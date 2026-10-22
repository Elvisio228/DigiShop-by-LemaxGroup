import crypto from 'crypto';

export interface VaultFile {
  filename: string;
  mimeType: string;
  getContent: (orderNumber: string, customerName: string) => Buffer;
}

export const DIGITAL_VAULT_FILES: Record<string, VaultFile> = {
  'prod-1': {
    filename: 'digishop_guide_marketing_digital_v2.pdf.txt',
    mimeType: 'text/plain; charset=utf-8',
    getContent: (orderNumber: string, customerName: string) => {
      const content = `================================================================================
DIGISHOP — VOTRE MARCHÉ DIGITAL, À PORTÉE DE CLIC
PRODUIT OFFICIEL : GUIDE ULTIME DU MARKETING DIGITAL & CROISSANCE
================================================================================
Numéro de commande : ${orderNumber}
Client licencié : ${customerName}
Date de délivrance : ${new Date().toISOString()}
Licence : Licence Standard Personnelle / Droit d'utilisation individuel
Sécurité : Fichier signé électroniquement par Digishop Digital Vault.
================================================================================

TABLE DES MATIÈRES & MODULES STRATÉGIQUES :

--- MODULE 1 : L'ARCHITECTURE DU TUNNEL DE VENTE 2026 ---
1.1 Les 3 piliers de la conversion moderne :
    - L'accroche à friction zéro (Zéro barrière psychologique)
    - La proposition de valeur quantifiée (+X% en Y jours)
    - L'offre irrésistible avec empilement de bonus (Stack Value)

1.2 Taux de conversion de référence :
    - Visiteur vers Prospect qualifié : Objectif 22% à 35%
    - Prospect vers Acheteur initial : Objectif 3.5% à 7%
    - Panier moyen et Upsell en 1 clic : Taux d'adoption 18%

--- MODULE 2 : ACQUISITION PAYANTE & RENTABILITÉ IMMÉDIATE (ROAS > 3.5) ---
2.1 Stratégie Meta Ads 2026 :
    - Campagnes Broad avec créatifs verticaux ultra-authentiques (UGC)
    - Structure CBO (Campaign Budget Optimization) simplifiée
    - 5 angles publicitaires incontournables : Le Problème Aigu, Le Contraste Avant/Après,
      La Preuve Sociale Détaillée, La Déconstruction du Mythe, L'Offre Limitée.

2.2 Google Search & Intent Marketing :
    - Ciblage des requêtes à haute intention transactionnelle ("Acheter template", "Modèle contrat")
    - Structure SKAG modernisée et extensions de prix dynamiques.

--- MODULE 3 : COPYWRITING & PSYCHOLOGIE D'ACHAT ---
3.1 La formule PASA adaptée au digital :
    - Problème : Nommer la douleur exacte avec les mots du client.
    - Agitation : Calculer le coût de l'inaction (temps perdu, argent gaspillé).
    - Solution : Présenter votre produit digital comme le raccourci évident.
    - Action : Appel à l'action précis, visible et sans ambiguïté.

--- MODULE 4 : FIDÉLISATION & STRATÉGIE EMAIL ---
4.1 Séquence de bienvenue 5 emails à haute conversion :
    - Email 1 : Livraison immédiate + cadeau surprise non annoncé.
    - Email 2 : L'histoire de la méthode et les pièges classiques à éviter.
    - Email 3 : Étude de cas concrète d'un client similaire.
    - Email 4 : Réponse aux 4 objections les plus fréquentes.
    - Email 5 : Offre spéciale sur le palier supérieur ou accompagnement.

================================================================================
FÉLICITATIONS POUR VOTRE ACQUISITION !
Besoin d'aide ou de ressources complémentaires ?
Support client Digishop : support@digishop.com
Site officiel : https://digishop.shop
================================================================================
`;
      return Buffer.from(content, 'utf-8');
    }
  },

  'prod-2': {
    filename: 'digishop_executive_pitch_business_plan.zip.txt',
    mimeType: 'text/plain; charset=utf-8',
    getContent: (orderNumber: string, customerName: string) => {
      const content = `================================================================================
DIGISHOP — PACK ULTIME BUSINESS PLAN & PITCH DECK EXÉCUTIF
================================================================================
Commande : ${orderNumber}
Attribué à : ${customerName}
Licence Commerciale Valide

VOS ACCÈS ET CONTENUS TÉLÉCHARGEABLES DU PACK :

1. Modèle de Business Plan Exécutif (Structure 30 pages) :
   - Résumé exécutif (Executive Summary)
   - Présentation de l'équipe et vision
   - Analyse de marché, TAM / SAM / SOM et positionnement concurrentiel
   - Modèle économique (Unit Economics, CAC, LTV, MRR)
   - Plan opérationnel et feuille de route technique sur 24 mois

2. Modèle Financier Prévisionnel 3 ans (Excel & Google Sheets) :
   Lien direct du modèle dynamique : https://digishop.shop/resources/templates/financial-model-v3
   (Formules pré-configurées : Chiffre d'affaires, Marge brute, BFR, Compte de Résultat,
   Tableau de Trésorerie mensuelle et Seuil de rentabilité).

3. Structure Pitch Deck Investisseur (12 Slides Clés) :
   Slide 1: Vision & Accroche
   Slide 2: Le Problème Non Résolu
   Slide 3: Votre Solution & Démonstration
   Slide 4: Taille du Marché & Momentum
   Slide 5: Modèle Économique & Pricing
   Slide 6: Traction Récente & Métriques Clés
   Slide 7: Stratégie Go-To-Market
   Slide 8: Paysage Concurrentiel & Barrières à l'entrée
   Slide 9: Équipe Fondatrice
   Slide 10: Prévisionnel Financier (3-5 ans)
   Slide 11: Besoin de Financement & Allocation des fonds
   Slide 12: Contact & Prochaines étapes

Support technique & questions : support@digishop.com
================================================================================
`;
      return Buffer.from(content, 'utf-8');
    }
  },

  'prod-3': {
    filename: 'digishop_mega_3d_icons_assets.zip.txt',
    mimeType: 'text/plain; charset=utf-8',
    getContent: (orderNumber: string, customerName: string) => {
      const content = `================================================================================
DIGISHOP — MEGA PACK 3D ICONS & UI ASSETS HAUTE RÉSOLUTION
================================================================================
Licence : Licence Étendue (Usage commercial et projets clients illimités)
Numéro de licence : ${orderNumber}
Titulaire : ${customerName}

RÉPERTOIRE DES RESSOURCES DIGITALES :
- 350+ Icônes 3D rendues en PNG 3000x3000px avec transparence alpha 100%
- Kit de composants Figma synchronisé (Glassmorphism, Chrome, Clay, Neon)
- Scènes sources Blender (.blend) avec éclairage studio 3 points configuré
- Optimisé pour le Web moderne (WebP et SVG inclus)

Lien d'accès permanent à la bibliothèque Figma officielle :
https://figma.com/@digishop/mega-3d-icons-pack-pro?auth=${orderNumber}

Ce fichier certifie votre droit exclusif d'utilisation pour vos projets
personnels et commerciaux.
================================================================================
`;
      return Buffer.from(content, 'utf-8');
    }
  },

  'prod-4': {
    filename: 'digishop_masterclass_ecommerce_kit.zip.txt',
    mimeType: 'text/plain; charset=utf-8',
    getContent: (orderNumber: string, customerName: string) => {
      const content = `================================================================================
DIGISHOP ACADEMY — MASTERCLASS E-COMMERCE & SCALING INTERNATIONAL
================================================================================
Apprenant : ${customerName}
Identifiant d'inscription : ${orderNumber}
Statut : Accès Étudiant Débloqué à Vie

VOS MODULES DE FORMATION EN LIGNE :
Module 1: Fondations & Sourcing de Produits Numériques et Physiques à Forte Marge
Module 2: Conception de la Boutique Ultra-Rapide et Ergonomique (UX/UI)
Module 3: Intégration des Systèmes de Paiement Sécurisés (PayPal, Cartes, Moov Money, Mixx)
Module 4: Tunnels d'Acquisition et Automatisation Marketing
Module 5: Stratégie de Marque & Rétention Clientèle
Module 6: Logistique & Gestion des Litiges
Module 7: Scaling Multi-Devises et Fiscalité Internationale
Module 8: Plan d'Action 90 Jours : De la Première Vente au Palier 10k€/mois

Cahier d'exercices PDF et checklists d'audit inclus.
Accès au portail étudiant Digishop : https://digishop.shop/academy/login?code=${orderNumber}
================================================================================
`;
      return Buffer.from(content, 'utf-8');
    }
  },

  'prod-5': {
    filename: 'digishop_pack_juridique_pro_2026.zip.txt',
    mimeType: 'text/plain; charset=utf-8',
    getContent: (orderNumber: string, customerName: string) => {
      const content = `================================================================================
DIGISHOP — PACK JURIDIQUE PRO : CONTRATS, CGV & ACCORDS NUMÉRIQUES
================================================================================
Délivré à : ${customerName}
Réf. Transaction : ${orderNumber}
Licence : Réutilisation professionnelle sans limitation

SOMMAIRE DES MODÈLES LÉGAUX INCLUS :

1. CONTRAT DE PRESTATION DE SERVICES & CRÉATION DIGITALE (DOCX)
   - Objet de la mission et définition des livrables
   - Modalités de règlement, acomptes et pénalités de retard
   - Clause de transfert de propriété intellectuelle après paiement complet
   - Clause de limitation de responsabilité et force majeure

2. CONDITIONS GÉNÉRALES DE VENTE (CGV) POUR PRODUITS NUMÉRIQUES
   - Caractère immédiatement exécutable du produit dématérialisé
   - Renonciation expresse au droit de rétractation conformément au Code de la Consommation
   - Limitation des droits de redistribution et protection anti-piratage
   - Juridiction compétente et règlement amiable des différends

3. ACCORD DE CONFIDENTIALITÉ BILATÉRAL (NON-DISCLOSURE AGREEMENT - NDA)
   - Périmètre strict des informations confidentielles
   - Durée de validité (2 à 5 ans) et sanctions pécuniaires prévues

4. POLITIQUE DE CONFIDENTIALITÉ ET GESTION DES DONNÉES PERSONNELLES (RGPD)
   - Registre des traitements, finalité des données collectées
   - Droits d'accès, de rectification et d'effacement du client

================================================================================
Note légale : Ces modèles constituent une base d'excellence rédigée par des
juristes et doivent être adaptés aux spécificités de votre juridiction.
================================================================================
`;
      return Buffer.from(content, 'utf-8');
    }
  }
};

export function generateDownloadToken(): string {
  return crypto.randomBytes(24).toString('hex');
}
