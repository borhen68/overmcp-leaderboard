import { Composition } from "remotion";
import { OverMcpXPromo } from "./overmcp-x-promo";

export function RemotionRoot() {
  return (
    <Composition
      id="OverMCPXPromo"
      component={OverMcpXPromo}
      durationInFrames={330}
      fps={30}
      width={1920}
      height={1080}
    />
  );
}
