(function () {
  'use strict';

  var r = function (x) {
    return Math.round(x * 10000) / 10000;
  };

  var PRICES_DB = {
    // ── Viandes & Protéines animales ──────────────────────────────────────────
    'Blanc de poulet': {
      name: 'Blanc de poulet',
      pricePerG: r(70 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Cuisses de poulet': {
      name: 'Cuisses de poulet',
      pricePerG: r(30 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Hachis de dinde': {
      name: 'Hachis de dinde',
      pricePerG: r(55 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Blanc de dinde': {
      name: 'Blanc de dinde',
      pricePerG: r(65 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Bœuf maigre haché': {
      name: 'Bœuf maigre haché',
      pricePerG: r(115 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Thon au naturel (boîte)': {
      name: 'Thon au naturel (boîte)',
      pricePerG: r(9.5 / 120),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Saumon frais (filet)': {
      name: 'Saumon frais (filet)',
      pricePerG: r(160 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },

    // ── Œufs & Produits laitiers ──────────────────────────────────────────────
    'Œuf': {
      name: 'Œuf',
      pricePerPce: r(1.2),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Feta': {
      name: 'Feta',
      pricePerG: r(90 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },

    // ── Légumineuses & Féculents ──────────────────────────────────────────────
    'Pois chiches (boîte, égouttés)': {
      name: 'Pois chiches (boîte, égouttés)',
      pricePerG: r(8.5 / 400),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Lentilles corail': {
      name: 'Lentilles corail',
      pricePerG: r(28 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Riz basmati': {
      name: 'Riz basmati',
      pricePerG: r(18 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Pâtes penne': {
      name: 'Pâtes penne',
      pricePerG: r(36 / 500),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Vermicelles': {
      name: 'Vermicelles',
      pricePerG: r(12 / 500),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Feuilles de brick': {
      name: 'Feuilles de brick',
      pricePerPce: r(1.2),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Légumes & Aromates frais ──────────────────────────────────────────────
    'Courgette': {
      name: 'Courgette',
      pricePerG: r(5 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Tomate': {
      name: 'Tomate',
      pricePerG: r(5 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Oignon': {
      name: 'Oignon',
      pricePerG: r(5 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Oignon rouge': {
      name: 'Oignon rouge',
      pricePerG: r(6 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Ail': {
      name: 'Ail',
      pricePerG: r(25 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Carotte': {
      name: 'Carotte',
      pricePerG: r(4 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Épinards frais': {
      name: 'Épinards frais',
      pricePerG: r(10 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Chou rouge': {
      name: 'Chou rouge',
      pricePerG: r(4 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Concombre': {
      name: 'Concombre',
      pricePerG: r(5 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Avocat mûr': {
      name: 'Avocat mûr',
      pricePerG: r(15 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Citron (jus)': {
      name: 'Citron (jus)',
      pricePerG: r(8 / 1000),
      pricePerPce: r((8 / 1000) * 80),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Citron vert (jus)': {
      name: 'Citron vert (jus)',
      pricePerG: r(12 / 1000),
      pricePerPce: r((12 / 1000) * 60),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Persil frais': {
      name: 'Persil frais',
      pricePerG: r(2 / 90),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Coriandre fraîche': {
      name: 'Coriandre fraîche',
      pricePerG: r(2 / 90),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Gingembre frais': {
      name: 'Gingembre frais',
      pricePerG: r(30 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Conserves & Condiments ────────────────────────────────────────────────
    'Tomates concassées (boîte)': {
      name: 'Tomates concassées (boîte)',
      pricePerG: r(8 / 400),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Olives noires': {
      name: 'Olives noires',
      pricePerG: r(18 / 200),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Huiles & Liquides ─────────────────────────────────────────────────────
    'Huile d\'olive': {
      name: 'Huile d\'olive',
      pricePerG: r(70 / 750),
      pricePerMl: r(70 / 750),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Huile de tournesol': {
      name: 'Huile de tournesol',
      pricePerG: r(22 / 1000),
      pricePerMl: r(22 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Huile de sésame': {
      name: 'Huile de sésame',
      pricePerG: r(45 / 250),
      pricePerMl: r(45 / 250),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Sauce soja': {
      name: 'Sauce soja',
      pricePerG: r(18 / 150),
      pricePerMl: r(18 / 150),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Pâtes & Purées ────────────────────────────────────────────────────────
    'Tahini': {
      name: 'Tahini',
      pricePerG: r(45 / 250),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Oléagineux & Graines ──────────────────────────────────────────────────
    'Amandes effilées': {
      name: 'Amandes effilées',
      pricePerG: r(110 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Sésame toasté': {
      name: 'Sésame toasté',
      pricePerG: r(40 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Sucres ────────────────────────────────────────────────────────────────
    'Sucre glace': {
      name: 'Sucre glace',
      pricePerG: r(12 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Épices & Herbes séchées ───────────────────────────────────────────────
    'Cumin moulu': {
      name: 'Cumin moulu',
      pricePerG: r(8 / 50),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Paprika doux': {
      name: 'Paprika doux',
      pricePerG: r(8 / 50),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Paprika fumé': {
      name: 'Paprika fumé',
      pricePerG: r(10 / 50),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Ras el hanout': {
      name: 'Ras el hanout',
      pricePerG: r(10 / 50),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Cannelle moulue': {
      name: 'Cannelle moulue',
      pricePerG: r(8 / 50),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Gingembre moulu': {
      name: 'Gingembre moulu',
      pricePerG: r(8 / 50),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Coriandre moulue': {
      name: 'Coriandre moulue',
      pricePerG: r(7 / 50),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Safran': {
      name: 'Safran',
      pricePerG: r(30 / 0.5),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Basilic séché': {
      name: 'Basilic séché',
      pricePerG: r(8 / 15),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Origan séché': {
      name: 'Origan séché',
      pricePerG: r(8 / 15),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Surgelés ──────────────────────────────────────────────────────────────
    'Edamame (surgelé)': {
      name: 'Edamame (surgelé)',
      pricePerG: r(35 / 400),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Protéines supplémentaires ──────────────────────────────────────────────
    'Crevettes décortiquées': {
      name: 'Crevettes décortiquées',
      pricePerG: r(100 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Bœuf (tranche fine)': {
      name: 'Bœuf (tranche fine)',
      pricePerG: r(130 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Saumon fumé': {
      name: 'Saumon fumé',
      pricePerG: r(250 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Thon frais (pavé)': {
      name: 'Thon frais (pavé)',
      pricePerG: r(180 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Produits laitiers supplémentaires ──────────────────────────────────────
    'Yaourt grec 0%': {
      name: 'Yaourt grec 0%',
      pricePerG: r(38 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Fromage râpé': {
      name: 'Fromage râpé',
      pricePerG: r(120 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Parmesan râpé': {
      name: 'Parmesan râpé',
      pricePerG: r(220 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Lait écrémé': {
      name: 'Lait écrémé',
      pricePerMl: r(7 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Beurre': {
      name: 'Beurre',
      pricePerG: r(90 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Crème légère 5%': {
      name: 'Crème légère 5%',
      pricePerMl: r(25 / 250),
      source: 'carrefour',
      updatedAt: '2026-03'
    },

    // ── Féculents supplémentaires ──────────────────────────────────────────────
    'Quinoa': {
      name: 'Quinoa',
      pricePerG: r(65 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Flocons d\'avoine': {
      name: 'Flocons d\'avoine',
      pricePerG: r(22 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Riz japonais': {
      name: 'Riz japonais',
      pricePerG: r(32 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Riz à sushi': {
      name: 'Riz à sushi',
      pricePerG: r(32 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Riz cuit (de la veille)': {
      name: 'Riz cuit (de la veille)',
      pricePerG: r(8 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Nouilles de riz': {
      name: 'Nouilles de riz',
      pricePerG: r(28 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Nouilles ramen': {
      name: 'Nouilles ramen',
      pricePerG: r(30 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Nouilles soba': {
      name: 'Nouilles soba',
      pricePerG: r(45 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Feuilles lasagnes': {
      name: 'Feuilles lasagnes',
      pricePerG: r(36 / 500),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Farine d\'avoine': {
      name: 'Farine d\'avoine',
      pricePerG: r(25 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Pain complet (tranches)': {
      name: 'Pain complet (tranches)',
      pricePerPce: 3.5,
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Pain burger complet': {
      name: 'Pain burger complet',
      pricePerPce: 8.0,
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Pain pita': {
      name: 'Pain pita',
      pricePerPce: 4.0,
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Tortillas de blé': {
      name: 'Tortillas de blé',
      pricePerPce: 5.0,
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Patate douce': {
      name: 'Patate douce',
      pricePerG: r(7 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Pommes de terre': {
      name: 'Pommes de terre',
      pricePerG: r(4 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Légumes supplémentaires ────────────────────────────────────────────────
    'Brocoli': {
      name: 'Brocoli',
      pricePerG: r(10 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Poivron rouge': {
      name: 'Poivron rouge',
      pricePerG: r(8 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Poivrons (rouge et jaune)': {
      name: 'Poivrons (rouge et jaune)',
      pricePerG: r(8 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Champignons': {
      name: 'Champignons',
      pricePerG: r(25 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Champignons de Paris': {
      name: 'Champignons de Paris',
      pricePerG: r(25 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Maïs en boîte': {
      name: 'Maïs en boîte',
      pricePerG: r(12 / 400),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Haricots verts': {
      name: 'Haricots verts',
      pricePerG: r(8 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Haricots noirs': {
      name: 'Haricots noirs',
      pricePerG: r(18 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Haricots rouges': {
      name: 'Haricots rouges',
      pricePerG: r(16 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Haricots (boîte)': {
      name: 'Haricots (boîte)',
      pricePerG: r(12 / 400),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Céleri': {
      name: 'Céleri',
      pricePerG: r(6 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Aubergine': {
      name: 'Aubergine',
      pricePerG: r(5 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Fruits supplémentaires ─────────────────────────────────────────────────
    'Banane': {
      name: 'Banane',
      pricePerG: r(8 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Mangue': {
      name: 'Mangue',
      pricePerG: r(15 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Fraises': {
      name: 'Fraises',
      pricePerG: r(20 / 500),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Myrtilles (surgelées)': {
      name: 'Myrtilles (surgelées)',
      pricePerG: r(45 / 500),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Ananas (boîte)': {
      name: 'Ananas (boîte)',
      pricePerG: r(14 / 560),
      source: 'carrefour',
      updatedAt: '2026-03'
    },

    // ── Condiments & Sauces supplémentaires ────────────────────────────────────
    'Miel': {
      name: 'Miel',
      pricePerG: r(80 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Moutarde de Dijon': {
      name: 'Moutarde de Dijon',
      pricePerG: r(22 / 200),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Sauce pimentée': {
      name: 'Sauce pimentée',
      pricePerMl: r(18 / 200),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Vinaigre de riz': {
      name: 'Vinaigre de riz',
      pricePerMl: r(12 / 500),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Vinaigre balsamique': {
      name: 'Vinaigre balsamique',
      pricePerMl: r(25 / 250),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Sauce teriyaki': {
      name: 'Sauce teriyaki',
      pricePerMl: r(22 / 250),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Nuoc-mâm': {
      name: 'Nuoc-mâm',
      pricePerMl: r(15 / 200),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Pâte de curry rouge': {
      name: 'Pâte de curry rouge',
      pricePerG: r(30 / 200),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Bouillon de poulet': {
      name: 'Bouillon de poulet',
      pricePerMl: r(0.002),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Bouillon de légumes': {
      name: 'Bouillon de légumes',
      pricePerMl: r(0.002),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Bouillon de bœuf': {
      name: 'Bouillon de bœuf',
      pricePerMl: r(0.002),
      source: 'estimation',
      updatedAt: '2026-03'
    },

    // ── Graines & Noix supplémentaires ─────────────────────────────────────────
    'Noix de cajou': {
      name: 'Noix de cajou',
      pricePerG: r(160 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Graines de chia': {
      name: 'Graines de chia',
      pricePerG: r(60 / 500),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Graines de lin': {
      name: 'Graines de lin',
      pricePerG: r(30 / 500),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Beurre de cacahuète': {
      name: 'Beurre de cacahuète',
      pricePerG: r(45 / 500),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Noix (cerneaux)': {
      name: 'Noix (cerneaux)',
      pricePerG: r(120 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Tofu & Protéines végétales ─────────────────────────────────────────────
    'Tofu ferme': {
      name: 'Tofu ferme',
      pricePerG: r(35 / 400),
      source: 'carrefour',
      updatedAt: '2026-03'
    },

    // ── Épices & Herbes supplémentaires ────────────────────────────────────────
    'Curry en poudre': {
      name: 'Curry en poudre',
      pricePerG: r(25 / 100),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Piment de Cayenne': {
      name: 'Piment de Cayenne',
      pricePerG: r(20 / 50),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Basilic frais': {
      name: 'Basilic frais',
      pricePerG: r(20 / 30),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Pesto vert': {
      name: 'Pesto vert',
      pricePerG: r(55 / 190),
      source: 'carrefour',
      updatedAt: '2026-03'
    },

    // ── Divers supplémentaires ──────────────────────────────────────────────────
    'Lait de coco': {
      name: 'Lait de coco',
      pricePerMl: r(12 / 400),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Crème de coco': {
      name: 'Crème de coco',
      pricePerMl: r(16 / 400),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Cacao non sucré': {
      name: 'Cacao non sucré',
      pricePerG: r(40 / 250),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Protéines de lactosérum (whey)': {
      name: 'Protéines de lactosérum (whey)',
      pricePerG: r(350 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },

    // ── Légumes & herbes supplémentaires ───────────────────────────────────────
    'Champignons shiitake': {
      name: 'Champignons shiitake',
      pricePerG: r(60 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Laitue romaine': {
      name: 'Laitue romaine',
      pricePerG: r(8 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Laitue': {
      name: 'Laitue',
      pricePerG: r(6 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Tomates cerises': {
      name: 'Tomates cerises',
      pricePerG: r(12 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Tomates mûres': {
      name: 'Tomates mûres',
      pricePerG: r(5 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Tomates': {
      name: 'Tomates',
      pricePerG: r(5 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Carottes': {
      name: 'Carottes',
      pricePerG: r(4 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Pousses de soja': {
      name: 'Pousses de soja',
      pricePerG: r(12 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Oignon vert': {
      name: 'Oignon vert',
      pricePerG: r(8 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Salade mélangée': {
      name: 'Salade mélangée',
      pricePerG: r(12 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Pastèque': {
      name: 'Pastèque',
      pricePerG: r(4 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Menthe fraîche': {
      name: 'Menthe fraîche',
      pricePerG: r(2 / 90),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Romarin frais': {
      name: 'Romarin frais',
      pricePerG: r(2 / 100),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Thym frais': {
      name: 'Thym frais',
      pricePerG: r(2 / 100),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Aneth frais': {
      name: 'Aneth frais',
      pricePerG: r(3 / 100),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Ciboulette fraîche': {
      name: 'Ciboulette fraîche',
      pricePerG: r(2.5 / 100),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Petits pois surgelés': {
      name: 'Petits pois surgelés',
      pricePerG: r(18 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Légumineuses supplémentaires ───────────────────────────────────────────
    'Pois chiches secs (trempés 12h)': {
      name: 'Pois chiches secs (trempés 12h)',
      pricePerG: r(12 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Lentilles vertes': {
      name: 'Lentilles vertes',
      pricePerG: r(22 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Haricots blancs (boîte)': {
      name: 'Haricots blancs (boîte)',
      pricePerG: r(8 / 400),
      source: 'carrefour',
      updatedAt: '2026-03'
    },

    // ── Fruits supplémentaires ─────────────────────────────────────────────────
    'Kiwi': {
      name: 'Kiwi',
      pricePerG: r(15 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Pomme': {
      name: 'Pomme',
      pricePerG: r(6 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Fruits rouges surgelés': {
      name: 'Fruits rouges surgelés',
      pricePerG: r(35 / 400),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Fruits rouges': {
      name: 'Fruits rouges',
      pricePerG: r(35 / 400),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Dattes Medjool dénoyautées': {
      name: 'Dattes Medjool dénoyautées',
      pricePerG: r(60 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Raisins secs': {
      name: 'Raisins secs',
      pricePerG: r(30 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Mangue fraîche': {
      name: 'Mangue fraîche',
      pricePerG: r(12 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Mangue surgelée': {
      name: 'Mangue surgelée',
      pricePerG: r(25 / 400),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Banane mûre': {
      name: 'Banane mûre',
      pricePerG: r(5 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Banane congelée': {
      name: 'Banane congelée',
      pricePerG: r(7 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Myrtilles': {
      name: 'Myrtilles',
      pricePerG: r(60 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },

    // ── Produits d'épicerie supplémentaires ────────────────────────────────────
    'Granola': {
      name: 'Granola',
      pricePerG: r(80 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Cacahuètes concassées': {
      name: 'Cacahuètes concassées',
      pricePerG: r(50 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Noix de coco râpée': {
      name: 'Noix de coco râpée',
      pricePerG: r(50 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Poudre de cacao': {
      name: 'Poudre de cacao',
      pricePerG: r(60 / 500),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Pépites de chocolat noir': {
      name: 'Pépites de chocolat noir',
      pricePerG: r(75 / 500),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Fécule de maïs': {
      name: 'Fécule de maïs',
      pricePerG: r(18 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Farine': {
      name: 'Farine',
      pricePerG: r(7 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Levure chimique': {
      name: 'Levure chimique',
      pricePerG: r(5 / 100),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Câpres': {
      name: 'Câpres',
      pricePerG: r(20 / 100),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Anchois': {
      name: 'Anchois',
      pricePerG: r(30 / 100),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Moutarde': {
      name: 'Moutarde',
      pricePerG: r(20 / 500),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Ail en poudre': {
      name: 'Ail en poudre',
      pricePerG: r(8 / 50),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Épices supplémentaires ─────────────────────────────────────────────────
    'Garam masala': {
      name: 'Garam masala',
      pricePerG: r(8 / 50),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Curcuma': {
      name: 'Curcuma',
      pricePerG: r(5 / 50),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Thym séché': {
      name: 'Thym séché',
      pricePerG: r(8 / 15),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Herbes de Provence': {
      name: 'Herbes de Provence',
      pricePerG: r(8 / 15),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Piment doux': {
      name: 'Piment doux',
      pricePerG: r(8 / 50),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Chili en poudre': {
      name: 'Chili en poudre',
      pricePerG: r(8 / 50),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Flocons de piment rouge': {
      name: 'Flocons de piment rouge',
      pricePerG: r(10 / 50),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Sauces & condiments asiatiques supplémentaires ─────────────────────────
    'Gochujang (pâte pimentée)': {
      name: 'Gochujang (pâte pimentée)',
      pricePerG: r(80 / 500),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Sauce poisson': {
      name: 'Sauce poisson',
      pricePerMl: r(15 / 150),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Pâte miso blanche': {
      name: 'Pâte miso blanche',
      pricePerG: r(25 / 100),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Kecap manis': {
      name: 'Kecap manis',
      pricePerMl: r(15 / 150),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Pâte de piment (sambal)': {
      name: 'Pâte de piment (sambal)',
      pricePerG: r(18 / 100),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Sauce tamari': {
      name: 'Sauce tamari',
      pricePerMl: r(18 / 150),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Vinaigre de vin rouge': {
      name: 'Vinaigre de vin rouge',
      pricePerMl: r(15 / 250),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Vinaigre blanc': {
      name: 'Vinaigre blanc',
      pricePerMl: r(5 / 250),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Vinaigre de cidre': {
      name: 'Vinaigre de cidre',
      pricePerMl: r(15 / 250),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Pesto au basilic': {
      name: 'Pesto au basilic',
      pricePerG: r(36 / 300),
      source: 'carrefour',
      updatedAt: '2026-03'
    },

    // ── Produits exotiques supplémentaires ─────────────────────────────────────
    'Algues wakame séchées': {
      name: 'Algues wakame séchées',
      pricePerG: r(20 / 10),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Nori (algues)': {
      name: 'Nori (algues)',
      pricePerG: r(30 / 25),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Tofu soyeux': {
      name: 'Tofu soyeux',
      pricePerG: r(30 / 500),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Étoile de badiane': {
      name: 'Étoile de badiane',
      pricePerPce: 2.0,
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Citronelle': {
      name: 'Citronelle',
      pricePerPce: 3.0,
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Galanga frais (ou gingembre)': {
      name: 'Galanga frais (ou gingembre)',
      pricePerG: r(30 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Huile de coco': {
      name: 'Huile de coco',
      pricePerMl: r(60 / 750),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Huile d\'arachide': {
      name: 'Huile d\'arachide',
      pricePerMl: r(28 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Pâtes locales (alternative économique) ─────────────────────────────────
    'Pâtes locales': {
      name: 'Pâtes locales',
      pricePerG: r(12 / 500),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Pâtes fusilli': {
      name: 'Pâtes fusilli',
      pricePerG: r(36 / 500),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Pâtes courtes (ditalini)': {
      name: 'Pâtes courtes (ditalini)',
      pricePerG: r(36 / 500),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Muffins anglais complets': {
      name: 'Muffins anglais complets',
      pricePerPce: 8.0,
      source: 'carrefour',
      updatedAt: '2026-03'
    },

    // ── Divers ─────────────────────────────────────────────────────────────────
    'Eau': {
      name: 'Eau',
      pricePerMl: 0,
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Eau froide': {
      name: 'Eau froide',
      pricePerMl: 0,
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Vanille': {
      name: 'Vanille',
      pricePerG: r(5 / 10),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Piment rouge': {
      name: 'Piment rouge',
      pricePerPce: 1.0,
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Piment': {
      name: 'Piment',
      pricePerPce: 1.0,
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Blanc d\'œuf': {
      name: 'Blanc d\'œuf',
      pricePerPce: 0.6,
      source: 'estimation',
      updatedAt: '2026-03'
    },

    // ── Ingrédients manquants R201-R360 + salades ─────────────────────────────
    // Viandes
    'Agneau haché maigre': {
      name: 'Agneau haché maigre',
      pricePerG: r(130 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Rumsteak de bœuf': {
      name: 'Rumsteak de bœuf',
      pricePerG: r(150 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Jambon de dinde (tranches)': {
      name: 'Jambon de dinde (tranches)',
      pricePerG: r(60 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Lardons de dinde fumée': {
      name: 'Lardons de dinde fumée',
      pricePerG: r(55 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    // Poissons & fruits de mer
    'Filet de saumon': {
      name: 'Filet de saumon',
      pricePerG: r(160 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Poulpe cuit': {
      name: 'Poulpe cuit',
      pricePerG: r(80 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    // Produits laitiers
    'Mozzarella fraîche': {
      name: 'Mozzarella fraîche',
      pricePerG: r(65 / 200),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Yaourt nature 0%': {
      name: 'Yaourt nature 0%',
      pricePerG: r(6 / 125),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    // Légumes
    'Poivron vert': {
      name: 'Poivron vert',
      pricePerG: r(6 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Olives vertes': {
      name: 'Olives vertes',
      pricePerG: r(20 / 200),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Salade romaine': {
      name: 'Salade romaine',
      pricePerG: r(8 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Maïs doux (boîte, égoutté)': {
      name: 'Maïs doux (boîte, égoutté)',
      pricePerG: r(12 / 400),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    // Légumineuses & féculents
    'Haricots noirs (boîte, égouttés)': {
      name: 'Haricots noirs (boîte, égouttés)',
      pricePerG: r(12 / 400),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Lentilles vertes (sèches)': {
      name: 'Lentilles vertes (sèches)',
      pricePerG: r(22 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Quinoa sec': {
      name: 'Quinoa sec',
      pricePerG: r(65 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Boulghour fin': {
      name: 'Boulghour fin',
      pricePerG: r(18 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Couscous fin': {
      name: 'Couscous fin',
      pricePerG: r(18 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Pâtes complètes (fusilli)': {
      name: 'Pâtes complètes (fusilli)',
      pricePerG: r(36 / 500),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Vermicelles de riz': {
      name: 'Vermicelles de riz',
      pricePerG: r(28 / 400),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    // Pains
    'Pain complet (grillé)': {
      name: 'Pain complet (grillé)',
      pricePerG: r(18 / 500),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Pain complet (croûtons)': {
      name: 'Pain complet (croûtons)',
      pricePerG: r(15 / 200),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Pain pita complet': {
      name: 'Pain pita complet',
      pricePerG: r(20 / 320),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    // Condiments & préparations
    'Falafel (prêt-à-cuire, surgelé)': {
      name: 'Falafel (prêt-à-cuire, surgelé)',
      pricePerG: r(30 / 300),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Houmous': {
      name: 'Houmous',
      pricePerG: r(25 / 200),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    // Herbes
    'Persil frais (bouquet)': {
      name: 'Persil frais (bouquet)',
      pricePerG: r(2 / 90),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Alias noms doublons (normalisation) ────────────────────────────────────
    'Dinde hachée': {
      name: 'Dinde hachée',
      pricePerG: r(55 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Bœuf haché maigre (5%)': {
      name: 'Bœuf haché maigre (5%)',
      pricePerG: r(115 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Bœuf (faux-filet, tranches fines)': {
      name: 'Bœuf (faux-filet, tranches fines)',
      pricePerG: r(130 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Saumon (pavé)': {
      name: 'Saumon (pavé)',
      pricePerG: r(160 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Saumon frais': {
      name: 'Saumon frais',
      pricePerG: r(160 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Thon en boîte (au naturel)': {
      name: 'Thon en boîte (au naturel)',
      pricePerG: r(9.5 / 120),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Cuisses de poulet sans peau': {
      name: 'Cuisses de poulet sans peau',
      pricePerG: r(30 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Lait de coco (léger)': {
      name: 'Lait de coco (léger)',
      pricePerMl: r(11 / 400),
      source: 'carrefour',
      updatedAt: '2026-03'
    },

    // ── Fruits & légumes frais ────────────────────────────────────────────────
    'Avocat': {
      name: 'Avocat',
      pricePerG: r(8 / 220),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Citron vert': {
      name: 'Citron vert',
      pricePerPce: r(1.5),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Citron': {
      name: 'Citron',
      pricePerPce: r(1.0),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Poivrons rouges': {
      name: 'Poivrons rouges',
      pricePerPce: r(3.0),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Conserves & légumineuses ──────────────────────────────────────────────
    'Tomates concassées': {
      name: 'Tomates concassées',
      pricePerG: r(10 / 400),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Pois chiches (boîte)': {
      name: 'Pois chiches (boîte)',
      pricePerG: r(12 / 400),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Haricots noirs (boîte)': {
      name: 'Haricots noirs (boîte)',
      pricePerG: r(12 / 400),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Haricots rouges (boîte)': {
      name: 'Haricots rouges (boîte)',
      pricePerG: r(12 / 400),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Épices & condiments ───────────────────────────────────────────────────
    'Cannelle': {
      name: 'Cannelle',
      pricePerG: r(25 / 100),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Sel, poivre': {
      name: 'Sel, poivre',
      pricePerG: r(0.002),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Sel': {
      name: 'Sel',
      pricePerG: r(0.001),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Sel, poivre, noix de muscade': {
      name: 'Sel, poivre, noix de muscade',
      pricePerG: r(0.003),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Sel, poivre, herbes': {
      name: 'Sel, poivre, herbes',
      pricePerG: r(0.003),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Sucre glace (décor)': {
      name: 'Sucre glace (décor)',
      pricePerG: r(10 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Sucre (optionnel)': {
      name: 'Sucre (optionnel)',
      pricePerG: r(8 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Jus de citron vert': {
      name: 'Jus de citron vert',
      pricePerMl: r(15 / 100),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Kecap manis (ou sauce soja + miel)': {
      name: 'Kecap manis (ou sauce soja + miel)',
      pricePerMl: r(25 / 200),
      source: 'carrefour',
      updatedAt: '2026-03'
    },

    // ── Graines & oléagineux ──────────────────────────────────────────────────
    'Graines de sésame': {
      name: 'Graines de sésame',
      pricePerG: r(20 / 100),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Amandes': {
      name: 'Amandes',
      pricePerG: r(80 / 500),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Noix': {
      name: 'Noix',
      pricePerG: r(70 / 500),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Beurre de cacahuète (naturel)': {
      name: 'Beurre de cacahuète (naturel)',
      pricePerG: r(35 / 500),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Edamame': {
      name: 'Edamame',
      pricePerG: r(18 / 200),
      source: 'carrefour',
      updatedAt: '2026-03'
    },

    // ── Bouillons & bases liquides ────────────────────────────────────────────
    'Bouillon légumes': {
      name: 'Bouillon légumes',
      pricePerMl: r(0.002),
      source: 'estimation',
      updatedAt: '2026-03'
    },

    // ── Pains & féculents ─────────────────────────────────────────────────────
    'Croûtons pain complet': {
      name: 'Croûtons pain complet',
      pricePerG: r(15 / 200),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Pain complet (tranches épaisses)': {
      name: 'Pain complet (tranches épaisses)',
      pricePerPce: r(2.5),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Flocons d\'avoine (mixés en farine)': {
      name: 'Flocons d\'avoine (mixés en farine)',
      pricePerG: r(12 / 500),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Viandes & protéines alternatives ─────────────────────────────────────
    'Blanc de poulet (avec os)': {
      name: 'Blanc de poulet (avec os)',
      pricePerG: r(55 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Épices asiatiques ─────────────────────────────────────────────────────
    'Galanga (ou gingembre)': {
      name: 'Galanga (ou gingembre)',
      pricePerG: r(30 / 200),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Alias & ingrédients SALAD_DB ──────────────────────────────────────────
    // Bases
    'Riz brun': {
      name: 'Riz brun',
      pricePerG: r(20 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Pâtes complètes': {
      name: 'Pâtes complètes',
      pricePerG: r(36 / 500),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Couscous': {
      name: 'Couscous',
      pricePerG: r(18 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Lentilles': {
      name: 'Lentilles',
      pricePerG: r(22 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Pois chiches': {
      name: 'Pois chiches',
      pricePerG: r(12 / 400),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Boulgour': {
      name: 'Boulgour',
      pricePerG: 0.022,
      source: 'marjane',
      updatedAt: '2026-03'
    },
    // Protéines — alias
    'Poulet grillé': {
      name: 'Poulet grillé',
      pricePerG: r(70 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Thon en boîte': {
      name: 'Thon en boîte',
      pricePerG: r(9.5 / 120),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Saumon': {
      name: 'Saumon',
      pricePerG: r(160 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Crevettes': {
      name: 'Crevettes',
      pricePerG: r(100 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Œuf dur': {
      name: 'Œuf dur',
      pricePerPce: r(1.2),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Bœuf haché 5%': {
      name: 'Bœuf haché 5%',
      pricePerG: 0.095,
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Mozzarella': {
      name: 'Mozzarella',
      pricePerG: 0.15,
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    // Légumes — alias
    'Épinards': {
      name: 'Épinards',
      pricePerG: r(10 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Roquette': {
      name: 'Roquette',
      pricePerG: 0.018,
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Maïs': {
      name: 'Maïs',
      pricePerG: r(12 / 400),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Oignons rouges': {
      name: 'Oignons rouges',
      pricePerG: r(6 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Olives': {
      name: 'Olives',
      pricePerG: r(18 / 200),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    // Sauces
    'Vinaigrette légère': {
      name: 'Vinaigrette légère',
      pricePerG: 0.012,
      pricePerMl: 0.012,
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Jus de citron': {
      name: 'Jus de citron',
      pricePerG: 0.005,
      pricePerMl: 0.005,
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Sauce yaourt': {
      name: 'Sauce yaourt',
      pricePerG: 0.008,
      pricePerMl: 0.008,
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Sauce tahini citronnée': {
      name: 'Sauce tahini citronnée',
      pricePerG: 0.025,
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Pesto': {
      name: 'Pesto',
      pricePerG: r(55 / 190),
      source: 'carrefour',
      updatedAt: '2026-03'
    },

    // ── Ingrédients manquants R381-R400 ──────────────────────────────────────────
    // Pain & féculents
    'Pain complet': {
      name: 'Pain complet',
      pricePerPce: r(3.0),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Riz blanc': {
      name: 'Riz blanc',
      pricePerG: r(15 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Riz jasmin': {
      name: 'Riz jasmin',
      pricePerG: r(20 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Pâtes complètes fusilli': {
      name: 'Pâtes complètes fusilli',
      pricePerG: r(36 / 500),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Farine complète': {
      name: 'Farine complète',
      pricePerG: r(10 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    // Légumes & fruits frais
    'Betterave (cuite)': {
      name: 'Betterave (cuite)',
      pricePerG: r(6 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Mangue (fraîche)': {
      name: 'Mangue (fraîche)',
      pricePerG: r(12 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Piment rouge (frais)': {
      name: 'Piment rouge (frais)',
      pricePerPce: r(1.5),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    // Légumineuses
    'Lentilles vertes sèches': {
      name: 'Lentilles vertes sèches',
      pricePerG: r(22 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    // Produits laitiers & alternatives
    'Skyr / Yaourt islandais': {
      name: 'Skyr / Yaourt islandais',
      pricePerG: r(55 / 500),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    // Condiments & bouillons
    'Citron (pce)': {
      name: 'Citron (pce)',
      pricePerPce: r(1.0),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Bouillon de légumes (cube)': {
      name: 'Bouillon de légumes (cube)',
      pricePerPce: r(1.5),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Bouillon de poulet (cube)': {
      name: 'Bouillon de poulet (cube)',
      pricePerPce: r(1.5),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    // Épices & herbes
    'Gingembre': {
      name: 'Gingembre',
      pricePerG: r(30 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    // Graines & oléagineux
    'Graines de tournesol': {
      name: 'Graines de tournesol',
      pricePerG: r(25 / 500),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Sésame (graines)': {
      name: 'Sésame (graines)',
      pricePerG: r(20 / 100),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    // Boissons & laits végétaux
    'Lait d\'amande': {
      name: 'Lait d\'amande',
      pricePerMl: r(18 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    // Surgelés & préparés
    'Falafel surgelé': {
      name: 'Falafel surgelé',
      pricePerG: r(30 / 300),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Tortilla de blé': {
      name: 'Tortilla de blé',
      pricePerPce: r(5.0),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    // Produits exotiques
    'Açaí en poudre': {
      name: 'Açaí en poudre',
      pricePerG: r(120 / 100),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Nori (feuilles d\'algue)': {
      name: 'Nori (feuilles d\'algue)',
      pricePerG: r(30 / 25),
      source: 'carrefour',
      updatedAt: '2026-03'
    },

    // ── 27 ingrédients manquants — couverture 100% recettes ───────────────────
    'aneth': {
      name: 'aneth',
      pricePerG: r(8 / 90),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'bok choy': {
      name: 'bok choy',
      pricePerG: r(15 / 300),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'cabillaud': {
      name: 'cabillaud',
      pricePerG: r(85 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'chapelure': {
      name: 'chapelure',
      pricePerG: r(12 / 500),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'chou blanc': {
      name: 'chou blanc',
      pricePerG: r(8 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'farine de sarrasin': {
      name: 'farine de sarrasin',
      pricePerG: r(25 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'framboises': {
      name: 'framboises',
      pricePerG: r(35 / 250),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'fromage frais': {
      name: 'fromage frais',
      pricePerG: r(28 / 150),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'gnocchi': {
      name: 'gnocchi',
      pricePerG: r(22 / 500),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'gochujang': {
      name: 'gochujang',
      pricePerG: r(35 / 200),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'halloumi': {
      name: 'halloumi',
      pricePerG: r(45 / 250),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'haricots noirs': {
      name: 'haricots noirs',
      pricePerG: r(12 / 400),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'lait de coco': {
      name: 'lait de coco',
      pricePerMl: r(18 / 400),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'maïs doux': {
      name: 'maïs doux',
      pricePerG: r(10 / 400),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'moules': {
      name: 'moules',
      pricePerG: r(40 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'origan': {
      name: 'origan',
      pricePerG: r(8 / 15),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'pain bao': {
      name: 'pain bao',
      pricePerPce: r(25 / 6),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'pâte miso': {
      name: 'pâte miso',
      pricePerG: r(35 / 200),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'pêche': {
      name: 'pêche',
      pricePerG: r(15 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'ricotta': {
      name: 'ricotta',
      pricePerG: r(30 / 250),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'romarin': {
      name: 'romarin',
      pricePerG: r(8 / 100),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'sauce huître': {
      name: 'sauce huître',
      pricePerMl: r(22 / 250),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'nuoc-mâm': {
      name: 'nuoc-mâm',
      pricePerMl: r(18 / 200),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'sriracha': {
      name: 'sriracha',
      pricePerMl: r(20 / 250),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'thym': {
      name: 'thym',
      pricePerG: r(8 / 100),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'wakame': {
      name: 'wakame',
      pricePerG: r(30 / 50),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'garam masala': {
      name: 'garam masala',
      pricePerG: r(15 / 50),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Produits laitiers & fromages (nouvelles recettes R401-R439) ──────────
    'Fromage blanc 0%': {
      name: 'Fromage blanc 0%',
      pricePerG: r(12 / 500),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Lait demi-écrémé': {
      name: 'Lait demi-écrémé',
      pricePerG: r(7 / 1000),
      pricePerMl: r(7 / 1000),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Lait entier': {
      name: 'Lait entier',
      pricePerG: r(8 / 1000),
      pricePerMl: r(8 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Mascarpone': {
      name: 'Mascarpone',
      pricePerG: r(25 / 250),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Cream cheese allégé': {
      name: 'Cream cheese allégé',
      pricePerG: r(22 / 200),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Gélatine en feuilles': {
      name: 'Gélatine en feuilles',
      pricePerG: r(18 / 12),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Jaune d\'œuf': {
      name: 'Jaune d\'œuf',
      pricePerPce: r(0.7),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Jaunes d\'œufs': {
      name: 'Jaunes d\'œufs',
      pricePerPce: r(0.7),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Sucres & édulcorants ──────────────────────────────────────────────────
    'Stevia': {
      name: 'Stevia',
      pricePerG: r(80 / 50),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Stevia en poudre': {
      name: 'Stevia en poudre',
      pricePerG: r(80 / 50),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Sucre de coco': {
      name: 'Sucre de coco',
      pricePerG: r(45 / 500),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Sucre de coco (pour caraméliser)': {
      name: 'Sucre de coco (pour caraméliser)',
      pricePerG: r(45 / 500),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Érythritol (ou sucre)': {
      name: 'Érythritol (ou sucre)',
      pricePerG: r(50 / 400),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Sirop d\'érable': {
      name: 'Sirop d\'érable',
      pricePerG: r(60 / 250),
      pricePerMl: r(60 / 250),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Sirop d\'agave': {
      name: 'Sirop d\'agave',
      pricePerG: r(45 / 250),
      pricePerMl: r(45 / 250),
      source: 'carrefour',
      updatedAt: '2026-03'
    },

    // ── Chocolat & cacao ──────────────────────────────────────────────────────
    'Chocolat noir 70%': {
      name: 'Chocolat noir 70%',
      pricePerG: r(25 / 100),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Chocolat noir 70% (enrobage)': {
      name: 'Chocolat noir 70% (enrobage)',
      pricePerG: r(25 / 100),
      source: 'carrefour',
      updatedAt: '2026-03'
    },

    // ── Fruits à coque & beurres ──────────────────────────────────────────────
    'Pistaches': {
      name: 'Pistaches',
      pricePerG: r(150 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Pistaches concassées': {
      name: 'Pistaches concassées',
      pricePerG: r(150 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Pistaches émondées': {
      name: 'Pistaches émondées',
      pricePerG: r(160 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Noisettes entières': {
      name: 'Noisettes entières',
      pricePerG: r(80 / 500),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Beurre de noisette': {
      name: 'Beurre de noisette',
      pricePerG: r(65 / 250),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Beurre de cajou': {
      name: 'Beurre de cajou',
      pricePerG: r(80 / 250),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Beurre d\'amande': {
      name: 'Beurre d\'amande',
      pricePerG: r(70 / 250),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Poudre d\'amandes': {
      name: 'Poudre d\'amandes',
      pricePerG: r(60 / 200),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Amandes en poudre': {
      name: 'Amandes en poudre',
      pricePerG: r(60 / 200),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Cranberries séchées': {
      name: 'Cranberries séchées',
      pricePerG: r(35 / 200),
      source: 'carrefour',
      updatedAt: '2026-03'
    },

    // ── Féculents & farines ───────────────────────────────────────────────────
    'Farine de riz': {
      name: 'Farine de riz',
      pricePerG: r(20 / 500),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Riz rond': {
      name: 'Riz rond',
      pricePerG: r(8 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Fruits & légumes ──────────────────────────────────────────────────────
    'Cerises fraîches ou surgelées dénoyautées': {
      name: 'Cerises fraîches ou surgelées dénoyautées',
      pricePerG: r(30 / 500),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Cerises dénoyautées surgelées': {
      name: 'Cerises dénoyautées surgelées',
      pricePerG: r(25 / 500),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Framboises fraîches': {
      name: 'Framboises fraîches',
      pricePerG: r(35 / 250),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Purée d\'açaï surgelée': {
      name: 'Purée d\'açaï surgelée',
      pricePerG: r(60 / 100),
      source: 'carrefour',
      updatedAt: '2026-03'
    },

    // ── Épices & arômates ──────────────────────────────────────────────────────
    'Matcha en poudre (qualité culinaire)': {
      name: 'Matcha en poudre (qualité culinaire)',
      pricePerG: r(60 / 50),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Matcha en poudre': {
      name: 'Matcha en poudre',
      pricePerG: r(60 / 50),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Extrait d\'amande amère': {
      name: 'Extrait d\'amande amère',
      pricePerMl: r(25 / 50),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Muscade moulue': {
      name: 'Muscade moulue',
      pricePerG: r(15 / 50),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Anis étoilé moulu': {
      name: 'Anis étoilé moulu',
      pricePerG: r(12 / 50),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Eau de rose': {
      name: 'Eau de rose',
      pricePerMl: r(20 / 200),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Fruits secs & divers ──────────────────────────────────────────────────
    'Figues séchées': {
      name: 'Figues séchées',
      pricePerG: r(30 / 200),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Mangue séchée non sucrée': {
      name: 'Mangue séchée non sucrée',
      pricePerG: r(40 / 200),
      source: 'carrefour',
      updatedAt: '2026-03'
    },

    // ── Boissons & liquides ───────────────────────────────────────────────────
    'Jus de fruit de la passion': {
      name: 'Jus de fruit de la passion',
      pricePerMl: r(30 / 200),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Café soluble': {
      name: 'Café soluble',
      pricePerG: r(40 / 100),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Café fort refroidi': {
      name: 'Café fort refroidi',
      pricePerMl: r(0.05),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Biscuits & pâtisserie ─────────────────────────────────────────────────
    'Boudoirs (biscuits à la cuillère)': {
      name: 'Boudoirs (biscuits à la cuillère)',
      pricePerG: r(20 / 200),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Bicarbonate de soude': {
      name: 'Bicarbonate de soude',
      pricePerG: r(5 / 200),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Zeste de citron (pce)': {
      name: 'Zeste de citron (pce)',
      pricePerPce: r(0.5),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Zeste de citron vert': {
      name: 'Zeste de citron vert',
      pricePerG: r(0.5 / 5),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Zeste de citron': {
      name: 'Zeste de citron',
      pricePerG: r(0.5 / 5),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── SALAD_DB premium — Bar à Salades ─────────────────────────────────────
    'Burrata': {
      name: 'Burrata',
      pricePerG: r(65 / 125),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Gravlax maison': {
      name: 'Gravlax maison',
      pricePerG: r(120 / 200),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Poulpe grillé': {
      name: 'Poulpe grillé',
      pricePerG: r(90 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Riz noir Vénéré': {
      name: 'Riz noir Vénéré',
      pricePerG: r(55 / 500),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Freekeh': {
      name: 'Freekeh',
      pricePerG: r(35 / 500),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Sarrasin grillé': {
      name: 'Sarrasin grillé',
      pricePerG: r(30 / 500),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Mâche': {
      name: 'Mâche',
      pricePerG: r(25 / 100),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Asperges blanches': {
      name: 'Asperges blanches',
      pricePerG: r(60 / 500),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Fenouil effiloché': {
      name: 'Fenouil effiloché',
      pricePerG: r(15 / 500),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Radis Watermelon': {
      name: 'Radis Watermelon',
      pricePerG: r(40 / 200),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Micro-pousses': {
      name: 'Micro-pousses',
      pricePerG: r(80 / 100),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Fleurs comestibles': {
      name: 'Fleurs comestibles',
      pricePerG: r(150 / 20),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Huile de truffe blanche': {
      name: 'Huile de truffe blanche',
      pricePerMl: r(280 / 100),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Pignons de pin grillés': {
      name: 'Pignons de pin grillés',
      pricePerG: r(120 / 100),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Noisettes concassées': {
      name: 'Noisettes concassées',
      pricePerG: r(60 / 200),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Sauce miso': {
      name: 'Sauce miso',
      pricePerG: r(45 / 250),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Green Goddess': {
      name: 'Green Goddess',
      pricePerG: r(35 / 200),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Yuzu kosho': {
      name: 'Yuzu kosho',
      pricePerG: r(90 / 70),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Chermoula': {
      name: 'Chermoula',
      pricePerG: r(20 / 100),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Gribiche express': {
      name: 'Gribiche express',
      pricePerG: r(40 / 100),
      source: 'estimation',
      updatedAt: '2026-03'
    },

    // ── Viandes & Poissons marocains (souk / poissonnerie) ────────────────────
    'Sardines fraîches': {
      name: 'Sardines fraîches',
      pricePerG: r(12 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Kefta de bœuf': {
      name: 'Kefta de bœuf',
      pricePerG: r(100 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Merguez': {
      name: 'Merguez',
      pricePerG: r(80 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Côtelettes d\'agneau': {
      name: 'Côtelettes d\'agneau',
      pricePerG: r(150 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Poulet entier fermier': {
      name: 'Poulet entier fermier',
      pricePerG: r(35 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Dinde entière': {
      name: 'Dinde entière',
      pricePerG: r(55 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Filet de dorade': {
      name: 'Filet de dorade',
      pricePerG: r(90 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Calamars frais': {
      name: 'Calamars frais',
      pricePerG: r(80 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Anchois frais': {
      name: 'Anchois frais',
      pricePerG: r(20 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Steak de veau': {
      name: 'Steak de veau',
      pricePerG: r(180 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },

    // ── Produits laitiers marocains ───────────────────────────────────────────
    'Lben': {
      name: 'Lben',
      pricePerMl: r(8 / 500),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Fromage Kiri': {
      name: 'Fromage Kiri',
      pricePerG: r(35 / 120),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Fromage Vache qui rit': {
      name: 'Fromage Vache qui rit',
      pricePerG: r(30 / 120),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Smen': {
      name: 'Smen',
      pricePerG: r(120 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Jben': {
      name: 'Jben',
      pricePerG: r(20 / 250),
      source: 'souk',
      updatedAt: '2026-03'
    },

    // ── Légumes frais (souk marocain) — entrées manquantes ───────────────────
    'Navet': {
      name: 'Navet',
      pricePerG: r(4 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Chou blanc': {
      name: 'Chou blanc',
      pricePerG: r(5 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Betterave fraîche': {
      name: 'Betterave fraîche',
      pricePerG: r(5 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Fèves fraîches': {
      name: 'Fèves fraîches',
      pricePerG: r(8 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Petits pois frais': {
      name: 'Petits pois frais',
      pricePerG: r(12 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Piment vert frais': {
      name: 'Piment vert frais',
      pricePerG: r(5 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Artichaut': {
      name: 'Artichaut',
      pricePerG: r(15 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Fenouil': {
      name: 'Fenouil',
      pricePerG: r(10 / 500),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Blette': {
      name: 'Blette',
      pricePerG: r(6 / 400),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Cresson': {
      name: 'Cresson',
      pricePerG: r(5 / 150),
      source: 'souk',
      updatedAt: '2026-03'
    },

    // ── Fruits frais (souk marocain) — entrées manquantes ────────────────────
    'Orange': {
      name: 'Orange',
      pricePerG: r(8 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Citron jaune': {
      name: 'Citron jaune',
      pricePerG: r(10 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Grenade': {
      name: 'Grenade',
      pricePerG: r(15 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Figue fraîche': {
      name: 'Figue fraîche',
      pricePerG: r(20 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Pastèque fraîche': {
      name: 'Pastèque fraîche',
      pricePerG: r(5 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Melon': {
      name: 'Melon',
      pricePerG: r(8 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Pêche fraîche': {
      name: 'Pêche fraîche',
      pricePerG: r(15 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Abricot': {
      name: 'Abricot',
      pricePerG: r(15 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Fraises fraîches': {
      name: 'Fraises fraîches',
      pricePerG: r(25 / 500),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Datte Medjool': {
      name: 'Datte Medjool',
      pricePerG: r(80 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },

    // ── Épicerie sèche marocaine ──────────────────────────────────────────────
    'Citrons confits': {
      name: 'Citrons confits',
      pricePerG: r(25 / 300),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Olives vertes marinées': {
      name: 'Olives vertes marinées',
      pricePerG: r(20 / 200),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Olives noires beldi': {
      name: 'Olives noires beldi',
      pricePerG: r(25 / 200),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Harissa': {
      name: 'Harissa',
      pricePerG: r(15 / 80),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Concentré de tomate': {
      name: 'Concentré de tomate',
      pricePerG: r(6 / 70),
      source: 'bim',
      updatedAt: '2026-03'
    },
    'Rfissa (trid séché)': {
      name: 'Rfissa (trid séché)',
      pricePerG: r(15 / 250),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Pâte de sésame (tahini)': {
      name: 'Pâte de sésame (tahini)',
      pricePerG: r(45 / 400),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Amlou': {
      name: 'Amlou',
      pricePerG: r(120 / 250),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Huile d\'argan': {
      name: 'Huile d\'argan',
      pricePerMl: r(250 / 250),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Safran marocain': {
      name: 'Safran marocain',
      pricePerG: r(30 / 0.5),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Gingembre en poudre': {
      name: 'Gingembre en poudre',
      pricePerG: r(8 / 50),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Cumin en poudre': {
      name: 'Cumin en poudre',
      pricePerG: r(5 / 50),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Paprika doux marocain': {
      name: 'Paprika doux marocain',
      pricePerG: r(5 / 50),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Cannelle en poudre': {
      name: 'Cannelle en poudre',
      pricePerG: r(6 / 50),
      source: 'souk',
      updatedAt: '2026-03'
    },

    // ── Légumineuses & Céréales marocaines ────────────────────────────────────
    'Pois cassés': {
      name: 'Pois cassés',
      pricePerG: r(15 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Haricots blancs secs': {
      name: 'Haricots blancs secs',
      pricePerG: r(18 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Fèves sèches': {
      name: 'Fèves sèches',
      pricePerG: r(15 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Semoule fine': {
      name: 'Semoule fine',
      pricePerG: r(10 / 1000),
      source: 'bim',
      updatedAt: '2026-03'
    },
    'Semoule moyenne': {
      name: 'Semoule moyenne',
      pricePerG: r(10 / 1000),
      source: 'bim',
      updatedAt: '2026-03'
    },
    'Semoule grosse': {
      name: 'Semoule grosse',
      pricePerG: r(10 / 1000),
      source: 'bim',
      updatedAt: '2026-03'
    },
    'Orge perlé': {
      name: 'Orge perlé',
      pricePerG: r(12 / 1000),
      source: 'souk',
      updatedAt: '2026-03'
    },
    'Farine blanche T55': {
      name: 'Farine blanche T55',
      pricePerG: r(8 / 1000),
      source: 'bim',
      updatedAt: '2026-03'
    },
    'Farine complète T110': {
      name: 'Farine complète T110',
      pricePerG: r(12 / 1000),
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Cuisine italienne (produits courants au Maroc) ─────────────────────────
    'Pâtes spaghetti': {
      name: 'Pâtes spaghetti',
      pricePerG: r(12 / 500),
      source: 'bim',
      updatedAt: '2026-03'
    },
    'Pâtes tagliatelles': {
      name: 'Pâtes tagliatelles',
      pricePerG: r(18 / 250),
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Tomates pelées en boîte': {
      name: 'Tomates pelées en boîte',
      pricePerG: r(12 / 400),
      source: 'bim',
      updatedAt: '2026-03'
    },
    'Pesto basilic': {
      name: 'Pesto basilic',
      pricePerG: r(45 / 190),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Ricotta': {
      name: 'Ricotta',
      pricePerG: r(55 / 250),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Mozzarella fraîche (125g)': {
      name: 'Mozzarella fraîche (125g)',
      pricePerG: r(50 / 125),
      source: 'carrefour',
      updatedAt: '2026-03'
    },

    // ── Suppléments & nutrition sportive ──────────────────────────────────────
    'Créatine monohydrate': {
      name: 'Créatine monohydrate',
      pricePerG: r(180 / 300),
      source: 'estimation',
      updatedAt: '2026-03'
    },

    // ── Whey & Suppléments ─────────────────────────────────────────────────────
    'Whey fraise': {
      name: 'Whey fraise',
      pricePerG: r(220 / 1000),   // ~220 DH/kg whey premium Maroc
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey noisette': {
      name: 'Whey noisette',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey cacahuète': {
      name: 'Whey cacahuète',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey café': {
      name: 'Whey café',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey nature': {
      name: 'Whey nature',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey framboise': {
      name: 'Whey framboise',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey caramel salé': {
      name: 'Whey caramel salé',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey cookies': {
      name: 'Whey cookies',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey tiramisu': {
      name: 'Whey tiramisu',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey orange': {
      name: 'Whey orange',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey birthday cake': {
      name: 'Whey birthday cake',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey cannelle': {
      name: 'Whey cannelle',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey cheesecake citron': {
      name: 'Whey cheesecake citron',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey toffee': {
      name: 'Whey toffee',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey chocolat blanc': {
      name: 'Whey chocolat blanc',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey piña colada': {
      name: 'Whey piña colada',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey vanille cannelle': {
      name: 'Whey vanille cannelle',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey spéculoos': {
      name: 'Whey spéculoos',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey cappuccino': {
      name: 'Whey cappuccino',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    "Whey pain d'épices": {
      name: "Whey pain d'épices",
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey pistache': {
      name: 'Whey pistache',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey myrtille': {
      name: 'Whey myrtille',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey coco': {
      name: 'Whey coco',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey citron': {
      name: 'Whey citron',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey banane': {
      name: 'Whey banane',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Whey matcha': {
      name: 'Whey matcha',
      pricePerG: r(220 / 1000),
      source: 'estimation',
      updatedAt: '2026-03'
    },

    // ── Boissons & Liquides spéciaux ──────────────────────────────────────────
    'Eau de coco': {
      name: 'Eau de coco',
      pricePerMl: r(18 / 330),    // ~18 DH brique 330ml Carrefour
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Eau pétillante': {
      name: 'Eau pétillante',
      pricePerMl: r(4 / 500),     // ~4 DH bouteille 500ml
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Café expresso': {
      name: 'Café expresso',
      pricePerMl: r(0.015),       // ~3 DH / 200ml café préparé
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Cold brew concentré': {
      name: 'Cold brew concentré',
      pricePerMl: r(0.06),        // ~0.06 DH/ml (concentré ≈ 3x espresso)
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Jus de citron frais': {
      name: 'Jus de citron frais',
      pricePerMl: r(6 / 100),     // ~6 DH/100ml jus frais pressé
      source: 'estimation',
      updatedAt: '2026-03'
    },

    // ── Fruits spéciaux & Congelés ────────────────────────────────────────────
    'Fraises congelées': {
      name: 'Fraises congelées',
      pricePerG: r(25 / 500),     // ~25 DH sachet 500g surgelées Carrefour
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Myrtilles congelées': {
      name: 'Myrtilles congelées',
      pricePerG: r(35 / 500),     // ~35 DH sachet 500g surgelées
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Pomme verte': {
      name: 'Pomme verte',
      pricePerG: r(12 / 1000),    // ~12 DH/kg Maroc
      source: 'marjane',
      updatedAt: '2026-03'
    },

    // ── Condiments & Aromatiques spéciaux ────────────────────────────────────
    'Matcha grade cérémonial': {
      name: 'Matcha grade cérémonial',
      pricePerG: r(150 / 50),     // ~150 DH boîte 50g matcha cérémonie
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Matcha cérémonie': {
      name: 'Matcha cérémonie',
      pricePerG: r(150 / 50),
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Miel de manuka': {
      name: 'Miel de manuka',
      pricePerG: r(350 / 250),    // ~350 DH pot 250g (premium)
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Miel de lavande': {
      name: 'Miel de lavande',
      pricePerG: r(80 / 500),     // ~80 DH pot 500g
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Gingembre râpé': {
      name: 'Gingembre râpé',
      pricePerG: r(8 / 100),      // ~8 DH/100g frais
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Flocons de coco': {
      name: 'Flocons de coco',
      pricePerG: r(20 / 200),     // ~20 DH sachet 200g
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Purée de noisette complète': {
      name: 'Purée de noisette complète',
      pricePerG: r(60 / 250),     // ~60 DH pot 250g
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Extrait vanille': {
      name: 'Extrait vanille',
      pricePerMl: r(25 / 30),     // ~25 DH flacon 30ml
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Ricotta légère': {
      name: 'Ricotta légère',
      pricePerG: r(18 / 250),     // ~18 DH barquette 250g
      source: 'carrefour',
      updatedAt: '2026-03'
    },
    'Poivre noir': {
      name: 'Poivre noir',
      pricePerG: r(15 / 50),      // ~15 DH flacon 50g
      source: 'marjane',
      updatedAt: '2026-03'
    },
    'Glaçons': {
      name: 'Glaçons',
      pricePerG: r(0.001),        // quasi gratuit (eau du robinet congelée)
      source: 'estimation',
      updatedAt: '2026-03'
    },
    'Citron zeste+jus': {
      name: 'Citron zeste+jus',
      pricePerPce: r(1.5),        // ~1.5 DH/citron
      source: 'marjane',
      updatedAt: '2026-03'
    },
  };

  /**
   * Retourne le prix unitaire d'un ingrédient selon l'unité demandée.
   *
   * @param {string} ingredientName  - Nom exact de l'ingrédient (doit correspondre à PRICES_DB)
   * @param {string} unit            - Unité : 'g' | 'ml' | 'pce'
   * @returns {number|null}          - Prix en MAD pour 1 unité, ou null si introuvable
   */
  // Aliases pour normaliser les variantes de noms d'ingrédients
  var PRICE_ALIASES = {
    'Whey protéine vanille': 'Protéines de lactosérum (whey)',
    'Whey protéine chocolat': 'Protéines de lactosérum (whey)',
    'Whey protéine neutre': 'Protéines de lactosérum (whey)',
    'Whey vanille': 'Protéines de lactosérum (whey)',
    'Whey chocolat': 'Protéines de lactosérum (whey)',
    'Whey neutre': 'Protéines de lactosérum (whey)',
    'Protéine de pois neutre (ou whey neutre)': 'Protéines de lactosérum (whey)',
    'Skyr nature': 'Skyr / Yaourt islandais',
    'Blancs d\'\u0153ufs': 'Blanc d\'\u0153uf',
    'Blanc d\'\u0153ufs': 'Blanc d\'\u0153uf',
    '\u0152ufs entiers': '\u0152uf',
    '\u0152ufs': '\u0152uf',
    'Cacao en poudre non sucré': 'Cacao non sucré',
    'Cacao pur non sucré': 'Cacao non sucré',
    'Dattes Medjool (dénoyautées)': 'Dattes Medjool dénoyautées',
    'Dattes Medjool (caramel)': 'Dattes Medjool dénoyautées',
    'Dattes dénoyautées': 'Dattes Medjool dénoyautées',
    'Myrtilles fraîches': 'Myrtilles',
    'Myrtilles fraîches ou surgelées': 'Myrtilles',
    'Myrtilles surgelées': 'Myrtilles (surgelées)',
    'Huile de coco fondue': 'Huile de coco',
    'Noix de cajou crues': 'Noix de cajou',
    'Noix de cajou concassées': 'Noix de cajou',
    'Noix de cajou entières': 'Noix de cajou',
    'Extrait de vanille': 'Vanille',
    'Pépites de chocolat noir 70%': 'Pépites de chocolat noir',
    'Maïzena': 'Fécule de maïs',
    'Lait de coco léger': 'Lait de coco',
    'Lait de coco light': 'Lait de coco',
    'Lait de coco (caramel)': 'Lait de coco',
    'Mangue congelée': 'Mangue surgelée',
    'Mangue en morceaux surgelée': 'Mangue surgelée',
    'Framboises': 'framboises',
    'Patate douce (cuite, en purée)': 'Patate douce',
    'Beurre de cacahuète naturel': 'Beurre de cacahuète',
    'Beurre de cacahuète (caramel)': 'Beurre de cacahuète',
    'Flocons d\'avoine (base biscuit)': 'Flocons d\'avoine',
    'Bananes bien mûres': 'Banane',
    'Banane mûre': 'Banane',
    'Bananes (congelées pour glace)': 'Banane',
    'Banane congelée': 'Banane',
    'Pommes Golden': 'Pomme',
    'Pommes (pelées, en fines tranches)': 'Pomme',
    // ─── SALAD_DB ALIASES ───────────────────────────────────────────────
    // Bases
    'Patate douce rôtie': 'Patate douce',
    'Pâtes complètes': 'Pâtes complètes (fusilli)',
    // Protéines
    'Feta AOP': 'Feta',
    'Mozzarella di bufala': 'Mozzarella',
    'Steak de thon snacké': 'Thon frais (pavé)',
    'Bœuf haché 5%': 'Bœuf haché maigre (5%)',
    'Œuf mollet': 'Œuf',
    // Légumes
    'Épinards baby': 'Épinards frais',
    'Carottes râpées': 'Carottes',
    'Maïs doux': 'Maïs',
    'Avocat tranché': 'Avocat',
    'Tomates Heirloom': 'Tomate',
    'Betterave rôtie': 'Betterave (cuite)',
    // Lipides
    'Huile d\'olive extra-vierge': 'Huile d\'olive',
    'Olives Taggiàsche': 'Olives noires',
    'Tahini de sésame blanc': 'Tahini',
    'Noix de Grenoble': 'Noix (cerneaux)',
    'Graines de sésame torréfiées': 'Graines de sésame',
    'Parmesan 24 mois': 'Parmesan',
    // Sauces
    'Sauce tahini citronnée': 'Tahini',
    'Pesto Génois': 'Pesto',
    'Sauce yaourt menthe': 'Yaourt nature 0%',
    'Sauce soja réduite': 'Sauce soja',
    'Vinaigrette au miso': 'Sauce miso',
    'Caesar légère': 'Vinaigrette légère',
    'Crevettes tigre': 'Crevettes décortiquées',
    // ── Alias Whey multi-parfums → base whey ──────────────────────────────────
    'Whey nature ou vanille': 'Whey nature',
    'Whey nature ou citron': 'Whey nature',
    'Whey noisette ou chocolat': 'Whey noisette',
    'Whey café ou noisette': 'Whey café',
    'Whey citron ou vanille': 'Whey nature',
    'Whey citron ou nature': 'Whey nature',
    'Whey coco ou vanille': 'Whey nature',
    'Whey myrtille ou vanille': 'Whey nature',
    'Whey fraise ou vanille': 'Whey fraise',
    'Whey banane ou vanille': 'Whey nature',
    'Whey vanille ou fraise': 'Whey fraise',
    // Alias ingrédients smoothie
    'Café expresso froid': 'Café expresso',
    'Café fort': 'Café expresso',
    'Pâte de noisette': 'Purée de noisette complète',
    'Pâte de noisette pure': 'Purée de noisette complète',
    'Vanille extrait': 'Extrait vanille',
    'Jus d\'orange frais': 'Jus de citron frais',
    'Matcha': 'Matcha grade cérémonial',
    'Gingembre frais': 'Gingembre râpé',
    'Gingembre': 'Gingembre râpé',
    'Lait': 'Lait entier',
    'Stevia': 'Miel',
    'Eau': 'Eau pétillante',
    'Curcuma': 'Cannelle moulue',
    'Cannelle': 'Cannelle moulue',
    'Granola': 'Flocons d\'avoine',
    'Graines de chia': 'Graines de lin',
    'Amandes effilées': 'Amandes',
    'Fraises': 'Fraises congelées',
    'Myrtilles': 'Myrtilles (surgelées)',
    'Ananas': 'Ananas (boîte)',
    'Citron': 'Citron zeste+jus',
    'Lait écrémé': 'Lait demi-écrémé',
    'Yaourt grec 0%': 'Yaourt grec nature',
    'Fromage blanc 0%': 'Fromage blanc nature',
    'Datte Medjool': 'Dattes Medjool dénoyautées',
    'Menthe': 'Menthe fraîche',
    // Aliases parfums whey nouveaux
    'Whey framboise': 'Whey framboise',
    'Whey caramel salé': 'Whey caramel salé',
    'Whey cookies': 'Whey cookies',
    'Whey tiramisu': 'Whey tiramisu',
    'Whey orange': 'Whey orange',
    'Whey birthday cake': 'Whey birthday cake',
    'Whey cannelle': 'Whey cannelle',
    'Whey cheesecake citron': 'Whey cheesecake citron',
    'Whey toffee': 'Whey toffee',
    'Whey chocolat blanc': 'Whey chocolat blanc',
    'Whey piña colada': 'Whey piña colada',
    'Whey vanille cannelle': 'Whey vanille cannelle',
    'Whey spéculoos': 'Whey spéculoos',
    'Whey cappuccino': 'Whey cappuccino',
    "Whey pain d'épices": "Whey pain d'épices",
    'Whey pistache': 'Whey pistache',
    'Whey matcha': 'Whey matcha',
    'Whey banane': 'Whey banane',
    'Whey citron': 'Whey citron',
    'Whey coco': 'Whey coco',
    'Whey myrtille': 'Whey myrtille',
    // Ingredients smoothie nouveaux
    'Fruits rouges surgelés': 'Fruits rouges surgelés',
    'Lait demi-écrémé': 'Lait demi-écrémé',
    'Café expresso froid': 'Café expresso',
    'Jus de citron': 'Jus de citron',
    'Cannelle': 'Cannelle moulue',
    'Pincée de sel': 'Sel',
  };

  function getPricePer(ingredientName, unit) {
    // Résoudre l'alias si besoin
    var resolvedName = PRICE_ALIASES[ingredientName] || ingredientName;
    var entry = PRICES_DB[resolvedName];
    if (!entry) {
      console.warn('[prices-db] Ingrédient inconnu : "' + ingredientName + '"');
      return null;
    }

    switch (unit) {
      case 'g':
        if (entry.pricePerG !== undefined) return entry.pricePerG;
        console.warn('[prices-db] pricePerG non disponible pour "' + ingredientName + '"');
        return null;

      case 'ml':
        if (entry.pricePerMl !== undefined) return entry.pricePerMl;
        // Fallback : si l'ingrédient a pricePerG et que densité ≈ 1 (eau, sauces à base d'eau)
        if (entry.pricePerG !== undefined) return entry.pricePerG;
        console.warn('[prices-db] pricePerMl non disponible pour "' + ingredientName + '"');
        return null;

      case 'pce':
        if (entry.pricePerPce !== undefined) return entry.pricePerPce;
        console.warn('[prices-db] pricePerPce non disponible pour "' + ingredientName + '"');
        return null;

      default:
        console.warn('[prices-db] Unité inconnue "' + unit + '" pour "' + ingredientName + '"');
        return null;
    }
  }

  // ── Exposition globale ─────────────────────────────────────────────────────
  window.PRICES_DB = PRICES_DB;
  window.getPricePer = getPricePer;
})();
