-- Käyttöliittymän tekstit (issue #29).
--
-- Kielet ovat rivejä, eivät sarakkeita: uusi kieli = rivi ui_language-tauluun
-- + käännösrivit ui_text-tauluun. Skeemaa tai koodia ei tarvitse muuttaa.
--
-- Koodissa tekstiin viitataan muodossa t('ryhmä.avain'), esim.
-- t('app.subtitle'). Ryhmä (text_group) on näkymä (app, stopCard, trip…) tai
-- yhteinen `common`. Avain voi sisältää pisteitä (esim. 'tab.search').
--
-- Ajo: Docker ajaa tämän automaattisesti ensimmäisellä käynnistyksellä
-- (docker-entrypoint-initdb.d). Web-hotellissa tuo phpMyAdminilla ennen
-- tiedostoja 02-texts-fi.sql ja 03-texts-en.sql. Tietokanta luodaan hostingin
-- hallintapaneelissa. Uudelleenajo ei muuta olemassa olevia tauluja eikä
-- kielten käyttöönottoa (enabled).

SET NAMES utf8mb4;

-- Käytössä olevat kielet (suomi oletuksena, englanti). Kielivalinta näkyy vain,
-- jos enabled-kieliä on useampi kuin yksi. enabled = 0 piilottaa kielen, esim.
-- uuden kielen käännöstyön ajaksi.
CREATE TABLE IF NOT EXISTS ui_language (
  code       VARCHAR(10) NOT NULL,             -- 'fi', 'en'
  name       VARCHAR(50) NOT NULL,             -- kielen nimi omalla kielellään: 'Suomi', 'English'
  locale     VARCHAR(20) NOT NULL,             -- kellonajat ja päivämäärät: 'fi-FI', 'en-GB'
  sort_order INT         NOT NULL DEFAULT 0,
  enabled    TINYINT     NOT NULL DEFAULT 1,    -- 1 = käytössä, 0 = piilotettu
  PRIMARY KEY (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Jokainen tekstiavain kerran. note kertoo ylläpitäjälle, missä teksti näkyy
-- ja mitä paikanpitimiin {0}, {1}, … tulee.
CREATE TABLE IF NOT EXISTS ui_text_key (
  text_group VARCHAR(50)  NOT NULL,            -- näkymä: 'app', 'stopCard', 'common'
  text_key   VARCHAR(100) NOT NULL,            -- 'subtitle', 'tab.search'
  note       VARCHAR(255) NULL,
  PRIMARY KEY (text_group, text_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tekstit kielittäin. Jos valitulta kieleltä puuttuu teksti, näytetään
-- suomenkielinen. Viiteavaimet hylkäävät kirjoitusvirheet kielessä ja avaimessa.
CREATE TABLE IF NOT EXISTS ui_text (
  lang       VARCHAR(10)  NOT NULL,
  text_group VARCHAR(50)  NOT NULL,
  text_key   VARCHAR(100) NOT NULL,
  value      TEXT         NOT NULL,
  PRIMARY KEY (lang, text_group, text_key),
  CONSTRAINT fk_ui_text_lang FOREIGN KEY (lang)
    REFERENCES ui_language (code) ON UPDATE CASCADE,
  CONSTRAINT fk_ui_text_key FOREIGN KEY (text_group, text_key)
    REFERENCES ui_text_key (text_group, text_key) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO ui_language (code, name, locale, sort_order, enabled) VALUES
  ('fi', 'Suomi',   'fi-FI', 1, 1),
  ('en', 'English', 'en-GB', 2, 1)
ON DUPLICATE KEY UPDATE code = code;
