import React from "react";
import { useCurrentFrame } from "remotion";
import { ThemePalette } from "../themes";

interface AudioWaveformProps {
  envelope: number[];
  palette: ThemePalette;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ envelope, palette }) => {
  const frame = useCurrentFrame();
  const barCount = 28;
  const centerAmp = envelope[Math.min(frame, Math.max(0, envelope.length - 1))] ?? 0;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 240,
        left: 72,
        right: 140,
        height: 72,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      {Array.from({ length: barCount }).map((_, i) => {
        const distFromCenter = Math.abs(i - barCount / 2) / (barCount / 2);
        const sampleOffset = Math.max(0, Math.min(envelope.length - 1, frame - Math.floor(distFromCenter * 4)));
        const amp = envelope[sampleOffset] ?? centerAmp;
        const height = 8 + amp * (1 - distFromCenter * 0.55) * 58;

        return (
          <div
            key={i}
            style={{
              width: 7,
              height,
              borderRadius: 4,
              backgroundColor: palette.accent,
              opacity: 0.35 + amp * 0.65,
            }}
          />
        );
      })}
    </div>
  );
};
