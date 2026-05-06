# syntax=docker/dockerfile:1.6
#
# Multi-stage build, joka jäljittelee tyypillistä PHP-tukevaa web-hotellia.
#
#   1) node:20-alpine ajaa `npm ci` + `npm run build` ja tuottaa /app/dist:n.
#   2) php:8.2-apache ajaa Apache + PHP 8 ja tarjoilee dist/-kansion sisällön
#      DocumentRoot:sta /var/www/html (vastaa `public_html`-juurta).
#
# API-avain välitetään build-argumenttina (`VITE_DIGITRANSIT_API_KEY`),
# koska Vite paistaa sen staattiseen bundleen build-vaiheessa — sama
# käyttäytyminen kuin oikeassa hostingissa.

# ---------------------------------------------------------------------------
# 1) Build stage
# ---------------------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

# Build-time avain — välitetään docker-compose.yml:n `build.args`-kentästä.
ARG VITE_DIGITRANSIT_API_KEY=""
ENV VITE_DIGITRANSIT_API_KEY=$VITE_DIGITRANSIT_API_KEY

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
# (välttämätön, kun lisäämme PHP-proxyn ja sen .htaccess-suojauksen).
RUN a2enmod rewrite \
 && printf '<Directory /var/www/html/>\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>\n' > /etc/apache2/conf-available/allow-htaccess.conf \
 && a2enconf allow-htaccess

# Kopioi staattinen build Apachen DocumentRootiin.
COPY --from=build /app/dist/ /var/www/html/

EXPOSE 80
