import { DailyReport, workedMinutes, formatHoursLabel } from "../lib/reports-storage";

type HoursCardProps = {
  report: DailyReport;
  onChange: (report: DailyReport) => void;
};

const breakPresets = [0, 15, 30, 45, 60];

export default function HoursCard({ report, onChange }: HoursCardProps) {
  const minutes = workedMinutes(report);

  const setTime = (field: "workStart" | "workEnd") => (value: string) =>
    onChange({ ...report, [field]: value });

  const setBreak = (value: number | null) => onChange({ ...report, breakMinutes: value });

  return (
    <div className="rounded-lg border border-line bg-panel p-4 print:border-black print:bg-white">
      <h2 className="font-display text-lg font-700 uppercase tracking-wide text-cream print:text-black">
        Stundenzettel
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="workStart" className="font-mono text-[11px] uppercase tracking-signage text-muted">
            Arbeitsbeginn
          </label>
          <input
            id="workStart"
            type="time"
            value={report.workStart}
            onChange={(e) => setTime("workStart")(e.target.value)}
            className="rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream outline-none focus:border-amber"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="workEnd" className="font-mono text-[11px] uppercase tracking-signage text-muted">
            Arbeitsende
          </label>
          <input
            id="workEnd"
            type="time"
            value={report.workEnd}
            onChange={(e) => setTime("workEnd")(e.target.value)}
            className="rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream outline-none focus:border-amber"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-signage text-muted">
          Pause (Minuten)
        </span>
        <div className="flex flex-wrap gap-2">
          {breakPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setBreak(preset)}
              className={`flex h-11 min-w-11 items-center justify-center rounded-full border px-3.5 font-mono text-sm transition-colors ${
                report.breakMinutes === preset
                  ? "border-amber bg-amber text-asphalt"
                  : "border-line text-muted"
              }`}
            >
              {preset}
            </button>
          ))}
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={5}
            placeholder="Andere"
            value={
              report.breakMinutes != null && !breakPresets.includes(report.breakMinutes)
                ? report.breakMinutes
                : ""
            }
            onChange={(e) => setBreak(e.target.value === "" ? null : Number(e.target.value))}
            className="h-11 w-24 rounded-full border border-line bg-asphalt px-3.5 text-center font-mono text-sm text-cream outline-none focus:border-amber"
          />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between rounded-md border border-dashed border-line px-3 py-2.5 print:border-black">
        <span className="font-mono text-[11px] uppercase tracking-signage text-muted print:text-black">
          Arbeitszeit gesamt
        </span>
        <span className="font-mono text-xl text-amber print:text-black">
          {formatHoursLabel(minutes)}
        </span>
      </div>
    </div>
  );
}
