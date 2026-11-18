import React from "react";
import { ThemePalette } from "../themes";
import { CitationItem } from "../types";

export const SourceBadge: React.FC<{ citations: CitationItem[]; palette: ThemePalette }> = ({
  citations,
  palette,
}) => {
  if (!citations.length) {
    return null;
  }

  const label = citations.map((c) => c.title).slice(0, 2).join(" · ");

  return (
    <div
      style={{
        position: "absolute",
        bottom: 320,
        left: 72,
        right: 140,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          backgroundColor: palette.cardBg,
          border: `1px solid ${palette.cardBorder}`,
          borderRadius: 999,
          padding: "10px 22px",
          color: palette.textMuted,
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 22,
          fontWeight: 500,
          backdropFilter: "blur(10px)",
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        Fuente: {label}
      </div>
    </div>
  );
};
