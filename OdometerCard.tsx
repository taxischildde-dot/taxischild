import { DailyReport, distanceKm } from "../lib/reports-storage";

type OdometerCardProps = {
  report: DailyReport;
  onChange: (report: DailyReport) => void;
};

export default function OdometerCard({ report, onChange }: OdometerCardProps) {
  const km = distanceKm(report);
  const invalid = report.startKm != null && report.endKm != null && report.endKm < report.startKm;

  const setField = (field: "startKm" | "endKm") => (value: string) => {
    const num = value === "" ? null : Number(value);
    onChange({ ...report, [field]: Number.isNaN(num as number) ? null : num });
  };

  return (
    <div className="rounded-lg border border-line bg-panel p-4 print:border-black print:bg-white">
      <h2 className="font-display text-lg font-700 uppercase tracking-wide text-cream print:text-black">
        Kilometerstand
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="startKm" className="font-mono text-[11px] uppercase tracking-signage text-muted">
            Start
          </label>
          <input
            id="startKm"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="0"
            value={report.startKm ?? ""}
            onChange={(e) => setField("startKm")(e.target.value)}
            className="rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream outline-none focus:border-amber"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="endKm" className="font-mono text-[11px] uppercase tracking-signage text-muted">
            Ende
          </label>
          <input
            id="endKm"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="0"
            value={report.endKm ?? ""}
            onChange={(e) => setField("endKm")(e.target.value)}
            className="rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream outline-none focus:border-amber"
          />
        </div>
      </div>

      {invalid && (
        <p className="mt-2 font-mono text-xs text-alert">
          Endstand muss größer als der Startstand sein.
        </p>
      )}

      <div className="mt-4 flex items-baseline justify-between rounded-md border border-dashed border-line px-3 py-2.5 print:border-black">
        <span className="font-mono text-[11px] uppercase tracking-signage text-muted print:text-black">
          Gesamtkilometer
        </span>
        <span className="font-mono text-xl text-amber print:text-black">
          {km != null ? `${km} km` : "—"}
        </span>
      </div>
    </div>
  );
}
