import { Card, CardContent } from "@/components/ui/card";

export default function StatsCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <Card
      className="rounded-3xl border-slate-100 bg-white py-0 shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/80"
      style={{
        minHeight: 132,
        borderRadius: 24,
        backgroundColor: "#ffffff",
        boxShadow: "0 14px 30px rgba(15, 23, 42, 0.06)",
      }}
    >
      <CardContent className="p-7" style={{ padding: 28 }}>
        <div className="mb-5 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            {title}
          </p>
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-300" />
        </div>

        <div className="flex items-end gap-3">
          <h2 className="text-4xl font-bold tracking-tight text-slate-950">
            {value}
          </h2>
          {title === "Total Reviews" && (
            <span className="mb-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
              Live
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
