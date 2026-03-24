"use client";

import { useRef } from "react";

export default function TimelinePanel({
  duration,
  segments = [],
  chapters = [],
  currentTime = 0,
  onSeek,
}) {
  const barRef = useRef(null);

  function handleClick(e) {
    if (!duration || !barRef.current || !onSeek) return;
    const rect = barRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    onSeek(pct * duration);
  }

  const positionPct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={barRef}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (!duration || !barRef.current || !onSeek) return;
        if (e.key === "ArrowRight") onSeek(Math.min(duration, currentTime + 5));
        if (e.key === "ArrowLeft") onSeek(Math.max(0, currentTime - 5));
      }}
      role="slider"
      aria-valuenow={currentTime}
      aria-valuemin={0}
      aria-valuemax={duration ?? 0}
      tabIndex={0}
      style={{
        position: "relative",
        height: 8,
        backgroundColor: "var(--mantine-color-gray-2)",
        borderRadius: 4,
        cursor: duration ? "pointer" : "default",
        margin: "8px 0",
      }}
    >
      {/* Current position indicator */}
      <div
        style={{
          position: "absolute",
          left: `${positionPct}%`,
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 12,
          height: 12,
          borderRadius: "50%",
          backgroundColor: "var(--mantine-color-blue-6)",
          zIndex: 2,
        }}
      />

      {/* Chapter markers */}
      {duration &&
        chapters.map((ch) => (
          <div
            key={ch.id}
            style={{
              position: "absolute",
              left: `${(ch.start_seconds / duration) * 100}%`,
              top: 0,
              bottom: 0,
              width: 2,
              backgroundColor: "var(--mantine-color-orange-5)",
              zIndex: 1,
            }}
          />
        ))}

      {/* Segment ticks */}
      {duration &&
        segments.map((seg) => (
          <div
            key={seg.id}
            style={{
              position: "absolute",
              left: `${(seg.start_seconds / duration) * 100}%`,
              top: 2,
              bottom: 2,
              width: 1,
              backgroundColor: "var(--mantine-color-gray-4)",
              zIndex: 0,
            }}
          />
        ))}
    </div>
  );
}
