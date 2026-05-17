"use client";

import { useEffect, useRef } from "react";

export function OnboardingVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.playbackRate = 2;
    }
  }, []);

  return (
    <video
      ref={ref}
      src="/onboarding.mp4"
      autoPlay
      muted
      loop
      playsInline
      controls
      className="w-full"
    />
  );
}
