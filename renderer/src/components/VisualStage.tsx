import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CartoonCharacter } from "../cartoon/Characters";
import { CartoonEnvironment } from "../cartoon/Environments";
import { CartoonFxLayer, CartoonPropsLayer } from "../cartoon/PropsAndFx";
import { ThemePalette } from "../themes";
import { CameraMotion, VisualScene } from "../types";

interface VisualStageProps {
  scenes: VisualScene[];
  palette: ThemePalette;
}

function getCameraTransform(motion: CameraMotion | undefined, localFrame: number, duration: number): string {
  const progress = interpolate(localFrame, [0, Math.max(1, duration)], [0, 1], {
    extrapolateRight: "clamp",
  });

  switch (motion) {
    case "pan_left": {
      const x = interpolate(progress, [0, 1], [3, -3]);
      return `scale(1.08) translateX(${x}%)`;
    }
    case "pan_right": {
      const x = interpolate(progress, [0, 1], [-3, 3]);
      return `scale(1.08) translateX(${x}%)`;
    }
    case "shake": {
      const decay = interpolate(localFrame, [0, 30], [1, 0.15], { extrapolateRight: "clamp" });
      const sx = Math.sin(localFrame * 1.9) * 1.2 * decay;
      const sy = Math.cos(localFrame * 2.3) * 0.9 * decay;
      return `scale(1.07) translate(${sx}%, ${sy}%)`;
    }
    case "float": {
      const fy = Math.sin(localFrame * 0.08) * 1.2;
      return `scale(1.05) translateY(${fy}%)`;
    }
    case "zoom_in":
    default: {
      const s = interpolate(progress, [0, 1], [1.0, 1.09]);
      return `scale(${s})`;
    }
  }
}

export const VisualStage: React.FC<VisualStageProps> = ({ scenes, palette }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const active =
    scenes.find((s, idx) => {
      const nextStart = scenes[idx + 1]?.startFrame ?? Number.MAX_SAFE_INTEGER;
      return frame >= s.startFrame && frame < nextStart;
    }) ?? scenes[0];
  if (!active) {
    return null;
  }

  const localFrame = Math.max(0, frame - active.startFrame);
  const sceneDuration = Math.max(1, active.endFrame - active.startFrame);
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 16, stiffness: 150, mass: 0.7 },
  });

  const cameraTransform = getCameraTransform(active.cameraMotion, localFrame, sceneDuration);
  const actors = active.actors ?? [];
  const propsList = active.props ?? [];
  const fxList = active.fx ?? [];

  return (
    <div
      style={{
        position: "absolute",
        top: 280,
        left: 48,
        right: 48,
        height: 740,
        opacity: Math.min(1, enter * 1.3),
        transform: `translateY(${(1 - enter) * 18}px)`,
        backgroundColor: "#0B1026",
        border: `1.5px solid ${palette.cardBorder}`,
        borderRadius: 32,
        overflow: "hidden",
        boxShadow: "0 28px 70px rgba(0, 0, 0, 0.55)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: cameraTransform,
          transformOrigin: "center center",
        }}
      >
        <svg viewBox="0 0 984 740" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
          <CartoonEnvironment
            backdrop={active.backdrop}
            landmark={active.landmark}
            landmarkState={active.landmarkState}
            frame={localFrame}
          />
          <CartoonPropsLayer
            propsList={propsList}
            frame={localFrame}
            hasFire={fxList.includes("cannon_fire")}
          />
          {actors.map((actor, idx) => (
            <CartoonCharacter key={`${actor.role}-${idx}`} actor={actor} frame={localFrame} index={idx} />
          ))}
          <CartoonFxLayer fxList={fxList} frame={localFrame} />
        </svg>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(10,12,16,0.08) 0%, rgba(10,12,16,0.0) 58%, rgba(10,12,16,0.88) 100%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 32,
          right: 32,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div
            style={{
              color: palette.textPrimary,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 900,
              fontSize: 34,
              lineHeight: 1.15,
              textShadow: "0 4px 16px rgba(0,0,0,0.9)",
            }}
          >
            {active.headline}
          </div>
          <div
            style={{
              color: palette.textMuted,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 600,
              fontSize: 22,
              textShadow: "0 2px 10px rgba(0,0,0,0.9)",
            }}
          >
            {active.sublabel}
          </div>
        </div>

        {active.metricValue ? (
          <div
            style={{
              backgroundColor: palette.accent,
              color: palette.accentText,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 900,
              fontSize: 28,
              padding: "10px 20px",
              borderRadius: 12,
              whiteSpace: "nowrap",
            }}
          >
            {active.metricValue}
          </div>
        ) : null}
      </div>
    </div>
  );
};
