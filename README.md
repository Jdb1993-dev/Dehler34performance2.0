# Optima 106 Performance

Webapp (PWA) die op je telefoon laat zien hoe goed de Dehler Optima 106 het doet t.o.v. het polar diagram:

- **GPS** (telefoon): actuele snelheid (SOG) en koers (COG).
- **Wind**: live van [actuelewind.nl](https://www.actuelewind.nl), spot *Trintelhaven Houtribdijk*, elke minuut vernieuwd.
- **Polar diagram**: schatting op basis van de Dehler 34 (zelfde ontwerp, VDS #320) — volledig aanpasbaar in de app onder de tandwiel-instellingen.
- **Performance %**: GPS-snelheid gedeeld door de target-snelheid uit de polar voor de actuele TWA/TWS.

## Waarom een server nodig is

actuelewind.nl heeft geen officiële publieke API en staat geen cross-origin requests toe (geen CORS-headers). Daarom draait er een klein Node/Express-servertje (`server.js`) dat de winddata ophaalt en doorgeeft aan de app (`/api/wind`). De server cachet 55 sec, in lijn met de cache van actuelewind.nl zelf, om ze niet te overvragen.

## Lokaal draaien

Vereist [Node.js](https://nodejs.org) (LTS, 18+). Op deze laptop stond dat nog niet geïnstalleerd — installeer het eerst.

```
cd dehler-performance
npm install
npm start
```

Open daarna `http://localhost:3000` in de browser. Voor GPS-toegang op een telefoon via je lokale netwerk heb je HTTPS nodig (localhost zelf is geen probleem op een laptop/desktop).

## Deployen naar Vercel (voor gebruik op het water)

Voor gebruik op de boot moet de telefoon de app via internet (4G) kunnen bereiken, met HTTPS (vereist voor GPS in de browser). Het project is al klaar voor Vercel:

- `api/wind.js` — de wind-proxy als serverless functie (zelfde logica als `server.js`, dat blijft ook werken voor lokaal testen).
- `vercel.json` — vertelt Vercel dat de map `public/` de statische app is.

Stappen (eenmalig, via jouw eigen gratis accounts):

1. **Maak een GitHub-repo** en push deze projectmap ertoe (bv. via GitHub Desktop, of `git init && git add . && git commit -m "init" && git remote add origin <url> && git push`).
2. Ga naar **[vercel.com](https://vercel.com)**, log in met je GitHub-account.
3. Klik **"Add New... > Project"**, selecteer de repo. Vercel herkent het project automatisch (geen framework-instellingen nodig) en klikt op **Deploy**.
4. Na een paar seconden krijg je een URL zoals `https://jouw-project.vercel.app` — open die op je telefoon en kies **"Toevoegen aan beginscherm"** voor de app-ervaring.

Elke keer dat je een wijziging naar GitHub pusht, deployt Vercel automatisch een nieuwe versie.

## Beperkingen om te weten

- GPS geeft **SOG/COG** (snelheid/koers over de grond), geen snelheid door het water — bij stroming wijkt dit af van de "echte" boegsnelheid.
- De polar is een **schatting**, geen gemeten data voor dit specifieke schip. Pas de tabel in Instellingen aan zodra je eigen ervaring of betere cijfers hebt.
- actuelewind.nl is een onofficiële databron (geen publieke API) — bij wijzigingen aan hun site kan `/api/wind` stuk gaan.
- Het weerstation zelf update ongeveer elke 10 minuten; de app polt elke minuut zodat je nooit langer dan nodig op verse data wacht, maar de waarde verandert niet elke minuut.
