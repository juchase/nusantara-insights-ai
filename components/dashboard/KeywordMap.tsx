import { Card, CardContent } from "@/components/ui/card";

export default function KeywordMap({ data }: { data: [string, number][] }) {
  return (
    <Card
      className="h-full rounded-3xl border-slate-100 bg-white py-0 shadow-sm shadow-slate-200/70"
      style={{
        minHeight: 360,
        borderRadius: 24,
        boxShadow: "0 14px 30px rgba(15, 23, 42, 0.06)",
      }}
    >
      <CardContent className="flex h-full flex-col p-7" style={{ padding: 28 }}>
        <h3 className="mb-5 text-2xl font-bold tracking-tight text-slate-950">
          Sentiment Keyword Map
        </h3>

        <div
          className="flex flex-1 flex-wrap items-center justify-center gap-x-6 gap-y-4 rounded-2xl bg-slate-50/70 p-6"
          style={{ minHeight: 250 }}
        >
          {data.map(([word, count], i) => (
            <span
              key={i}
              className="font-bold capitalize"
              style={{
                color: i % 3 === 0 ? "#312e81" : i % 3 === 1 ? "#047857" : "#4f46e5",
                fontSize: `${Math.min(18 + count * 4, 58)}px`,
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
