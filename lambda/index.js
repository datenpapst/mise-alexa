// Mise – Alexa-Skill (Kochmodus auf dem Echo Show)
//
// Sprachgesteuerter Kochmodus: Rezept per Sprache öffnen, Schritte auf dem
// Echo-Show-Display anzeigen + vorlesen, mit "nächster Schritt" / "zurück" /
// "wiederhole" / "Zutaten" durchsteuern. Touch-Buttons (Weiter/Zurück) machen
// dasselbe für den, der lieber tippt.
//
// Datenquelle: Bei verknuepftem Konto (Account-Linking) werden die echten
// Mise-Rezepte des Haushalts live von /alexa/recipes geladen. Ohne Verknuepfung
// oder bei Netzfehler faellt der Skill auf die statischen Seed-Rezepte
// (lambda/recipes.js) zurueck — er bleibt so immer funktionsfaehig.

const https = require("https");
const Alexa = require("ask-sdk-core");
const { RECIPES, findRecipe, listTitles } = require("./recipes");
const cookingStepDoc = require("./apl/cookingStep.json");
const homeDoc = require("./apl/home.json");

const APL_IFACE = "Alexa.Presentation.APL";

// Live-Rezept-Endpoint (X-Mise-Key aus der Lambda-Env; ohne Key bleibt der
// Live-Pfad still aus und der Skill nutzt die Seeds).
const LIVE_URL =
  process.env.MISE_RECIPES_URL || "https://mise.c-arena.com/alexa/recipes";
const MISE_KEY = process.env.MISE_KEY || "";

// Holt die Live-Rezepte des verknuepften Haushalts. Loest IMMER auf (null bei
// jedem Fehler) — der Skill darf daran nie haengenbleiben oder abstuerzen.
function fetchLiveRecipes(accessToken) {
  return new Promise((resolve) => {
    if (!accessToken) return resolve(null);
    let url;
    try {
      url = new URL(LIVE_URL);
    } catch (e) {
      return resolve(null);
    }
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    };
    if (MISE_KEY) headers["X-Mise-Key"] = MISE_KEY;
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: "GET",
        headers,
        timeout: 4000
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return resolve(null);
        }
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            resolve(Array.isArray(parsed.recipes) ? parsed.recipes : null);
          } catch (e) {
            resolve(null);
          }
        });
      }
    );
    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
    req.end();
  });
}

function slugify(name) {
  return (
    String(name)
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "rezept"
  );
}

// Einmal pro Session die Live-Rezepte laden und in den Session-Attributen
// cachen. Nicht verknuepft / Fehler / kein Key -> book bleibt leer -> Fallback.
const LiveRecipesInterceptor = {
  async process(handlerInput) {
    const attrs = handlerInput.attributesManager.getSessionAttributes();
    if (attrs.bookLoaded) return;
    const sys =
      handlerInput.requestEnvelope.context &&
      handlerInput.requestEnvelope.context.System;
    const accessToken =
      (sys && sys.user && sys.user.accessToken) ||
      (handlerInput.requestEnvelope.session &&
        handlerInput.requestEnvelope.session.user &&
        handlerInput.requestEnvelope.session.user.accessToken) ||
      null;
    const live = await fetchLiveRecipes(accessToken);
    if (live && live.length) {
      const book = {};
      const titles = [];
      for (const r of live) {
        if (!r || !r.title) continue;
        const id = r.id || slugify(r.title);
        book[id] = {
          id,
          title: r.title,
          ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
          steps: Array.isArray(r.steps) ? r.steps : []
        };
        titles.push(r.title);
      }
      attrs.book = book;
      attrs.titles = titles;
      attrs.linked = true;
    } else if (accessToken) {
      // verknuepft, aber (noch) keine Rezepte -> markieren fuer klare Ansage
      attrs.linked = true;
    }
    attrs.bookLoaded = true;
    handlerInput.attributesManager.setSessionAttributes(attrs);
  }
};

// Aktives Rezeptbuch: Live-Rezepte falls geladen, sonst statische Seeds.
function bookFor(handlerInput) {
  const attrs = handlerInput.attributesManager.getSessionAttributes();
  return attrs.book || RECIPES;
}
function titlesFor(handlerInput) {
  const attrs = handlerInput.attributesManager.getSessionAttributes();
  return attrs.titles && attrs.titles.length ? attrs.titles : listTitles();
}
function findFor(handlerInput, spoken, resolvedId) {
  const attrs = handlerInput.attributesManager.getSessionAttributes();
  if (!attrs.book) return findRecipe(spoken, resolvedId);
  const book = attrs.book;
  if (resolvedId && book[resolvedId]) return book[resolvedId];
  if (spoken) {
    const s = slugify(spoken);
    if (book[s]) return book[s];
    const low = spoken.toLowerCase();
    for (const id in book) {
      const t = book[id].title.toLowerCase();
      if (t === low || t.includes(low) || low.includes(t)) return book[id];
    }
  }
  return null;
}

// Dynamic Entities: die Live-Rezeptnamen zur Laufzeit als Slot-Werte fuer
// MiseRecipe injizieren, damit "koche <mein Rezept>" per Sprache erkannt wird.
function dynamicEntitiesDirective(handlerInput) {
  const attrs = handlerInput.attributesManager.getSessionAttributes();
  if (!attrs.book) return null;
  const values = Object.keys(attrs.book).map((id) => ({
    id,
    name: { value: attrs.book[id].title, synonyms: [] }
  }));
  if (!values.length) return null;
  return {
    type: "Dialog.UpdateDynamicEntities",
    updateBehavior: "REPLACE",
    types: [{ name: "MiseRecipe", values }]
  };
}

function supportsAPL(handlerInput) {
  const ifaces =
    Alexa.getSupportedInterfaces(handlerInput.requestEnvelope) || {};
  return !!ifaces[APL_IFACE];
}

function joinList(items) {
  if (items.length <= 1) return items.join("");
  return items.slice(0, -1).join(", ") + " und " + items[items.length - 1];
}

// Baut Sprachausgabe + (falls Bildschirm da) APL-Anzeige für einen Kochschritt.
function renderStep(handlerInput, recipe, index) {
  const total = recipe.steps.length;
  const stepText = recipe.steps[index];
  const isLast = index === total - 1;
  const stepNumber = index + 1;

  const attrs = handlerInput.attributesManager.getSessionAttributes();
  attrs.recipeId = recipe.id;
  attrs.stepIndex = index;
  handlerInput.attributesManager.setSessionAttributes(attrs);

  let speak = `Schritt ${stepNumber} von ${total}. ${stepText}`;
  if (isLast) {
    speak += " Das war der letzte Schritt. Guten Appetit!";
  }
  const reprompt = isLast
    ? "Sag Zutaten, um die Zutaten zu hören, oder Stopp zum Beenden."
    : "Sag nächster Schritt, wenn du weiter möchtest.";

  const builder = handlerInput.responseBuilder.speak(speak);

  if (supportsAPL(handlerInput)) {
    builder.addDirective({
      type: "Alexa.Presentation.APL.RenderDocument",
      token: "miseCooking",
      document: cookingStepDoc,
      datasources: {
        payload: {
          cooking: {
            title: recipe.title,
            stepNumber,
            totalSteps: total,
            stepText,
            isLast
          }
        }
      }
    });
  }

  if (!isLast) builder.reprompt(reprompt);
  else builder.reprompt(reprompt);

  return builder.getResponse();
}

function renderHome(handlerInput, headingOverride) {
  const attrs = handlerInput.attributesManager.getSessionAttributes();
  const titles = titlesFor(handlerInput);

  // Verknuepft, aber leerer Bestand: ehrliche Ansage statt Seed-Rezepte.
  if (attrs.linked && (!attrs.titles || !attrs.titles.length)) {
    const msg =
      (headingOverride || "Willkommen bei Mise.") +
      " Du hast noch keine Rezepte in Mise. Lege in der App ein Rezept an, dann findest du es hier.";
    return handlerInput.responseBuilder
      .speak(msg)
      .reprompt("Lege in der Mise-App ein Rezept an und probiere es erneut.")
      .getResponse();
  }

  const heading = headingOverride || "Was möchtest du kochen?";
  const speak =
    `${heading} Ich kenne aktuell ${joinList(titles)}. ` +
    `Sag zum Beispiel: koche ${titles[0]}.`;

  const builder = handlerInput.responseBuilder
    .speak(speak)
    .reprompt(`Sag zum Beispiel: koche ${titles[0]}.`);

  const dyn = dynamicEntitiesDirective(handlerInput);
  if (dyn) builder.addDirective(dyn);

  if (supportsAPL(handlerInput)) {
    builder.addDirective({
      type: "Alexa.Presentation.APL.RenderDocument",
      token: "miseHome",
      document: homeDoc,
      datasources: {
        payload: {
          home: {
            heading,
            recipes: titles.map((t) => ({ title: t })),
            hint: `Sag „koche ${titles[0]}“, um zu starten.`
          }
        }
      }
    });
  }
  return builder.getResponse();
}

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest";
  },
  handle(handlerInput) {
    return renderHome(handlerInput, "Willkommen bei Mise.");
  }
};

const KochenIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "KochenIntent"
    );
  },
  handle(handlerInput) {
    const slot =
      Alexa.getSlot(handlerInput.requestEnvelope, "rezept") || {};
    const spoken = slot.value;
    let resolvedId = null;
    const res = slot.resolutions && slot.resolutions.resolutionsPerAuthority;
    if (res) {
      for (const auth of res) {
        if (
          auth.status &&
          auth.status.code === "ER_SUCCESS_MATCH" &&
          auth.values &&
          auth.values.length
        ) {
          resolvedId = auth.values[0].value.id;
          break;
        }
      }
    }
    const recipe = findFor(handlerInput, spoken, resolvedId);
    if (!recipe) {
      return renderHome(
        handlerInput,
        `${spoken || "Das Rezept"} kenne ich leider noch nicht.`
      );
    }
    return renderStep(handlerInput, recipe, 0);
  }
};

function currentRecipe(handlerInput) {
  const attrs = handlerInput.attributesManager.getSessionAttributes();
  if (!attrs.recipeId) return null;
  return { recipe: bookFor(handlerInput)[attrs.recipeId], index: attrs.stepIndex || 0 };
}

const NextStepHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.NextIntent"
    );
  },
  handle(handlerInput) {
    const cur = currentRecipe(handlerInput);
    if (!cur || !cur.recipe) return renderHome(handlerInput);
    const next = Math.min(cur.index + 1, cur.recipe.steps.length - 1);
    if (next === cur.index && cur.index === cur.recipe.steps.length - 1) {
      return handlerInput.responseBuilder
        .speak("Das war schon der letzte Schritt. Sag Stopp zum Beenden.")
        .reprompt("Sag Stopp zum Beenden oder Zutaten für die Zutaten.")
        .getResponse();
    }
    return renderStep(handlerInput, cur.recipe, next);
  }
};

const PreviousStepHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.PreviousIntent"
    );
  },
  handle(handlerInput) {
    const cur = currentRecipe(handlerInput);
    if (!cur || !cur.recipe) return renderHome(handlerInput);
    const prev = Math.max(cur.index - 1, 0);
    return renderStep(handlerInput, cur.recipe, prev);
  }
};

const RepeatHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.RepeatIntent"
    );
  },
  handle(handlerInput) {
    const cur = currentRecipe(handlerInput);
    if (!cur || !cur.recipe) return renderHome(handlerInput);
    return renderStep(handlerInput, cur.recipe, cur.index);
  }
};

const ZutatenIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "ZutatenIntent"
    );
  },
  handle(handlerInput) {
    const cur = currentRecipe(handlerInput);
    if (!cur || !cur.recipe) return renderHome(handlerInput);
    const r = cur.recipe;
    const speak =
      `Für ${r.title} brauchst du: ${joinList(r.ingredients)}. ` +
      `Sag nächster Schritt, wenn du weiterkochen möchtest.`;
    return handlerInput.responseBuilder
      .speak(speak)
      .reprompt("Sag nächster Schritt, um weiterzukochen.")
      .getResponse();
  }
};

// Touch auf die APL-Buttons (Weiter/Zurück) kommt als UserEvent zurück.
const APLUserEventHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) ===
      "Alexa.Presentation.APL.UserEvent"
    );
  },
  handle(handlerInput) {
    const args =
      handlerInput.requestEnvelope.request.arguments || [];
    const action = args[0];
    const cur = currentRecipe(handlerInput);
    if (!cur || !cur.recipe) return renderHome(handlerInput);
    if (action === "previous") {
      return renderStep(handlerInput, cur.recipe, Math.max(cur.index - 1, 0));
    }
    // "next"
    const next = Math.min(cur.index + 1, cur.recipe.steps.length - 1);
    return renderStep(handlerInput, cur.recipe, next);
  }
};

const HelpHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    return renderHome(
      handlerInput,
      "Ich führe dich Schritt für Schritt durchs Kochen."
    );
  }
};

const StopHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      ["AMAZON.StopIntent", "AMAZON.CancelIntent"].includes(
        Alexa.getIntentName(handlerInput.requestEnvelope)
      )
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.speak("Bis bald. Guten Appetit!").getResponse();
  }
};

const FallbackHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.FallbackIntent"
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak("Das habe ich nicht verstanden. Sag nächster Schritt, zurück, wiederhole oder Zutaten.")
      .reprompt("Sag nächster Schritt, zurück, wiederhole oder Zutaten.")
      .getResponse();
  }
};

const SessionEndedHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) ===
      "SessionEndedRequest"
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error("Mise-Skill-Fehler:", error);
    return handlerInput.responseBuilder
      .speak("Es gab ein Problem. Bitte versuche es noch einmal.")
      .reprompt("Bitte versuche es noch einmal.")
      .getResponse();
  }
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    KochenIntentHandler,
    NextStepHandler,
    PreviousStepHandler,
    RepeatHandler,
    ZutatenIntentHandler,
    APLUserEventHandler,
    HelpHandler,
    StopHandler,
    FallbackHandler,
    SessionEndedHandler
  )
  .addRequestInterceptors(LiveRecipesInterceptor)
  .addErrorHandlers(ErrorHandler)
  .lambda();
