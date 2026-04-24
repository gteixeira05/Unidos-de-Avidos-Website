export function withAssetVersion(url: string, versionRaw: string | number | Date): string {
  if (/^https?:\/\//i.test(url)) {
    // URLs remotos (ex.: Cloudinary) já têm versionamento próprio no path.
    return url;
  }
  const version = new Date(versionRaw).getTime();
  if (!Number.isFinite(version) || version <= 0) return url;
  return url.includes("?") ? `${url}&v=${version}` : `${url}?v=${version}`;
}
