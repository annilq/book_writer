import { appResponse } from '@/utils/response';
import { getModels } from './models';

export async function GET(request: Request) {
  return appResponse(async () => {
    return getModels()
  });
}
