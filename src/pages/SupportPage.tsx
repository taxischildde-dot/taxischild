import React, { useState } from 'react';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { ChevronIcon, SupportIcon } from '../components/ui/Icons';
import { useAuth } from '../context/AuthContext';

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'Wie erfasse ich schnell eine neue Fahrt?',
    a: 'Tippen Sie unten auf das amberfarbene „+“ oder auf „Neue Fahrt“ auf der Startseite. Geben Sie Kundenname, Abholort, Ziel und Preis ein und speichern Sie — das Formular ist auf möglichst wenige Klicks ausgelegt.',
  },
  {
    q: 'Was ist der Unterschied zwischen „Zentrale“ und „Direktanruf beim Fahrer“?',
    a: 'Trägt die Geschäftsführung oder die Zentrale die Fahrt ein, wird sie als „Zentrale“ erfasst. Ruft der Kunde direkt beim Fahrer an und dieser trägt die Fahrt selbst über sein Telefon ein, wird sie als „Direktanruf beim Fahrer“ markiert — in beiden Fällen bleibt die Fahrt für alle sichtbar.',
  },
  {
    q: 'Kann ein Fahrer die Fahrten anderer Fahrer sehen?',
    a: 'Nein. Jeder Fahrer sieht ausschließlich seine eigenen Fahrten, während die Geschäftsführung alle Fahrten sämtlicher Fahrer und Fahrzeuge einsehen kann.',
  },
  {
    q: 'Wie erstelle ich einen Bericht für die Buchhaltung?',
    a: 'Wählen Sie im Bereich „Berichte“ den gewünschten Zeitraum (heute, Woche, Monat oder alle) und tippen Sie auf „PDF-Bericht exportieren“. Die Datei wird sofort heruntergeladen und ist druckfertig.',
  },
  {
    q: 'Bleiben meine Daten erhalten, wenn ich den Browser schließe?',
    a: 'Ja, alle Daten werden lokal auf Ihrem Gerät gespeichert. Zusätzlich können Sie in den Einstellungen jederzeit eine Sicherungskopie herunterladen.',
  },
  {
    q: 'Kann ich die App auf dem Startbildschirm installieren?',
    a: 'Ja, TaxiSchild ist eine Progressive Web App (PWA) — wählen Sie in Ihrem Browser „Zum Startbildschirm hinzufügen“, damit die App wie eine eigenständige Anwendung funktioniert, auch ohne durchgehende Internetverbindung.',
  },
];

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-cream-400/50 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
      >
        <span className="text-sm font-bold text-ink">{q}</span>
        <ChevronIcon
          width={16}
          height={16}
          className={`shrink-0 text-ink/40 transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>
      {open && <p className="pb-3.5 text-sm leading-relaxed text-ink/60">{a}</p>}
    </div>
  );
}

export default function SupportPage() {
  const { company } = useAuth();
  return (
    <div>
      <TopBar title="Support" subtitle="Häufige Fragen & direkter Kontakt" />

      <div className="space-y-4 px-4 pt-4 pb-6">
        <Card className="flex items-center gap-3 bg-asphalt-900 text-cream-100">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-asphalt-950">
            <SupportIcon width={20} height={20} />
          </div>
          <div>
            <p className="font-display text-sm font-bold">Sofortige Hilfe benötigt?</p>
            <p className="text-xs text-cream-100/60">Unser Support-Team ist jederzeit für Sie da</p>
          </div>
        </Card>

        <a
          href="mailto:support@taxischild.de"
          className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3.5 font-display font-bold text-asphalt-950 transition hover:bg-amber-500"
        >
          support@taxischild.de
        </a>

        <Card padded={false} className="divide-y divide-cream-400/50 px-4">
          {FAQ.map((item) => (
            <AccordionItem key={item.q} {...item} />
          ))}
        </Card>

        <p className="text-center text-xs text-ink/35">{company?.name ?? 'TaxiSchild'} — Version 1.0.0</p>
      </div>
    </div>
  );
}
