import index from "../../assets/art/card-art-index.json";
export function assetUrl(path: string): string {
  const optimized =
    path.startsWith("/art/") && path.endsWith(".png")
      ? path.replace("/art/", "/art/optimized/").replace(/\.png$/, ".webp")
      : path;
  return `${import.meta.env.BASE_URL ?? "/"}${optimized.replace(/^\//, "")}`;
}
export function cardIllustration(id: string): string | undefined {
  const path = (index as Record<string, string>)[id];
  return path ? assetUrl(path) : undefined;
}
