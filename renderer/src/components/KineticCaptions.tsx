import React, { useMemo } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ThemePalette } from "../themes";
import { WordFrame } from "../types";

interface PhraseGroup {
  words: WordFrame[];
  startFrame: number;
  endFrame: number;
}

function groupWordsIntoPhrases(words: WordFrame[], maxPerGroup = 3): PhraseGroup[] {
  const groups: PhraseGroup[] = [];
  let current: WordFrame[] = [];

  for (const word of words) {
    current.push(word);
    const endsSentence = /[.!?]$/.test(word.text);
    if (current.length >= maxPerGroup || endsSentence) {
      groups.push({
        words: current,
        startFrame: current[0].startFrame,
        endFrame: current[current.length - 1].endFrame,
      });
      current = [];
    }
  }
  if (current.length > 0) {
    groups.push({
      words: current,
      startFrame: current[0].startFrame,
      endFrame: current[current.length - 1].endFrame,
    });
  }
  return groups;
}

export const KineticCaptions: React.FC<{ words: WordFrame[]; palette: ThemePalette }> = ({
  words,
  palette,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phrases = useMemo(() => groupWordsIntoPhrases(words, 3), [words]);
  const activePhrase = phrases.find((p, idx) => {
    const nextStart = phrases[idx + 1]?.startFrame ?? Number.MAX_SAFE_INTEGER;
    return frame >= p.startFrame && frame < nextStart;
  });

  if (!activePhrase) {
    return null;
  }

  const pop = spring({
    frame: Math.max(0, frame - activePhrase.startFrame),
    fps,
    config: { damping: 14, stiffness: 210, mass: 0.6 },
  });

  return (
    <div
      style={{
        position: "absolute",
        top: "70%",
        left: 72,
        right: 130,
        transform: `translateY(-50%) scale(${0.92 + pop * 0.08})`,
        opacity: Math.min(1, pop * 1.4),
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: "16px 20px",
      }}
    >
      {activePhrase.words.map((word, idx) => {
        const isSpoken = frame >= word.startFrame;
        const isCurrent = frame >= word.startFrame && frame <= word.endFrame;
        const color = word.isEmphasis
          ? palette.accent
          : isSpoken
          ? palette.textPrimary
          : palette.textMuted;

        return (
          <span
            key={`${word.startFrame}-${idx}`}
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 900,
              fontSize: word.isEmphasis ? 82 : 74,
              lineHeight: 1.12,
              color,
              textShadow: "0 8px 28px rgba(0,0,0,0.75)",
              transform: `scale(${isCurrent ? 1.07 : 1})`,
              transition: "transform 60ms ease-out",
            }}
          >
            {word.text}
          </span>
        );
      })}
    </div>
  );
};
