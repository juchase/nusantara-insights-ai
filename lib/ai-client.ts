export async function analyzeSentiment(text: string) {
  const res = await fetch("http://localhost:8000/analyze-sentiment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  return res.json();
}

export async function generateInsightAI(
  sentiment: any,
  keywords: [string, number][],
) {
  const res = await fetch("http://localhost:8000/generate-insight", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sentiment,
      keywords,
    }),
  });

  return res.json();
}
