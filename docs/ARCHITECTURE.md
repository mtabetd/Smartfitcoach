# SmartFitCoach — Architecture & System Contracts

> Version 1.0.0 — Source de vérité : `app/sfc-contracts.js`

---

## 1. Vue d'ensemble

SmartFitCoach est une **PWA vanilla JavaScript** (sans framework) qui orchestre deux domaines métier :
- **Nutrition** : calcul BMR/TDEE/macros, carb cycling, recettes
- **Sport** : génération de séances, périodisation, charge d'entraînement

Ces domaines communiquent via un **bus bidirectionnel** géré par `SFCSymbiosis` et `SFCDecisionCore`.

---

## 2. Modules principaux

```
┌─────────────────────────────────────────────────────────────────┐
│                        window (global state)                    │
│  S: {goal, sex, weight, trainingLoad, lastSessionGroups, ...}  │
└─────────────────────────────────────────────────────────────────┘
           │                              │
    ┌──────▼──────┐              ┌────────▼────────┐
    │  NUTRITION  │              │     SPORT       │
    │             │              │                 │
    │ nutrition-  │◄────────────►│  sfc-symbiosis  │
    │ master.js   │   XM-01/05   │  .js            │
    │             │              │                 │
    │ NutritionMaster.compute()  │  LOAD_MULTIPLIERS│
    │ (fonctions pures, ±état)   │  PERIODIZATION_CFG│
    └──────┬──────┘              └────────┬────────┘
           │                              │
           └──────────┬───────────────────┘
                      │
             ┌────────▼────────┐
             │ sfc-decision-   │
             │ core.js         │
             │                 │
             │ SFCDecisionCore │
             │ (orchestre les  │
             │  signaux bidi)  │
             └────────┬────────┘
                      │
           ┌──────────┴──────────┐
           │                     │
    ┌──────▼──────┐    ┌─────────▼──────┐
    │  RECETTES   │    │   SÉANCES      │
    │             │    │                │
    │ recipe-     │    │ muscu-engine   │
    │ engine.js   │    │ .js (UMD)      │
    │             │    │                │
    │ RECIPES_DB  │    │sfcBuildMuscuDay│
    │ (source     │    │(grps, cfg)     │
    │  unique)    │    │                │
    └──────┬──────┘    └────────────────┘
           │
    ┌──────▼──────┐
    │ recipe-auto-│
    │ improver.js │
    │ runDryRun() │
    │ non-dest.   │
    └─────────────┘
```

---

## 3. Contrats inter-modules (Cross-Module Contracts)

Définis dans `SFCContracts.CROSS_MODULE`. Ces 8 contrats sont les plus dangereux à briser.

| ID | Nom | Risque | Modules |
|----|-----|--------|---------|
| XM-01 | Carb cycling calorie-neutre | HIGH | NutritionMaster |
| XM-02 | LOAD_MULTIPLIERS cohérence | HIGH | SFCSymbiosis ↔ SFCDecisionCore |
| XM-03 | Dry-run non-destructif | **CRITICAL** | RecipeAutoImprover ↔ RecipeEngine |
| XM-04 | Récupération 48h | MEDIUM | SFCDecisionCore → sfcBuildMuscuDay |
| XM-05 | Deficit → volume réduit | HIGH | NutritionMaster → SFCSymbiosis → sfcBuildMuscuDay |
| XM-06 | NutritionMaster déterministe | MEDIUM | NutritionMaster |
| XM-07 | REVIEW_REQUIRED isolation | **CRITICAL** | RecipeAutoImprover |
| XM-08 | processCompletedSession idempotence | MEDIUM | SFCSymbiosis |

---

## 4. Flux de données — Journée type

```
1. Profil utilisateur (S.goal, S.sex, S.weight)
        │
        ▼
2. NutritionMaster.compute(inputs)
   → bmr, tdee, caloriesTarget, proteinGrams, carbsGrams, fatGrams
   → carbCyclingApplied (si trainingDay=true)
        │
        ▼
3. SFCSymbiosis.getNutritionState()
   → volumeFactor (shred→0.80, bulk→1.08, etc.)
        │
        ▼
4. SFCDecisionCore.getDecision()
   → intègre signal nutrition (calDeficit, proteinAdequacy)
   → intègre signal sport (trainingLoad, fatigueLevel)
   → retourne { recommendation, nutritionMod, trainingMod }
        │
        ├──▶ sfcBuildMuscuDay(grps, { durMax×volumeFactor, ... })
        │    → séance du jour
        │
        └──▶ NutritionMaster.compute({ trainingDay: true/false })
             → macros ajustées pour la journée
```

---

## 5. Valeurs figées (FROZEN)

Définies dans `SFCContracts.FROZEN`. **Ne jamais modifier sans version majeure.**

### Nutrition (sources : ACSM 2009, ISSN 2017/2021/2023, IOM 2005)

| Constante | Valeur | Source |
|-----------|--------|--------|
| KCAL_FLOOR_MALE | 1500 kcal | ACSM 2009 |
| KCAL_FLOOR_FEMALE | 1400 kcal | ISSN 2017 |
| CARB_MIN_GDAY | 130 g | IOM 2005 (glucose cérébral) |
| FAT_MIN_GPERKG | 0.8 g/kg | ISSN 2021 |
| CARB_CYCLING_BOOST | +20% | Holland 2019 JISSN |
| DEFICIT_MAX_KCAL | 500 kcal | ACSM 2009 / Helms 2014 |
| PROTEIN_DEFAULT_MALE | 1.8 g/kg | ISSN 2023 |
| PROTEIN_DEFAULT_FEMALE | 1.6 g/kg | ISSN 2023 |
| PROTEIN_ELITE_MALE | 2.2 g/kg | Morton 2018 BJSM |

### LOAD_MULTIPLIERS (source : Helms 2014 + ISSN 2023)

| Type | cal | carbBoost | fatAdjust |
|------|-----|-----------|-----------|
| heavy | 1.10 | 1.20 | 0.92 |
| moderate | 1.07 | 1.10 | 0.96 |
| light | 1.03 | 1.00 | 1.00 |
| rest | 0.90 | 0.90 | 1.08 |

### PERIODIZATION_CFG (source : ACSM 2009 / Haff & Triplett 2015)

| Phase | durMax | durSets | restOverride | Note |
|-------|--------|---------|--------------|------|
| S1 (semaine 1) | 6 | 4 | — | Volume base |
| S2 (semaine 2) | 6 | 5 | — | Volume ↑ |
| S3 (semaine 3) | 5 | 5 | 120-180s | Intensité ↑ |
| S4 (semaine 4) | 4 | 3 | 60s | Deload actif |

---

## 6. Invariants runtime

Définis dans `app/sfc-invariants.js`. Activés en mode `throw` (tests) et `warn` (prod).

### Nutrition (NUT-01 à NUT-07)
- **NUT-01** : `caloriesTarget >= KCAL_FLOOR` (1400F / 1500M)
- **NUT-02** : `proteinGrams >= 1.6 g/kg` pour muscle/cut/shred
- **NUT-03** : `fatGrams >= 15% kcal totaux`
- **NUT-04** : `carbsGrams >= 130g` (plancher IOM 2005)
- **NUT-05** : `caloriesCheck ≈ P×4 + G×4 + L×9` (±5%)
- **NUT-06** : `trainingDay=true → carbCyclingApplied=true`
- **NUT-07** : `ON day carbsGrams > OFF day carbsGrams` (même profil)

### Sport (SPT-01 à SPT-03)
- **SPT-01** : Pas de double deload (S4 → S4 interdit)
- **SPT-02** : Minimum d'exercices par séance
- **SPT-03** : Aucun exercice interdit en grossesse T3

---

## 7. Carte d'impact (Dependency Map)

> "Si je modifie X, quels modules peuvent casser ?"

```
sfc-constants.js  [CRITICAL]
    └── nutrition-master.js  → app-nutrition.js, app-core.js, today-dashboard.js
    └── sfc-invariants.js    → nutrition-master.js, app-core.js

app-core.js  [CRITICAL — window.S]
    └── TOUS les modules app-*.js

sfc-symbiosis.js  [HIGH]
    └── app-sport.js
    └── custom-session.js
    └── sfc-decision-core.js

sfc-decision-core.js  [HIGH]
    └── app-sport.js
    └── today-dashboard.js
    └── custom-session.js

muscu-engine.js  [MEDIUM]
    └── app-sport.js
    └── custom-session.js

recipe-engine.js  [HIGH]
    └── recipe-auto-improver.js
    └── recipe-ux-engine.js
    └── recipe-qa.js
```

---

## 8. Patterns interdits (Anti-patterns)

| ID | Pattern | Raison |
|----|---------|--------|
| FP-01 | Muter `RECIPES_DB` directement | Données corrompues pour tous |
| FP-02 | `REVIEW_REQUIRED` dans `proposal.applied[]` | Modification non-validée |
| FP-03 | Hard-coder `LOAD_MULTIPLIERS` hors `sfc-symbiosis.js` | Divergence silencieuse |
| FP-04 | Modifier la signature de `compute()` | Casse tous les appelants |
| FP-05 | Assouplir un invariant dans `sfc-invariants.js` | Violations silencieuses |
| FP-06 | Baisser `KCAL_FLOOR` sous 1400F/1500M | Risque médical (RED-S) |
| FP-07 | Changer `CARB_MIN_GDAY` sous 130g | Déficit glucose cérébral |
| FP-08 | `processCompletedSession` sans guard idempotence | Double comptage |

---

## 9. Politique de fallback

Comportements garantis quand les données sont manquantes :

| Situation | Comportement |
|-----------|-------------|
| `NutritionMaster.compute({})` — inputs invalides | `{ errors: [...], caloriesTarget: 0 }` |
| `SFCSymbiosis.getWeekIndex()` — pas de `sportProgramStart` | Retourne `1` (semaine de base) |
| `SFCSymbiosis.getFatigueScore()` — pas de `S` | `{ level: "fresh", cycleFactor: 1.0 }` |
| `SFCSymbiosis.getNutritionState()` — `S.goal` null | `{ state: "neutral", volumeFactor: 1.0 }` |
| `SFCDecisionCore.getDecision()` — pas de `S` | Décision neutre (train, moderate) |
| `sfcBuildMuscuDay(grps, { exercises: {} })` | `[]` + warning console |
| `RecipeAutoImprover.runDryRun({})` — DB vide | `{ proposals: [], summary: {...zeros} }` |

---

## 10. Pipelines QA

### Tests automatisés (`npm test`)

37 fichiers de test couvrant :

| Suite | Tests | Domaine |
|-------|-------|---------|
| `unit-calculs.js` | — | Calculs BMR/TDEE |
| `unit-sport-nutrition-symbiosis.js` | 77 | Symbiose sport×nutrition |
| `unit-training-plan-integrity.js` | 25 | Intégrité séances muscu |
| `unit-nutrition-adaptation.js` | 40 | Adaptation nutritionnelle |
| `unit-user-personalization.js` | 44 | 10 profils extrêmes |
| `unit-weekly-plan-coherence.js` | 23 | Cohérence plan hebdo |
| `unit-regression-post-merge.js` | 55 | Régression post-merge |
| `unit-system-contracts.js` | 150 | Contrats système (SFCContracts) |
| `unit-scalability.js` | 26 | Performance & scalabilité |

### Scripts QA recettes

```bash
npm run qa          # Snapshot des recettes
npm run qa:fix      # Auto-fix recettes
npm run improve     # Auto-amélioration (dry-run)
```

---

## 11. Guide d'extension

### Ajouter un invariant nutrition

1. Ouvrir `app/sfc-invariants.js`
2. Ajouter un `_assert()` dans la section NUT-XX
3. Documenter la source scientifique en commentaire
4. **Ne jamais assouplir un invariant existant** (FP-05)

### Ajouter un module sport

1. Vérifier que le module **ne hard-code pas** `LOAD_MULTIPLIERS` (FP-03)
2. Référencer `window.SFCSymbiosis.LOAD_MULTIPLIERS` directement
3. Mettre à jour `SFCContracts.DEPENDENCY_MAP` dans `app/sfc-contracts.js`
4. Ajouter des tests dans un fichier `tests/unit-<module>.js`

### Modifier `RECIPES_DB`

1. Modifier uniquement via `app/recipe-registry.js`
2. Valider avec `npm run qa`
3. **Ne jamais** push une modification qui viole XM-03 ou XM-07

### Changer une constante FROZEN

Interdit sans version majeure. Si nécessaire :
1. Créer une `v2` de la constante avec un nouveau nom
2. Migrer les appelants progressivement
3. Déprécier l'ancienne après migration complète
4. Mettre à jour `app/sfc-contracts.js` et `app/sfc-constants.js`

---

## 12. Vérification rapide de l'état du système

```bash
# Vérifier que tous les contrats tiennent
node tests/unit-system-contracts.js

# Vérifier la scalabilité
node tests/unit-scalability.js

# Suite complète (37 suites, ~700 tests)
npm test
```

---

*Ce document est généré à partir de `app/sfc-contracts.js`. En cas de divergence, le code fait foi.*
