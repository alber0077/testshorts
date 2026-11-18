export interface WordFrame {
  text: string;
  startFrame: number;
  endFrame: number;
  isEmphasis: boolean;
}

export interface CitationItem {
  source_id: string;
  title: string;
  url: string;
}

export type CameraMotion = "zoom_in" | "pan_left" | "pan_right" | "shake" | "float";

export type BackdropKind =
  | "night_siege"
  | "day_plains"
  | "mediterranean_sea"
  | "palace_court"
  | "ancient_library"
  | "storm_battle";

export type LandmarkKind =
  | "fortress_walls"
  | "palace_columns"
  | "temple_library"
  | "harbor_ships"
  | "camp_tents"
  | "none";

export type LandmarkState = "intact" | "smoking" | "breached";

export type ActorRole =
  | "emperor"
  | "sultan"
  | "soldier"
  | "engineer"
  | "scholar"
  | "sailor"
  | "ox_team";

export type ActorAction =
  | "idle"
  | "march"
  | "command"
  | "reject"
  | "haul"
  | "celebrate"
  | "panic";

export interface CartoonActor {
  role: ActorRole;
  side: "left" | "center" | "right";
  facing: "left" | "right";
  action: ActorAction;
  label?: string;
}

export type PropKind =
  | "giant_cannon"
  | "blueprint_scroll"
  | "gold_coins"
  | "warship"
  | "scroll_stack"
  | "treaty_seal"
  | "crossed_swords";

export type FxKind =
  | "cannon_fire"
  | "smoke_plumes"
  | "sparks"
  | "dust_cloud"
  | "falling_stones"
  | "clouds";

export interface VisualScene {
  startFrame: number;
  endFrame: number;
  headline: string;
  sublabel: string;
  metricValue?: string;
  cameraMotion?: CameraMotion;
  backdrop: BackdropKind;
  landmark: LandmarkKind;
  landmarkState?: LandmarkState;
  actors?: CartoonActor[];
  props?: PropKind[];
  fx?: FxKind[];
}

export type HistoryShortProps = {
  jobId: string;
  locale: string;
  theme: string;
  fps: number;
  durationInFrames: number;
  audioSrc: string;
  title: string;
  eraLabel: string;
  year: string;
  citations: CitationItem[];
  words: WordFrame[];
  scenes?: VisualScene[];
  amplitudeEnvelope: number[];
};
