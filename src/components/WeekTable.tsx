import {
  DailyReport,
  distanceKm,
  workedMinutes,
  formatHoursLabel,
  formatDateShort,
  getReport,
} from "../lib/reports-storage";

type WeekTableProps = {
  weekDates: string[];
  reports: DailyReport[];
  selectedDate: string;
};

export default function WeekTable({ weekDates, reports, selectedDate }: WeekTableProps) {
  const rows = weekDates.map((date) => {
    const r = getReport(reports, date);
    return { date, km: distanceKm(r), minutes: workedMinutes(r) };
  });

  const totalKm = rows.reduce((sum, row) => sum + (row.km ?? 0), 0);
  const totalMinutes = rows.reduce((sum, row) => sum + (row.minutes ?? 0), 0);

  return (
    <table className="w-full border-collapse font-mono text-sm">
      <thead>
        <tr className="border-b border-line print:border-black">
          <th className="py-2 text-left font-mono text-[11px] uppercase tracking-signage text-muted print:text-black">
            Tag
          </th>
          <th className="py-2 text-right font-mono text-[11px] uppercase tracking-signage text-muted print:text-black">
            km
          </th>
          <th className="py-2 text-right font-mono text-[11px] uppercase tracking-signage text-muted print:text-black">
            Arbeitszeit
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.date}
            className={`border-b border-line/60 print:border-black/40 ${
              row.date === selectedDate
                ? "text-amber print:text-black print:font-700"
                : "text-cream print:text-black"
            }`}
          >
            <td className="py-2">{formatDateShort(row.date)}</td>
            <td className="py-2 text-right">{row.km != null ? row.km : "—"}</td>
            <td className="py-2 text-right">{formatHoursLabel(row.minutes)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td className="pt-3 font-700 uppercase tracking-signage text-cream print:text-black">
            Summe
          </td>
          <td className="pt-3 text-right font-700 text-cream print:text-black">{totalKm} km</td>
          <td className="pt-3 text-right font-700 text-cream print:text-black">
            {formatHoursLabel(totalMinutes)}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
