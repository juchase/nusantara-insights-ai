import { Card, CardContent } from "@/components/ui/card";

export default function ComplaintsCard() {
  const data = [
    { label: "Pengiriman Lambat", count: 422 },
    { label: "Kemasan Rusak", count: 156 },
    { label: "Respon Chat", count: 89 },
  ];

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6 space-y-4">
        <h3 className="font-semibold text-lg">Top Customer Complaints</h3>

        {data.map((item, i) => (
          <div
            key={i}
            className="flex justify-between items-center p-3 rounded-lg bg-muted hover:bg-muted/70 transition"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>

            <span className="text-xs text-muted-foreground">
              {item.count} mentions
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
