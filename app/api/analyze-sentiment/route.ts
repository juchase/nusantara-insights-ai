export async function POST(req: Request) {
  const { text } = await req.json();

  const response = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/analyze" ||
      "http://127.0.0.1:8000/analyze",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    },
  );

  const data = await response.json();

  return Response.json(data);
}
