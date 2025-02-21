import { appResponse } from '@/utils/response';
import { getModels } from './models';

export interface Model {
  name: string
  provider: string
}

export async function GET(request: Request) {
  return appResponse(async () => {
    return getModels()
  });
}
