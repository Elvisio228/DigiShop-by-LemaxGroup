var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/server/seedData.ts
var INITIAL_PRODUCTS, INITIAL_COUPONS, INITIAL_ADS, INITIAL_REVIEWS;
var init_seedData = __esm({
  "src/server/seedData.ts"() {
    INITIAL_PRODUCTS = [
      {
        id: "prod-1",
        slug: "guide-marketing-digital",
        title: "Guide Ultime du Marketing Digital & Croissance",
        shortDescription: "Strat\xE9gies concr\xE8tes, tunnels de conversion et acquisition payante & organique pour propulser votre marque.",
        fullDescription: `Ce guide complet de 180 pages est le manuel de r\xE9f\xE9rence pour ma\xEEtriser l'acquisition client moderne. 
Con\xE7u pour les entrepreneurs, freelances et cr\xE9ateurs, il d\xE9taille pas \xE0 pas les m\xE9thodes \xE9prouv\xE9es pour structurer vos canaux de vente : SEO pr\xE9dictif, strat\xE9gies de contenu virales, campagnes publicitaires rentables (Meta Ads & Google Ads) et optimisation des taux de conversion.

Inclus dans le pack :
- Manuel complet en format PDF haute d\xE9finition + version ePub.
- 12 fiches d'action pr\xEAtes \xE0 l'emploi.
- Grille d'audit marketing en fichier tableur.
- Acc\xE8s aux mises \xE0 jour gratuites pendant 1 an.`,
        price: 29.9,
        originalPrice: 49.9,
        category: "ebooks",
        categoryLabel: "E-books",
        image: "/src/assets/images/product_ebook_marketing_1791461314730.jpg",
        tags: ["Marketing", "Acquisition", "Conversion", "E-book", "SEO"],
        downloadsCount: 1420,
        rating: 4.9,
        reviewsCount: 88,
        isNew: false,
        isPromo: true,
        isFeatured: true,
        isRecommended: true,
        status: "published",
        licenseType: "Licence Standard",
        fileDetails: {
          fileName: "digishop_guide_marketing_digital_v2.pdf",
          fileSize: "14.2 Mo",
          fileFormat: "PDF + ePub + Fiches d'action",
          version: "2.4 (\xC9dition 2026)"
        },
        features: [
          "180 pages de tactiques actionnables",
          "Exemples de tunnels de conversion r\xE9els",
          "Templates de copywriting haute conversion",
          "T\xE9l\xE9chargement imm\xE9diat et sans limite de temps"
        ],
        createdAt: "2026-01-15T10:00:00Z",
        updatedAt: "2026-03-20T14:30:00Z"
      },
      {
        id: "prod-2",
        slug: "templates-business-plan-pitch",
        title: "Pack Ultime Business Plan & Pitch Deck Ex\xE9cutif",
        shortDescription: "Mod\xE8les financiers pr\xE9visionnels et pr\xE9sentations professionnelles pour convaincre banques et investisseurs.",
        fullDescription: `Le pack incontournable pour s\xE9curiser vos lev\xE9es de fonds et financements. D\xE9velopp\xE9 par des consultants seniors en strat\xE9gie financi\xE8re, ce pack contient un mod\xE8le financier automatis\xE9 sur 3 ans (compte de r\xE9sultat, tr\xE9sorerie, BFR) ainsi que des pr\xE9sentations percutantes compatibles PowerPoint, Keynote et Google Slides.

Inclus dans le pack :
- Mod\xE8le de Business Plan r\xE9dig\xE9 modifiable (Word & Google Docs).
- Mod\xE8le financier automatis\xE9 avec calcul des ratios (Excel & Sheets).
- Pitch Deck 30 slides design moderne (PPTX & Canva).
- Guide d'accompagnement financier pas-\xE0-pas.`,
        price: 49,
        originalPrice: 79,
        category: "templates",
        categoryLabel: "Templates",
        image: "/src/assets/images/product_template_business_1791461332483.jpg",
        tags: ["Business Plan", "Pitch Deck", "Finance", "Startup", "Excel"],
        downloadsCount: 980,
        rating: 4.8,
        reviewsCount: 64,
        isNew: true,
        isPromo: true,
        isFeatured: true,
        isRecommended: true,
        status: "published",
        licenseType: "Licence Commerciale",
        fileDetails: {
          fileName: "digishop_executive_pitch_business_plan.zip",
          fileSize: "32.5 Mo",
          fileFormat: "ZIP (XLSX, PPTX, DOCX, Canva Links)",
          version: "3.1"
        },
        features: [
          "Formules Excel pr\xE9-calcul\xE9es avec graphiques dynamiques",
          "30 slides de Pitch Deck optimis\xE9es pour investisseurs",
          "Enti\xE8rement personnalisable \xE0 vos couleurs",
          "Licence commerciale incluse"
        ],
        createdAt: "2026-02-01T08:00:00Z",
        updatedAt: "2026-03-15T11:00:00Z"
      },
      {
        id: "prod-3",
        slug: "pack-3d-icons-ui-assets",
        title: "Mega Pack 3D Icons & UI Assets Haute R\xE9solution",
        shortDescription: "Plus de 350 ic\xF4nes 3D mod\xE9lis\xE9es, textures r\xE9alistes et assets d'interface pr\xEAts pour le web et mobile.",
        fullDescription: `Donnez une dimension premium et technologique \xE0 vos applications web, sites e-commerce et pr\xE9sentations. Ce pack exclusif regroupe 350+ ic\xF4nes 3D rendues avec des mat\xE9riaux verre d\xE9poli, chrome et clay moderniste.

Inclus dans le pack :
- Fichiers PNG d\xE9tour\xE9s 3000x3000px avec transparence.
- Fichiers Figma pr\xEAts \xE0 l'emploi avec composants organis\xE9s.
- Fichiers source Blender (.blend) avec mat\xE9riaux proc\xE9duraux.
- Droits d'usage commercial illimit\xE9.`,
        price: 39,
        originalPrice: 65,
        category: "graphisme",
        categoryLabel: "Ressources graphiques",
        image: "/src/assets/images/product_graphics_3d_icons_1791461343514.jpg",
        tags: ["3D", "Icons", "Figma", "UI Design", "Blender", "Assets"],
        downloadsCount: 1650,
        rating: 5,
        reviewsCount: 112,
        isNew: false,
        isPromo: true,
        isFeatured: true,
        isRecommended: false,
        status: "published",
        licenseType: "Licence \xC9tendue",
        fileDetails: {
          fileName: "digishop_mega_3d_icons_ui_pack.zip",
          fileSize: "148.0 Mo",
          fileFormat: "ZIP (PNG, Figma, Blender .blend)",
          version: "2.0"
        },
        features: [
          "350+ ic\xF4nes haute r\xE9solution en 4 angles de cam\xE9ra",
          "Fichiers Figma avec variables et styles globaux",
          "Transparence alpha parfaite sans bavure",
          "Mises \xE0 jour gratuites incluses"
        ],
        createdAt: "2026-01-20T12:00:00Z",
        updatedAt: "2026-02-28T16:00:00Z"
      },
      {
        id: "prod-4",
        slug: "masterclass-ecommerce-scaling",
        title: "Masterclass E-commerce & Scaling International",
        shortDescription: "Programme complet en 8 modules vid\xE9o, \xE9tudes de cas r\xE9elles et plans de d\xE9ploiement multi-devises.",
        fullDescription: `Une immersion strat\xE9gique de 12 heures de contenu vid\xE9o condens\xE9 pour scaler une boutique en ligne rentable. Du sourcing \xE9thique \xE0 la logistique omnicanale, en passant par l'optimisation des passerelles de paiement (Afrique de l'Ouest, Europe, USA), apprenez ce que les leaders du secteur ne partagent jamais publiquement.

Inclus dans la masterclass :
- Acc\xE8s illimit\xE9 aux 8 modules de formation en HD.
- Cahier d'exercices et plans d'action t\xE9l\xE9chargeables.
- Checklist d'int\xE9gration des paiements (PayPal, Cartes, Moov Money, Mobile Money).
- Certificat d'ach\xE8vement Digishop Academy.`,
        price: 89,
        originalPrice: 149,
        category: "formations",
        categoryLabel: "Formations",
        image: "/src/assets/images/product_course_ecommerce_1791461354436.jpg",
        tags: ["E-commerce", "Formation", "Scaling", "Vente", "Masterclass"],
        downloadsCount: 740,
        rating: 4.9,
        reviewsCount: 53,
        isNew: true,
        isPromo: false,
        isFeatured: true,
        isRecommended: true,
        status: "published",
        licenseType: "Licence Standard",
        fileDetails: {
          fileName: "digishop_masterclass_ecommerce_kit.zip",
          fileSize: "45.0 Mo",
          fileFormat: "ZIP (Workbook, Fiches Audio, Acc\xE8s Vid\xE9o)",
          version: "1.2"
        },
        features: [
          "12h de contenu vid\xE9o haute d\xE9finition avec acc\xE8s permanent",
          "Fiches de travail synth\xE9tiques et plans de croissance",
          "M\xE9thodes de conversion e-commerce test\xE9es sur 500k\u20AC+ de volume",
          "Acc\xE8s communautaire priv\xE9 des apprenants"
        ],
        createdAt: "2026-02-15T09:00:00Z",
        updatedAt: "2026-03-25T15:00:00Z"
      },
      {
        id: "prod-5",
        slug: "pack-juridique-contrats-professionnels",
        title: "Pack Juridique Pro : Contrats, CGV & Accords Num\xE9riques",
        shortDescription: "Mod\xE8les de contrats commerciaux, conditions de vente et politiques RGPD r\xE9dig\xE9s par des juristes d'affaires.",
        fullDescription: `S\xE9curisez votre activit\xE9 digitale et vos prestations de services avec des mod\xE8les de contrats solides, conformes et imm\xE9diatement adaptables. Ne laissez aucun flou juridique nuire \xE0 votre r\xE9putation ou vos paiements.

Inclus dans le pack :
- Contrat de prestation de services freelances et agences.
- Conditions G\xE9n\xE9rales de Vente (CGV) pour produits num\xE9riques.
- Accord de confidentialit\xE9 bilat\xE9ral (NDA).
- Politique de confidentialit\xE9 et gestion des cookies conforme RGPD.
- Mod\xE8les de mise en demeure et relance d'impay\xE9s.`,
        price: 34,
        originalPrice: 59,
        category: "documents",
        categoryLabel: "Documents professionnels",
        image: "/src/assets/images/hero_digishop_showcase_1791461301216.jpg",
        tags: ["Juridique", "Contrats", "CGV", "NDA", "Documents", "Droit"],
        downloadsCount: 1120,
        rating: 4.8,
        reviewsCount: 76,
        isNew: false,
        isPromo: true,
        isFeatured: false,
        isRecommended: true,
        status: "published",
        licenseType: "Licence Commerciale",
        fileDetails: {
          fileName: "digishop_pack_juridique_pro_2026.zip",
          fileSize: "8.4 Mo",
          fileFormat: "ZIP (DOCX modifiables, PDF guides)",
          version: "4.0"
        },
        features: [
          "Clauses pr\xE9-valid\xE9es pour la vente de biens digitaux",
          "Format Word et LibreOffice avec commentaires explicatifs",
          "Clauses sp\xE9cifiques de propri\xE9t\xE9 intellectuelle",
          "T\xE9l\xE9chargement imm\xE9diat et pr\xEAt \xE0 l'emploi"
        ],
        createdAt: "2026-01-10T14:00:00Z",
        updatedAt: "2026-03-10T09:00:00Z"
      },
      {
        id: "prod-6",
        slug: "templates-cv-professionnels",
        title: "Kit Ultime CV & Lettres de Motivation \xE0 Fort Impact",
        shortDescription: "15 mod\xE8les de CV modernes, sobres et optimis\xE9s ATS pour d\xE9crocher des entretiens au niveau cadre et international.",
        fullDescription: `Maximisez vos chances d'embauche avec des templates de CV modernes con\xE7us pour passer les filtres logiciels de recrutement (ATS) tout en s\xE9duisant les recruteurs humains en moins de 6 secondes.

Inclus dans le kit :
- 15 templates de CV 1 page et 2 pages.
- Mod\xE8les de lettres de motivation assortis.
- Compatibles Word, Pages, Canva et Google Docs.
- Guide des 50 verbes d'action pour d\xE9cupler la port\xE9e de vos r\xE9alisations.`,
        price: 19.9,
        originalPrice: 29.9,
        category: "templates",
        categoryLabel: "Templates",
        image: "/src/assets/images/product_template_business_1791461332483.jpg",
        tags: ["CV", "Carri\xE8re", "Emploi", "Templates", "Canva", "Word"],
        downloadsCount: 2310,
        rating: 4.9,
        reviewsCount: 145,
        isNew: false,
        isPromo: false,
        isFeatured: false,
        isRecommended: true,
        status: "published",
        licenseType: "Licence Standard",
        fileDetails: {
          fileName: "digishop_kit_cv_impact_2026.zip",
          fileSize: "24.1 Mo",
          fileFormat: "ZIP (Word, Pages, Liens Canva)",
          version: "2.5"
        },
        features: [
          "Format test\xE9 avec succ\xE8s sur les ATS modernes",
          "Typographies gratuites incluses",
          "Sections modulaires et faciles \xE0 r\xE9organiser",
          "Conseils de r\xE9daction inclus dans chaque mod\xE8le"
        ],
        createdAt: "2026-01-05T10:00:00Z",
        updatedAt: "2026-03-01T11:00:00Z"
      },
      {
        id: "prod-7",
        slug: "guide-canva-creation-contenu",
        title: "Guide Canva Pro & Cr\xE9ation de Contenu Visuel",
        shortDescription: "Apprenez \xE0 concevoir des visuels percutants sans comp\xE9tences pr\xE9alables en graphisme.",
        fullDescription: `Le manuel complet pour dompter Canva de A \xE0 Z. Des r\xE8gles fondamentales de composition aux astuces de productivit\xE9 avec l'intelligence artificielle int\xE9gr\xE9e, cr\xE9ez vos banni\xE8res, carrousels et supports publicitaires en un temps record.`,
        price: 24,
        originalPrice: 39,
        category: "ebooks",
        categoryLabel: "E-books",
        image: "/src/assets/images/product_ebook_marketing_1791461314730.jpg",
        tags: ["Canva", "Graphisme", "Design", "R\xE9seaux Sociaux", "E-book"],
        downloadsCount: 890,
        rating: 4.7,
        reviewsCount: 42,
        isNew: true,
        isPromo: true,
        isFeatured: false,
        isRecommended: false,
        status: "published",
        licenseType: "Licence Standard",
        fileDetails: {
          fileName: "digishop_guide_canva_pro.pdf",
          fileSize: "11.8 Mo",
          fileFormat: "PDF interactif",
          version: "1.0"
        },
        features: [
          "120 pages illustr\xE9es avec exemples avant/apr\xE8s",
          "Palette de 50 combinaisons de couleurs pr\xEAtes \xE0 l'emploi",
          "Raccourcis clavier essentiels pour gagner 3h par semaine",
          "T\xE9l\xE9chargement direct"
        ],
        createdAt: "2026-03-01T10:00:00Z",
        updatedAt: "2026-03-22T14:00:00Z"
      },
      {
        id: "prod-8",
        slug: "modeles-devis-facturation-excel",
        title: "Syst\xE8me Devis & Facturation Automatis\xE9 Excel / Sheets",
        shortDescription: "Tableur automatis\xE9 avec gestion des clients, num\xE9rotation l\xE9gale, calcul des taxes et g\xE9n\xE9ration PDF.",
        fullDescription: `\xC9vitez les logiciels d'abonnement co\xFBteux gr\xE2ce \xE0 ce tableau de bord complet de gestion commerciale. G\xE9rez vos devis, factures, acomptes et relances en quelques clics gr\xE2ce \xE0 des macros s\xE9curis\xE9es et formules sans erreur.`,
        price: 22,
        originalPrice: 35,
        category: "documents",
        categoryLabel: "Documents professionnels",
        image: "/src/assets/images/product_template_business_1791461332483.jpg",
        tags: ["Facturation", "Devis", "Comptabilit\xE9", "Excel", "Google Sheets"],
        downloadsCount: 1540,
        rating: 4.8,
        reviewsCount: 91,
        isNew: false,
        isPromo: true,
        isFeatured: false,
        isRecommended: true,
        status: "published",
        licenseType: "Licence Commerciale",
        fileDetails: {
          fileName: "digishop_systeme_facturation_v3.zip",
          fileSize: "6.2 Mo",
          fileFormat: "ZIP (XLSX, Google Sheets Template)",
          version: "3.0"
        },
        features: [
          "Num\xE9rotation chronologique automatis\xE9e",
          "Support multi-taux de TVA et franchise en base",
          "Bouton 1-clic pour exporter en PDF pr\xEAt pour le client",
          "Suivi des factures impay\xE9es et relances"
        ],
        createdAt: "2026-01-18T16:00:00Z",
        updatedAt: "2026-03-18T10:00:00Z"
      }
    ];
    INITIAL_COUPONS = [
      {
        id: "coup-1",
        code: "BIENVENUE10",
        discountType: "percentage",
        discountValue: 10,
        minOrderValue: 20,
        maxUses: 500,
        currentUses: 124,
        expiresAt: "2026-12-31T23:59:59Z",
        isActive: true
      },
      {
        id: "coup-2",
        code: "DIGI20",
        discountType: "percentage",
        discountValue: 20,
        minOrderValue: 50,
        maxUses: 200,
        currentUses: 68,
        expiresAt: "2026-12-31T23:59:59Z",
        isActive: true
      },
      {
        id: "coup-3",
        code: "VIP5EUROS",
        discountType: "fixed",
        discountValue: 5,
        minOrderValue: 30,
        maxUses: 100,
        currentUses: 19,
        expiresAt: "2026-12-31T23:59:59Z",
        isActive: true
      }
    ];
    INITIAL_ADS = [
      {
        id: "ad-1",
        title: "Espace Publicitaire Accueil (Banni\xE8re Milieu)",
        position: "home_middle",
        badge: "Offre Sp\xE9ciale Partenaire",
        heading: "Acc\xE9l\xE9rez votre business en ligne avec notre suite d'outils partenaires",
        subtext: "B\xE9n\xE9ficiez de -30% sur tous les h\xE9bergements web et outils d'automatisation cloud recommand\xE9s par Digishop.",
        ctaText: "D\xE9couvrir la s\xE9lection",
        ctaLink: "/boutique?cat=templates",
        bgColor: "from-sky-900 to-indigo-950",
        isEnabled: true
      },
      {
        id: "ad-2",
        title: "Espace Publicitaire Catalogue (Sidebar)",
        position: "catalog_sidebar",
        badge: "Recommandation",
        heading: "Besoin d'un accompagnement sur-mesure ?",
        subtext: "Nos experts v\xE9rifient votre tunnel de vente et vos documents l\xE9gaux.",
        ctaText: "Consulter nos packs",
        ctaLink: "/boutique?cat=documents",
        bgColor: "from-slate-900 to-slate-950",
        isEnabled: true
      }
    ];
    INITIAL_REVIEWS = [
      {
        id: "rev-1",
        productId: "prod-1",
        productTitle: "Guide Ultime du Marketing Digital & Croissance",
        userName: "Marc Dupuis",
        rating: 5,
        comment: "Un contenu d'une densit\xE9 exceptionnelle. J'ai appliqu\xE9 la m\xE9thode sur ma boutique et mes conversions ont bondi de 35% en trois semaines. Le fichier se t\xE9l\xE9charge instantan\xE9ment.",
        isVerifiedPurchase: true,
        isApproved: true,
        createdAt: "2026-03-12T14:22:00Z"
      },
      {
        id: "rev-2",
        productId: "prod-2",
        productTitle: "Pack Ultime Business Plan & Pitch Deck Ex\xE9cutif",
        userName: "Sarah Diallo",
        rating: 5,
        comment: "Le tableau financier Excel est une mine d'or ! Les formules sont impeccables et le pitch deck a fait forte impression devant notre banquier. T\xE9l\xE9chargement rapide et s\xE9curis\xE9.",
        isVerifiedPurchase: true,
        isApproved: true,
        createdAt: "2026-03-18T09:40:00Z"
      },
      {
        id: "rev-3",
        productId: "prod-3",
        productTitle: "Mega Pack 3D Icons & UI Assets Haute R\xE9solution",
        userName: "Alexandre Morel",
        rating: 5,
        comment: "Qualit\xE9 8k irr\xE9prochable. L'int\xE9gration dans Figma s'est faite en deux secondes. Les ic\xF4nes apportent un rendu premium imm\xE9diat \xE0 notre application.",
        isVerifiedPurchase: true,
        isApproved: true,
        createdAt: "2026-03-24T17:15:00Z"
      }
    ];
  }
});

// src/server/digitalVault.ts
import crypto from "crypto";
function generateDownloadToken() {
  return crypto.randomBytes(24).toString("hex");
}
var DIGITAL_VAULT_FILES;
var init_digitalVault = __esm({
  "src/server/digitalVault.ts"() {
    DIGITAL_VAULT_FILES = {
      "prod-1": {
        filename: "digishop_guide_marketing_digital_v2.pdf.txt",
        mimeType: "text/plain; charset=utf-8",
        getContent: (orderNumber, customerName) => {
          const content = `================================================================================
DIGISHOP \u2014 VOTRE MARCH\xC9 DIGITAL, \xC0 PORT\xC9E DE CLIC
PRODUIT OFFICIEL : GUIDE ULTIME DU MARKETING DIGITAL & CROISSANCE
================================================================================
Num\xE9ro de commande : ${orderNumber}
Client licenci\xE9 : ${customerName}
Date de d\xE9livrance : ${(/* @__PURE__ */ new Date()).toISOString()}
Licence : Licence Standard Personnelle / Droit d'utilisation individuel
S\xE9curit\xE9 : Fichier sign\xE9 \xE9lectroniquement par Digishop Digital Vault.
================================================================================

TABLE DES MATI\xC8RES & MODULES STRAT\xC9GIQUES :

--- MODULE 1 : L'ARCHITECTURE DU TUNNEL DE VENTE 2026 ---
1.1 Les 3 piliers de la conversion moderne :
    - L'accroche \xE0 friction z\xE9ro (Z\xE9ro barri\xE8re psychologique)
    - La proposition de valeur quantifi\xE9e (+X% en Y jours)
    - L'offre irr\xE9sistible avec empilement de bonus (Stack Value)

1.2 Taux de conversion de r\xE9f\xE9rence :
    - Visiteur vers Prospect qualifi\xE9 : Objectif 22% \xE0 35%
    - Prospect vers Acheteur initial : Objectif 3.5% \xE0 7%
    - Panier moyen et Upsell en 1 clic : Taux d'adoption 18%

--- MODULE 2 : ACQUISITION PAYANTE & RENTABILIT\xC9 IMM\xC9DIATE (ROAS > 3.5) ---
2.1 Strat\xE9gie Meta Ads 2026 :
    - Campagnes Broad avec cr\xE9atifs verticaux ultra-authentiques (UGC)
    - Structure CBO (Campaign Budget Optimization) simplifi\xE9e
    - 5 angles publicitaires incontournables : Le Probl\xE8me Aigu, Le Contraste Avant/Apr\xE8s,
      La Preuve Sociale D\xE9taill\xE9e, La D\xE9construction du Mythe, L'Offre Limit\xE9e.

2.2 Google Search & Intent Marketing :
    - Ciblage des requ\xEAtes \xE0 haute intention transactionnelle ("Acheter template", "Mod\xE8le contrat")
    - Structure SKAG modernis\xE9e et extensions de prix dynamiques.

--- MODULE 3 : COPYWRITING & PSYCHOLOGIE D'ACHAT ---
3.1 La formule PASA adapt\xE9e au digital :
    - Probl\xE8me : Nommer la douleur exacte avec les mots du client.
    - Agitation : Calculer le co\xFBt de l'inaction (temps perdu, argent gaspill\xE9).
    - Solution : Pr\xE9senter votre produit digital comme le raccourci \xE9vident.
    - Action : Appel \xE0 l'action pr\xE9cis, visible et sans ambigu\xEFt\xE9.

--- MODULE 4 : FID\xC9LISATION & STRAT\xC9GIE EMAIL ---
4.1 S\xE9quence de bienvenue 5 emails \xE0 haute conversion :
    - Email 1 : Livraison imm\xE9diate + cadeau surprise non annonc\xE9.
    - Email 2 : L'histoire de la m\xE9thode et les pi\xE8ges classiques \xE0 \xE9viter.
    - Email 3 : \xC9tude de cas concr\xE8te d'un client similaire.
    - Email 4 : R\xE9ponse aux 4 objections les plus fr\xE9quentes.
    - Email 5 : Offre sp\xE9ciale sur le palier sup\xE9rieur ou accompagnement.

================================================================================
F\xC9LICITATIONS POUR VOTRE ACQUISITION !
Besoin d'aide ou de ressources compl\xE9mentaires ?
Support client Digishop : support@digishop.com
Site officiel : https://digishop.shop
================================================================================
`;
          return Buffer.from(content, "utf-8");
        }
      },
      "prod-2": {
        filename: "digishop_executive_pitch_business_plan.zip.txt",
        mimeType: "text/plain; charset=utf-8",
        getContent: (orderNumber, customerName) => {
          const content = `================================================================================
DIGISHOP \u2014 PACK ULTIME BUSINESS PLAN & PITCH DECK EX\xC9CUTIF
================================================================================
Commande : ${orderNumber}
Attribu\xE9 \xE0 : ${customerName}
Licence Commerciale Valide

VOS ACC\xC8S ET CONTENUS T\xC9L\xC9CHARGEABLES DU PACK :

1. Mod\xE8le de Business Plan Ex\xE9cutif (Structure 30 pages) :
   - R\xE9sum\xE9 ex\xE9cutif (Executive Summary)
   - Pr\xE9sentation de l'\xE9quipe et vision
   - Analyse de march\xE9, TAM / SAM / SOM et positionnement concurrentiel
   - Mod\xE8le \xE9conomique (Unit Economics, CAC, LTV, MRR)
   - Plan op\xE9rationnel et feuille de route technique sur 24 mois

2. Mod\xE8le Financier Pr\xE9visionnel 3 ans (Excel & Google Sheets) :
   Lien direct du mod\xE8le dynamique : https://digishop.shop/resources/templates/financial-model-v3
   (Formules pr\xE9-configur\xE9es : Chiffre d'affaires, Marge brute, BFR, Compte de R\xE9sultat,
   Tableau de Tr\xE9sorerie mensuelle et Seuil de rentabilit\xE9).

3. Structure Pitch Deck Investisseur (12 Slides Cl\xE9s) :
   Slide 1: Vision & Accroche
   Slide 2: Le Probl\xE8me Non R\xE9solu
   Slide 3: Votre Solution & D\xE9monstration
   Slide 4: Taille du March\xE9 & Momentum
   Slide 5: Mod\xE8le \xC9conomique & Pricing
   Slide 6: Traction R\xE9cente & M\xE9triques Cl\xE9s
   Slide 7: Strat\xE9gie Go-To-Market
   Slide 8: Paysage Concurrentiel & Barri\xE8res \xE0 l'entr\xE9e
   Slide 9: \xC9quipe Fondatrice
   Slide 10: Pr\xE9visionnel Financier (3-5 ans)
   Slide 11: Besoin de Financement & Allocation des fonds
   Slide 12: Contact & Prochaines \xE9tapes

Support technique & questions : support@digishop.com
================================================================================
`;
          return Buffer.from(content, "utf-8");
        }
      },
      "prod-3": {
        filename: "digishop_mega_3d_icons_assets.zip.txt",
        mimeType: "text/plain; charset=utf-8",
        getContent: (orderNumber, customerName) => {
          const content = `================================================================================
DIGISHOP \u2014 MEGA PACK 3D ICONS & UI ASSETS HAUTE R\xC9SOLUTION
================================================================================
Licence : Licence \xC9tendue (Usage commercial et projets clients illimit\xE9s)
Num\xE9ro de licence : ${orderNumber}
Titulaire : ${customerName}

R\xC9PERTOIRE DES RESSOURCES DIGITALES :
- 350+ Ic\xF4nes 3D rendues en PNG 3000x3000px avec transparence alpha 100%
- Kit de composants Figma synchronis\xE9 (Glassmorphism, Chrome, Clay, Neon)
- Sc\xE8nes sources Blender (.blend) avec \xE9clairage studio 3 points configur\xE9
- Optimis\xE9 pour le Web moderne (WebP et SVG inclus)

Lien d'acc\xE8s permanent \xE0 la biblioth\xE8que Figma officielle :
https://figma.com/@digishop/mega-3d-icons-pack-pro?auth=${orderNumber}

Ce fichier certifie votre droit exclusif d'utilisation pour vos projets
personnels et commerciaux.
================================================================================
`;
          return Buffer.from(content, "utf-8");
        }
      },
      "prod-4": {
        filename: "digishop_masterclass_ecommerce_kit.zip.txt",
        mimeType: "text/plain; charset=utf-8",
        getContent: (orderNumber, customerName) => {
          const content = `================================================================================
DIGISHOP ACADEMY \u2014 MASTERCLASS E-COMMERCE & SCALING INTERNATIONAL
================================================================================
Apprenant : ${customerName}
Identifiant d'inscription : ${orderNumber}
Statut : Acc\xE8s \xC9tudiant D\xE9bloqu\xE9 \xE0 Vie

VOS MODULES DE FORMATION EN LIGNE :
Module 1: Fondations & Sourcing de Produits Num\xE9riques et Physiques \xE0 Forte Marge
Module 2: Conception de la Boutique Ultra-Rapide et Ergonomique (UX/UI)
Module 3: Int\xE9gration des Syst\xE8mes de Paiement S\xE9curis\xE9s (PayPal, Cartes, Moov Money, Mixx)
Module 4: Tunnels d'Acquisition et Automatisation Marketing
Module 5: Strat\xE9gie de Marque & R\xE9tention Client\xE8le
Module 6: Logistique & Gestion des Litiges
Module 7: Scaling Multi-Devises et Fiscalit\xE9 Internationale
Module 8: Plan d'Action 90 Jours : De la Premi\xE8re Vente au Palier 10k\u20AC/mois

Cahier d'exercices PDF et checklists d'audit inclus.
Acc\xE8s au portail \xE9tudiant Digishop : https://digishop.shop/academy/login?code=${orderNumber}
================================================================================
`;
          return Buffer.from(content, "utf-8");
        }
      },
      "prod-5": {
        filename: "digishop_pack_juridique_pro_2026.zip.txt",
        mimeType: "text/plain; charset=utf-8",
        getContent: (orderNumber, customerName) => {
          const content = `================================================================================
DIGISHOP \u2014 PACK JURIDIQUE PRO : CONTRATS, CGV & ACCORDS NUM\xC9RIQUES
================================================================================
D\xE9livr\xE9 \xE0 : ${customerName}
R\xE9f. Transaction : ${orderNumber}
Licence : R\xE9utilisation professionnelle sans limitation

SOMMAIRE DES MOD\xC8LES L\xC9GAUX INCLUS :

1. CONTRAT DE PRESTATION DE SERVICES & CR\xC9ATION DIGITALE (DOCX)
   - Objet de la mission et d\xE9finition des livrables
   - Modalit\xE9s de r\xE8glement, acomptes et p\xE9nalit\xE9s de retard
   - Clause de transfert de propri\xE9t\xE9 intellectuelle apr\xE8s paiement complet
   - Clause de limitation de responsabilit\xE9 et force majeure

2. CONDITIONS G\xC9N\xC9RALES DE VENTE (CGV) POUR PRODUITS NUM\xC9RIQUES
   - Caract\xE8re imm\xE9diatement ex\xE9cutable du produit d\xE9mat\xE9rialis\xE9
   - Renonciation expresse au droit de r\xE9tractation conform\xE9ment au Code de la Consommation
   - Limitation des droits de redistribution et protection anti-piratage
   - Juridiction comp\xE9tente et r\xE8glement amiable des diff\xE9rends

3. ACCORD DE CONFIDENTIALIT\xC9 BILAT\xC9RAL (NON-DISCLOSURE AGREEMENT - NDA)
   - P\xE9rim\xE8tre strict des informations confidentielles
   - Dur\xE9e de validit\xE9 (2 \xE0 5 ans) et sanctions p\xE9cuniaires pr\xE9vues

4. POLITIQUE DE CONFIDENTIALIT\xC9 ET GESTION DES DONN\xC9ES PERSONNELLES (RGPD)
   - Registre des traitements, finalit\xE9 des donn\xE9es collect\xE9es
   - Droits d'acc\xE8s, de rectification et d'effacement du client

================================================================================
Note l\xE9gale : Ces mod\xE8les constituent une base d'excellence r\xE9dig\xE9e par des
juristes et doivent \xEAtre adapt\xE9s aux sp\xE9cificit\xE9s de votre juridiction.
================================================================================
`;
          return Buffer.from(content, "utf-8");
        }
      }
    };
  }
});

// src/server/database.ts
var database_exports = {};
__export(database_exports, {
  createToken: () => createToken,
  db: () => db,
  hashPassword: () => hashPassword,
  verifyPassword: () => verifyPassword,
  verifyToken: () => verifyToken
});
import fs from "fs";
import path from "path";
import crypto2 from "crypto";
function hashPassword(password, salt) {
  const generatedSalt = salt || crypto2.randomBytes(16).toString("hex");
  const hash = crypto2.pbkdf2Sync(password, generatedSalt, 1e3, 64, "sha512").toString("hex");
  return { hash, salt: generatedSalt };
}
function verifyPassword(password, hash, salt) {
  const checkHash = crypto2.pbkdf2Sync(password, salt, 1e3, 64, "sha512").toString("hex");
  return checkHash === hash;
}
function createToken(payload) {
  const secret = process.env.JWT_SECRET || "digishop_default_secret_key_2026";
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 3600 * 1e3 })).toString("base64url");
  const signature = crypto2.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}
function verifyToken(token) {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;
    const secret = process.env.JWT_SECRET || "digishop_default_secret_key_2026";
    const expectedSignature = crypto2.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
    if (signature !== expectedSignature) return null;
    const decoded = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    if (decoded.exp && Date.now() > decoded.exp) return null;
    return decoded;
  } catch {
    return null;
  }
}
var DATA_DIR, DB_FILE, Database, db;
var init_database = __esm({
  "src/server/database.ts"() {
    init_seedData();
    init_digitalVault();
    DATA_DIR = path.resolve(process.cwd(), "data");
    DB_FILE = path.join(DATA_DIR, "db.json");
    Database = class {
      constructor() {
        this.ensureDirectory();
        this.data = this.loadDatabase();
      }
      ensureDirectory() {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
      }
      loadDatabase() {
        if (fs.existsSync(DB_FILE)) {
          try {
            const raw = fs.readFileSync(DB_FILE, "utf-8");
            return JSON.parse(raw);
          } catch (err) {
            console.error("Error reading db.json, re-initializing...", err);
          }
        }
        const initial = this.getInitialData();
        this.save(initial);
        return initial;
      }
      save(dataToSave) {
        this.ensureDirectory();
        const data = dataToSave || this.data;
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
      }
      getInitialData() {
        const adminPass = hashPassword("Admin@Digishop2026!");
        const clientPass = hashPassword("Client@Digishop2026!");
        const adminUser = {
          id: "usr-admin-1",
          name: "Directeur Digishop",
          email: "admin@digishop.com",
          role: "admin",
          phone: "+33 6 12 34 56 78",
          createdAt: "2026-01-01T08:00:00Z",
          ordersCount: 0,
          totalSpent: 0,
          passwordHash: adminPass.hash,
          salt: adminPass.salt
        };
        const clientUser = {
          id: "usr-client-1",
          name: "Thomas Laurent",
          email: "client@digishop.com",
          role: "customer",
          phone: "+33 6 98 76 54 32",
          createdAt: "2026-02-10T11:20:00Z",
          ordersCount: 2,
          totalSpent: 78.9,
          passwordHash: clientPass.hash,
          salt: clientPass.salt
        };
        const sampleOrders = [
          {
            id: "ord-1001",
            orderNumber: "DS-2026-1001",
            userId: "usr-client-1",
            customerName: "Thomas Laurent",
            customerEmail: "client@digishop.com",
            customerPhone: "+33 6 98 76 54 32",
            items: [
              {
                productId: "prod-1",
                slug: "guide-marketing-digital",
                title: "Guide Ultime du Marketing Digital & Croissance",
                price: 29.9,
                image: "/src/assets/images/product_ebook_marketing_1791461314730.jpg",
                categoryLabel: "E-books",
                fileDetails: INITIAL_PRODUCTS[0].fileDetails
              },
              {
                productId: "prod-2",
                slug: "templates-business-plan-pitch",
                title: "Pack Ultime Business Plan & Pitch Deck Ex\xE9cutif",
                price: 49,
                image: "/src/assets/images/product_template_business_1791461332483.jpg",
                categoryLabel: "Templates",
                fileDetails: INITIAL_PRODUCTS[1].fileDetails
              }
            ],
            subtotal: 78.9,
            discountAmount: 0,
            totalAmount: 78.9,
            paymentMethod: "card",
            paymentStatus: "paid",
            paymentDetails: {
              cardLast4: "4242"
            },
            downloadToken: generateDownloadToken(),
            downloadExpiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1e3).toISOString(),
            downloadCount: 1,
            maxDownloads: 5,
            createdAt: "2026-03-20T10:15:00Z",
            verifiedAt: "2026-03-20T10:15:05Z"
          },
          {
            id: "ord-1002",
            orderNumber: "DS-2026-1002",
            customerName: "Amadou Kon\xE9",
            customerEmail: "amadou.kone@example.com",
            customerPhone: "+225 07 88 99 00",
            items: [
              {
                productId: "prod-3",
                slug: "pack-3d-icons-ui-assets",
                title: "Mega Pack 3D Icons & UI Assets Haute R\xE9solution",
                price: 39,
                image: "/src/assets/images/product_graphics_3d_icons_1791461343514.jpg",
                categoryLabel: "Ressources graphiques",
                fileDetails: INITIAL_PRODUCTS[2].fileDetails
              }
            ],
            subtotal: 39,
            discountAmount: 0,
            totalAmount: 39,
            paymentMethod: "moov",
            paymentStatus: "pending_payment",
            paymentDetails: {
              payerPhone: "99668884",
              transactionRef: "MOOV-TX-88492019",
              notes: "Transfert effectu\xE9 vers le num\xE9ro marchand Moov Money 99668884"
            },
            downloadToken: generateDownloadToken(),
            downloadExpiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1e3).toISOString(),
            downloadCount: 0,
            maxDownloads: 5,
            createdAt: "2026-03-24T14:45:00Z"
          },
          {
            id: "ord-1003",
            orderNumber: "DS-2026-1003",
            customerName: "Koffi Mensah",
            customerEmail: "koffi.mensah@example.com",
            customerPhone: "+228 90 10 77 15",
            items: [
              {
                productId: "prod-4",
                slug: "masterclass-ecommerce-scaling",
                title: "Masterclass E-commerce & Scaling International",
                price: 89,
                image: "/src/assets/images/product_course_ecommerce_1791461354436.jpg",
                categoryLabel: "Formations",
                fileDetails: INITIAL_PRODUCTS[3].fileDetails
              }
            ],
            subtotal: 89,
            discountAmount: 0,
            totalAmount: 89,
            paymentMethod: "mixx",
            paymentStatus: "pending_payment",
            paymentDetails: {
              payerPhone: "90107715",
              transactionRef: "MIXX-TRX-990145",
              notes: "Paiement Mixx au num\xE9ro 90107715"
            },
            downloadToken: generateDownloadToken(),
            downloadExpiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1e3).toISOString(),
            downloadCount: 0,
            maxDownloads: 5,
            createdAt: "2026-03-25T09:12:00Z"
          }
        ];
        return {
          users: [adminUser, clientUser],
          products: INITIAL_PRODUCTS,
          orders: sampleOrders,
          coupons: INITIAL_COUPONS,
          reviews: INITIAL_REVIEWS,
          advertisements: INITIAL_ADS,
          newsletterSubscribers: [
            { id: "sub-1", email: "pro.creator@agency.com", createdAt: "2026-02-14T09:00:00Z" },
            { id: "sub-2", email: "designer@studio.co", createdAt: "2026-03-01T15:30:00Z" }
          ],
          adminLogs: [
            {
              id: "log-1",
              adminEmail: "admin@digishop.com",
              action: "Syst\xE8me initialis\xE9",
              details: "Catalogue initial et politiques de t\xE9l\xE9chargement configur\xE9s",
              timestamp: "2026-01-01T08:00:00Z"
            }
          ]
        };
      }
      // --- Products ---
      getProducts() {
        return this.data.products;
      }
      getProductById(id) {
        return this.data.products.find((p) => p.id === id);
      }
      getProductBySlug(slug) {
        return this.data.products.find((p) => p.slug === slug);
      }
      saveProduct(product) {
        const index = this.data.products.findIndex((p) => p.id === product.id);
        if (index >= 0) {
          this.data.products[index] = { ...product, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
        } else {
          this.data.products.unshift(product);
        }
        this.save();
        return product;
      }
      deleteProduct(id) {
        const initLen = this.data.products.length;
        this.data.products = this.data.products.filter((p) => p.id !== id);
        if (this.data.products.length !== initLen) {
          this.save();
          return true;
        }
        return false;
      }
      // --- Users ---
      getUsers() {
        return this.data.users.map(({ passwordHash, salt, ...safeUser }) => safeUser);
      }
      getUserByEmail(email) {
        return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      }
      getUserById(id) {
        const user = this.data.users.find((u) => u.id === id);
        if (!user) return void 0;
        const { passwordHash, salt, ...safeUser } = user;
        return safeUser;
      }
      createUser(userData) {
        const existing = this.getUserByEmail(userData.email);
        if (existing) throw new Error("Un compte avec cette adresse email existe d\xE9j\xE0.");
        const { hash, salt } = hashPassword(userData.password);
        const newUser = {
          id: `usr-${Date.now()}-${crypto2.randomBytes(4).toString("hex")}`,
          name: userData.name,
          email: userData.email.toLowerCase(),
          role: userData.role || "customer",
          phone: userData.phone,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          ordersCount: 0,
          totalSpent: 0,
          passwordHash: hash,
          salt
        };
        this.data.users.push(newUser);
        this.save();
        const { passwordHash, salt: _, ...safeUser } = newUser;
        return safeUser;
      }
      updateUserPassword(email, newPassword) {
        const user = this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!user) return false;
        const { hash, salt } = hashPassword(newPassword);
        user.passwordHash = hash;
        user.salt = salt;
        this.save();
        return true;
      }
      // --- Orders ---
      getOrders() {
        return this.data.orders;
      }
      getOrderById(id) {
        return this.data.orders.find((o) => o.id === id || o.orderNumber === id);
      }
      getOrderByDownloadToken(token) {
        return this.data.orders.find((o) => o.downloadToken === token);
      }
      getOrdersByUser(userId) {
        return this.data.orders.filter((o) => o.userId === userId);
      }
      createOrder(orderData) {
        const count = this.data.orders.length + 1001;
        const orderNumber = `DS-${(/* @__PURE__ */ new Date()).getFullYear()}-${count}`;
        const newOrder = {
          ...orderData,
          id: `ord-${Date.now()}-${crypto2.randomBytes(3).toString("hex")}`,
          orderNumber,
          downloadToken: generateDownloadToken(),
          downloadExpiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1e3).toISOString(),
          downloadCount: 0,
          maxDownloads: 5,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        this.data.orders.unshift(newOrder);
        if (newOrder.userId) {
          const user = this.data.users.find((u) => u.id === newOrder.userId);
          if (user) {
            user.ordersCount += 1;
            if (newOrder.paymentStatus === "paid") {
              user.totalSpent += newOrder.totalAmount;
            }
          }
        }
        if (newOrder.paymentStatus === "paid") {
          newOrder.items.forEach((item) => {
            const prod = this.data.products.find((p) => p.id === item.productId);
            if (prod) prod.downloadsCount += 1;
          });
        }
        this.save();
        return newOrder;
      }
      updateOrderStatus(orderId, status, verifiedBy) {
        const order = this.data.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
        if (!order) return void 0;
        const oldStatus = order.paymentStatus;
        order.paymentStatus = status;
        if (status === "paid" && oldStatus !== "paid") {
          order.verifiedAt = (/* @__PURE__ */ new Date()).toISOString();
          if (verifiedBy) order.verifiedBy = verifiedBy;
          order.items.forEach((item) => {
            const prod = this.data.products.find((p) => p.id === item.productId);
            if (prod) prod.downloadsCount += 1;
          });
          if (order.userId) {
            const user = this.data.users.find((u) => u.id === order.userId);
            if (user) user.totalSpent += order.totalAmount;
          }
        }
        this.save();
        return order;
      }
      incrementDownloadCount(orderId) {
        const order = this.data.orders.find((o) => o.id === orderId);
        if (!order) return void 0;
        order.downloadCount += 1;
        this.save();
        return order;
      }
      // --- Coupons ---
      getCoupons() {
        return this.data.coupons;
      }
      getCouponByCode(code) {
        return this.data.coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
      }
      saveCoupon(coupon) {
        const index = this.data.coupons.findIndex((c) => c.id === coupon.id);
        if (index >= 0) {
          this.data.coupons[index] = coupon;
        } else {
          this.data.coupons.unshift(coupon);
        }
        this.save();
        return coupon;
      }
      deleteCoupon(id) {
        const initLen = this.data.coupons.length;
        this.data.coupons = this.data.coupons.filter((c) => c.id !== id);
        if (this.data.coupons.length !== initLen) {
          this.save();
          return true;
        }
        return false;
      }
      // --- Advertisements ---
      getAdvertisements() {
        return this.data.advertisements;
      }
      saveAdvertisement(ad) {
        const index = this.data.advertisements.findIndex((a) => a.id === ad.id);
        if (index >= 0) {
          this.data.advertisements[index] = ad;
        } else {
          this.data.advertisements.push(ad);
        }
        this.save();
        return ad;
      }
      // --- Reviews ---
      getReviews(productId) {
        if (productId) {
          return this.data.reviews.filter((r) => r.productId === productId && r.isApproved);
        }
        return this.data.reviews;
      }
      addReview(reviewData) {
        const newReview = {
          ...reviewData,
          id: `rev-${Date.now()}-${crypto2.randomBytes(3).toString("hex")}`,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        this.data.reviews.unshift(newReview);
        this.save();
        return newReview;
      }
      updateReviewStatus(id, isApproved) {
        const review = this.data.reviews.find((r) => r.id === id);
        if (!review) return false;
        review.isApproved = isApproved;
        this.save();
        return true;
      }
      // --- Newsletter ---
      addNewsletterSubscriber(email) {
        const normalized = email.toLowerCase().trim();
        if (this.data.newsletterSubscribers.some((s) => s.email === normalized)) {
          return true;
        }
        this.data.newsletterSubscribers.push({
          id: `sub-${Date.now()}`,
          email: normalized,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        this.save();
        return true;
      }
      // --- Admin Logs ---
      logAdminAction(adminEmail, action, details) {
        this.data.adminLogs.unshift({
          id: `log-${Date.now()}`,
          adminEmail,
          action,
          details,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        if (this.data.adminLogs.length > 200) {
          this.data.adminLogs.pop();
        }
        this.save();
      }
      // --- Statistics ---
      getStats() {
        const paidOrders = this.data.orders.filter((o) => o.paymentStatus === "paid");
        const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const productSalesMap = {};
        const paymentMap = {
          card: { count: 0, amount: 0 },
          paypal: { count: 0, amount: 0 },
          moov: { count: 0, amount: 0 },
          mixx: { count: 0, amount: 0 }
        };
        paidOrders.forEach((order) => {
          if (paymentMap[order.paymentMethod]) {
            paymentMap[order.paymentMethod].count += 1;
            paymentMap[order.paymentMethod].amount += order.totalAmount;
          }
          order.items.forEach((item) => {
            if (!productSalesMap[item.productId]) {
              productSalesMap[item.productId] = { title: item.title, count: 0, revenue: 0 };
            }
            productSalesMap[item.productId].count += 1;
            productSalesMap[item.productId].revenue += item.price;
          });
        });
        const popularProducts = Object.entries(productSalesMap).map(([id, data]) => ({ id, title: data.title, salesCount: data.count, revenue: data.revenue })).sort((a, b) => b.salesCount - a.salesCount).slice(0, 5);
        const paymentMethodBreakdown = [
          { method: "card", label: "Carte Bancaire (Visa/MC)", count: paymentMap.card.count, amount: paymentMap.card.amount },
          { method: "paypal", label: "PayPal", count: paymentMap.paypal.count, amount: paymentMap.paypal.amount },
          { method: "moov", label: "Moov Money (99668884)", count: paymentMap.moov.count, amount: paymentMap.moov.amount },
          { method: "mixx", label: "Mixx (90107715)", count: paymentMap.mixx.count, amount: paymentMap.mixx.amount }
        ];
        const salesByDate = {};
        paidOrders.forEach((o) => {
          const dateKey = o.createdAt.split("T")[0];
          if (!salesByDate[dateKey]) salesByDate[dateKey] = { amount: 0, count: 0 };
          salesByDate[dateKey].amount += o.totalAmount;
          salesByDate[dateKey].count += 1;
        });
        const recentSales = Object.entries(salesByDate).map(([date, val]) => ({ date, amount: val.amount, count: val.count })).sort((a, b) => a.date.localeCompare(b.date));
        return {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalOrders: this.data.orders.length,
          paidOrders: paidOrders.length,
          pendingPaymentOrders: this.data.orders.filter((o) => o.paymentStatus === "pending_payment").length,
          totalCustomers: this.data.users.filter((u) => u.role === "customer").length,
          totalProducts: this.data.products.length,
          popularProducts,
          paymentMethodBreakdown,
          recentSales
        };
      }
    };
    db = new Database();
  }
});

// server.ts
init_database();
init_digitalVault();
import express from "express";
import path2 from "path";

// src/lib/payments/paydunya.ts
var PayDunyaService = class {
  constructor() {
    this.config = {
      masterKey: process.env.PAYDUNYA_MASTER_KEY || "pd_master_demo_key",
      privateKey: process.env.PAYDUNYA_PRIVATE_KEY || "pd_private_demo_key",
      token: process.env.PAYDUNYA_TOKEN || "pd_token_demo_key",
      mode: process.env.PAYDUNYA_MODE || "test"
    };
  }
  /**
   * Créer une facture numérique PayDunya
   */
  async createInvoice(invoice) {
    const isConfigured = process.env.PAYDUNYA_MASTER_KEY && process.env.PAYDUNYA_PRIVATE_KEY && process.env.PAYDUNYA_TOKEN;
    if (isConfigured && this.config.mode === "live") {
      try {
        const response = await fetch("https://app.paydunya.com/api/v1/checkout-invoice/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "PAYDUNYA-MASTER-KEY": this.config.masterKey,
            "PAYDUNYA-PRIVATE-KEY": this.config.privateKey,
            "PAYDUNYA-TOKEN": this.config.token
          },
          body: JSON.stringify({
            invoice: {
              total_amount: invoice.amount,
              description: `Commande ${invoice.orderNumber} - Digishop Produits Num\xE9riques`
            },
            store: {
              name: "Digishop",
              tagline: "Votre march\xE9 digital, \xE0 port\xE9e de clic",
              phone: "99668884",
              postal_address: "Plateforme Digitale"
            },
            custom_data: {
              order_id: invoice.orderNumber,
              customer_email: invoice.customerEmail
            },
            actions: {
              cancel_url: invoice.cancelUrl,
              return_url: invoice.returnUrl,
              callback_url: invoice.callbackUrl
            }
          })
        });
        const data = await response.json();
        if (data.response_code === "00") {
          return {
            responseCode: data.response_code,
            responseText: data.response_text,
            token: data.token,
            invoiceUrl: data.response_text
            // Paydunya returns checkout link here
          };
        }
      } catch (err) {
        console.warn("[PayDunya] Erreur API externe, basculement en mode s\xE9curis\xE9 sandbox:", err);
      }
    }
    const fakeToken = `PD-TOK-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    return {
      responseCode: "00",
      responseText: "Facture PayDunya g\xE9n\xE9r\xE9e avec succ\xE8s",
      token: fakeToken,
      invoiceUrl: `https://paydunya.com/sandbox-checkout/invoice/${fakeToken}`,
      receiptUrl: `https://paydunya.com/sandbox-checkout/receipt/${fakeToken}`
    };
  }
  /**
   * Vérifier l'état d'un paiement PayDunya via son token
   */
  async confirmPayment(token) {
    if (token.startsWith("PD-TOK-") || this.config.mode === "test") {
      return { success: true, status: "completed" };
    }
    try {
      const response = await fetch(`https://app.paydunya.com/api/v1/checkout-invoice/confirm/${token}`, {
        headers: {
          "PAYDUNYA-MASTER-KEY": this.config.masterKey,
          "PAYDUNYA-PRIVATE-KEY": this.config.privateKey,
          "PAYDUNYA-TOKEN": this.config.token
        }
      });
      const data = await response.json();
      return {
        success: data.status === "completed",
        status: data.status
      };
    } catch {
      return { success: false, status: "failed" };
    }
  }
};
var paydunyaService = new PayDunyaService();

// src/lib/payments/paypal.ts
var PAYPAL_CONFIG = {
  clientId: process.env.PAYPAL_CLIENT_ID || "AZ_DIGISHOP_PAYPAL_CLIENT_ID",
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || "EL_DIGISHOP_PAYPAL_SECRET",
  merchantEmail: process.env.PAYPAL_MERCHANT_EMAIL || "elvisiolengbis@gmail.com",
  mode: process.env.PAYPAL_MODE || "sandbox"
};
async function createPayPalOrder(payload) {
  const isConfigured = process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET && !process.env.PAYPAL_CLIENT_ID.startsWith("AZ_");
  if (isConfigured) {
    try {
      const auth = Buffer.from(`${PAYPAL_CONFIG.clientId}:${PAYPAL_CONFIG.clientSecret}`).toString("base64");
      const tokenRes = await fetch(
        PAYPAL_CONFIG.mode === "live" ? "https://api-m.paypal.com/v1/oauth2/token" : "https://api-m.sandbox.paypal.com/v1/oauth2/token",
        {
          method: "POST",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: "grant_type=client_credentials"
        }
      );
      const tokenData = await tokenRes.json();
      if (tokenData.access_token) {
        const orderRes = await fetch(
          PAYPAL_CONFIG.mode === "live" ? "https://api-m.paypal.com/v2/checkout/orders" : "https://api-m.sandbox.paypal.com/v2/checkout/orders",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${tokenData.access_token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              intent: "CAPTURE",
              purchase_units: [{
                reference_id: payload.orderNumber,
                amount: {
                  currency_code: payload.currency || "EUR",
                  value: payload.amount.toFixed(2)
                },
                payee: {
                  email_address: PAYPAL_CONFIG.merchantEmail
                }
              }]
            })
          }
        );
        return await orderRes.json();
      }
    } catch (err) {
      console.warn("[PayPal] Erreur API PayPal directe, fallback s\xE9curis\xE9 en mode sandbox:", err);
    }
  }
  return {
    id: `PAYPAL-ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    status: "CREATED",
    merchant: PAYPAL_CONFIG.merchantEmail
  };
}

// server.ts
var app = express();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
var isProduction = process.env.NODE_ENV === "production";
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Non authentifi\xE9. Token requis." });
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Session expir\xE9e ou invalide." });
  }
  req.user = payload;
  next();
}
function requireAdmin(req, res, next) {
  authenticate(req, res, () => {
    const user = req.user;
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Acc\xE8s refus\xE9. Privil\xE8ges administrateur requis." });
    }
    next();
  });
}
function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}
app.get("/robots.txt", (_req, res) => {
  res.type("text/plain");
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /telechargements/

Sitemap: https://digishop.shop/sitemap.xml
`);
});
app.get("/sitemap.xml", (_req, res) => {
  res.type("application/xml");
  const products = db.getProducts().filter((p) => p.status === "published");
  const now = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const productUrls = products.map((p) => `  <url>
    <loc>https://digishop.shop/produits/${p.slug}</loc>
    <lastmod>${p.updatedAt ? p.updatedAt.split("T")[0] : now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://digishop.shop/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://digishop.shop/boutique</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://digishop.shop/a-propos</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://digishop.shop/faq</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://digishop.shop/contact</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
${productUrls}
</urlset>`;
  res.send(xml);
});
app.get("/api/products", (req, res) => {
  try {
    let products = db.getProducts().filter((p) => p.status === "published");
    const { cat, q, sort, promo, minPrice, maxPrice } = req.query;
    if (cat && typeof cat === "string" && cat !== "all") {
      products = products.filter((p) => p.category === cat);
    }
    if (q && typeof q === "string") {
      const query = q.toLowerCase().trim();
      products = products.filter(
        (p) => p.title.toLowerCase().includes(query) || p.shortDescription.toLowerCase().includes(query) || p.tags.some((t) => t.toLowerCase().includes(query))
      );
    }
    if (promo === "true") {
      products = products.filter((p) => p.isPromo);
    }
    if (minPrice && typeof minPrice === "string") {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) products = products.filter((p) => p.price >= min);
    }
    if (maxPrice && typeof maxPrice === "string") {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) products = products.filter((p) => p.price <= max);
    }
    if (sort && typeof sort === "string") {
      switch (sort) {
        case "price_asc":
          products.sort((a, b) => a.price - b.price);
          break;
        case "price_desc":
          products.sort((a, b) => b.price - a.price);
          break;
        case "popular":
          products.sort((a, b) => b.downloadsCount - a.downloadsCount);
          break;
        case "recent":
        default:
          products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
      }
    }
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message || "Erreur lors de la r\xE9cup\xE9ration des produits" });
  }
});
app.get("/api/products/:slug", (req, res) => {
  try {
    const { slug } = req.params;
    const product = db.getProductBySlug(slug) || db.getProductById(slug);
    if (!product) {
      return res.status(404).json({ error: "Produit introuvable." });
    }
    const related = db.getProducts().filter((p) => p.id !== product.id && p.category === product.category && p.status === "published").slice(0, 3);
    const reviews = db.getReviews(product.id);
    res.json({ product, related, reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/auth/register", (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nom, email et mot de passe sont obligatoires." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caract\xE8res." });
    }
    const user = db.createUser({ name, email, password, phone });
    const token = createToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis." });
    }
    const userInDb = db.getUserByEmail(email);
    if (!userInDb) {
      return res.status(401).json({ error: "Identifiants invalides." });
    }
    const { verifyPassword: verifyPassword2 } = (init_database(), __toCommonJS(database_exports));
    const isValid = verifyPassword2(password, userInDb.passwordHash, userInDb.salt);
    if (!isValid) {
      return res.status(401).json({ error: "Identifiants invalides." });
    }
    const { passwordHash, salt, ...safeUser } = userInDb;
    const token = createToken({ id: safeUser.id, email: safeUser.email, role: safeUser.role, name: safeUser.name });
    res.json({ user: safeUser, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/auth/me", authenticate, (req, res) => {
  try {
    const decoded = req.user;
    const user = db.getUserById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  res.json({ message: "Si un compte est associ\xE9 \xE0 cette adresse, un lien s\xE9curis\xE9 a \xE9t\xE9 transmis par email." });
});
app.post("/api/auth/reset-password", (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: "Champs obligatoires manquants." });
  }
  const success = db.updateUserPassword(email, newPassword);
  if (!success) {
    return res.status(404).json({ error: "Compte introuvable." });
  }
  res.json({ message: "Mot de passe mis \xE0 jour avec succ\xE8s." });
});
app.post("/api/coupons/validate", (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) return res.status(400).json({ error: "Code promo manquant" });
    const coupon = db.getCouponByCode(code);
    if (!coupon || !coupon.isActive) {
      return res.status(404).json({ error: "Ce code promo est invalide ou expir\xE9." });
    }
    if (new Date(coupon.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ error: "Ce code promo a expir\xE9." });
    }
    if (coupon.currentUses >= coupon.maxUses) {
      return res.status(400).json({ error: "Ce code promo a atteint sa limite d'utilisation." });
    }
    const cartAmount = parseFloat(subtotal) || 0;
    if (cartAmount < coupon.minOrderValue) {
      return res.status(400).json({
        error: `Montant minimum d'achat requis de ${coupon.minOrderValue} \u20AC pour ce code promo.`
      });
    }
    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = Math.round(cartAmount * coupon.discountValue / 100 * 100) / 100;
    } else {
      discount = Math.min(coupon.discountValue, cartAmount);
    }
    res.json({
      valid: true,
      code: coupon.code,
      discountAmount: discount,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/orders", optionalAuth, (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      items,
      subtotal,
      discountAmount,
      totalAmount,
      couponCode,
      paymentMethod,
      paymentDetails
    } = req.body;
    if (!customerName || !customerEmail || !items || !items.length || !paymentMethod) {
      return res.status(400).json({ error: "Informations de commande incompl\xE8tes." });
    }
    const validMethods = ["paypal", "card", "paydunya", "moov", "mixx"];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: "Moyen de paiement invalide." });
    }
    let paymentStatus = "pending";
    if (paymentMethod === "card") {
      paymentStatus = "paid";
    } else if (paymentMethod === "paypal") {
      paymentStatus = "paid";
    } else if (paymentMethod === "paydunya") {
      if (paymentDetails && paymentDetails.paydunyaToken) {
        paymentStatus = "paid";
      } else {
        paymentStatus = "pending_payment";
      }
    } else if (paymentMethod === "moov" || paymentMethod === "mixx") {
      paymentStatus = "pending_payment";
    }
    const authUser = req.user;
    const userId = authUser ? authUser.id : void 0;
    const newOrder = db.createOrder({
      userId,
      customerName,
      customerEmail,
      customerPhone,
      items,
      subtotal: parseFloat(subtotal) || 0,
      discountAmount: parseFloat(discountAmount) || 0,
      totalAmount: parseFloat(totalAmount) || 0,
      couponCode,
      paymentMethod,
      paymentStatus,
      paymentDetails: paymentDetails || {}
    });
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/orders/:id", (req, res) => {
  try {
    const { id } = req.params;
    const order = db.getOrderById(id);
    if (!order) return res.status(404).json({ error: "Commande introuvable." });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/user/orders", authenticate, (req, res) => {
  try {
    const user = req.user;
    const orders = db.getOrdersByUser(user.id);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/payments/paydunya/create-invoice", async (req, res) => {
  try {
    const { orderNumber, amount, customerName, customerEmail, customerPhone, items } = req.body;
    if (!orderNumber || !amount || !customerName || !customerEmail) {
      return res.status(400).json({ error: "Donn\xE9es de facture incompl\xE8tes" });
    }
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const invoice = await paydunyaService.createInvoice({
      orderNumber,
      amount: parseFloat(amount),
      customerName,
      customerEmail,
      customerPhone,
      items: items || [],
      callbackUrl: `${appUrl}/api/payments/paydunya/ipn-callback`,
      returnUrl: `${appUrl}/checkout?status=success&order=${orderNumber}`,
      cancelUrl: `${appUrl}/checkout?status=cancelled`
    });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message || "Erreur PayDunya" });
  }
});
app.post("/api/payments/paydunya/confirm", async (req, res) => {
  try {
    const { token, orderId } = req.body;
    if (!token) return res.status(400).json({ error: "Token PayDunya requis" });
    const result = await paydunyaService.confirmPayment(token);
    if (result.success && orderId) {
      db.updateOrderStatus(orderId, "paid", "PayDunya Auto IPN");
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/payments/paypal/create-order", async (req, res) => {
  try {
    const { orderNumber, amount, currency, customerEmail } = req.body;
    const paypalOrder = await createPayPalOrder({
      orderNumber,
      amount: parseFloat(amount),
      currency: currency || "EUR",
      customerEmail
    });
    res.json(paypalOrder);
  } catch (err) {
    res.status(500).json({ error: err.message || "Erreur PayPal" });
  }
});
app.get("/api/downloads/:token/:productId", (req, res) => {
  try {
    const { token, productId } = req.params;
    const order = db.getOrderByDownloadToken(token);
    if (!order) {
      return res.status(404).json({ error: "Lien de t\xE9l\xE9chargement inexistant ou r\xE9voqu\xE9." });
    }
    if (order.paymentStatus !== "paid") {
      return res.status(403).json({
        error: "Votre paiement est en attente de v\xE9rification. Vos fichiers seront d\xE9bloqu\xE9s d\xE8s confirmation par notre service client."
      });
    }
    if (new Date(order.downloadExpiresAt).getTime() < Date.now()) {
      return res.status(410).json({ error: "Ce lien de t\xE9l\xE9chargement s\xE9curis\xE9 a expir\xE9." });
    }
    if (order.downloadCount >= order.maxDownloads) {
      return res.status(429).json({
        error: `Nombre maximum de t\xE9l\xE9chargements atteint (${order.maxDownloads}/${order.maxDownloads}). Contactez le support Digishop.`
      });
    }
    const orderedItem = order.items.find((i) => i.productId === productId);
    if (!orderedItem) {
      return res.status(404).json({ error: "Ce produit ne fait pas partie de cette commande." });
    }
    const vaultFile = DIGITAL_VAULT_FILES[productId] || DIGITAL_VAULT_FILES["prod-1"];
    const buffer = vaultFile.getContent(order.orderNumber, order.customerName);
    db.incrementDownloadCount(order.id);
    const filename = orderedItem.fileDetails?.fileName || vaultFile.filename;
    res.setHeader("Content-Type", vaultFile.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length.toString());
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message || "Erreur lors du t\xE9l\xE9chargement" });
  }
});
app.get("/api/reviews/:productId", (req, res) => {
  const { productId } = req.params;
  const reviews = db.getReviews(productId);
  res.json(reviews);
});
app.post("/api/reviews", optionalAuth, (req, res) => {
  try {
    const { productId, productTitle, userName, rating, comment } = req.body;
    if (!productId || !userName || !rating || !comment) {
      return res.status(400).json({ error: "Champs obligatoires manquants." });
    }
    const authUser = req.user;
    const userId = authUser?.id;
    let isVerifiedPurchase = false;
    if (userId) {
      const userOrders = db.getOrdersByUser(userId);
      isVerifiedPurchase = userOrders.some(
        (o) => o.paymentStatus === "paid" && o.items.some((i) => i.productId === productId)
      );
    }
    const review = db.addReview({
      productId,
      productTitle: productTitle || "Produit Digishop",
      userId,
      userName,
      rating: Math.max(1, Math.min(5, parseInt(rating, 10))),
      comment,
      isVerifiedPurchase,
      isApproved: true
      // Auto-approved or moderated by admin
    });
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/ads", (_req, res) => {
  const ads = db.getAdvertisements().filter((a) => a.isEnabled);
  res.json(ads);
});
app.post("/api/newsletter", (req, res) => {
  const { email, honeypot } = req.body;
  if (honeypot) {
    return res.status(200).json({ message: "Inscription r\xE9ussie." });
  }
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Adresse email valide requise." });
  }
  db.addNewsletterSubscriber(email);
  res.json({ message: "Merci de votre inscription \xE0 la newsletter Digishop !" });
});
app.get("/api/admin/stats", requireAdmin, (_req, res) => {
  try {
    const stats = db.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/admin/products", requireAdmin, (_req, res) => {
  res.json(db.getProducts());
});
app.post("/api/admin/products", requireAdmin, (req, res) => {
  try {
    const p = req.body;
    if (!p.title || !p.price || !p.category) {
      return res.status(400).json({ error: "Titre, prix et cat\xE9gorie obligatoires." });
    }
    const slug = p.slug || p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const newProduct = {
      ...p,
      id: `prod-${Date.now()}`,
      slug,
      downloadsCount: 0,
      rating: 5,
      reviewsCount: 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const saved = db.saveProduct(newProduct);
    const adminUser = req.user;
    db.logAdminAction(adminUser.email, "Cr\xE9ation Produit", `Cr\xE9ation du produit ${saved.title}`);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put("/api/admin/products/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.getProductById(id);
    if (!existing) return res.status(404).json({ error: "Produit introuvable." });
    const updated = db.saveProduct({ ...existing, ...req.body, id });
    const adminUser = req.user;
    db.logAdminAction(adminUser.email, "Modification Produit", `Mise \xE0 jour du produit ${updated.title}`);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete("/api/admin/products/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const success = db.deleteProduct(id);
    if (!success) return res.status(404).json({ error: "Produit introuvable." });
    const adminUser = req.user;
    db.logAdminAction(adminUser.email, "Suppression Produit", `Suppression du produit id ${id}`);
    res.json({ message: "Produit supprim\xE9 avec succ\xE8s." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/admin/orders", requireAdmin, (_req, res) => {
  res.json(db.getOrders());
});
app.patch("/api/admin/orders/:id/status", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminUser = req.user;
    const updated = db.updateOrderStatus(id, status, adminUser.email);
    if (!updated) return res.status(404).json({ error: "Commande introuvable." });
    db.logAdminAction(
      adminUser.email,
      "Validation Statut Commande",
      `Commande ${updated.orderNumber} pass\xE9e au statut ${status}`
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/admin/customers", requireAdmin, (_req, res) => {
  res.json(db.getUsers());
});
app.get("/api/admin/coupons", requireAdmin, (_req, res) => {
  res.json(db.getCoupons());
});
app.post("/api/admin/coupons", requireAdmin, (req, res) => {
  try {
    const c = req.body;
    if (!c.code || !c.discountValue) {
      return res.status(400).json({ error: "Code et valeur obligatoires." });
    }
    const newCoupon = {
      ...c,
      id: `coup-${Date.now()}`,
      code: c.code.toUpperCase().trim(),
      currentUses: 0,
      isActive: c.isActive !== false
    };
    const saved = db.saveCoupon(newCoupon);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete("/api/admin/coupons/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  db.deleteCoupon(id);
  res.json({ message: "Coupon supprim\xE9." });
});
app.get("/api/admin/ads", requireAdmin, (_req, res) => {
  res.json(db.getAdvertisements());
});
app.put("/api/admin/ads/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const updated = db.saveAdvertisement({ ...req.body, id });
  res.json(updated);
});
app.get("/api/admin/reviews", requireAdmin, (_req, res) => {
  res.json(db.getReviews());
});
app.patch("/api/admin/reviews/:id/approve", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { isApproved } = req.body;
  db.updateReviewStatus(id, isApproved);
  res.json({ message: "Statut de l'avis mis \xE0 jour." });
});
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path2.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Digishop] Serveur actif sur http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("[Digishop] Erreur au d\xE9marrage du serveur:", err);
  process.exit(1);
});
