export function withAssetVersion(url: string, versionRaw: string | number | Date): string {
  const version = new Date(versionRaw).getTime();
  if (!Number.isFinite(version) || version <= 0) return url;
  return url.includes("?") ? `${url}&v=${version}` : `${url}?v=${version}`;
}
