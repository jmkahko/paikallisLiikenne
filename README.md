# Paikallisliikenne — Nysse pysäkit

Yksinkertainen React-sovellus, jolla voit seurata Tampereen Nysse-pysäkkien
seuraavia bussi- ja raitiovaunulähtöjä reaaliaikaisesti. Voit lisätä jopa
**6 pysäkkiä** ja sovellus muistaa valintasi selaimen `localStorage`:ssa.

Tiedot haetaan [Digitransit](https://digitransit.fi/) GraphQL-rajapinnasta
(Waltti / Tampere).

## Ominaisuudet

- Pysäkkihaku nimellä tai pysäkkikoodilla.
- Jopa 6 pysäkkiä rinnakkain. Pysäkit tallennetaan selaimeen.
- Seuraavat 5 lähtöä per pysäkki: linja, määränpää, lähtöaika ja "min"-laskuri.
- Reaaliaikamerkki (vihreä piste) kun aikataulutieto on liikenteen GPS:stä.
- Automaattinen päivitys 30 sekunnin välein. Manuaalinen päivitys napilla.
- Polling pysähtyy, kun välilehti ei ole näkyvissä (Page Visibility API),
  ja päivittyy heti kun välilehti palaa eteen — säästää API-kiintiötä.
- Bussit (sininen) ja raitiovaunut (punainen) erottuvat värillä.
- Vaalea/tumma teema seuraa järjestelmäasetusta.

## 1. API-avaimen hankinta

Digitransit vaatii ilmaisen subscription keyn.

1. Mene osoitteeseen <https://portal-api.digitransit.fi/>.
2. Rekisteröidy / kirjaudu sisään.
3. Tilaa **Routing API** -tuote (riittää ilmainen taso).
4. Kopioi avaimesi. Avain näyttää 32 merkin heksamerkkijonolta.

## 2. Asennus ja käynnistys

Tarvitset [Node.js 18+](https://nodejs.org/).

```bash
# 1. Asenna riippuvuudet
npm install

# 2. Luo .env-tiedosto API-avaimen kanssa
cp .env.example .env
# avaa .env ja täytä VITE_DIGITRANSIT_API_KEY=oma-avaimesi

# 3. Käynnistä kehityspalvelin
npm run dev
```

Sovellus avautuu osoitteessa <http://localhost:5173>.

### Tuotantokäännös

```bash
npm run build      # luo dist/-kansion
npm run preview    # kokeile käännöstä paikallisesti
```

## Pysäkkien lisääminen

1. Hae pysäkki nimellä (esim. `Keskustori`, `Hervanta`) tai pysäkkikoodilla
   (esim. `0501`).
2. Klikkaa hakutulosta — pysäkki ilmestyy alas omaan korttiin.
3. Korttien painikkeilla voit järjestää (↑/↓), päivittää (↻) tai poistaa (✕).
4. Kun olet lisännyt 6 pysäkkiä, hakukenttä lukkiutuu kunnes poistat jonkin.

Pysäkkivalintasi tallennetaan automaattisesti selaimeen — ne säilyvät
sivulatausten yli.

## Tekninen yhteenveto

- **React 18** + **Vite** (ei TypeScriptiä, ei lisäkirjastoja UI:lle).
- Yksi GraphQL-päätepiste:
  `https://api.digitransit.fi/routing/v2/waltti/gtfs/v1/`.
- Avain lähetetään `digitransit-subscription-key`-headerissa.
- Tila pidetään `useState`/`useLocalStorage`-hookkien kanssa, ei reduxia.
- Päivitys ajastimella `setInterval` (30 s) komponentin sisällä,
  pysäytetty `visibilitychange`-tapahtumaan kun välilehti on piilossa.

## Tekijä

Tämä sovellus on toteutettu **kokonaan Claude-tekoälyllä** (Anthropic) —
koodia ei ole kirjoitettu käsin. Projekti syntyi luonnollisen kielen
komentoja antamalla: vaatimukset, suunnittelu, toteutus ja jatkokehitys
(esim. pysäkin haun bugikorjaus ja näkyvyystietoinen polling) ohjattiin
keskustelemalla Clauden kanssa, joka kirjoitti, muokkasi ja tarkasti
tiedostot. Tämän README-tiedoston sisältö on niin ikään Clauden tuottamaa.

## Lisenssi & lähteet

Aineisto: © Tampereen seudun joukkoliikenne / Digitransit, lisenssi
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
