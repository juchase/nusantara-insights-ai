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
