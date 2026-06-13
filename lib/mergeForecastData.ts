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

  // Masukkan data aktual
  sales.forEach((s) => {
    const date = new Date(s.date).toISOString().split("T")[0];
    map.set(date, { date, actual: s.quantity });
  });

  // Masukkan data prediksi beserta upper/lower bound
  predictions.forEach((p) => {
    const date = new Date(p.predictionDate).toISOString().split("T")[0];

    const point: ForecastDataPoint = {
      date,
      predicted: p.predictedSales,
      // upperBound dan lowerBound tersedia setelah migrasi Prisma
      // Fallback ke undefined jika kolom belum ada
      upper: p.upperBound ?? undefined,
      lower: p.lowerBound ?? undefined,
    };

    if (map.has(date)) {
      // Tanggal overlap (aktual dan prediksi di hari yang sama)
      map.set(date, { ...map.get(date)!, ...point });
    } else {
      map.set(date, point);
    }
  });

  // Sort ascending by date
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}
