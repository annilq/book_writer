import { getPrisma } from '@/utils/prisma';
import { appResponse } from '@/utils/response';

export async function GET(request: Request) {
  return appResponse(async () => {
    const prisma = getPrisma();
    const categories = await prisma.category.findMany({})
    return categories
  });
}
