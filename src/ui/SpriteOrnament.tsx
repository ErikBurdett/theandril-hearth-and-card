import { assetUrl } from "../content/artwork";
import type { CSSProperties } from "react";
export function SpriteOrnament({
  kind,
  active = false,
}: {
  kind: "book" | "pack" | "card" | "corner" | "barrel" | "cauldron";
  active?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`sprite-ornament ${active ? "sprite-active" : ""} ornament-${kind}`}
      style={
        {
          "--sprite-art": `url("${assetUrl(`/art/animation/${kind === "barrel" || kind === "cauldron" ? "ambience" : "ornament"}.${kind}.png`)}")`,
        } as CSSProperties
      }
    />
  );
}
