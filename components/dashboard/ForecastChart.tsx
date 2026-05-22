type ForecastPoint = {
  date: string;
  actual?: number | null;
  predicted?: number | null;
  confidence?: number;
};

function getDemandAlert(growth: number) {
  if (growth > 20) return "High demand increase expected";
  if (growth > 10) return "Moderate growth expected";
  if (growth < -10) return "Demand may decrease";
  return "Stable demand predicted";
}

export default function ForecastChart({
  data,
  growth,
  confidence,
}: {
  data: ForecastPoint[];
  growth: number;
  confidence: number;
}) {
  const latestActual = [...data].reverse().find((item) => item.actual)?.actual;
  const avgPredicted =
    data
      .filter((item) => item.predicted)
      .reduce((total, item) => total + (item.predicted || 0), 0) /
    Math.max(data.filter((item) => item.predicted).length, 1);

  return (
    <div
      className="flex h-full flex-col justify-between rounded-3xl bg-indigo-600 p-8 text-white shadow-xl shadow-indigo-200"
      style={{
        minHeight: 420,
        borderRadius: 24,
        background:
          "linear-gradient(145deg, #4338ca 0%, #4f46e5 45%, #5b5bf0 100%)",
        boxShadow: "0 22px 38px rgba(79, 70, 229, 0.26)",
      }}
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Demand Forecast</h2>
          <p className="mt-2 text-sm text-white/75">
            Predicted demand based on historical sales trend
          </p>
        </div>

        {/* Growth */}
        <div>
          <p className="text-sm opacity-80">Predicted growth</p>
          <h1 className="mt-2 text-6xl font-bold tracking-tight">
            {growth > 0 ? "+" : ""}
            {growth}%
          </h1>
          <p className="mt-3 text-sm font-medium">{getDemandAlert(growth)}</p>
        </div>

        <div className="mt-4 bg-white/10 rounded-xl p-3">
          <p className="text-sm text-gray-300">Forecast Reliability</p>

          <h3 className="text-2xl font-bold">{confidence.toFixed(1)}%</h3>

          <p className="text-xs text-gray-400 mt-1">
            {confidence >= 80
              ? "🟢 High Accuracy"
              : confidence >= 60
                ? "🟡 Moderate Accuracy"
                : "🔴 Low Accuracy"}
          </p>
        </div>

        <div
          className="grid grid-cols-2 gap-3"
          style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
        >
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.16em] text-white/60">
              Last actual sales
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {latestActual ? latestActual.toLocaleString() : "-"}
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.16em] text-white/60">
              Avg predicted demand
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {avgPredicted ? Math.round(avgPredicted).toLocaleString() : "-"}
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs leading-5 opacity-70">
        Based on historical sales trend using Linear Regression
      </p>
    </div>
  );
}
