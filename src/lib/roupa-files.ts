import { removeStoredMediaAsset } from "./media/remove-stored-asset";

export async function unlinkPublicRoupaFile(urlPath: string): Promise<void> {
  await removeStoredMediaAsset(urlPath);
}
