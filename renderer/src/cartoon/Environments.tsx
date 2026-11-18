import React from "react";
import { BackdropKind, LandmarkKind, LandmarkState } from "../types";

interface EnvironmentProps {
  backdrop: BackdropKind;
  landmark: LandmarkKind;
  landmarkState?: LandmarkState;
  frame: number;
}

const BACKDROP_PALETTES: Record<
  BackdropKind,
  {
    skyTop: string;
    skyMid: string;
    skyBottom: string;
    mtnFar: string;
    mtnMid: string;
    hillNear: string;
    ground: string;
    groundDark: string;
    celestial: string;
    isNight: boolean;
  }
> = {
  night_siege: {
    skyTop: "#060919",
    skyMid: "#1B1438",
    skyBottom: "#451A3E",
    mtnFar: "#14112B",
    mtnMid: "#1D1936",
    hillNear: "#151924",
    ground: "#1E2430",
    groundDark: "#12161F",
    celestial: "#FDE68A",
    isNight: true,
  },
  day_plains: {
    skyTop: "#1E40AF",
    skyMid: "#3B82F6",
    skyBottom: "#BAE6FD",
    mtnFar: "#475569",
    mtnMid: "#365314",
    hillNear: "#3F6212",
    ground: "#4D7C0F",
    groundDark: "#365314",
    celestial: "#FEF08A",
    isNight: false,
  },
  mediterranean_sea: {
    skyTop: "#075985",
    skyMid: "#0284C7",
    skyBottom: "#BAE6FD",
    mtnFar: "#0C4A6E",
    mtnMid: "#075985",
    hillNear: "#0369A1",
    ground: "#0284C7",
    groundDark: "#0369A1",
    celestial: "#FEF9C3",
    isNight: false,
  },
  palace_court: {
    skyTop: "#1A0B2E",
    skyMid: "#3B154A",
    skyBottom: "#6B214A",
    mtnFar: "#2B1238",
    mtnMid: "#3B1842",
    hillNear: "#2C1B2E",
    ground: "#3F2E3E",
    groundDark: "#241824",
    celestial: "#FBBF24",
    isNight: true,
  },
  ancient_library: {
    skyTop: "#1F110A",
    skyMid: "#4A2511",
    skyBottom: "#9A4E1C",
    mtnFar: "#381C0E",
    mtnMid: "#4E2714",
    hillNear: "#3A1E0F",
    ground: "#452715",
    groundDark: "#29160B",
    celestial: "#FCD34D",
    isNight: false,
  },
  storm_battle: {
    skyTop: "#090D16",
    skyMid: "#1E293B",
    skyBottom: "#475569",
    mtnFar: "#1E293B",
    mtnMid: "#1E2430",
    hillNear: "#1C1917",
    ground: "#292524",
    groundDark: "#1C1917",
    celestial: "#CBD5E1",
    isNight: true,
  },
};

export const CartoonEnvironment: React.FC<EnvironmentProps> = ({
  backdrop,
  landmark,
  landmarkState = "intact",
  frame,
}) => {
  const p = BACKDROP_PALETTES[backdrop] ?? BACKDROP_PALETTES.night_siege;
  const cloudDrift = (frame * 0.65) % 1200;
  const waveShift = Math.sin(frame * 0.1) * 16;
  const flagWave = Math.sin(frame * 0.24) * 8;
  const torchFlicker = 0.85 + Math.sin(frame * 0.45) * 0.15;

  return (
    <g id="cartoon-environment">
      <defs>
        <linearGradient id={`sky-${backdrop}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.skyTop} />
          <stop offset="55%" stopColor={p.skyMid} />
          <stop offset="100%" stopColor={p.skyBottom} />
        </linearGradient>
        <linearGradient id="godray" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor={p.celestial} stopOpacity="0.16" />
          <stop offset="100%" stopColor={p.celestial} stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="984" height="740" fill={`url(#sky-${backdrop})`} />

      {/* Stars */}
      {p.isNight ? (
        <g opacity="0.75">
          {[
            [85, 72, 2.2],
            [170, 125, 1.8],
            [260, 58, 2.8],
            [355, 140, 1.6],
            [470, 68, 2.4],
            [580, 118, 2],
            [670, 52, 2.8],
            [745, 145, 1.8],
            [915, 85, 2.5],
          ].map(([sx, sy, sr], idx) => (
            <circle
              key={idx}
              cx={sx}
              cy={sy}
              r={sr}
              fill="#FFF"
              opacity={0.5 + Math.sin(frame * 0.08 + idx) * 0.4}
            />
          ))}
        </g>
      ) : null}

      {/* Sun / Moon + Volumetric Glow & Light Rays */}
      <polygon points="820,115 440,560 660,560" fill="url(#godray)" />
      <circle cx="820" cy="115" r="88" fill={p.celestial} opacity="0.08" />
      <circle cx="820" cy="115" r="62" fill={p.celestial} opacity="0.18" />
      <circle cx="820" cy="115" r="42" fill={p.celestial} opacity="0.95" />

      {/* Layered Drifting Clouds */}
      <g transform={`translate(${cloudDrift - 180}, 82)`} opacity="0.22">
        <ellipse cx="90" cy="40" rx="82" ry="26" fill="#FFFFFF" />
        <ellipse cx="140" cy="26" rx="52" ry="24" fill="#FFFFFF" />
        <ellipse cx="48" cy="34" rx="44" ry="20" fill="#FFFFFF" />
      </g>
      <g transform={`translate(${((cloudDrift + 520) % 1200) - 180}, 152)`} opacity="0.14">
        <ellipse cx="75" cy="34" rx="68" ry="20" fill="#FFFFFF" />
        <ellipse cx="115" cy="22" rx="44" ry="18" fill="#FFFFFF" />
      </g>

      {/* Far Mountain Range */}
      <path
        d="M 0 460 L 120 355 L 240 420 L 390 325 L 540 410 L 710 340 L 860 405 L 984 365 L 984 740 L 0 740 Z"
        fill={p.mtnFar}
      />

      {/* Midground Rolling Hills & Cypress/Tree Silhouettes */}
      <path
        d="M 0 495 Q 200 415 430 475 T 820 450 T 984 480 L 984 740 L 0 740 Z"
        fill={p.mtnMid}
      />
      {[65, 115, 310, 355, 895, 940].map((tx, idx) => (
        <g key={tx} transform={`translate(${tx}, ${458 + (idx % 2) * 14})`} opacity="0.65">
          <ellipse cx="0" cy="-24" rx="14" ry="34" fill={p.hillNear} />
          <rect x="-3" y="4" width="6" height="16" fill="#1C1917" />
        </g>
      ))}

      {/* Detailed Landmarks */}
      {landmark === "fortress_walls" ? (
        <g id="landmark-fortress" transform="translate(470, 210)">
          {/* Distant Inner Dome (Hagia Sophia silhouette) */}
          <g opacity="0.78" transform="translate(175, -35)">
            <path d="M 20 110 Q 95 25 170 110 Z" fill="#334155" stroke="#1E293B" strokeWidth="3" />
            <rect x="0" y="30" width="12" height="90" fill="#475569" />
            <polygon points="0,30 6,8 12,30" fill="#F59E0B" />
            <rect x="178" y="30" width="12" height="90" fill="#475569" />
            <polygon points="178,30 184,8 190,30" fill="#F59E0B" />
          </g>

          {/* Outer Flanking Tower */}
          <rect x="260" y="40" width="150" height="300" fill="#475569" stroke="#0F172A" strokeWidth="4" />
          {/* Masonry courses */}
          {[80, 120, 160, 200, 240, 280].map((my) => (
            <line key={my} x1="260" y1={my} x2="410" y2={my} stroke="#334155" strokeWidth="2" />
          ))}
          {/* Tower Battlements */}
          {[254, 294, 334, 374].map((bx) => (
            <rect key={bx} x={bx} y="16" width="28" height="28" fill="#64748B" stroke="#0F172A" strokeWidth="3" />
          ))}

          {/* Main Curtain Wall */}
          <rect x="0" y="120" width="265" height="220" fill="#334155" stroke="#0F172A" strokeWidth="4" />
          {[155, 190, 225, 260, 295].map((my) => (
            <line key={my} x1="0" y1={my} x2="265" y2={my} stroke="#1E293B" strokeWidth="2" />
          ))}
          {[4, 56, 108, 160, 212].map((bx) => (
            <rect key={bx} x={bx} y="98" width="32" height="26" fill="#475569" stroke="#0F172A" strokeWidth="3" />
          ))}

          {/* Arrow Slits & Torches */}
          {[55, 195, 335].map((sx) => (
            <g key={sx}>
              <rect x={sx} y="152" width="10" height="34" rx="4" fill="#0F172A" />
              <circle cx={sx + 5} cy="212" r={10 * torchFlicker} fill="#F97316" opacity="0.35" />
              <circle cx={sx + 5} cy="212" r={4.5 * torchFlicker} fill="#FACC15" />
            </g>
          ))}

          {/* Arched Iron Gate */}
          <path d="M 92 340 L 92 225 A 38 38 0 0 1 168 225 L 168 340 Z" fill="#0F172A" stroke="#1E293B" strokeWidth="4" />
          <line x1="112" y1="205" x2="112" y2="340" stroke="#334155" strokeWidth="3" />
          <line x1="148" y1="205" x2="148" y2="340" stroke="#334155" strokeWidth="3" />

          {/* Fluttering Imperial Banner */}
          <line x1="335" y1="-44" x2="335" y2="16" stroke="#F8FAFC" strokeWidth="4" />
          <path
            d={`M 337 -42 Q 370 ${-48 + flagWave} 404 -32 Q 370 ${-16 + flagWave} 337 -20 Z`}
            fill="#DC2626"
            stroke="#7F1D1D"
            strokeWidth="2"
          />

          {/* Breach / Damage */}
          {landmarkState === "breached" || landmarkState === "smoking" ? (
            <g>
              <path
                d="M 165 130 L 195 178 L 170 225 L 208 275 L 185 335"
                stroke="#090D16"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
              />
              <circle cx="188" cy="195" r={32 * torchFlicker} fill="#EA580C" opacity="0.32" />
              <circle cx="195" cy="255" r={24 * torchFlicker} fill="#F59E0B" opacity="0.28" />
            </g>
          ) : null}
        </g>
      ) : null}

      {landmark === "palace_columns" ? (
        <g id="landmark-palace" transform="translate(70, 175)">
          <polygon points="0,85 422,0 844,85" fill="#78350F" stroke="#451A03" strokeWidth="4" />
          <polygon points="65,78 422,18 779,78" fill="#92400E" />
          <rect x="24" y="85" width="796" height="32" fill="#B45309" stroke="#451A03" strokeWidth="3" />
          {[75, 225, 375, 525, 675, 765].map((cx) => (
            <g key={cx}>
              <rect x={cx} y="117" width="46" height="255" fill="#E7E5E4" stroke="#57534E" strokeWidth="3" />
              <line x1={cx + 14} y1="117" x2={cx + 14} y2="372" stroke="#D6D3D1" strokeWidth="2" />
              <line x1={cx + 32} y1="117" x2={cx + 32} y2="372" stroke="#D6D3D1" strokeWidth="2" />
              <rect x={cx - 8} y="117" width="62" height="18" rx="4" fill="#F5F5F4" stroke="#57534E" strokeWidth="2" />
            </g>
          ))}
          {/* Hanging Royal Drapes */}
          <path d="M 121 117 Q 173 190 225 117 Z" fill="#7F1D1D" opacity="0.88" />
          <path d="M 571 117 Q 623 190 675 117 Z" fill="#7F1D1D" opacity="0.88" />
        </g>
      ) : null}

      {landmark === "temple_library" ? (
        <g id="landmark-library" transform="translate(130, 190)">
          <polygon points="0,85 362,0 724,85" fill="#B45309" stroke="#78350F" strokeWidth="4" />
          <rect x="36" y="85" width="652" height="275" fill="#29150A" stroke="#78350F" strokeWidth="3" />
          {[70, 195, 320, 445, 570].map((cx) => (
            <g key={cx}>
              <rect x={cx} y="85" width="42" height="275" fill="#FDE68A" stroke="#92400E" strokeWidth="3" />
              <circle cx={cx + 75} cy="165" r={18 * torchFlicker} fill="#F59E0B" opacity="0.25" />
            </g>
          ))}
        </g>
      ) : null}

      {landmark === "camp_tents" ? (
        <g id="landmark-tents" transform="translate(520, 360)">
          {[
            [0, 10, 1],
            [135, 25, 0.92],
            [260, 5, 1.05],
          ].map(([tx, ty, sc], idx) => (
            <g key={idx} transform={`translate(${tx}, ${ty}) scale(${sc})`}>
              <polygon points="0,140 68,20 136,140" fill="#B91C1C" stroke="#450A0A" strokeWidth="3.5" />
              <polygon points="34,140 68,20 102,140" fill="#DC2626" />
              <polygon points="52,140 68,72 84,140" fill="#450A0A" />
              <line x1="68" y1="-6" x2="68" y2="20" stroke="#FDE047" strokeWidth="3.5" />
              <polygon points="68,-6 92,2 68,10" fill="#FACC15" />
            </g>
          ))}
        </g>
      ) : null}

      {landmark === "harbor_ships" ? (
        <g id="landmark-harbor" transform="translate(540, 415)" opacity="0.85">
          {[0, 160].map((sx, idx) => (
            <g key={sx} transform={`translate(${sx}, ${Math.sin(frame * 0.09 + idx) * 6})`}>
              <path d="M 0 50 L 110 50 L 92 78 L 18 78 Z" fill="#451A03" />
              <line x1="55" y1="-25" x2="55" y2="50" stroke="#78350F" strokeWidth="4" />
              <path d="M 58 -20 Q 105 12 58 38 Z" fill="#E2E8F0" />
            </g>
          ))}
        </g>
      ) : null}

      {/* Foreground Terrain / Sea */}
      {backdrop === "mediterranean_sea" ? (
        <g>
          <path
            d={`M -40 530 Q ${160 + waveShift} 500 360 530 T 760 530 T 1040 530 L 1040 740 L -40 740 Z`}
            fill="#0284C7"
          />
          <path
            d={`M -40 585 Q ${200 - waveShift} 555 440 585 T 880 585 T 1040 585 L 1040 740 L -40 740 Z`}
            fill="#0369A1"
          />
        </g>
      ) : (
        <g>
          <path
            d="M 0 535 Q 290 500 580 532 T 984 522 L 984 740 L 0 740 Z"
            fill={p.ground}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="4"
          />
          <path
            d="M 0 605 Q 360 580 710 605 T 984 592 L 984 740 L 0 740 Z"
            fill={p.groundDark}
          />
        </g>
      )}
    </g>
  );
};
