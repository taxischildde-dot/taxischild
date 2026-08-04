type RoofSignProps = {
  /** 0 to 3 — number of fields filled in */
  litSegments: number;
};

const TOTAL_SEGMENTS = 3;

/**
 * A stylised taxi roof sign ("Taxischild") — the source of the app's name.
 * Each of its three lamp segments corresponds to one required field; the case
 * glows amber as fields are filled, standing in for a conventional progress bar.
 */
export default function RoofSign({ litSegments }: RoofSignProps) {
  const isFull = litSegments >= TOTAL_SEGMENTS;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`relative rounded-md border-2 px-8 py-4 transition-shadow duration-500 ${
          isFull ? "border-amber shadow-lamp" : "border-line"
        }`}
      >
        <span className="font-display text-4xl font-800 uppercase tracking-signage text-cream">
          Taxi
        </span>
        <span className="absolute -bottom-2 left-1/2 h-2 w-16 -translate-x-1/2 rounded-b-sm bg-line" />
      </div>

      <div className="flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${
              i < litSegments ? "bg-amber" : "bg-line"
            }`}
          />
        ))}
      </div>

      <p className="font-mono text-xs text-muted">
        Einrichtung {litSegments}/{TOTAL_SEGMENTS}
      </p>
    </div>
  );
}
