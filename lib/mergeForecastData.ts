export interface ForecastDataPoint {
  date: string;
  actual?: number;
  predicted?: number;
  upper?: number; // yhat_upper dari Prophet — batas atas uncertainty interval
  lower?: number; // yhat_lower dari Prophet — batas bawah uncertainty interval
}

export function mergeForecastData(
  sales: any[],
  predictions: any[],
): ForecastDataPoint[] {
  const map = new Map<string, ForecastDataPoint>();

  sales.forEach((s) => {
    const date = new Date(s.date).toISOString().split("T")[0];
    map.set(date, { date, actual: s.quantity });
  });

  predictions.forEach((p) => {
    const date = new Date(p.predictionDate).toISOString().split("T")[0];

    const point: ForecastDataPoint = {
      date,
      predicted: p.predictedSales,
      upper: p.upperBound ?? undefined,
      lower: p.lowerBound ?? undefined,
    };

    if (map.has(date)) {
      map.set(date, { ...map.get(date)!, ...point });
    } else {
      map.set(date, point);
    }
  });

  const sorted = Array.from(map.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  if (sorted.length === 0) return sorted;

  // ── FIX: buang outlier tanggal lama yang menyebabkan sumbu X chart
  // melompat (misal gap 4 tahun lalu rapat harian). Ambil hanya jendela
  // kontinu 180 hari terakhir relatif ke tanggal terbaru di data, supaya
  // axis time-series tetap linear dan tidak ada gap besar.
  const MAX_WINDOW_DAYS = 180;
  const latestDate = new Date(sorted[sorted.length - 1].date).getTime();
  const cutoff = latestDate - MAX_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  return sorted.filter((d) => new Date(d.date).getTime() >= cutoff);
}
