import React from "react";
import { ActorAction, ActorRole, CartoonActor } from "../types";

interface CharacterProps {
  actor: CartoonActor;
  frame: number;
  index: number;
}

const ROLE_COLORS: Record<
  ActorRole,
  { tunic: string; tunicDark: string; trim: string; skin: string; cape?: string }
> = {
  emperor: { tunic: "#7E22CE", tunicDark: "#581C87", trim: "#FACC15", skin: "#FDBA74", cape: "#4C1D95" },
  sultan: { tunic: "#B91C1C", tunicDark: "#7F1D1D", trim: "#FBBF24", skin: "#FDBA74", cape: "#7F1D1D" },
  soldier: { tunic: "#475569", tunicDark: "#334155", trim: "#CBD5E1", skin: "#FED7AA" },
  engineer: { tunic: "#B45309", tunicDark: "#78350F", trim: "#FDE68A", skin: "#FDBA74" },
  scholar: { tunic: "#0F766E", tunicDark: "#115E59", trim: "#99F6E4", skin: "#FDBA74" },
  sailor: { tunic: "#1D4ED8", tunicDark: "#1E3A8A", trim: "#F8FAFC", skin: "#FED7AA" },
  ox_team: { tunic: "#78350F", tunicDark: "#451A03", trim: "#D6D3D1", skin: "#451A03" },
};

function getSideX(side: CartoonActor["side"], index: number): number {
  const base = side === "left" ? 200 : side === "right" ? 760 : 480;
  return base + (index % 2 === 0 ? 0 : 42);
}

function getLimbAngles(action: ActorAction, frame: number) {
  switch (action) {
    case "march":
    case "haul":
      return {
        legSwing: Math.sin(frame * 0.28) * 24,
        armAngle: Math.cos(frame * 0.28) * 28 - (action === "haul" ? 35 : 0),
        bounce: Math.abs(Math.sin(frame * 0.28)) * 6,
      };
    case "command":
      return {
        legSwing: 5,
        armAngle: -58 + Math.sin(frame * 0.16) * 8,
        bounce: Math.sin(frame * 0.12) * 2,
      };
    case "reject":
      return {
        legSwing: 0,
        armAngle: -32 + Math.sin(frame * 0.35) * 22,
        bounce: 0,
      };
    case "celebrate":
      return {
        legSwing: Math.sin(frame * 0.25) * 10,
        armAngle: -78 + Math.sin(frame * 0.3) * 14,
        bounce: Math.abs(Math.sin(frame * 0.25)) * 12,
      };
    case "panic":
      return {
        legSwing: Math.sin(frame * 0.45) * 18,
        armAngle: -72 + Math.cos(frame * 0.45) * 20,
        bounce: Math.abs(Math.sin(frame * 0.45)) * 8,
      };
    case "idle":
    default:
      return {
        legSwing: 0,
        armAngle: Math.sin(frame * 0.08) * 5,
        bounce: Math.sin(frame * 0.08) * 2,
      };
  }
}

const SingleCharacterBody: React.FC<{
  role: ActorRole;
  action: ActorAction;
  frame: number;
  scale?: number;
}> = ({ role, action, frame, scale = 1 }) => {
  const colors = ROLE_COLORS[role] ?? ROLE_COLORS.soldier;
  const { legSwing, armAngle, bounce } = getLimbAngles(action, frame);

  return (
    <g transform={`translate(0, ${-bounce}) scale(${scale})`}>
      <ellipse cx="0" cy={36 + bounce} rx="34" ry="9" fill="rgba(0,0,0,0.38)" />

      {/* Cape */}
      {colors.cape ? (
        <path
          d={`M -16 -58 Q -46 -18 -38 22 L 10 14 L 8 -58 Z`}
          fill={colors.cape}
          stroke="#0F172A"
          strokeWidth="3"
        />
      ) : null}

      {/* Back Arm */}
      <g transform={`translate(-10, -52) rotate(${-armAngle * 0.4})`}>
        <line x1="0" y1="0" x2="-18" y2="24" stroke={colors.tunicDark} strokeWidth="11" strokeLinecap="round" />
      </g>

      {/* Legs + Boots */}
      <g transform={`rotate(${-legSwing * 0.7} -10 -12)`}>
        <line x1="-10" y1="-12" x2="-10" y2="28" stroke="#1E293B" strokeWidth="13" strokeLinecap="round" />
        <ellipse cx="-6" cy="30" rx="10" ry="5" fill="#0F172A" />
      </g>
      <g transform={`rotate(${legSwing * 0.7} 10 -12)`}>
        <line x1="10" y1="-12" x2="10" y2="28" stroke="#0F172A" strokeWidth="13" strokeLinecap="round" />
        <ellipse cx="14" cy="30" rx="10" ry="5" fill="#090D16" />
      </g>

      {/* Torso + Armor/Robe Shading */}
      <rect
        x="-24"
        y="-66"
        width="48"
        height="60"
        rx="14"
        fill={colors.tunic}
        stroke="#0F172A"
        strokeWidth="3.5"
      />
      <path d="M -24 -66 Q 0 -54 24 -66" fill="none" stroke={colors.trim} strokeWidth="3" />
      <rect x="-24" y="-26" width="48" height="10" fill={colors.trim} stroke="#0F172A" strokeWidth="2" />
      <rect x="-6" y="-27" width="12" height="12" rx="2" fill="#FDE047" />

      {/* Front Arm + Held Prop */}
      <g transform={`translate(12, -52) rotate(${armAngle})`}>
        <line x1="0" y1="0" x2="28" y2="18" stroke={colors.tunic} strokeWidth="12" strokeLinecap="round" />
        <circle cx="30" cy="19" r="6.5" fill={colors.skin} stroke="#0F172A" strokeWidth="2.5" />
        {role === "soldier" ? (
          <g transform="translate(30, 19) rotate(-35)">
            <line x1="0" y1="36" x2="0" y2="-65" stroke="#78350F" strokeWidth="4.5" />
            <polygon points="-6,-65 0,-86 6,-65" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1.5" />
          </g>
        ) : null}
        {role === "sultan" || role === "emperor" ? (
          <g transform="translate(30, 19) rotate(-25)">
            <line x1="0" y1="12" x2="0" y2="-48" stroke="#FACC15" strokeWidth="4" />
            <circle cx="0" cy="-50" r="6" fill="#FDE047" />
          </g>
        ) : null}
      </g>

      {/* Head & Expressive Face */}
      <circle cx="0" cy="-90" r="24" fill={colors.skin} stroke="#0F172A" strokeWidth="3.5" />
      {/* Eyebrows */}
      <line
        x1="2"
        y1={action === "command" || action === "reject" ? -98 : -100}
        x2="10"
        y2={action === "command" || action === "reject" ? -95 : -100}
        stroke="#0F172A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="13"
        y1={action === "command" || action === "reject" ? -95 : -100}
        x2="21"
        y2={action === "command" || action === "reject" ? -98 : -100}
        stroke="#0F172A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Eyes */}
      <circle cx="7" cy="-91" r="3" fill="#0F172A" />
      <circle cx="16" cy="-91" r="3" fill="#0F172A" />
      <circle cx="8" cy="-92" r="1" fill="#FFF" />
      <circle cx="17" cy="-92" r="1" fill="#FFF" />

      {/* Beard / Mustache */}
      {role === "sultan" || role === "emperor" || role === "scholar" ? (
        <path d="M -8 -76 Q 6 -56 20 -76 Q 6 -72 -8 -76 Z" fill="#292524" />
      ) : null}

      {/* Headgear */}
      {role === "emperor" ? (
        <path
          d="M -20 -108 L -16 -130 L -5 -116 L 4 -132 L 13 -116 L 22 -128 L 22 -108 Z"
          fill="#FACC15"
          stroke="#854D0E"
          strokeWidth="2.5"
        />
      ) : null}
      {role === "sultan" ? (
        <g>
          <ellipse cx="0" cy="-112" rx="28" ry="15" fill="#F8FAFC" stroke="#1E293B" strokeWidth="2.5" />
          <path d="M -22 -114 Q 0 -104 22 -114" stroke="#E2E8F0" strokeWidth="2" fill="none" />
          <circle cx="12" cy="-120" r="4.5" fill="#EF4444" />
        </g>
      ) : null}
      {role === "soldier" ? (
        <g>
          <path d="M -24 -94 A 24 24 0 0 1 24 -94 Z" fill="#94A3B8" stroke="#1E293B" strokeWidth="3" />
          <line x1="0" y1="-118" x2="0" y2="-94" stroke="#475569" strokeWidth="3" />
        </g>
      ) : null}
      {role === "engineer" ? (
        <rect x="-22" y="-114" width="44" height="13" rx="6" fill="#92400E" stroke="#451A03" strokeWidth="2.5" />
      ) : null}
    </g>
  );
};

const OxTeamGraphic: React.FC<{ x: number; y: number; facing: "left" | "right"; frame: number; label?: string }> = ({
  x,
  y,
  facing,
  frame,
  label,
}) => {
  const dir = facing === "left" ? -1 : 1;
  const legSwing = Math.sin(frame * 0.24) * 16;
  const bob = Math.abs(Math.sin(frame * 0.24)) * 4;

  return (
    <g transform={`translate(${x}, ${y - bob})`}>
      <g transform={`scale(${dir}, 1)`}>
        {[
          { dx: -95, dy: -16, sc: 0.84, op: 0.78 },
          { dx: -40, dy: -10, sc: 0.92, op: 0.9 },
          { dx: 0, dy: 0, sc: 1.0, op: 1.0 },
        ].map((ox, i) => (
          <g key={i} transform={`translate(${ox.dx}, ${ox.dy}) scale(${ox.sc})`} opacity={ox.op}>
            <rect x="-46" y="-46" width="92" height="50" rx="20" fill="#78350F" stroke="#291205" strokeWidth="3.5" />
            <circle cx="48" cy="-34" r="20" fill="#78350F" stroke="#291205" strokeWidth="3.5" />
            <circle cx="54" cy="-37" r="3" fill="#1C1917" />
            <path d="M 50 -50 Q 66 -68 58 -72" stroke="#FAFAF9" strokeWidth="6" strokeLinecap="round" fill="none" />
            <line
              x1="-24"
              y1="0"
              x2={-24 + legSwing * 0.5}
              y2="30"
              stroke="#451A03"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <line
              x1="24"
              y1="0"
              x2={24 - legSwing * 0.5}
              y2="30"
              stroke="#451A03"
              strokeWidth="10"
              strokeLinecap="round"
            />
          </g>
        ))}
        {/* Heavy Wooden Yoke & Taut Hauling Ropes */}
        <line x1="-90" y1="-22" x2="145" y2="-8" stroke="#E7E5E4" strokeWidth="3.5" strokeDasharray="7 4" />
        <line x1="-30" y1="-16" x2="145" y2="-2" stroke="#D6D3D1" strokeWidth="3" strokeDasharray="7 4" />
      </g>
      {label ? (
        <g transform="translate(0, 60)">
          <rect x="-72" y="-16" width="144" height="28" rx="8" fill="rgba(15,23,42,0.85)" stroke="#F59E0B" strokeWidth="1.5" />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            fill="#F8FAFC"
            fontSize="16"
            fontWeight="700"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {label}
          </text>
        </g>
      ) : null}
    </g>
  );
};

export const CartoonCharacter: React.FC<CharacterProps> = ({ actor, frame, index }) => {
  const x = getSideX(actor.side, index);
  const y = 552;

  if (actor.role === "ox_team") {
    return <OxTeamGraphic x={x} y={y} facing={actor.facing} frame={frame} label={actor.label} />;
  }

  const dir = actor.facing === "left" ? -1 : 1;
  const trim = (ROLE_COLORS[actor.role] ?? ROLE_COLORS.soldier).trim;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Marching squad depth for soldiers */}
      {actor.role === "soldier" ? (
        <g opacity="0.72" transform="translate(-58, -16) scale(0.82)">
          <g transform={`scale(${dir}, 1)`}>
            <SingleCharacterBody role="soldier" action={actor.action} frame={frame + 5} />
          </g>
        </g>
      ) : null}
      {actor.role === "soldier" ? (
        <g opacity="0.82" transform="translate(52, -10) scale(0.88)">
          <g transform={`scale(${dir}, 1)`}>
            <SingleCharacterBody role="soldier" action={actor.action} frame={frame + 11} />
          </g>
        </g>
      ) : null}

      <g transform={`scale(${dir}, 1)`}>
        <SingleCharacterBody role={actor.role} action={actor.action} frame={frame + index * 7} />
      </g>

      {actor.label ? (
        <g transform="translate(0, 62)">
          <rect x="-74" y="-16" width="148" height="28" rx="8" fill="rgba(15,23,42,0.88)" stroke={trim} strokeWidth="1.5" />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            fill="#F8FAFC"
            fontSize="16"
            fontWeight="700"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {actor.label}
          </text>
        </g>
      ) : null}
    </g>
  );
};
