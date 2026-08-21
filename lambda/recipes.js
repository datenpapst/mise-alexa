// Rezept-Datenquelle für den Mise-Alexa-Skill.
//
// Für den ersten funktionierenden Stand sind hier zwei Testrezepte fest
// hinterlegt — damit beweisen wir Anzeige + Sprachsteuerung auf dem Echo Show,
// bevor wir den echten Rezept-Sync aus Mise anhängen (Schritt 2).
//
// Struktur pro Rezept:
//   id          – interner Schlüssel (klein, ohne Umlaute), matcht die Slot-ID
//   title       – Anzeigename
//   servings    – Portionen (nur Info)
//   ingredients – Liste Zutaten (Strings)
//   steps       – Liste Zubereitungsschritte (Strings), Reihenfolge = Kochreihenfolge

const RECIPES = {
  ruehrei: {
    id: "ruehrei",
    title: "Rührei",
    servings: 2,
    ingredients: ["4 Eier", "2 EL Milch", "1 Prise Salz", "Pfeffer", "1 EL Butter"],
    steps: [
      "Die Eier in eine Schüssel schlagen. Milch, Salz und Pfeffer dazugeben und alles gut verquirlen.",
      "Die Butter in einer Pfanne bei mittlerer Hitze schmelzen lassen, bis sie leicht schäumt.",
      "Die Eiermasse in die Pfanne gießen und mit einem Pfannenwender langsam von außen nach innen rühren.",
      "Sobald die Masse gestockt, aber noch cremig ist, die Pfanne vom Herd nehmen und das Rührei sofort servieren."
    ]
  },
  "nudeln-tomate": {
    id: "nudeln-tomate",
    title: "Nudeln mit Tomatensauce",
    servings: 2,
    ingredients: [
      "250 g Spaghetti",
      "1 Dose gehackte Tomaten",
      "1 Zwiebel",
      "1 Knoblauchzehe",
      "2 EL Olivenöl",
      "Salz, Pfeffer, etwas Zucker",
      "frisches Basilikum"
    ],
    steps: [
      "Einen großen Topf mit Salzwasser aufsetzen und zum Kochen bringen.",
      "Zwiebel und Knoblauch fein würfeln. Das Olivenöl in einem Topf erhitzen und beides glasig anschwitzen.",
      "Die gehackten Tomaten dazugeben, mit Salz, Pfeffer und einer Prise Zucker würzen. Bei kleiner Hitze etwa zehn Minuten köcheln lassen.",
      "Die Spaghetti ins kochende Wasser geben und nach Packungsangabe al dente kochen.",
      "Die Nudeln abgießen, mit der Tomatensauce vermengen und mit frischem Basilikum bestreut servieren."
    ]
  }
};

// Namens-Lookup: erlaubt, ein Rezept über den gesprochenen Namen zu finden,
// falls die Slot-ID-Auflösung mal nicht greift.
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
