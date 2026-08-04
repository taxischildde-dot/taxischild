import { TripStatus, statusLabels } from "../lib/trips-storage";

const styles: Record<TripStatus, string> = {
  geplant: "border-line text-muted",
  aktiv: "border-amber bg-amber text-asphalt",
  erledigt: "border-cream/40 text-cream",
  storniert: "border-alert text-alert",
};

export default function StatusBadge({ status }: { status: TripStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] font-600 uppercase tracking-signage ${styles[status]}`}
    >
      {status === "erledigt" && "✓ "}
      {statusLabels[status]}
    </span>
  );
}
