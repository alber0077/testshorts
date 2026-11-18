import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { EraHeader } from "../components/EraHeader";
import { KineticCaptions } from "../components/KineticCaptions";
import { ProceduralBg } from "../components/ProceduralBg";
import { VisualStage } from "../components/VisualStage";
import { getTheme } from "../themes";
import { HistoryShortProps } from "../types";

export const HistoryShort: React.FC<HistoryShortProps> = (props) => {
  const palette = getTheme(props.theme);

  return (
    <AbsoluteFill>
      <ProceduralBg palette={palette} />
      {props.audioSrc ? <Audio src={staticFile(props.audioSrc)} /> : null}
      <EraHeader
        eraLabel={props.eraLabel}
        year={props.year}
        title={props.title}
        palette={palette}
      />
      {props.scenes && props.scenes.length > 0 ? (
        <VisualStage scenes={props.scenes} palette={palette} />
      ) : null}
      <KineticCaptions words={props.words} palette={palette} />
    </AbsoluteFill>
  );
};
