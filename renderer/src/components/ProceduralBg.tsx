import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThemePalette } from "../themes";

export const ProceduralBg: React.FC<{ palette: ThemePalette }> = ({ palette }) => {
  const frame = useCurrentFrame();
  const gridShift = (frame * 0.35) % 96;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: palette.bgPrimary,
        overflow: "hidden",
      }}
    >
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern
            id="arch-grid"
            width="96"
            height="96"
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(0 ${gridShift})`}
          >
            <path d="M 96 0 L 0 0 0 96" fill="none" stroke={palette.gridColor} strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="1080" height="1920" fill="url(#arch-grid)" />
      </svg>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 45%, transparent 45%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
