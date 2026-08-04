import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BrandFooter from "../components/BrandFooter";
import { loadSetup, TaxiSetup, emptySetup } from "../lib/setup-storage";
import {
  FeedbackCategory,
  FeedbackEntry,
  SUPPORT_EMAIL,
  buildSupportMailto,
  categoryLabels,
  createFeedbackId,
  loadFeedbackHistory,
  saveFeedbackHistory,
} from "../lib/support-storage";

const categories: FeedbackCategory[] = ["fehler", "funktionswunsch", "abrechnung", "allgemein"];

export default function SupportPage() {
  const [setup, setSetup] = useState<TaxiSetup>(emptySetup);
  const [history, setHistory] = useState<FeedbackEntry[]>([]);
  const [category, setCategory] = useState<FeedbackCategory>("fehler");
  const [message, setMessage] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSetup(loadSetup());
    setHistory(loadFeedbackHistory());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveFeedbackHistory(history);
  }, [history, hydrated]);

  const canSubmit = message.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const entry: FeedbackEntry = {
      id: createFeedbackId(),
      category,
      message: message.trim(),
      replyEmail: replyEmail.trim(),
      createdAt: Date.now(),
    };

    const mailto = buildSupportMailto({
      category,
      message: entry.message,
      replyEmail: entry.replyEmail,
      companyName: setup.companyName,
      vehicleNumber: setup.vehicleNumber,
    });

    setHistory((prev) => [entry, ...prev]);
    window.location.href = mailto;

    setMessage("");
    setReplyEmail("");
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — the email is still visible and selectable.
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8 sm:py-10">
      <header className="mb-6 flex items-start justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-signage text-muted">Hilfe</p>
          <h1 className="font-display text-2xl font-700 uppercase tracking-wide text-cream">
            Support &amp; Feedback
          </h1>
        </div>
        <Link
          to="/dashboard"
          className="flex h-10 shrink-0 items-center rounded-md border border-line px-3 font-mono text-xs uppercase tracking-signage text-muted transition-colors hover:border-amber hover:text-amber"
        >
          Dashboard
        </Link>
      </header>

      {/* Direct contact — the official support channel */}
      <div className="rounded-lg border border-amber bg-panel p-4">
        <p className="font-mono text-[10px] uppercase tracking-signage text-muted">
          Offizieller Support-Kontakt
        </p>
        <p className="mt-1 font-mono text-lg text-cream">{SUPPORT_EMAIL}</p>
        <p className="mt-2 text-sm text-muted">
          Für dringende Anliegen, Reklamationen oder allgemeine Fragen erreichen Sie unser Team
          direkt per E-Mail.
        </p>
        <div className="mt-4 flex gap-2">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex h-12 flex-1 items-center justify-center rounded-md bg-amber font-mono text-sm font-600 uppercase tracking-signage text-asphalt"
          >
            E-Mail schreiben
          </a>
          <button
            type="button"
            onClick={copyEmail}
            className="flex h-12 items-center justify-center rounded-md border border-line px-4 font-mono text-sm uppercase tracking-signage text-muted hover:border-amber hover:text-amber"
          >
            {copied ? "Kopiert ✓" : "Kopieren"}
          </button>
        </div>
      </div>

      {/* Quick in-app feedback form */}
      <form
        onSubmit={handleSubmit}
        className="mt-5 flex flex-col gap-5 rounded-lg border border-line bg-panel p-4"
      >
        <h2 className="font-display text-lg font-700 uppercase tracking-wide text-cream">
          Schnelles Feedback
        </h2>
        <p className="-mt-3 text-sm text-muted">
          Öffnet Ihr E-Mail-Programm mit einer vorausgefüllten Nachricht an unser Support-Team.
        </p>

        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] uppercase tracking-signage text-muted">
            Kategorie
          </span>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`flex h-11 items-center rounded-full border px-4 font-mono text-sm transition-colors ${
                  category === c ? "border-amber bg-amber text-asphalt" : "border-line text-muted"
                }`}
              >
                {categoryLabels[c]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="message" className="font-mono text-[11px] uppercase tracking-signage text-muted">
            Nachricht
          </label>
          <textarea
            id="message"
            rows={4}
            required
            placeholder="Beschreiben Sie kurz, worum es geht …"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="resize-none rounded-md border border-line bg-asphalt px-3 py-3 text-base text-cream placeholder:text-muted/50 outline-none focus:border-amber"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="replyEmail" className="font-mono text-[11px] uppercase tracking-signage text-muted">
            Ihre E-Mail (optional, für Rückfragen)
          </label>
          <input
            id="replyEmail"
            type="email"
            placeholder="name@beispiel.de"
            value={replyEmail}
            onChange={(e) => setReplyEmail(e.target.value)}
            className="rounded-md border border-line bg-asphalt px-3 py-3 text-base text-cream placeholder:text-muted/50 outline-none focus:border-amber"
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="h-14 w-full rounded-md bg-amber font-display text-lg font-700 uppercase tracking-signage text-asphalt transition-opacity disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
        >
          Per E-Mail senden
        </button>
      </form>

      {history.length > 0 && (
        <div className="mt-5">
          <h2 className="mb-2 font-mono text-[11px] uppercase tracking-signage text-muted">
            Ihre bisherigen Meldungen
          </h2>
          <div className="flex flex-col gap-2">
            {history.slice(0, 5).map((entry) => (
              <div key={entry.id} className="rounded-md border border-line bg-panel px-3 py-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xs uppercase tracking-signage text-amber">
                    {categoryLabels[entry.category]}
                  </span>
                  <span className="font-mono text-[10px] text-muted">
                    {new Date(entry.createdAt).toLocaleDateString("de-DE")}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-cream">{entry.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <BrandFooter />
    </main>
  );
}
