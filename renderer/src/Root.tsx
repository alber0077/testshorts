import React from "react";
import { Composition } from "remotion";
import { HistoryShort } from "./compositions/HistoryShort";
import { HistoryShortProps } from "./types";

const DEFAULT_PROPS: HistoryShortProps = {
  jobId: "preview",
  locale: "es-ES",
  theme: "editorial_dark",
  fps: 60,
  durationInFrames: 300,
  audioSrc: "",
  title: "La caída de Constantinopla",
  eraLabel: "Imperio otomano · 1453",
  year: "1453",
  citations: [{ source_id: "S1", title: "Caída de Constantinopla", url: "https://es.wikipedia.org" }],
  words: [
    { text: "En", startFrame: 5, endFrame: 18, isEmphasis: false },
    { text: "1453,", startFrame: 19, endFrame: 42, isEmphasis: true },
    { text: "Constantinopla", startFrame: 43, endFrame: 78, isEmphasis: true },
    { text: "cayó.", startFrame: 79, endFrame: 105, isEmphasis: false },
  ],
  scenes: [
    {
      startFrame: 0,
      endFrame: 300,
      headline: "CAÑÓN DE URBÁN",
      sublabel: "Asedio otomano de Constantinopla",
      metricValue: "1453",
      cameraMotion: "shake",
      backdrop: "night_siege",
      landmark: "fortress_walls",
      landmarkState: "smoking",
      actors: [
        { role: "sultan", side: "left", facing: "right", action: "command", label: "Mehmed II" },
      ],
      props: ["giant_cannon"],
      fx: ["cannon_fire", "smoke_plumes"],
    },
  ],
  amplitudeEnvelope: Array.from({ length: 300 }, (_, i) => Math.abs(Math.sin(i * 0.15)) * 0.8),
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="HistoryShort"
      component={HistoryShort}
      durationInFrames={DEFAULT_PROPS.durationInFrames}
      fps={60}
      width={1080}
      height={1920}
      defaultProps={DEFAULT_PROPS}
      calculateMetadata={({ props }) => ({
        durationInFrames: props.durationInFrames,
        fps: props.fps || 60,
      })}
    />
  );
};
