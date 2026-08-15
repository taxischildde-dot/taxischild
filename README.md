# TaxiSchild

Das digitale Fahrtenbuch für Taxiunternehmen – ein Progressive Web App (PWA) zur
Verwaltung von Buchungen, Fahrern, Fuhrpark und Berichten als vollständiger
Ersatz für das Papier-Fahrtenbuch.

Gebaut mit **Vite + React + TypeScript + Tailwind CSS**.

## Funktionen

- **Schnelle Fahrtenerfassung** ("Neue Fahrt"): Kunde, Abholort, Ziel, Termin
  und Preis in einem kompakten Formular mit minimaler Klickanzahl. Optional:
  abweichende Fälligkeitszeit ("Fällig bis") und ein Ziel-Kürzel (z. B. "ROW"),
  wie es in Fahrplänen von Auftraggebern üblich ist.
- **Flexible Disposition**: Fahrten können ohne Fahrer angelegt und später
  zugewiesen werden ("Nicht zugewiesen"-Filter + Ein-Klick-Zuweisung),
  jederzeit bearbeitet (Zeit, Adresse, Fahrer, Fahrzeug) oder storniert
  werden — auch für zukünftige, im Voraus geplante Fahrten. Für eine
  Stornierung ist ein Stornierungsgrund erforderlich und wird in der
  Fahrtenkarte gespeichert.
- **Zwei Erfassungswege pro Fahrt** – jede Fahrt hat immer einen zugewiesenen
  Fahrer, sobald sie disponiert wurde. Die Zentrale kann eine Fahrt zunächst
  bewusst unzugewiesen lassen; bei Direktanrufen erfasst der Fahrer sie selbst
  (`entrySource: 'central' | 'driver_phone'`).
- **Mandantenfähigkeit & Rollen**: Jedes Unternehmen (Mandant) sieht
  ausschließlich seine eigenen Daten. Innerhalb eines Unternehmens gibt es die
  Rollen **Geschäftsführung (admin)** und **Fahrer (driver)** – Fahrer sehen
  nur ihre eigenen Fahrten, die Geschäftsführung sieht alles.
- **Erweiterte Fahrerprofile**: Fahrer-Nr., Führerschein-/Beförderungsschein-Typ
  und Arbeitstage (damit an freien Tagen keine Fahrten zugewiesen werden).
- **Fuhrparkverwaltung**: Fahrzeuge mit Kennzeichen, Modell, technischem
  Status und zugewiesenem Fahrer.
- **Tagesabschluss für Fahrer**: Kilometerstand (Start/Ende) und Arbeitszeit
  (Beginn/Ende/Pause) direkt im Dashboard erfassen — Grundlage für die
  folgenden zwei automatischen Berichte.
- **Fahrbericht (Tagesbericht)**: PDF je Fahrer und Tag mit Fahrtenliste
  (Von/Nach/Preis/Ziel-Kürzel), Kilometerständen sowie leeren Feldern für
  Unterschrift und Firmenstempel zum Ausdrucken.
- **Stundenzettel (Monatsbericht)**: PDF je Fahrer und Monat mit
  Arbeitszeiten, Pausen und Monatssumme.
- **Erinnerungen**: Beim Öffnen der App wird einmal täglich per
  Browser-Benachrichtigung auf anstehende Fahrten für den nächsten Tag
  hingewiesen (siehe Hinweis zu Push-Benachrichtigungen unten); zusätzlich
  zeigt das Dashboard eine "Morgen anstehend"-Übersicht.
- **Berichte & PDF-Export**: Finanzübersicht nach Tag/Woche/Monat sowie
  Export als PDF-Bericht für die Buchhaltung.
- **Mobile-first UI** im TaxiSchild-Design (Creme/RAL 1015, Asphaltschwarz,
  Amber) mit Bottom-Tab-Navigation für die Bedienung im Fahrzeug.
- **PWA**: installierbar auf dem Homescreen, funktioniert auch mit
  eingeschränkter Internetverbindung.

## Schnellstart (lokal)

```bash
npm install
npm run dev
```

Öffnen Sie anschließend `http://localhost:5173`. Auf der Login-Seite können
Sie über **"Mit Beispieldaten testen"** sofort ein Demo-Unternehmen mit
Fahrern, Fahrzeugen und Fahrten laden (Demo-Login: `chef@taxi-demo.de` /
`123456`).

## Build für Produktion

```bash
npm run build
npm run preview   # optional: Produktion lokal testen
```

Das Build-Ergebnis liegt danach in `dist/`.

## Deployment auf Vercel

1. Repository auf GitHub pushen.
2. In Vercel: **New Project** → Repository importieren.
3. Framework Preset: **Vite** (wird automatisch erkannt).
4. Build Command: `npm run build`, Output Directory: `dist` (Standard).
5. Deploy – fertig. Die `vercel.json` sorgt dafür, dass alle Routen
   (React Router) korrekt auf `index.html` umgeleitet werden.

Es sind **keine Umgebungsvariablen** notwendig, da die App aktuell vollständig
mit lokalem Speicher (`localStorage`) arbeitet.

## Architektur & Datenhaltung

Die gesamte Datenschicht ist bewusst hinter einer einzigen Datei gekapselt:
**`src/lib/db.ts`**. Sie kapselt alle Lese-/Schreibzugriffe (Unternehmen,
Nutzer, Fahrten, Fahrzeuge) hinter klaren Funktionen mit denselben
TypeScript-Typen aus `src/types/index.ts`.

Aktuell speichert `src/lib/storage.ts` die Daten im `localStorage` des
Browsers – pro Gerät, nicht geräteübergreifend synchronisiert. Für eine
spätere Anbindung an eine Cloud-Datenbank (z. B. **Supabase**) genügt es,
ausschließlich den Inhalt von `db.ts` (und optional `storage.ts`) durch
Supabase-Client-Aufrufe zu ersetzen – keine Seite oder Komponente muss dafür
angepasst werden, da sie ausschließlich mit `db.*` arbeiten.

> **Wichtige Sicherheitsgrenze:** Die aktuelle App ist eine Offline-PWA. Die
> `companyId`-Prüfungen in `db.ts` und die Rollenlogik verhindern versehentliche
> Vermischung von Daten in der Oberfläche und in lokalen Exporten. Sie sind
> jedoch **keine kryptografische oder serverseitig erzwungene Mandantentrennung**:
> Browser-`localStorage` kann von einer Person mit Zugriff auf das Gerät über
> Entwicklertools eingesehen oder verändert werden, und die lokale
> E-Mail/Passwort-Anmeldung ist keine produktive Identitätsverwaltung. Für
> mehrere reale Unternehmen, geräteübergreifende Nutzung oder rechtlich
> belastbare Zugriffskontrollen sind ein Authentifizierungsdienst und eine
> Datenbank mit serverseitiger Mandantenprüfung (z. B. Supabase Auth + RLS)
> erforderlich.

```
src/
├─ types/          Zentrale TypeScript-Datenmodelle
├─ lib/            db.ts (Datenzugriff), storage.ts, format.ts, labels.ts, pdf.ts, reminders.ts
├─ context/        AuthContext (Login, Registrierung, Sitzungen, Rollen)
├─ components/
│  ├─ layout/      AppLayout, BottomNav, TopBar
│  ├─ ui/          Button, Card, Field/Input/Select, Modal, Icons
│  ├─ trips/       TripCard, TripForm, AssignDriverModal
│  ├─ fleet/       VehicleCard
│  ├─ dashboard/   StatCard, DailyLogCard
│  └─ reports/     FahrberichtCard, StundenzettelCard
├─ pages/          Login, Register, Dashboard, Trips, NewTrip, Fleet, Reports, Support, Settings
└─ seed/           Demo-Datengenerator
```

## Hinweis zum PDF-Export

Die Bibliothek `jsPDF` unterstützt keine automatische Rechts-nach-links- oder
Schriftverbindungs-Darstellung für nicht-lateinische Schriften. Da die App
und ihre Buchhaltungsberichte ohnehin auf Deutsch ausgelegt sind, ist dies
für den produktiven Einsatz unkritisch – der PDF-Bericht wird zuverlässig
und korrekt mit lateinischer Schrift erzeugt.

## Hinweis zu Erinnerungen/Benachrichtigungen

Echte Hintergrund-Push-Benachrichtigungen (die auch bei vollständig
geschlossener App ankommen) erfordern einen eigenen Push-Server mit
Service-Worker-Subscriptions (z. B. via Web-Push/VAPID) – das ist ohne
Backend nicht möglich. TaxiSchild löst das pragmatisch: Beim Öffnen der App
wird geprüft, ob für den nächsten Tag Fahrten geplant sind, und bei erteilter
Berechtigung einmal täglich eine lokale Browser-Benachrichtigung angezeigt.
Zusätzlich zeigt das Dashboard unabhängig von der Berechtigung immer einen
Hinweisbanner für morgen anstehende Fahrten. Für zuverlässige
Hintergrund-Push-Benachrichtigungen wäre in einem späteren Schritt ein
kleiner Push-Server (z. B. über Supabase Edge Functions) nötig.

## Datenmodell: Tagesabschluss (DailyLog)

Ein `DailyLog`-Eintrag (ein Datensatz je Fahrer und Tag) bildet sowohl die
Kilometerstände für den **Fahrbericht** als auch die Arbeitszeiten für den
**Stundenzettel** ab. Fahrer pflegen ihn über die Karte "Tagesabschluss" auf
dem Dashboard; die Geschäftsführung wertet ihn über "Berichte → Fahrer-
Dokumente" aus und exportiert ihn dort als PDF.

## Nächste mögliche Schritte

- Anbindung an Supabase (Auth + Postgres) anstelle von `localStorage`.
- Echter Push-Server für Hintergrund-Erinnerungen (siehe Hinweis oben).
- Mehrsprachigkeit (aktuell: Deutsch).
