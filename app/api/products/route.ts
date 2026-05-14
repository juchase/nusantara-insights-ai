import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  return Response.json(products);
}
