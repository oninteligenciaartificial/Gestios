import { Composition } from "remotion";
import { GestiosVideo } from "./GestiosVideo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="GestiosOnboarding"
      component={GestiosVideo}
      durationInFrames={2625}
      fps={30}
      width={1280}
      height={720}
    />
  );
};
