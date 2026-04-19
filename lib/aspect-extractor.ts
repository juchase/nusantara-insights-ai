export const aspectMap = [
  {
    label: "pengiriman",
    keywords: ["pengiriman", "kirim", "delivery", "kurir", "lama", "telat"],
  },
  {
    label: "kemasan",
    keywords: ["kemasan", "packing", "bungkus", "box", "rusak"],
  },
  {
    label: "produk",
    keywords: ["produk", "barang", "rasa", "kualitas", "tidak sesuai"],
  },
  {
    label: "pelayanan",
    keywords: ["pelayanan", "respon", "admin", "cs", "seller"],
  },
];

export function extractAspect(text: string): string {
  const lower = text.toLowerCase();

  for (const aspect of aspectMap) {
    if (aspect.keywords.some((k) => lower.includes(k))) {
      return aspect.label;
    }
  }

  return "lainnya";
}
