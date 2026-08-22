// Rezept-Datenquelle fuer den Mise-Alexa-Skill.
//
// AUTOGENERIERT von tools/sync-recipes.js aus der iOS-Seed
//   (Projects/hermes/mise/Resources/seed_recipes.json).
// NICHT HAND-EDITIEREN — Rezept aendern -> in der App/Seed aendern und
//   node tools/sync-recipes.js && ask deploy
//
// Struktur pro Rezept: id, title, servings, ingredients[], steps[]

const RECIPES = {
  "ruehrei-mit-schnittlauch": {
    "id": "ruehrei-mit-schnittlauch",
    "title": "Rührei mit Schnittlauch",
    "servings": 2,
    "ingredients": [
      "4 Stk Eier",
      "20 g Butter",
      "1 Bund Schnittlauch",
      "1 Prise Salz"
    ],
    "steps": [
      "Eier in einer Schüssel verquirlen, mit Salz und Pfeffer würzen.",
      "Butter in einer Pfanne bei mittlerer Hitze schmelzen.",
      "Eimasse hineingeben und unter Rühren stocken lassen, ca. 2 Minuten.",
      "Mit gehacktem Schnittlauch bestreün und sofort servieren."
    ]
  },
  "spaghetti-bolognese": {
    "id": "spaghetti-bolognese",
    "title": "Spaghetti Bolognese",
    "servings": 4,
    "ingredients": [
      "400 g Spaghetti",
      "500 g Hackfleisch",
      "800 g Tomaten",
      "2 Stk Zwiebeln",
      "2 Zehen Knoblauch",
      "2 EL Olivenöl"
    ],
    "steps": [
      "Zwiebeln und Knoblauch fein hacken und in Olivenöl glasig dünsten.",
      "Hackfleisch dazugeben und krümelig anbraten.",
      "Tomaten zugeben, mit Salz und Pfeffer würzen, 30 Minuten köcheln lassen.",
      "Spaghetti in Salzwasser al dente kochen, abgiessen.",
      "Nudeln mit der Sauce anrichten und servieren."
    ]
  },
  "tomatensuppe": {
    "id": "tomatensuppe",
    "title": "Tomatensuppe",
    "servings": 4,
    "ingredients": [
      "800 g Tomaten",
      "1 Stk Zwiebeln",
      "500 ml Gemüsebrühe",
      "100 ml Sahne"
    ],
    "steps": [
      "Zwiebel hacken und in etwas Öl andünsten.",
      "Tomaten und Brühe zugeben und 20 Minuten köcheln lassen.",
      "Mit dem Stabmixer fein pürieren.",
      "Sahne unterrühren, abschmecken und servieren."
    ]
  },
  "pfannkuchen": {
    "id": "pfannkuchen",
    "title": "Pfannkuchen",
    "servings": 3,
    "ingredients": [
      "250 g Mehl",
      "500 ml Milch",
      "3 Stk Eier",
      "1 Prise Salz"
    ],
    "steps": [
      "Mehl, Milch, Eier und Salz zu einem glatten Teig verrühren.",
      "Teig 15 Minuten ruhen lassen.",
      "Etwas Fett in einer Pfanne erhitzen und dünne Pfannkuchen ausbacken.",
      "Nach Wunsch süss oder herzhaft füllen."
    ]
  },
  "gemuesepfanne-mit-reis": {
    "id": "gemuesepfanne-mit-reis",
    "title": "Gemüsepfanne mit Reis",
    "servings": 3,
    "ingredients": [
      "250 g Reis",
      "2 Stk Paprika",
      "1 Stk Zucchini",
      "2 Stk Möhren",
      "3 EL Sojasauce"
    ],
    "steps": [
      "Reis nach Packungsanweisung kochen.",
      "Gemüse in mundgerechte Stücke schneiden.",
      "In einer Pfanne mit etwas Öl 8-10 Minuten braten.",
      "Mit Sojasauce abschmecken und mit dem Reis servieren."
    ]
  },
  "linseneintopf": {
    "id": "linseneintopf",
    "title": "Linseneintopf",
    "servings": 4,
    "ingredients": [
      "300 g Linsen",
      "3 Stk Möhren",
      "400 g Kartoffeln",
      "1 Stk Zwiebeln",
      "1 l Gemüsebrühe"
    ],
    "steps": [
      "Zwiebel, Möhren und Kartoffeln würfeln.",
      "Zwiebel in etwas Öl andünsten, restliches Gemüse zugeben.",
      "Linsen und Brühe zugeben und 35 Minuten köcheln lassen.",
      "Mit Salz, Pfeffer und einem Schuss Essig abschmecken."
    ]
  },
  "kaesespaetzle": {
    "id": "kaesespaetzle",
    "title": "Käsespätzle",
    "servings": 3,
    "ingredients": [
      "500 g Spätzle",
      "200 g Bergkäse",
      "2 Stk Zwiebeln",
      "30 g Butter"
    ],
    "steps": [
      "Zwiebeln in Ringe schneiden und in Butter goldbraun rösten.",
      "Spätzle in Salzwasser garen und abgiessen.",
      "Spätzle und geriebenen Käse schichtweise vermengen.",
      "Mit den Röstzwiebeln bestreut servieren."
    ]
  },
  "haehnchen-mit-reis": {
    "id": "haehnchen-mit-reis",
    "title": "Hähnchen mit Reis",
    "servings": 2,
    "ingredients": [
      "300 g Hähnchenbrust",
      "180 g Reis",
      "1 Stk Paprika",
      "1 Stk Zwiebeln"
    ],
    "steps": [
      "Reis nach Packungsanweisung kochen.",
      "Hähnchen in Streifen schneiden und scharf anbraten.",
      "Zwiebel und Paprika zugeben und 5 Minuten mitbraten.",
      "Mit Salz, Pfeffer und Paprikapulver würzen, mit Reis servieren."
    ]
  },
  "bratkartoffeln-mit-spiegelei": {
    "id": "bratkartoffeln-mit-spiegelei",
    "title": "Bratkartoffeln mit Spiegelei",
    "servings": 2,
    "ingredients": [
      "600 g Kartoffeln",
      "2 Stk Eier",
      "1 Stk Zwiebeln",
      "80 g Speck"
    ],
    "steps": [
      "Gekochte Kartoffeln in Scheiben schneiden.",
      "Speck und Zwiebeln in einer Pfanne anbraten.",
      "Kartoffeln zugeben und knusprig braten.",
      "Spiegeleier separat braten und auf den Bratkartoffeln anrichten."
    ]
  },
  "nudelsalat": {
    "id": "nudelsalat",
    "title": "Nudelsalat",
    "servings": 4,
    "ingredients": [
      "400 g Nudeln",
      "1 Stk Gurke",
      "1 Stk Paprika",
      "1 Dose Mais",
      "200 g Joghurt"
    ],
    "steps": [
      "Nudeln kochen, abgiessen und abkühlen lassen.",
      "Gemüse klein schneiden.",
      "Alles mit Joghurt und etwas Senf vermengen.",
      "Mit Salz und Pfeffer abschmecken und kalt stellen."
    ]
  },
  "chili-con-carne": {
    "id": "chili-con-carne",
    "title": "Chili con Carne",
    "servings": 4,
    "ingredients": [
      "500 g Hackfleisch",
      "1 Dose Kidneybohnen",
      "1 Dose Mais",
      "800 g Tomaten",
      "2 Stk Zwiebeln"
    ],
    "steps": [
      "Zwiebeln hacken und mit dem Hackfleisch anbraten.",
      "Tomaten zugeben und 20 Minuten köcheln lassen.",
      "Bohnen und Mais unterrühren, weitere 10 Minuten garen.",
      "Mit Chili, Kreuzkümmel, Salz und Pfeffer kräftig abschmecken."
    ]
  },
  "milchreis-mit-zimt": {
    "id": "milchreis-mit-zimt",
    "title": "Milchreis mit Zimt",
    "servings": 3,
    "ingredients": [
      "250 g Milchreis",
      "1 l Milch",
      "3 EL Zucker",
      "1 TL Zimt"
    ],
    "steps": [
      "Milch mit einer Prise Salz aufkochen.",
      "Milchreis einrühren und bei kleiner Hitze 30 Minuten qüllen lassen.",
      "Dabei gelegentlich umrühren, damit nichts anbrennt.",
      "Mit Zucker und Zimt bestreut servieren."
    ]
  },
  "ofengemuese": {
    "id": "ofengemuese",
    "title": "Ofengemüse",
    "servings": 3,
    "ingredients": [
      "500 g Kartoffeln",
      "3 Stk Möhren",
      "1 Stk Zucchini",
      "3 EL Olivenöl"
    ],
    "steps": [
      "Backofen auf 200 Grad vorheizen.",
      "Gemüse in Stücke schneiden und mit Öl, Salz und Kräutern vermengen.",
      "Auf einem Blech verteilen.",
      "30 Minuten backen, bis alles goldbraun ist."
    ]
  },
  "frikadellen": {
    "id": "frikadellen",
    "title": "Frikadellen",
    "servings": 4,
    "ingredients": [
      "500 g Hackfleisch",
      "1 Stk Brötchen",
      "1 Stk Eier",
      "1 Stk Zwiebeln"
    ],
    "steps": [
      "Brötchen in Wasser einweichen und ausdrücken.",
      "Mit Hackfleisch, Ei, gehackter Zwiebel, Salz und Pfeffer verkneten.",
      "Flache Frikadellen formen.",
      "In einer Pfanne von beiden Seiten goldbraun braten."
    ]
  },
  "kartoffelsuppe": {
    "id": "kartoffelsuppe",
    "title": "Kartoffelsuppe",
    "servings": 4,
    "ingredients": [
      "700 g Kartoffeln",
      "2 Stk Möhren",
      "1 Stange Lauch",
      "1 l Gemüsebrühe"
    ],
    "steps": [
      "Gemüse schälen und in Stücke schneiden.",
      "Alles in der Brühe 25 Minuten weich kochen.",
      "Teilweise pürieren, damit die Suppe cremig wird.",
      "Mit Salz, Pfeffer und Majoran abschmecken."
    ]
  },
  "overnight-oats": {
    "id": "overnight-oats",
    "title": "Overnight Oats",
    "servings": 1,
    "ingredients": [
      "50 g Haferflocken",
      "150 ml Milch",
      "100 g Joghurt",
      "1 Stk Banane"
    ],
    "steps": [
      "Haferflocken mit Milch und Joghurt verrühren.",
      "Über Nacht im Kühlschrank qüllen lassen.",
      "Am Morgen mit geschnittener Banane toppen.",
      "Nach Wunsch mit Honig oder Nüssen verfeinern."
    ]
  }
};

function findRecipe(slotValue, resolvedId) {
  if (resolvedId && RECIPES[resolvedId]) return RECIPES[resolvedId];
  if (!slotValue) return null;
  const needle = slotValue.toLowerCase().trim();
  return (
    Object.values(RECIPES).find(
      (r) => r.title.toLowerCase() === needle || r.id === needle
    ) ||
    Object.values(RECIPES).find((r) => r.title.toLowerCase().includes(needle)) ||
    null
  );
}

function listTitles() {
  return Object.values(RECIPES).map((r) => r.title);
}

module.exports = { RECIPES, findRecipe, listTitles };
