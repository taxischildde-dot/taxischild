import { getTenantStorageScope } from "./auth-storage";

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

function getScopedStorageKey(baseKey: string, tenantId?: string): string {
  return `${baseKey}.${tenantId ?? getTenantStorageScope()}`;
}

export const categoryLabels: Record<FeedbackCategory, string> = {
  fehler: "Fehler melden",
  funktionswunsch: "Funktionswunsch",
  abrechnung: "Rechnung / Abrechnung",
  allgemein: "Allgemeines Feedback",
};

export function loadFeedbackHistory(tenantId?: string): FeedbackEntry[] {
  try {
    const scopedKey = getScopedStorageKey(FEEDBACK_STORAGE_KEY, tenantId);
    const legacyRaw = window.localStorage.getItem(FEEDBACK_STORAGE_KEY);
    const raw = window.localStorage.getItem(scopedKey) ?? legacyRaw;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFeedbackHistory(entries: FeedbackEntry[], tenantId?: string) {
  const scopedKey = getScopedStorageKey(FEEDBACK_STORAGE_KEY, tenantId);
  window.localStorage.setItem(scopedKey, JSON.stringify(entries));
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
