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
