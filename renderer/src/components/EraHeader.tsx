import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ThemePalette } from "../themes";

interface EraHeaderProps {
  eraLabel: string;
  year: string;
  title: string;
  palette: ThemePalette;
}

export const EraHeader: React.FC<EraHeaderProps> = ({ eraLabel, year, title, palette }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const progress = interpolate(frame, [0, durationInFrames], [0, 100], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        top: 130,
        left: 72,
        right: 140,
        opacity: enter,
        transform: `translateY(${(1 - enter) * -18}px)`,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span
          style={{
            backgroundColor: palette.accent,
            color: palette.accentText,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 800,
            fontSize: 28,
            letterSpacing: 1.5,
            padding: "8px 18px",
            borderRadius: 8,
          }}
        >
          {year}
        </span>
        <span
          style={{
            color: palette.textMuted,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 600,
            fontSize: 24,
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          {eraLabel}
        </span>
      </div>

      <div
        style={{
          color: palette.textPrimary,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 38,
          lineHeight: 1.2,
          letterSpacing: -0.5,
        }}
      >
        {title}
      </div>

      <div
        style={{
          width: "100%",
          height: 4,
          borderRadius: 2,
          backgroundColor: palette.cardBorder,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            backgroundColor: palette.accent,
          }}
        />
      </div>
    </div>
  );
};
