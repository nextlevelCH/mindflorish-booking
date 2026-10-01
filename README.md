# Mindflorish Buchungsbestätigung

Statische Dankesseite nach der Buchung des Erstgesprächs, live unter `https://booking.mindflorish.ch`.

- `index.html` ist die deutsche Seite, `en/index.html` die englische unter `/en/`. Beide teilen `assets/site.css` und `assets/site.js`, Texte und Dateinamen unterscheiden sich pro Sprache. Nach CSS- oder JS-Änderungen die Versionsnummer `?v=` in beiden Seiten hochzählen.
- Ein Push auf `main` baut das Image `ghcr.io/nextlevelch/mindflorish-booking:latest` (GitHub Actions).
- Auf dem VPS läuft es im Hostinger Docker-Manager mit `docker-compose.yml`, HTTPS über Traefik.
- Update: Änderung pushen, Build abwarten, im Docker-Manager «Neu bereitstellen».
- DNS: A-Record `booking` bei Hostpoint auf die VPS-IP 69.62.119.147.

## Tracking und Cookie-Banner

- IDs stehen oben in `assets/site.js` (`MF_CONFIG`): Google-Tag `GT-TNP972XG` der Hauptseite, Meta Pixel `1862301615141973`.
- Eigenes Opt-in-Banner: Google und Meta laden erst nach Zustimmung. Auswahl liegt im localStorage (`mf_consent`), der Footer-Link «Cookie-Einstellungen» öffnet sie erneut.
- Buchung zählt nur, wenn der Besuch von Calendly kommt (`?src=calendly`, `invitee_uuid` oder Referrer calendly.com), einmal pro Buchung bzw. 30 Minuten. Google-Event `booking_confirmed`, Meta `Schedule` mit `eventID` = `invitee_uuid`.
- Weitere Events: `video_start`, `video_progress` (50 %), `video_complete`, `questionnaire_download` (Meta: VideoStart, VideoHalf, VideoComplete, QuestionnaireDownload).
- Calendly-Weiterleitung: `https://booking.mindflorish.ch/?src=calendly` bzw. `/en/?src=calendly`. Alle URL-Parameter werden beim Laden sofort entfernt.
- Neue Tracking-Kategorien: `CONSENT_VERSION` in `site.js` erhöhen, dann fragt das Banner erneut.
