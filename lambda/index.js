// Mise – Alexa-Skill (Kochmodus auf dem Echo Show)
//
// Sprachgesteuerter Kochmodus: Rezept per Sprache öffnen, Schritte auf dem
// Echo-Show-Display anzeigen + vorlesen, mit "nächster Schritt" / "zurück" /
// "wiederhole" / "Zutaten" durchsteuern. Touch-Buttons (Weiter/Zurück) machen
// dasselbe für den, der lieber tippt.
//
// Datenquelle: lambda/recipes.js (aktuell zwei Testrezepte). Schritt 2 hängt
// hier den echten Mise-Rezept-Sync an – der Rest des Skills bleibt gleich.

const Alexa = require("ask-sdk-core");
const { RECIPES, findRecipe, listTitles } = require("./recipes");
const cookingStepDoc = require("./apl/cookingStep.json");
const homeDoc = require("./apl/home.json");

const APL_IFACE = "Alexa.Presentation.APL";

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
  const titles = listTitles();
  const heading = headingOverride || "Was möchtest du kochen?";
  const speak =
    `${heading} Ich kenne aktuell ${joinList(titles)}. ` +
    `Sag zum Beispiel: koche ${titles[0]}.`;

  const builder = handlerInput.responseBuilder
    .speak(speak)
    .reprompt(`Sag zum Beispiel: koche ${titles[0]}.`);

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
    const recipe = findRecipe(spoken, resolvedId);
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
  return { recipe: RECIPES[attrs.recipeId], index: attrs.stepIndex || 0 };
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
  .addErrorHandlers(ErrorHandler)
  .lambda();
