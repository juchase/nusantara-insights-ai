// lib/safe-fetch.ts
export async function safeFetch<T>(
  url: string,
  fallback: T,
  options?: RequestInit, // ← tambah parameter opsional
): Promise<T> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}
