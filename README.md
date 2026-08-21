# Mise – Alexa-Skill (Kochmodus auf dem Echo Show)

Sprachgesteuerter Kochmodus für Mise: Rezept per Sprache öffnen, Schritte auf dem
Echo-Show-Display anzeigen **und** vorlesen, mit „nächster Schritt" / „zurück" /
„wiederhole" / „Zutaten" durchsteuern. Touch-Buttons (Weiter/Zurück) machen dasselbe.

**Aufrufname:** „meine Küche" → *„Alexa, öffne meine Küche"*
**Kosten:** 0 € (Alexa-hosted Skill, Amazons Gratis-Kontingent). Kein eigenes AWS nötig.
**Datenschutz:** Mini-Backend bleibt unangetastet im Tailnet. Rezepte liegen (v1) fest im Skill (`lambda/recipes.js`).

---

## Inhalt

| Datei | Zweck |
|---|---|
| `interaction-model/de-DE.json` | Sprachmodell (Intents, Aufrufname, Rezept-Slots) |
| `lambda/index.js` | Skill-Logik (Handler für alle Sprach-/Touch-Befehle) |
| `lambda/recipes.js` | Rezept-Daten (v1: 2 Testrezepte — Rührei, Nudeln mit Tomatensauce) |
| `lambda/apl/home.json` | Echo-Show-Startbildschirm (Rezeptliste) |
| `lambda/apl/cookingStep.json` | Echo-Show-Kochschritt (Schritt-Text + Weiter/Zurück-Buttons) |
| `lambda/package.json` | Abhängigkeiten (ask-sdk-core) |

---

## Deployment — Klick für Klick (ca. 15 Min)

> Voraussetzung: Amazon-Entwickler-Account (developer.amazon.com, mit **demselben**
> Amazon-Login, an dem auch der Echo Show hängt). ✅ Martin ist registriert.

### 1. Skill anlegen
1. https://developer.amazon.com/alexa/console/ask → **Create Skill**.
2. Skill name: `Mise` · Primary locale: **German (DE)**.
3. Type: **Custom** · Model: **Custom**.
4. Hosting: **Alexa-hosted (Node.js)** ← wichtig, das ist das gratis AWS.
5. Template: **Start from Scratch** → **Create Skill**. (Ein paar Minuten Provisionierung.)

### 2. Sprachmodell einspielen
1. Links im Menü: **Build → Interaction Model → JSON Editor**.
2. Kompletten Inhalt von `interaction-model/de-DE.json` **hineinkopieren** (alles ersetzen).
3. Oben **Save Model**, dann **Build Model** (grüner Haken abwarten).

### 3. Code einspielen (Tab „Code")
Oben auf den Tab **Code** wechseln. Der Editor zeigt eine Ordnerstruktur (`lambda/…`).
Dateien **1:1 ersetzen bzw. anlegen** mit dem Inhalt aus diesem Repo:

| Im Alexa-Editor | Inhalt aus |
|---|---|
| `lambda/index.js` | `lambda/index.js` |
| `lambda/recipes.js` | *(neu anlegen)* `lambda/recipes.js` |
| `lambda/apl/home.json` | *(Ordner `apl/` + Datei neu anlegen)* `lambda/apl/home.json` |
| `lambda/apl/cookingStep.json` | *(neu anlegen)* `lambda/apl/cookingStep.json` |
| `lambda/package.json` | `lambda/package.json` |

> Neue Datei/Ordner: im Editor links auf das **+**-Symbol neben `lambda`.
> `package.json` muss `ask-sdk-core` als Dependency haben (ist in der Repo-Version drin).

Dann oben **Save**, danach **Deploy** (baut das gratis Lambda + npm install, ~1 Min).

### 4. Auf dem Echo Show testen
1. Der Echo Show muss am **selben Amazon-Konto** hängen wie der Dev-Account.
2. Sag: **„Alexa, öffne meine Küche."** → Startbildschirm mit Rezeptliste.
3. **„Koche Rührei"** → erster Schritt erscheint + wird vorgelesen.
4. **„Alexa, nächster Schritt"** / **„zurück"** / **„wiederhole"** / **„Zutaten"**.
5. Oder die **Weiter/Zurück-Buttons** auf dem Display antippen.

Kein Veröffentlichen/Zertifizieren nötig — der Skill läuft im **Development**-Modus auf
allen Echo-Geräten deines Kontos.

---

## Sprachbefehle (v1)

| Sagen | Effekt |
|---|---|
| „öffne meine Küche" | Startbildschirm mit Rezeptliste |
| „koche Rührei" / „koch Nudeln" | Rezept starten, Schritt 1 |
| „nächster Schritt" / „weiter" | nächster Schritt |
| „zurück" | vorheriger Schritt |
| „wiederhole" | aktuellen Schritt nochmal |
| „Zutaten" | Zutatenliste vorlesen |
| „Stopp" | beenden |

---

## Schritt 2 — echter Rezept-Sync (später)

v1 hält die Rezepte fest in `lambda/recipes.js`, um Anzeige + Steuerung auf dem Echo
Show zu beweisen. Für den echten Bestand gibt es zwei Wege:

- **A (einfach, empfohlen):** Ein kleiner Sync-Job schreibt die aktuellen Mise-Rezepte
  periodisch als `recipes.js` in den Skill (redeploy). Backend bleibt privat.
- **B (live):** Der Skill ruft zur Laufzeit einen **öffentlichen** Read-Only-Endpoint
  ab. Erfordert, den Rezept-Sync (oder einen schlanken Proxy) öffentlich erreichbar zu
  machen — Sicherheits-Tradeoff, daher nicht Default.

Die Skill-Logik (`index.js`, APL) bleibt in beiden Fällen unverändert — nur die
Datenquelle in `recipes.js` wird ausgetauscht.

---

## Lokaler Selbsttest

```bash
cd lambda && npm install
# Handler lädt + simulierte Invocation (Launch → Kochen → Next → Zutaten → Touch)
```
Verifiziert am Build-Stand: Launch/Home/APL, KochenIntent, NextIntent, ZutatenIntent,
APL-Touch-UserEvent — alle grün.
