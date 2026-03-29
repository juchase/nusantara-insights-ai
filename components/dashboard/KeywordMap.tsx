import { Card, CardContent } from "@/components/ui/card";

export default function KeywordMap() {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6">
        <h3 className="font-semibold text-lg mb-4">Sentiment Keyword Map</h3>

        <div className="flex flex-wrap justify-center items-center gap-4 h-56">
          <span className="text-5xl font-bold text-primary">Original</span>
          <span className="text-2xl text-green-600">Terjangkau</span>
          <span className="text-xl text-muted-foreground">Pengiriman</span>
          <span className="text-3xl text-primary/70">Kualitas</span>
          <span className="text-lg text-muted-foreground">Warna</span>
        </div>
      </CardContent>
    </Card>
  );
}
