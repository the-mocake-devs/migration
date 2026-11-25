# SJBijbel reader integration

Deze map bevat de losse readerbestanden voor de bestaande statische SJBijbel-site.

## Bestanden plaatsen

Kopieer naar de hoofdmap van de bestaande repository:

- `lezen.html`
- `lezen.css`
- `lezen.js`
- `data/README.md`

De bestaande `style.css`, `script.js`, `index.html`, `bijbel/` en `gids/` blijven behouden. De reader gebruikt de bestaande root `style.css`, DM Sans / Space Grotesk, logo en kleurvariabelen.

## Navigatielink toevoegen

Voeg in de bestaande navigatie van `index.html` een link toe, bijvoorbeeld naast het huidige navigatie-element:

```html
<a href="/lezen">Bijbel lezen</a>
```

Voeg dezelfde link eventueel toe aan de footer of de `bijbelboeken.html`-pagina.

## Tekstbestand en licentie

De reader bevat bewust **geen HSV-tekst**. De Herziene Statenvertaling is auteursrechtelijk beschermd. Vraag eerst schriftelijke toestemming/licentie aan de rechthebbende voor het digitaal tonen én full-text doorzoeken van de tekst. Neem in de aanvraag expliciet op dat het om een publieke website gaat en vermeld eventuele advertenties/inkomsten.

Na ontvangst van de toegestane dataset plaats je `hsv.json` in deze map (`/data/hsv.json`).

Verwacht JSON-formaat:

```json
{
  "translation": "HSV",
  "books": {
    "genesis": {
      "1": [
        { "verse": 1, "text": "..." },
        { "verse": 2, "text": "..." }
      ],
      "2": [
        { "verse": 1, "text": "..." }
      ]
    },
    "johannes": {
      "3": [
        { "verse": 16, "text": "..." }
      ]
    }
  }
}
```

- De book keys zijn de slugs uit `lezen.js` (bijvoorbeeld `1-korintiers`, `psalmen`, `johannes`).
- Elk hoofdstuk bevat een array met versobjecten.
- `verse` is het versnummer en `text` de volledige versinhoud.
- Hoofdstukken en verzen mogen in de dataset volledig aanwezig zijn; de interface toont wat er in het bestand staat.

Zonder `hsv.json` werken de boeknavigatie, hoofdstukselectie, URL's en verwijzingsherkenning al. Het lezen van de tekst en full-text search worden actief zodra het gelicentieerde bestand beschikbaar is.

## Cloudflare

De huidige repository gebruikt statische assets via `wrangler.jsonc`. De reader vereist geen buildstap, npm-package, Worker of database. Het JSON-bestand wordt als statisch bestand uit `/data/hsv.json` geladen. Bij een zeer grote dataset kan later een Cloudflare Worker/D1 full-text index worden toegevoegd, maar begin pas daarmee als de omvang van de toegestane dataset dat nodig maakt.
