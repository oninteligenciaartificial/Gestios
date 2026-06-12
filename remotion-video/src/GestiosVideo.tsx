import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Scene1Welcome } from "./scenes/Scene1Welcome";
import { Scene2Setup } from "./scenes/Scene2Setup";
import { Scene3Inventory } from "./scenes/Scene3Inventory";
import { Scene4POS } from "./scenes/Scene4POS";
import { Scene5Reports } from "./scenes/Scene5Reports";
import { Scene6CTA } from "./scenes/Scene6CTA";

// Scene durations in frames (30fps)
// Total: 2700 frames - 5 transitions * 15 frames = 2625 frames
const S1 = 150;  // 5s  — Welcome
const S2 = 450;  // 15s — Setup
const S3 = 450;  // 15s — Inventory
const S4 = 450;  // 15s — POS
const S5 = 450;  // 15s — Reports
const S6 = 750;  // 25s — CTA

const TRANSITION = 15;

export const GestiosVideo = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={S1}>
        <Scene1Welcome />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION })}
      />

      <TransitionSeries.Sequence durationInFrames={S2}>
        <Scene2Setup />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION })}
      />

      <TransitionSeries.Sequence durationInFrames={S3}>
        <Scene3Inventory />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION })}
      />

      <TransitionSeries.Sequence durationInFrames={S4}>
        <Scene4POS />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION })}
      />

      <TransitionSeries.Sequence durationInFrames={S5}>
        <Scene5Reports />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION })}
      />

      <TransitionSeries.Sequence durationInFrames={S6}>
        <Scene6CTA />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
