import { Card, CardContent } from "@/components/ui/card";

export default function ComplaintsCard({ data }: { data: [string, number][] }) {
  return (
    <Card
      className="h-full rounded-3xl border-slate-100 bg-white py-0 shadow-sm shadow-slate-200/70"
      style={{
        minHeight: 360,
        borderRadius: 24,
        boxShadow: "0 14px 30px rgba(15, 23, 42, 0.06)",
      }}
    >
      <CardContent
        className="flex h-full flex-col space-y-5 p-7"
        style={{ padding: 28 }}
      >
        <h3 className="text-2xl font-bold tracking-tight text-slate-950">
          Top Customer Complaints
        </h3>

        <div className="flex flex-1 flex-col gap-3">
          {data.map(([word, count], i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-2xl bg-indigo-50/60 p-4 transition hover:bg-indigo-50"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: i === 0 ? "#dc2626" : "#a5b4fc" }}
                />
                <span className="font-semibold capitalize text-slate-900">
                  {word}
                </span>
              </div>

              <span className="text-xs font-semibold text-slate-500">
                {count} mentions
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
