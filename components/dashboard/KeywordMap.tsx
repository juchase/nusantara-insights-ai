import { Card, CardContent } from "@/components/ui/card";

export default function KeywordMap({ data }: { data: [string, number][] }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6">
        <h3 className="font-semibold text-lg mb-4">Sentiment Keyword Map</h3>

        <div className="flex flex-wrap justify-center items-center gap-4 h-56">
          {data.map(([word, count], i) => (
            <span
              key={i}
              className={`font-bold text-primary`}
              style={{
                fontSize: `${Math.min(16 + count * 2, 48)}px`,
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
