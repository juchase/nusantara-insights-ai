const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Sedang menghapus data...");

  // Urutan penting: hapus tabel anak (child) baru tabel induk jika ada relasi
  await prisma.keywordSummary.deleteMany();
  await prisma.review.deleteMany();

  console.log("Data berhasil dibersihkan! ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
