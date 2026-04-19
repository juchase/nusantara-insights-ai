// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.keywordSummary.deleteMany();
  await prisma.review.deleteMany();
  // ... kode untuk mengisi data baru (optional)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
