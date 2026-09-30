# Mindflorish Buchungsbestätigung

Statische Dankesseite nach der Buchung des Erstgesprächs, live unter `https://booking.mindflorish.ch`.

- `index.html` und `assets/` sind die Seite.
- Ein Push auf `main` baut das Image `ghcr.io/nextlevelch/mindflorish-booking:latest` (GitHub Actions).
- Auf dem VPS läuft es im Hostinger Docker-Manager mit `docker-compose.yml`, HTTPS über Traefik.
- Update: Änderung pushen, Build abwarten, im Docker-Manager «Neu bereitstellen».
- DNS: A-Record `booking` bei Hostpoint auf die VPS-IP 69.62.119.147.
