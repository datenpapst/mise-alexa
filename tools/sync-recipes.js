#!/usr/bin/env node
/*
 * sync-recipes.js — Mise iOS Seed -> Alexa-Skill Rezept-Sync
 *
 * Liest die kanonische Rezeptquelle der iOS-App
 *   (~/Projects/hermes/mise/Resources/seed_recipes.json)
 * und generiert daraus:
 *   1. lambda/recipes.js                 (RECIPES-Objekt fuer die Lambda)
 *   2. interaction-model/de-DE.json      (MiseRecipe-Slot-Werte)
 *
 * Damit ist ein Rezept-Update ein Ein-Befehl-Vorgang:
 *   node tools/sync-recipes.js && ask deploy
 *
 * Der Seed-Pfad kann per Argument oder ENV MISE_SEED ueberschrieben werden.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const SEED =
  process.argv[2] ||
  process.env.MISE_SEED ||
  path.join(os.homedir(), "Projects/hermes/mise/Resources/seed_recipes.json");

const ROOT = path.join(__dirname, "..");
const OUT_RECIPES = path.join(ROOT, "lambda/recipes.js");
const OUT_MODEL = path.join(ROOT, "interaction-model/de-DE.json");

// ASCII-Transliteration der iOS-Seed zurueck zu echten Umlauten fuer
// Anzeige + Sprachslots. Domain = deutsche Alltagsrezepte; bei neuen Zutaten
// generierte recipes.js kurz gegenlesen.
function umlaut(s) {
  return s
    .replace(/ae/g, "ä")
    .replace(/oe/g, "ö")
    .replace(/ue/g, "ü")
    .replace(/Ae/g, "Ä")
    .replace(/Oe/g, "Ö")
    .replace(/Ue/g, "Ü")
    .replace(/ß/g, "ß");
}

// Stabile Slot-/Objekt-ID: ASCII, klein, ohne Umlaute.
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fmtQty(q) {
  if (q === null || q === undefined || q === "") return "";
  if (typeof q === "number") {
    return Number.isInteger(q) ? String(q) : String(q).replace(".", ",");
  }
  return String(q);
}

function ingredientLine(ing) {
  const qty = fmtQty(ing.quantity);
  const unit = (ing.unit || "").trim();
  const name = umlaut((ing.name || "").trim());
  return [qty, unit, name].filter(Boolean).join(" ");
}

const seed = JSON.parse(fs.readFileSync(SEED, "utf8"));
if (!Array.isArray(seed)) {
  throw new Error("Seed hat unerwartetes Format (erwartet Array).");
}

const recipes = {};
const slotValues = [];
const seenIds = new Set();

for (const r of seed) {
  const title = umlaut(r.name.trim());
  let id = slugify(r.name);
  while (seenIds.has(id)) id += "-2";
  seenIds.add(id);

  recipes[id] = {
    id,
    title,
    servings: r.servings ?? null,
    ingredients: (r.ingredients || []).map(ingredientLine),
    steps: (r.steps || []).map((s) => umlaut(String(s).trim())),
  };

  slotValues.push({ id, name: { value: title } });
}

// --- 1) lambda/recipes.js schreiben --------------------------------------
const header = `// Rezept-Datenquelle fuer den Mise-Alexa-Skill.
//
// AUTOGENERIERT von tools/sync-recipes.js aus der iOS-Seed
//   (${path.relative(os.homedir(), SEED)}).
// NICHT HAND-EDITIEREN — Rezept aendern -> in der App/Seed aendern und
//   node tools/sync-recipes.js && ask deploy
//
// Struktur pro Rezept: id, title, servings, ingredients[], steps[]
`;

const body = `const RECIPES = ${JSON.stringify(recipes, null, 2)};

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
`;

fs.writeFileSync(OUT_RECIPES, header + "\n" + body, "utf8");

// --- 2) Interaction-Model MiseRecipe-Slot aktualisieren ------------------
const model = JSON.parse(fs.readFileSync(OUT_MODEL, "utf8"));
const types = model.interactionModel.languageModel.types || [];
let mise = types.find((t) => t.name === "MiseRecipe");
if (!mise) {
  mise = { name: "MiseRecipe", values: [] };
  types.push(mise);
  model.interactionModel.languageModel.types = types;
}
mise.values = slotValues;
fs.writeFileSync(OUT_MODEL, JSON.stringify(model, null, 2) + "\n", "utf8");

console.log(
  `OK: ${slotValues.length} Rezepte -> recipes.js + MiseRecipe-Slot geschrieben.`
);
console.log(slotValues.map((v) => "  - " + v.name.value).join("\n"));
