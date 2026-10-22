import type { Product, Coupon, Advertisement, Review } from '../types.ts';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    slug: 'guide-marketing-digital',
    title: 'Guide Ultime du Marketing Digital & Croissance',
    shortDescription: 'Stratégies concrètes, tunnels de conversion et acquisition payante & organique pour propulser votre marque.',
    fullDescription: `Ce guide complet de 180 pages est le manuel de référence pour maîtriser l'acquisition client moderne. 
Conçu pour les entrepreneurs, freelances et créateurs, il détaille pas à pas les méthodes éprouvées pour structurer vos canaux de vente : SEO prédictif, stratégies de contenu virales, campagnes publicitaires rentables (Meta Ads & Google Ads) et optimisation des taux de conversion.

Inclus dans le pack :
- Manuel complet en format PDF haute définition + version ePub.
- 12 fiches d'action prêtes à l'emploi.
- Grille d'audit marketing en fichier tableur.
- Accès aux mises à jour gratuites pendant 1 an.`,
    price: 29.90,
    originalPrice: 49.90,
    category: 'ebooks',
    categoryLabel: 'E-books',
    image: '/src/assets/images/product_ebook_marketing_1791461314730.jpg',
    tags: ['Marketing', 'Acquisition', 'Conversion', 'E-book', 'SEO'],
    downloadsCount: 1420,
    rating: 4.9,
    reviewsCount: 88,
    isNew: false,
    isPromo: true,
    isFeatured: true,
    isRecommended: true,
    status: 'published',
    licenseType: 'Licence Standard',
    fileDetails: {
      fileName: 'digishop_guide_marketing_digital_v2.pdf',
      fileSize: '14.2 Mo',
      fileFormat: 'PDF + ePub + Fiches d\'action',
      version: '2.4 (Édition 2026)'
    },
    features: [
      '180 pages de tactiques actionnables',
      'Exemples de tunnels de conversion réels',
      'Templates de copywriting haute conversion',
      'Téléchargement immédiat et sans limite de temps'
    ],
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-03-20T14:30:00Z'
  },
  {
    id: 'prod-2',
    slug: 'templates-business-plan-pitch',
    title: 'Pack Ultime Business Plan & Pitch Deck Exécutif',
    shortDescription: 'Modèles financiers prévisionnels et présentations professionnelles pour convaincre banques et investisseurs.',
    fullDescription: `Le pack incontournable pour sécuriser vos levées de fonds et financements. Développé par des consultants seniors en stratégie financière, ce pack contient un modèle financier automatisé sur 3 ans (compte de résultat, trésorerie, BFR) ainsi que des présentations percutantes compatibles PowerPoint, Keynote et Google Slides.

Inclus dans le pack :
- Modèle de Business Plan rédigé modifiable (Word & Google Docs).
- Modèle financier automatisé avec calcul des ratios (Excel & Sheets).
- Pitch Deck 30 slides design moderne (PPTX & Canva).
- Guide d'accompagnement financier pas-à-pas.`,
    price: 49.00,
    originalPrice: 79.00,
    category: 'templates',
    categoryLabel: 'Templates',
    image: '/src/assets/images/product_template_business_1791461332483.jpg',
    tags: ['Business Plan', 'Pitch Deck', 'Finance', 'Startup', 'Excel'],
    downloadsCount: 980,
    rating: 4.8,
    reviewsCount: 64,
    isNew: true,
    isPromo: true,
    isFeatured: true,
    isRecommended: true,
    status: 'published',
    licenseType: 'Licence Commerciale',
    fileDetails: {
      fileName: 'digishop_executive_pitch_business_plan.zip',
      fileSize: '32.5 Mo',
      fileFormat: 'ZIP (XLSX, PPTX, DOCX, Canva Links)',
      version: '3.1'
    },
    features: [
      'Formules Excel pré-calculées avec graphiques dynamiques',
      '30 slides de Pitch Deck optimisées pour investisseurs',
      'Entièrement personnalisable à vos couleurs',
      'Licence commerciale incluse'
    ],
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-03-15T11:00:00Z'
  },
  {
    id: 'prod-3',
    slug: 'pack-3d-icons-ui-assets',
    title: 'Mega Pack 3D Icons & UI Assets Haute Résolution',
    shortDescription: 'Plus de 350 icônes 3D modélisées, textures réalistes et assets d\'interface prêts pour le web et mobile.',
    fullDescription: `Donnez une dimension premium et technologique à vos applications web, sites e-commerce et présentations. Ce pack exclusif regroupe 350+ icônes 3D rendues avec des matériaux verre dépoli, chrome et clay moderniste.

Inclus dans le pack :
- Fichiers PNG détourés 3000x3000px avec transparence.
- Fichiers Figma prêts à l'emploi avec composants organisés.
- Fichiers source Blender (.blend) avec matériaux procéduraux.
- Droits d'usage commercial illimité.`,
    price: 39.00,
    originalPrice: 65.00,
    category: 'graphisme',
    categoryLabel: 'Ressources graphiques',
    image: '/src/assets/images/product_graphics_3d_icons_1791461343514.jpg',
    tags: ['3D', 'Icons', 'Figma', 'UI Design', 'Blender', 'Assets'],
    downloadsCount: 1650,
    rating: 5.0,
    reviewsCount: 112,
    isNew: false,
    isPromo: true,
    isFeatured: true,
    isRecommended: false,
    status: 'published',
    licenseType: 'Licence Étendue',
    fileDetails: {
      fileName: 'digishop_mega_3d_icons_ui_pack.zip',
      fileSize: '148.0 Mo',
      fileFormat: 'ZIP (PNG, Figma, Blender .blend)',
      version: '2.0'
    },
    features: [
      '350+ icônes haute résolution en 4 angles de caméra',
      'Fichiers Figma avec variables et styles globaux',
      'Transparence alpha parfaite sans bavure',
      'Mises à jour gratuites incluses'
    ],
    createdAt: '2026-01-20T12:00:00Z',
    updatedAt: '2026-02-28T16:00:00Z'
  },
  {
    id: 'prod-4',
    slug: 'masterclass-ecommerce-scaling',
    title: 'Masterclass E-commerce & Scaling International',
    shortDescription: 'Programme complet en 8 modules vidéo, études de cas réelles et plans de déploiement multi-devises.',
    fullDescription: `Une immersion stratégique de 12 heures de contenu vidéo condensé pour scaler une boutique en ligne rentable. Du sourcing éthique à la logistique omnicanale, en passant par l'optimisation des passerelles de paiement (Afrique de l'Ouest, Europe, USA), apprenez ce que les leaders du secteur ne partagent jamais publiquement.

Inclus dans la masterclass :
- Accès illimité aux 8 modules de formation en HD.
- Cahier d'exercices et plans d'action téléchargeables.
- Checklist d'intégration des paiements (PayPal, Cartes, Moov Money, Mobile Money).
- Certificat d'achèvement Digishop Academy.`,
    price: 89.00,
    originalPrice: 149.00,
    category: 'formations',
    categoryLabel: 'Formations',
    image: '/src/assets/images/product_course_ecommerce_1791461354436.jpg',
    tags: ['E-commerce', 'Formation', 'Scaling', 'Vente', 'Masterclass'],
    downloadsCount: 740,
    rating: 4.9,
    reviewsCount: 53,
    isNew: true,
    isPromo: false,
    isFeatured: true,
    isRecommended: true,
    status: 'published',
    licenseType: 'Licence Standard',
    fileDetails: {
      fileName: 'digishop_masterclass_ecommerce_kit.zip',
      fileSize: '45.0 Mo',
      fileFormat: 'ZIP (Workbook, Fiches Audio, Accès Vidéo)',
      version: '1.2'
    },
    features: [
      '12h de contenu vidéo haute définition avec accès permanent',
      'Fiches de travail synthétiques et plans de croissance',
      'Méthodes de conversion e-commerce testées sur 500k€+ de volume',
      'Accès communautaire privé des apprenants'
    ],
    createdAt: '2026-02-15T09:00:00Z',
    updatedAt: '2026-03-25T15:00:00Z'
  },
  {
    id: 'prod-5',
    slug: 'pack-juridique-contrats-professionnels',
    title: 'Pack Juridique Pro : Contrats, CGV & Accords Numériques',
    shortDescription: 'Modèles de contrats commerciaux, conditions de vente et politiques RGPD rédigés par des juristes d\'affaires.',
    fullDescription: `Sécurisez votre activité digitale et vos prestations de services avec des modèles de contrats solides, conformes et immédiatement adaptables. Ne laissez aucun flou juridique nuire à votre réputation ou vos paiements.

Inclus dans le pack :
- Contrat de prestation de services freelances et agences.
- Conditions Générales de Vente (CGV) pour produits numériques.
- Accord de confidentialité bilatéral (NDA).
- Politique de confidentialité et gestion des cookies conforme RGPD.
- Modèles de mise en demeure et relance d'impayés.`,
    price: 34.00,
    originalPrice: 59.00,
    category: 'documents',
    categoryLabel: 'Documents professionnels',
    image: '/src/assets/images/hero_digishop_showcase_1791461301216.jpg',
    tags: ['Juridique', 'Contrats', 'CGV', 'NDA', 'Documents', 'Droit'],
    downloadsCount: 1120,
    rating: 4.8,
    reviewsCount: 76,
    isNew: false,
    isPromo: true,
    isFeatured: false,
    isRecommended: true,
    status: 'published',
    licenseType: 'Licence Commerciale',
    fileDetails: {
      fileName: 'digishop_pack_juridique_pro_2026.zip',
      fileSize: '8.4 Mo',
      fileFormat: 'ZIP (DOCX modifiables, PDF guides)',
      version: '4.0'
    },
    features: [
      'Clauses pré-validées pour la vente de biens digitaux',
      'Format Word et LibreOffice avec commentaires explicatifs',
      'Clauses spécifiques de propriété intellectuelle',
      'Téléchargement immédiat et prêt à l\'emploi'
    ],
    createdAt: '2026-01-10T14:00:00Z',
    updatedAt: '2026-03-10T09:00:00Z'
  },
  {
    id: 'prod-6',
    slug: 'templates-cv-professionnels',
    title: 'Kit Ultime CV & Lettres de Motivation à Fort Impact',
    shortDescription: '15 modèles de CV modernes, sobres et optimisés ATS pour décrocher des entretiens au niveau cadre et international.',
    fullDescription: `Maximisez vos chances d'embauche avec des templates de CV modernes conçus pour passer les filtres logiciels de recrutement (ATS) tout en séduisant les recruteurs humains en moins de 6 secondes.

Inclus dans le kit :
- 15 templates de CV 1 page et 2 pages.
- Modèles de lettres de motivation assortis.
- Compatibles Word, Pages, Canva et Google Docs.
- Guide des 50 verbes d'action pour décupler la portée de vos réalisations.`,
    price: 19.90,
    originalPrice: 29.90,
    category: 'templates',
    categoryLabel: 'Templates',
    image: '/src/assets/images/product_template_business_1791461332483.jpg',
    tags: ['CV', 'Carrière', 'Emploi', 'Templates', 'Canva', 'Word'],
    downloadsCount: 2310,
    rating: 4.9,
    reviewsCount: 145,
    isNew: false,
    isPromo: false,
    isFeatured: false,
    isRecommended: true,
    status: 'published',
    licenseType: 'Licence Standard',
    fileDetails: {
      fileName: 'digishop_kit_cv_impact_2026.zip',
      fileSize: '24.1 Mo',
      fileFormat: 'ZIP (Word, Pages, Liens Canva)',
      version: '2.5'
    },
    features: [
      'Format testé avec succès sur les ATS modernes',
      'Typographies gratuites incluses',
      'Sections modulaires et faciles à réorganiser',
      'Conseils de rédaction inclus dans chaque modèle'
    ],
    createdAt: '2026-01-05T10:00:00Z',
    updatedAt: '2026-03-01T11:00:00Z'
  },
  {
    id: 'prod-7',
    slug: 'guide-canva-creation-contenu',
    title: 'Guide Canva Pro & Création de Contenu Visuel',
    shortDescription: 'Apprenez à concevoir des visuels percutants sans compétences préalables en graphisme.',
    fullDescription: `Le manuel complet pour dompter Canva de A à Z. Des règles fondamentales de composition aux astuces de productivité avec l'intelligence artificielle intégrée, créez vos bannières, carrousels et supports publicitaires en un temps record.`,
    price: 24.00,
    originalPrice: 39.00,
    category: 'ebooks',
    categoryLabel: 'E-books',
    image: '/src/assets/images/product_ebook_marketing_1791461314730.jpg',
    tags: ['Canva', 'Graphisme', 'Design', 'Réseaux Sociaux', 'E-book'],
    downloadsCount: 890,
    rating: 4.7,
    reviewsCount: 42,
    isNew: true,
    isPromo: true,
    isFeatured: false,
    isRecommended: false,
    status: 'published',
    licenseType: 'Licence Standard',
    fileDetails: {
      fileName: 'digishop_guide_canva_pro.pdf',
      fileSize: '11.8 Mo',
      fileFormat: 'PDF interactif',
      version: '1.0'
    },
    features: [
      '120 pages illustrées avec exemples avant/après',
      'Palette de 50 combinaisons de couleurs prêtes à l\'emploi',
      'Raccourcis clavier essentiels pour gagner 3h par semaine',
      'Téléchargement direct'
    ],
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-22T14:00:00Z'
  },
  {
    id: 'prod-8',
    slug: 'modeles-devis-facturation-excel',
    title: 'Système Devis & Facturation Automatisé Excel / Sheets',
    shortDescription: 'Tableur automatisé avec gestion des clients, numérotation légale, calcul des taxes et génération PDF.',
    fullDescription: `Évitez les logiciels d'abonnement coûteux grâce à ce tableau de bord complet de gestion commerciale. Gérez vos devis, factures, acomptes et relances en quelques clics grâce à des macros sécurisées et formules sans erreur.`,
    price: 22.00,
    originalPrice: 35.00,
    category: 'documents',
    categoryLabel: 'Documents professionnels',
    image: '/src/assets/images/product_template_business_1791461332483.jpg',
    tags: ['Facturation', 'Devis', 'Comptabilité', 'Excel', 'Google Sheets'],
    downloadsCount: 1540,
    rating: 4.8,
    reviewsCount: 91,
    isNew: false,
    isPromo: true,
    isFeatured: false,
    isRecommended: true,
    status: 'published',
    licenseType: 'Licence Commerciale',
    fileDetails: {
      fileName: 'digishop_systeme_facturation_v3.zip',
      fileSize: '6.2 Mo',
      fileFormat: 'ZIP (XLSX, Google Sheets Template)',
      version: '3.0'
    },
    features: [
      'Numérotation chronologique automatisée',
      'Support multi-taux de TVA et franchise en base',
      'Bouton 1-clic pour exporter en PDF prêt pour le client',
      'Suivi des factures impayées et relances'
    ],
    createdAt: '2026-01-18T16:00:00Z',
    updatedAt: '2026-03-18T10:00:00Z'
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coup-1',
    code: 'BIENVENUE10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 20,
    maxUses: 500,
    currentUses: 124,
    expiresAt: '2026-12-31T23:59:59Z',
    isActive: true
  },
  {
    id: 'coup-2',
    code: 'DIGI20',
    discountType: 'percentage',
    discountValue: 20,
    minOrderValue: 50,
    maxUses: 200,
    currentUses: 68,
    expiresAt: '2026-12-31T23:59:59Z',
    isActive: true
  },
  {
    id: 'coup-3',
    code: 'VIP5EUROS',
    discountType: 'fixed',
    discountValue: 5,
    minOrderValue: 30,
    maxUses: 100,
    currentUses: 19,
    expiresAt: '2026-12-31T23:59:59Z',
    isActive: true
  }
];

export const INITIAL_ADS: Advertisement[] = [
  {
    id: 'ad-1',
    title: 'Espace Publicitaire Accueil (Bannière Milieu)',
    position: 'home_middle',
    badge: 'Offre Spéciale Partenaire',
    heading: 'Accélérez votre business en ligne avec notre suite d\'outils partenaires',
    subtext: 'Bénéficiez de -30% sur tous les hébergements web et outils d\'automatisation cloud recommandés par Digishop.',
    ctaText: 'Découvrir la sélection',
    ctaLink: '/boutique?cat=templates',
    bgColor: 'from-sky-900 to-indigo-950',
    isEnabled: true
  },
  {
    id: 'ad-2',
    title: 'Espace Publicitaire Catalogue (Sidebar)',
    position: 'catalog_sidebar',
    badge: 'Recommandation',
    heading: 'Besoin d\'un accompagnement sur-mesure ?',
    subtext: 'Nos experts vérifient votre tunnel de vente et vos documents légaux.',
    ctaText: 'Consulter nos packs',
    ctaLink: '/boutique?cat=documents',
    bgColor: 'from-slate-900 to-slate-950',
    isEnabled: true
  },
  {
    id: 'ad-3',
    title: 'Bannière d\'Annonce Supérieure (Top Bar)',
    position: 'top_bar',
    badge: 'Sponsor & Partenaire',
    heading: '🚀 Boostez vos ventes : Pack Outils Cloud & Automatisation à -40%',
    subtext: 'Offre exclusive réservée aux membres et clients Digishop ce mois-ci.',
    ctaText: 'Profiter de l\'offre',
    ctaLink: '/boutique?cat=formations',
    bgColor: 'from-sky-700 via-indigo-700 to-purple-800',
    isEnabled: true
  },
  {
    id: 'ad-4',
    title: 'Espace Publicitaire Fiche Produit (Sidebar)',
    position: 'product_sidebar',
    badge: 'Partenaire Certifié',
    heading: 'Hébergement Web & Domaine Offerts pour Débuter',
    subtext: 'Lancez votre site ou déployez vos templates avec notre partenaire d\'infrastructure haute disponibilité.',
    ctaText: 'Découvrir l\'offre partenaire',
    ctaLink: '/boutique?cat=templates',
    bgColor: 'from-emerald-950 via-teal-900 to-slate-950',
    isEnabled: true
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    productId: 'prod-1',
    productTitle: 'Guide Ultime du Marketing Digital & Croissance',
    userName: 'Marc Dupuis',
    rating: 5,
    comment: 'Un contenu d\'une densité exceptionnelle. J\'ai appliqué la méthode sur ma boutique et mes conversions ont bondi de 35% en trois semaines. Le fichier se télécharge instantanément.',
    isVerifiedPurchase: true,
    isApproved: true,
    createdAt: '2026-03-12T14:22:00Z'
  },
  {
    id: 'rev-2',
    productId: 'prod-2',
    productTitle: 'Pack Ultime Business Plan & Pitch Deck Exécutif',
    userName: 'Sarah Diallo',
    rating: 5,
    comment: 'Le tableau financier Excel est une mine d\'or ! Les formules sont impeccables et le pitch deck a fait forte impression devant notre banquier. Téléchargement rapide et sécurisé.',
    isVerifiedPurchase: true,
    isApproved: true,
    createdAt: '2026-03-18T09:40:00Z'
  },
  {
    id: 'rev-3',
    productId: 'prod-3',
    productTitle: 'Mega Pack 3D Icons & UI Assets Haute Résolution',
    userName: 'Alexandre Morel',
    rating: 5,
    comment: 'Qualité 8k irréprochable. L\'intégration dans Figma s\'est faite en deux secondes. Les icônes apportent un rendu premium immédiat à notre application.',
    isVerifiedPurchase: true,
    isApproved: true,
    createdAt: '2026-03-24T17:15:00Z'
  }
];
