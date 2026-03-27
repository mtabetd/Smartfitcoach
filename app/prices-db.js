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
    'Céleri': {
      name: 'Céleri',
      pricePerG: r(3 / 150),
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
    'Origan séché': {
      name: 'Origan séché',
      pricePerG: r(15 / 20),
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
    'Huile de sésame': {
      name: 'Huile de sésame',
      pricePerMl: r(45 / 250),
      source: 'carrefour',
      updatedAt: '2026-03'
    },
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
    'Ananas (boîte)': {
      name: 'Ananas (boîte)',
      pricePerG: r(14 / 560),
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
    'Origan séché': {
      name: 'Origan séché',
      pricePerG: r(8 / 15),
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
    'Oeuf dur': {
      name: 'Oeuf dur',
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
    // Lipides — alias
    'Huile d\'olive': {
      name: 'Huile d\'olive',
      pricePerG: r(70 / 750),
      pricePerMl: r(70 / 750),
      source: 'carrefour',
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
    }
  };

  /**
   * Retourne le prix unitaire d'un ingrédient selon l'unité demandée.
   *
   * @param {string} ingredientName  - Nom exact de l'ingrédient (doit correspondre à PRICES_DB)
   * @param {string} unit            - Unité : 'g' | 'ml' | 'pce'
   * @returns {number|null}          - Prix en MAD pour 1 unité, ou null si introuvable
   */
  function getPricePer(ingredientName, unit) {
    var entry = PRICES_DB[ingredientName];
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
