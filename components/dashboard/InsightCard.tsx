import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function InsightCard({ text }: { text: string }) {
  return (
    <Card className="rounded-2xl border-green-200 bg-green-50">
      <CardContent className="p-6 flex gap-3">
        <Sparkles className="text-green-500 mt-1" />

        <div>
          <p className="text-xs font-bold text-green-600 uppercase mb-1">
            AI SMART INSIGHT
          </p>

          <p className="text-lg">{text}</p>
        </div>
      </CardContent>
    </Card>
  );
}
