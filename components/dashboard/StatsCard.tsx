import { Card, CardContent } from "@/components/ui/card";

export default function StatsCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-5">
        <p className="text-xs text-gray-400 uppercase">{title}</p>
        <h2 className="text-3xl font-bold mt-2">{value}</h2>
      </CardContent>
    </Card>
  );
}
