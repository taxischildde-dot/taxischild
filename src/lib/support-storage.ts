export type FeedbackCategory = "fehler" | "funktionswunsch" | "abrechnung" | "allgemein";

export type FeedbackEntry = {
  id: string;
  category: FeedbackCategory;
  message: string;
  replyEmail: string;
  createdAt: number;
};

export const FEEDBACK_STORAGE_KEY = "taxiFlotte.feedback";
export const SUPPORT_EMAIL = "support@taxischild.de";

export const categoryLabels: Record<FeedbackCategory, string> = {
  fehler: "Fehler melden",
  funktionswunsch: "Funktionswunsch",
  abrechnung: "Rechnung / Abrechnung",
  allgemein: "Allgemeines Feedback",
};

export function loadFeedbackHistory(): FeedbackEntry[] {
  try {
    const raw = window.localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFeedbackHistory(entries: FeedbackEntry[]) {
  window.localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(entries));
}

export function createFeedbackId(): string {
  return `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Builds a mailto: link that pre-fills subject and body for the official support inbox. */
export function buildSupportMailto(entry: {
  category: FeedbackCategory;
  message: string;
  replyEmail: string;
  vehicleNumber?: string;
  companyName?: string;
}): string {
  const subject = `TaxiSchild – ${categoryLabels[entry.category]}`;
  const bodyLines = [
    entry.message.trim(),
    "",
    "---",
    entry.companyName ? `Unternehmen: ${entry.companyName}` : null,
    entry.vehicleNumber ? `Fahrzeug-Nr.: ${entry.vehicleNumber}` : null,
    entry.replyEmail ? `Antwort an: ${entry.replyEmail}` : null,
  ].filter(Boolean);

  const params = new URLSearchParams({
    subject,
    body: bodyLines.join("\n"),
  });

  return `mailto:${SUPPORT_EMAIL}?${params.toString().replace(/\+/g, "%20")}`;
}
