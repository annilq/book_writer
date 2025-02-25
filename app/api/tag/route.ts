import { auth } from '@/auth';
import { getPrisma } from '@/utils/prisma';
import { appResponse } from '@/utils/response';

export async function GET(req: Request) {
  const session = await auth()

  return appResponse(async () => {
    const prisma = getPrisma();
    const tags = await prisma.tag.findMany({
      where: {
        creatorId: session?.user?.id
      }
    })
    return tags
  });
}
