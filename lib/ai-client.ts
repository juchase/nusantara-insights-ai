export async function predictDemand(sales: number[]) {
  const res = await fetch("http://localhost:8000/predict-demand", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sales }),
  });

  if (!res.ok) {
    throw new Error("AI service error");
  }

  return res.json();
}
