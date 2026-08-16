# TaxiSchild – Leitfaden für den produktiven SaaS-Betrieb mit Supabase

Dieser Leitfaden beschreibt, wie TaxiSchild von einer lokalen Offline-PWA auf eine mandantenfähige SaaS-Infrastruktur mit Supabase (PostgreSQL + Auth + RLS) umgestellt wird, um den sicheren Betrieb für deutsche Taxiunternehmen zu gewährleisten.

## 1. Datenbank-Schema in Supabase einrichten

Öffnen Sie Ihr Supabase-Projekt Dashboard, wechseln Sie zum **SQL Editor**, und führen Sie den Inhalt der Datei `supabase_schema.sql` aus. 

Das Skript erstellt:
- Die Tabelle `companies` zur Mandantentrennung (Multi-Tenancy).
- Die Tabelle `profiles` für Administratoren und Fahrer mit fester Zuordnung zu einer Firma.
- Die Tabelle `driver_invites` für sichere Fahrereinladungen.
- Die Tabellen `vehicles`, `vehicle_drivers`, `trips` und `daily_logs`.
- Aktivierte **Row Level Security (RLS)** mit strikten Richtlinien, sodass kein Benutzer Daten aus einer anderen Firma einsehen oder bearbeiten kann.

## 2. Umgebungsvariablen in Vercel / Produktion hinterlegen

Fügen Sie in Ihren Hosting-Einstellungen (z. B. Vercel Project Settings → Environment Variables) folgende Variablen hinzu:

- `VITE_SUPABASE_URL`: Die Projekt-URL aus Ihren Supabase API-Einstellungen.
- `VITE_SUPABASE_ANON_KEY`: Der öffentliche Publishable/Anon Key für den Client-Zugriff.

Es werden keine Service-Role-Schlüssel im Frontend verwendet.

## 3. Onboarding der ersten Pilotunternehmen

1. **Registrierung des Unternehmens**: Über die Registrierungsseite erstellt das erste Firmenkonto automatisch den Mandanten (`companies`) und den Administrator-Account (`profiles` mit Rolle `admin`).
2. **Einladung von Fahrern**: Über den Einstellungsbereich kann die Geschäftsführung Fahrer anlegen und Zugangsdaten sicher übergeben.
3. **Fahrten und Fuhrpark**: Die Zentrale verwaltet Fahrzeuge, weist den Fahrern Fahrten oder Fahrzeuge zu, und erfasst Statusänderungen live.

## 4. Datenschutz und DSGVO-Konformität (Deutschland)

- **Auftragsverarbeitung (AVV)**: Schließen Sie über Ihr Supabase-Dashboard einen AVV-Vertrag ab (ab dem Pro-Plan oder gemäss den aktuellen EU-Richtlinien von Supabase mit Standardvertragsklauseln).
- **Hosting-Standort**: Wählen Sie bei der Projekterstellung in Supabase die Region Frankfurt (EU Central), um die Datenverarbeitung innerhalb der Europäischen Union sicherzustellen.
