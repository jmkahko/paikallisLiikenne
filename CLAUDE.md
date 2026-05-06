# CLAUDE.md

Tämä tiedosto on muistilappu tekoälylle (ja kehittäjälle), joka työskentelee
tämän projektin parissa. Lue tämä **ennen** kuin teet muutoksia.

## Yleiskuvaus

Pieni React-sovellus, jolla seurataan Tampereen Nysse-pysäkkien
reaaliaikaisia bussi- ja raitiovaunulähtöjä. Käyttäjä voi lisätä enintään
6 pysäkkiä, jotka tallennetaan selaimen `localStorage`:een. Tiedot haetaan
Digitransit GraphQL-rajapinnasta (Waltti / Tampere).

## Tekniikat

- **React 18** funktionaalisilla komponenteilla ja hookeilla.
- **Vite 5** dev-palvelin & build-työkalu.
- **Vanilla CSS** (`src/styles.css`). Ei Tailwindia, ei CSS-in-JS:ää.
- **Fetch + GraphQL POST** suoraan Digitransitiin — ei Apollo Clientia
  eikä muita riippuvuuksia.
- **localStorage** pysäkkivalintojen tallennukseen (`useLocalStorage`-hook).
- **Page Visibility API** (`visibilitychange`) pollingin pysäyttämiseen
  kun välilehti on piilossa.
- Ei TypeScriptiä. Ei testikirjastoa. Ei lintteriä konfiguroituna.

Riippuvuudet näkyvät `package.json`:ssa. Pidä riippuvuusmäärä minimissä —
älä lisää kirjastoja ilman selkeää tarvetta.

## Hakemistorakenne

```
.
├── index.html               # Vite entry HTML
├── vite.config.js           # Vite-asetukset (portti 5173, react-plugin)
├── package.json             # npm-skriptit & dependencies
├── .env.example             # Malli .env-tiedostosta (avain tyhjä)
├── README.md                # Käyttäjäohjeet (asennus, API-avain, käyttö)
├── CLAUDE.md                # Tämä tiedosto
└── src/
    ├── main.jsx             # React-juuren bootstrap
    ├── App.jsx              # Sovelluksen päärakenne, tila, layout
    ├── styles.css           # Kaikki tyylit (CSS-muuttujat juuressa)
    ├── api/
    │   └── digitransit.js   # GraphQL-kutsut: searchStops, getStopDepartures
    ├── hooks/
    │   ├── useLocalStorage.js   # Yleinen localStorage-hook
    │   └── useDepartures.js     # Pollaa pysäkin lähtöjä, näkyvyystietoinen
    └── components/
        ├── StopSearch.jsx   # Pysäkkihaku (debounce 350 ms)
        └── StopCard.jsx     # Yhden pysäkin kortti + lähdöt
```

## Yleiset komennot

```bash
npm install        # asenna riippuvuudet
npm run dev        # dev-palvelin http://localhost:5173
npm run build      # tuotantokäännös → dist/
npm run preview    # esikatsele tuotantokäännöstä
```

API-avain syötetään tiedostoon `.env` muodossa
`VITE_DIGITRANSIT_API_KEY=...`. Tiedosto on `.gitignore`:ssa eikä saa päätyä
GitHubiin. `.env.example` toimii mallina.

## Konventiot

- Käyttöliittymäteksti **suomeksi** (myös virheilmoitukset ja tooltipit).
- Tiedosto- ja muuttujanimet **englanniksi** (`stop`, `departures`).
- Tila päämäärässään lähimmässä järkevässä paikassa: globaalia storea ei ole.
  `App.jsx` omistaa pysäkkilistan, `StopCard` hoitaa oman pysäkkinsä haut.
- Verkkokutsut keskitettävä `src/api/digitransit.js`:ään. Älä tee `fetch`:iä
  komponenteista suoraan.
- 30 sekunnin polling-väli on oletus. Jos sitä muutetaan, päivitä myös README.
- CSS-muuttujat määritellään `:root`:issa ja `prefers-color-scheme: light`
  -mediakyselyssä — käytä niitä uusissa tyyleissä `--bg`, `--text`, jne.
- Ei kirjastoja UI:hin (date-fns, lodash, MUI) ilman vahvaa perustelua.
- Pidetään yhden tiedoston / komponentin pituus alle ~200 riviä.

## Mitä päivittää, kun jotain muuttuu

Tämä on tärkein osa: pidä nämä tiedostot synkassa.

| Muutoksen tyyppi | Päivitä myös |
| ---------------- | ------------ |
| Uusi npm-riippuvuus tai version nosto | `package.json`, `package-lock.json` (auto), README-kohta "Tekninen yhteenveto" jos relevantti |
| Uusi ympäristömuuttuja (`VITE_...`) | `.env.example`, README:n "API-avaimen hankinta" / "Asennus" -osiot |
| Uusi käyttäjälle näkyvä toiminto | README:n "Ominaisuudet"-lista; tarvittaessa "Pysäkkien lisääminen" |
| Polling-välin tai näkyvyyslogiikan muutos | README:n "Ominaisuudet" + "Tekninen yhteenveto" |
| Uusi komponentti tai tiedosto | Tämän CLAUDE.md:n "Hakemistorakenne" |
| API-päätepisteen URL muuttuu | `src/api/digitransit.js` (`ENDPOINT`-vakio) **ja** README |
| Maksimi pysäkkimäärä muuttuu | `App.jsx` (`MAX_STOPS`), README, tämä taulukko |
| `localStorage`-avaimen rikkova muutos | Nosta avaimen versionumeroa (`paikallis.stops.v1` → `v2`) ja `App.jsx`:n `STORAGE_KEY`. Mainitse README:ssä. |
| Uusi npm-skripti `package.json`:iin | README:n komennot, tämän tiedoston "Yleiset komennot" |
| Tyylimuutokset `:root`-muuttujiin | `src/styles.css` molemmat lohkot (tumma + light-media) |

## Yleisiä sudenkuoppia

- **GraphQL-skeema**: Digitransit v2 ei tue kaikkia v1:n argumentteja
  (esim. `stops(maxResults: ...)` ei toimi). Validoi kenttä-argumentit
  Digitransit-portaalin GraphiQL:llä ennen julkaisua.
- **Service day -aikalaskenta**: `stoptimesWithoutPatterns` palauttaa ajat
  sekunteina `serviceDay`:n päälle. Älä unohda kertoa 1000:lla muunnoksessa
  `Date`-objektiksi (`(serviceDay + secs) * 1000`).
- **localStorage SSR**: Tätä sovellusta ei renderöidä palvelimella, joten
  suora `window.localStorage` on ok. Jos siirrytään SSR:ään, lisää `typeof
  window` -tarkistus.
- **API-avaimen vuotaminen**: Vite paljastaa kaikki `VITE_`-alkuiset
  ympäristömuuttujat selaimeen. Tämä on Digitransit-avaimelle hyväksyttävää
  (avain on subscription-tason rajoitettu), mutta älä lisää muita salaisuuksia
  `VITE_`-prefixillä.
- **Suluiden tasapaino**: ilman lintteriä JSX-virheet huomataan vasta
  käännöksessä. Aja `npm run build` ennen committia.

## Tekijä

Sovellus on toteutettu Claude-tekoälyllä keskustelun kautta — lue README:n
"Tekijä"-osio.
