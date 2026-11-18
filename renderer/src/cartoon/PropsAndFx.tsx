import React from "react";
import { interpolate } from "remotion";
import { FxKind, PropKind } from "../types";

export const CartoonPropsLayer: React.FC<{ propsList: PropKind[]; frame: number; hasFire: boolean }> = ({
  propsList,
  frame,
  hasFire,
}) => {
  return (
    <g id="cartoon-props">
      {propsList.includes("giant_cannon") ? (
        <g id="prop-giant-cannon" transform="translate(260, 480)">
          {(() => {
            const cycle = frame % 45;
            const recoil = hasFire && cycle < 10 ? interpolate(cycle, [0, 3, 10], [0, -16, 0]) : 0;
            const ballProgress = hasFire
              ? interpolate(cycle, [2, 32], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
              : 0;
            const ballX = 195 + ballProgress * 360;
            const ballY = -40 - Math.sin(ballProgress * Math.PI) * 155;
            const flashScale = hasFire && cycle < 7 ? interpolate(cycle, [0, 3, 7], [0.4, 1.45, 0]) : 0;
            const impactScale = hasFire && cycle >= 30 && cycle < 42 ? interpolate(cycle, [30, 34, 42], [0.3, 1.3, 0]) : 0;

            return (
              <g transform={`translate(${recoil}, 0)`}>
                {/* Heavy Timber Carriage */}
                <path d="M -28 52 L 165 52 L 138 14 L 8 14 Z" fill="#78350F" stroke="#291205" strokeWidth="4" />
                <line x1="15" y1="32" x2="145" y2="32" stroke="#451A03" strokeWidth="4" />

                {/* Massive Bronze Bombard Barrel */}
                <g transform="rotate(-14 60 15)">
                  <rect x="-18" y="-26" width="228" height="52" rx="12" fill="#B45309" stroke="#451A03" strokeWidth="4" />
                  <rect x="-18" y="-26" width="228" height="16" rx="8" fill="#D97706" opacity="0.45" />
                  {[35, 95, 155].map((rx) => (
                    <rect key={rx} x={rx} y="-28" width="14" height="56" rx="3" fill="#F59E0B" stroke="#451A03" strokeWidth="2" />
                  ))}
                  <rect x="196" y="-30" width="18" height="60" rx="5" fill="#D97706" stroke="#451A03" strokeWidth="3.5" />
                </g>

                {/* Iron-Bound Spoked Wheel */}
                <circle cx="44" cy="52" r="38" fill="#92400E" stroke="#1C1917" strokeWidth="6" />
                <circle cx="44" cy="52" r="11" fill="#F59E0B" stroke="#451A03" strokeWidth="2" />
                <line x1="10" y1="52" x2="78" y2="52" stroke="#451A03" strokeWidth="4.5" />
                <line x1="44" y1="18" x2="44" y2="86" stroke="#451A03" strokeWidth="4.5" />
                <line x1="20" y1="28" x2="68" y2="76" stroke="#451A03" strokeWidth="3.5" />
                <line x1="68" y1="28" x2="20" y2="76" stroke="#451A03" strokeWidth="3.5" />

                {/* Muzzle Flash */}
                {flashScale > 0 ? (
                  <g transform={`translate(216, -38) scale(${flashScale})`}>
                    <polygon
                      points="0,-28 16,-10 42,-16 22,5 44,24 14,16 0,36 -10,12"
                      fill="#FACC15"
                      stroke="#EF4444"
                      strokeWidth="3.5"
                    />
                  </g>
                ) : null}

                {/* Flying Stone Cannonball + Fire Trail */}
                {hasFire && cycle >= 2 && cycle <= 32 ? (
                  <g transform={`translate(${ballX}, ${ballY})`}>
                    <circle cx="-26" cy="8" r="10" fill="#F97316" opacity="0.55" />
                    <circle cx="-14" cy="4" r="13" fill="#FACC15" opacity="0.75" />
                    <circle cx="0" cy="0" r="17" fill="#334155" stroke="#0F172A" strokeWidth="3.5" />
                  </g>
                ) : null}

                {/* Wall Impact Shockwave */}
                {impactScale > 0 ? (
                  <g transform={`translate(555, -40) scale(${impactScale})`}>
                    <circle cx="0" cy="0" r="36" fill="#F97316" opacity="0.45" />
                    <polygon points="0,-32 10,-10 34,-12 16,6 28,28 2,16 -24,26 -14,4 -32,-12 -8,-10" fill="#FDE047" />
                  </g>
                ) : null}
              </g>
            );
          })()}
        </g>
      ) : null}

      {propsList.includes("warship") ? (
        <g id="prop-warship" transform={`translate(460, ${468 + Math.sin(frame * 0.1) * 8})`}>
          <path d="M -98 20 L 98 20 L 70 58 L -70 58 Z" fill="#78350F" stroke="#291205" strokeWidth="3.5" />
          <line x1="0" y1="-96" x2="0" y2="20" stroke="#451A03" strokeWidth="6" />
          <path d="M 4 -88 Q 82 -42 4 4 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2.5" />
          <path d="M 30 -54 L 54 -42 L 30 -30 Z" fill="#EF4444" />
        </g>
      ) : null}

      {propsList.includes("blueprint_scroll") ? (
        <g id="prop-blueprint" transform="translate(410, 440)">
          <rect x="0" y="0" width="150" height="94" rx="8" fill="#1E3A8A" stroke="#93C5FD" strokeWidth="3.5" />
          <line x1="20" y1="24" x2="130" y2="24" stroke="#93C5FD" strokeWidth="2.5" strokeDasharray="6 4" />
          <rect x="36" y="38" width="78" height="32" stroke="#FACC15" strokeWidth="2.5" fill="none" />
          <circle cx="15" cy="15" r="4" fill="#FACC15" />
        </g>
      ) : null}

      {propsList.includes("gold_coins") ? (
        <g id="prop-coins" transform="translate(440, 520)">
          {[0, 24, 48].map((cx, i) => (
            <g key={cx} transform={`translate(${cx}, ${-i * 6})`}>
              <ellipse cx="0" cy="0" rx="18" ry="8" fill="#FACC15" stroke="#854D0E" strokeWidth="2.5" />
              <ellipse cx="0" cy="-10" rx="18" ry="8" fill="#FDE047" stroke="#854D0E" strokeWidth="2.5" />
            </g>
          ))}
        </g>
      ) : null}

      {propsList.includes("scroll_stack") ? (
        <g id="prop-scrolls" transform="translate(420, 495)">
          <rect x="0" y="0" width="120" height="24" rx="12" fill="#FEF3C7" stroke="#92400E" strokeWidth="3" />
          <rect x="14" y="-22" width="110" height="24" rx="12" fill="#FDE68A" stroke="#92400E" strokeWidth="3" />
        </g>
      ) : null}
    </g>
  );
};

export const CartoonFxLayer: React.FC<{ fxList: FxKind[]; frame: number }> = ({ fxList, frame }) => {
  return (
    <g id="cartoon-fx" pointerEvents="none">
      {fxList.includes("smoke_plumes") ? (
        <g opacity="0.6">
          {[0, 1, 2, 3, 4].map((i) => {
            const rise = (frame * 1.7 + i * 24) % 140;
            const alpha = interpolate(rise, [0, 140], [0.75, 0]);
            return (
              <circle
                key={i}
                cx={620 + i * 26 + Math.sin(frame * 0.08 + i) * 12}
                cy={400 - rise}
                r={18 + rise * 0.24}
                fill="#94A3B8"
                opacity={alpha}
              />
            );
          })}
        </g>
      ) : null}

      {fxList.includes("dust_cloud") ? (
        <g opacity="0.48">
          {[0, 1, 2, 3, 4].map((i) => {
            const drift = (frame * 1.9 + i * 20) % 95;
            return (
              <circle
                key={i}
                cx={210 + i * 95 - drift * 0.65}
                cy={572 - Math.sin(drift * 0.05) * 18}
                r={14 + (drift % 18)}
                fill="#D6D3D1"
                opacity={interpolate(drift, [0, 95], [0.65, 0])}
              />
            );
          })}
        </g>
      ) : null}

      {fxList.includes("sparks") || fxList.includes("cannon_fire") ? (
        <g>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const t = (frame * 2.4 + i * 13) % 70;
            const sy = 460 - t * 2.5;
            const sx = 540 + (i - 3.5) * 34 + Math.sin(i * 2.1 + frame * 0.12) * 24;
            return (
              <circle
                key={i}
                cx={sx}
                cy={sy}
                r={3.5 + (i % 2) * 1.5}
                fill={i % 2 === 0 ? "#FACC15" : "#EF4444"}
                opacity={interpolate(t, [0, 70], [1, 0])}
              />
            );
          })}
        </g>
      ) : null}
    </g>
  );
};
