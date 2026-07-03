import { prisma } from "../lib/prisma";

// ── WHITELIST keluhan valid — sama persis dengan keyword_service.py ──────────
// dan upload-dataset/route.ts. Hanya kata yang benar-benar mengindikasikan
// masalah spesifik yang dihitung — bukan kata generik seperti "produk", "sangat"
const VALID_COMPLAINT_KEYWORDS = new Set([
  "pengiriman",
  "kualitas",
  "harga",
  "kemasan",
  "pelayanan",
  "expired",
  "bocor",
  "tumpah",
  "plastik",
  "rusak",
  "cacat",
  "lambat",
  "lama",
  "mahal",
  "apek",
  "basi",
  "kotor",
  "lecet",
  "pecah",
  "retak",
  "penyok",
  "basah",
  "robek",
  "kurang",
  "salah",
  "palsu",
  "tiruan",
  "berbeda",
]);

async function main() {
  console.log("🚀 Rebuilding keyword summary untuk semua produk...");

  // ── Hapus semua keyword lama dulu — bersih dari logika lama ───────────────
  const deleted = await prisma.keywordSummary.deleteMany({});
  console.log(`🗑️  Dihapus ${deleted.count} keyword lama`);

  // ── Ambil semua produk yang punya review ───────────────────────────────────
  const products = await prisma.product.findMany({
    select: { id: true, name: true },
  });

  console.log(`📦 Memproses ${products.length} produk...`);
  console.log("=".repeat(60));

  let totalKeywords = 0;

  for (const [idx, product] of products.entries()) {
    console.log(`\n[${idx + 1}/${products.length}] ${product.name}`);

    // ── Hanya ulasan negative atau neutral yang dianalisis ──────────────────
    // Ulasan positif tidak relevan untuk analisis keluhan
    const reviews = await prisma.review.findMany({
      where: {
        productId: product.id,
        sentiment: { in: ["negative", "neutral"] },
      },
      select: { reviewText: true },
    });

    if (reviews.length === 0) {
      console.log("   ⚠️  Tidak ada ulasan negative/neutral, dilewati");
      continue;
    }

    const wordCount: Record<string, number> = {};

    reviews.forEach((r) => {
      const words = r.reviewText
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .split(/\s+/);

      words.forEach((word) => {
        const cleanWord = word.trim();
        // WAJIB ada di whitelist — bukan sekadar lolos dari stopword
        if (VALID_COMPLAINT_KEYWORDS.has(cleanWord)) {
          wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
        }
      });
    });

    // Top 5 keluhan paling spesifik per produk
    const sortedWords = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (sortedWords.length === 0) {
      console.log("   ✅ Tidak ada keluhan spesifik terdeteksi");
      continue;
    }

    for (const [word, count] of sortedWords) {
      await prisma.keywordSummary.create({
        data: {
          productId: product.id,
          word,
          count,
        },
      });
    }

    console.log(
      `   ✅ ${sortedWords.length} keluhan: ${sortedWords.map(([w, c]) => `${w}(${c})`).join(", ")}`,
    );
    totalKeywords += sortedWords.length;
  }

  console.log("\n" + "=".repeat(60));
  console.log(
    `🎉 Selesai! ${totalKeywords} keyword tersimpan untuk ${products.length} produk`,
  );
}

main()
  .catch((e) => {
    console.error("❌ ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
