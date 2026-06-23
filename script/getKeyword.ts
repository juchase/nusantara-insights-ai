// script/getKeyword.ts
import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

async function main() {
  // Ambil semua data dari KeywordSummary
  const keywords = await prisma.keywordSummary.findMany({
    select: {
      productId: true,
      word: true,
      count: true,
      category: true,
    },
  });

  // Tampilkan semua data di console tanpa terpotong
  console.dir(keywords, { depth: null, maxArrayLength: null });

  // Format output untuk disimpan ke file txt
  const output = keywords
    .map((k) => `${k.productId} | ${k.word} | ${k.count} | ${k.category}`)
    .join("\n");

  // Simpan ke file keywords.txt
  fs.writeFileSync("keywords.txt", output, "utf-8");

  console.log("✅ Semua data berhasil disimpan ke keywords.txt");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
