# syntax=docker/dockerfile:1.6
#
# Multi-stage build, joka jäljittelee tyypillistä PHP-tukevaa web-hotellia.
#
#   1) node:20-alpine ajaa `npm ci` + `npm run build` ja tuottaa /app/dist:n.
#   2) php:8.2-apache ajaa Apache + PHP 8 ja tarjoilee dist/-kansion sisällön
#      DocumentRoot:sta /var/www/html (vastaa `public_html`-juurta).
#
# API-avainta ei tarvita build-vaiheessa: PHP-proxy lukee sen runtimessa
# ympäristömuuttujasta DIGITRANSIT_API_KEY.

# ---------------------------------------------------------------------------
# 1) Build stage
# ---------------------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

# Asenna riippuvuudet erillisessä tasossa, jotta Docker layer cache toimii.
COPY package.json package-lock.json* ./
RUN npm ci

# Kopioi loput lähdekoodista ja tuota tuotantokäännös.
COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# 2) Runtime stage – Apache 2.4 + PHP 8 (kuten useimmilla web-hotelleilla)
# ---------------------------------------------------------------------------
FROM php:8.2-apache AS runtime

# Salli mod_rewrite ja .htaccess-tiedostojen vaikutus DocumentRootissa
# (välttämätön config.php:n suojaukselle).
RUN a2enmod rewrite \
 && printf '<Directory /var/www/html/>\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>\n' > /etc/apache2/conf-available/allow-htaccess.conf \
 && a2enconf allow-htaccess

# Apachen oletus PHP-FPM/mod_php välittää getenv():lle vain SetEnv-arvot,
# joten julkaistaan kontaineriin tulevat env-muuttujat PHP:lle.
# (Tämä mahdollistaa DIGITRANSIT_API_KEY:n lukemisen getenv():llä.)
RUN printf 'PassEnv DIGITRANSIT_API_KEY\n' \
    > /etc/apache2/conf-available/passenv.conf \
 && a2enconf passenv

# Kopioi staattinen build (sisältää PHP-proxyn `api/`-alikansiossa).
COPY --from=build /app/dist/ /var/www/html/

EXPOSE 80
