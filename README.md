# TaxiSchild

Flottenmanagement-Web-App für deutsche Taxiunternehmen. Ein Produkt von **Schild Systems**.

## Über das Projekt

TaxiSchild ist eine White-Label-fähige, rein clientseitige Web-App (kein Backend nötig — alle
Daten liegen im `localStorage` des Geräts) für den täglichen Einsatz im Fahrzeug:

- **Fahrzeug-Einstellungen** — Firmenname (White-Label), Fahrzeug-Nr., Fahrername
- **Fahrtenliste** — Tagesrouten manuell erfassen, Status verfolgen (Geplant/Aktiv/Erledigt/Storniert),
  direkte Routenführung via Google Maps, Storno-Workflow mit Grundangabe
- **Fahrbericht & Stundenzettel** — Kilometerstand (Start/Ende) und Arbeitszeit (inkl. Pause) pro Tag,
  Wochenübersicht, druck-/PDF-fähiger Export für Buchhaltung und Steuer
- **Support & Feedback** — direkter Kontakt zu `support@taxischild.de` sowie ein Schnell-Feedback-Formular

## Design

Die Optik orientiert sich bewusst an der tatsächlichen Farbe deutscher Taxis: **RAL 1015
"Hellelfenbein"** (Creme) statt des in den USA üblichen Gelbs, kombiniert mit Asphaltschwarz und
einem einzelnen Akzent in Kehrmann-Amber — angelehnt an das Leuchtsignal eines Taxischilds (daher
der Produktname). Die Typografie mischt eine kondensierte Signage-Schrift (Big Shoulders Condensed)
mit IBM Plex Sans/Mono für ein an deutsche Beschilderung erinnerndes, technisches Erscheinungsbild.

## Tech-Stack

- [Vite](https://vitejs.dev/) + React 18 + TypeScript
- [React Router](https://reactrouter.com/) für clientseitiges Routing
- [Tailwind CSS](https://tailwindcss.com/) (mobile-first)
- Keine Backend-Abhängigkeit — alle Daten werden lokal im Browser gespeichert

## Lokale Entwicklung

```bash
npm install
npm run dev
```

Production-Build:

```bash
npm run build
npm run preview
```

## Nutzung mit Bolt.new

Dieses Projekt ist als Standard-Vite/React/Tailwind-Projekt aufgebaut und kann direkt als ZIP in
[bolt.new](https://bolt.new) hochgeladen werden. Bolt erkennt `package.json` automatisch, führt
`npm install` aus und startet den Dev-Server (`npm run dev`) im integrierten Vorschaufenster —
kein zusätzliches Setup nötig.

## Projektstruktur

```
src/
  pages/          Bildschirme (Setup, Dashboard, Fahrtenliste, Reports, Support)
  components/      Wiederverwendbare UI-Bausteine
  lib/             localStorage-Helfer und Berechnungslogik (Kilometer, Arbeitszeit, Feedback)
  index.css        Tailwind-Einstieg + Print-Stile
index.html          Lädt Google Fonts clientseitig (Big Shoulders Condensed, IBM Plex Sans/Mono)
```

## Kontakt

Support & Feedback: **support@taxischild.de**
