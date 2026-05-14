export function mergeForecastData(sales: any[], predictions: any[]) {
  const map = new Map();

  sales.forEach((s) => {
    const date = new Date(s.date).toISOString().split("T")[0];
    map.set(date, { date, actual: s.quantity });
  });

  predictions.forEach((p) => {
    const date = new Date(p.predictionDate).toISOString().split("T")[0];

    if (map.has(date)) {
      map.get(date).predicted = p.predictedSales;
    } else {
      map.set(date, { date, predicted: p.predictedSales });
    }
  });

  return Array.from(map.values());
}
